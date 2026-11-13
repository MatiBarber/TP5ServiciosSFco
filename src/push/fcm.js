import { FIREBASE, VAPID_KEY } from '../config.js';

/**
 * Cliente de Firebase Cloud Messaging para web.
 *
 * Replica en la web el canal que el TP6 implemento en Android nativo. El
 * concepto y la consola se reutilizan; el codigo no, porque la plataforma es
 * otra. Las diferencias concretas respecto del cliente Android son tres:
 *
 * 1. El receptor de segundo plano no es una clase del SDK sino un service
 *    worker propio (public/firebase-messaging-sw.js), que el navegador ejecuta
 *    aunque la pestana este cerrada.
 * 2. Hace falta una clave VAPID, que el protocolo Web Push exige para firmar la
 *    suscripcion y que en Android no existe.
 * 3. El contexto tiene que ser seguro: HTTPS o localhost. En cualquier otro
 *    origen el navegador no registra el service worker y no hay token.
 */

const RUTA_SW = '/firebase-messaging-sw.js';

/**
 * El SDK, si no se le indica otra cosa, registra el service worker de
 * mensajeria en el alcance /firebase-cloud-messaging-push-scope. Aca se lo
 * registra de forma explicita en ese mismo alcance para que conviva sin
 * ambiguedad con el service worker de Workbox que genera vite-plugin-pwa para
 * el funcionamiento sin conexion, que vive en el alcance raiz.
 *
 * Son dos service workers con dos responsabilidades distintas, y confundirlos
 * es el error mas comun al sumar push a una PWA que ya funcionaba sin conexion.
 */
const ALCANCE_SW = '/firebase-cloud-messaging-push-scope';

/**
 * El SDK de Firebase se carga bajo demanda y no en el arranque.
 *
 * Es la optimizacion que mas pesa sobre el requisito no funcional de cargar en
 * menos de tres segundos. Firebase es la dependencia mas grande del proyecto y
 * la unica que no hace falta para dibujar la primera pantalla: un vecino que
 * entra a consultar una estacion de bicicletas no necesita el canal de push.
 * Con el import dinamico, el empaquetador lo deja en un fragmento aparte que el
 * navegador descarga solo si el usuario activa las notificaciones.
 *
 * La medicion del antes y el despues esta en el informe.
 */
let sdk = null;
let aplicacion = null;
let mensajeria = null;

async function cargarSdk() {
  if (sdk) return sdk;
  const [app, messaging] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);
  sdk = { ...app, ...messaging };
  return sdk;
}

/** True si la configuracion de Firebase fue completada en el archivo .env */
export function hayConfiguracion() {
  return Boolean(FIREBASE.apiKey && FIREBASE.projectId && FIREBASE.messagingSenderId);
}

/** True si ademas se cargo la clave publica del par VAPID. */
export function hayClaveVapid() {
  return Boolean(VAPID_KEY);
}

async function iniciarAplicacion() {
  if (!hayConfiguracion()) return null;
  if (aplicacion) return aplicacion;
  const { getApps, initializeApp } = await cargarSdk();
  aplicacion = getApps().length ? getApps()[0] : initializeApp(FIREBASE);
  return aplicacion;
}

async function obtenerMensajeria() {
  if (mensajeria) return mensajeria;
  const app = await iniciarAplicacion();
  if (!app) return null;
  const { getMessaging } = await cargarSdk();
  mensajeria = getMessaging(app);
  return mensajeria;
}

/**
 * Estado del canal de push, en una sola llamada.
 *
 * Devuelve siempre un objeto y nunca lanza: la pantalla de preferencias tiene
 * que poder explicar por que no hay token, y un error sin capturar solo deja
 * una pantalla en blanco.
 *
 * @returns {Promise<{
 *   soportado: boolean, contextoSeguro: boolean, configurado: boolean,
 *   vapid: boolean, permiso: NotificationPermission | 'no_disponible',
 *   motivo: string | null
 * }>}
 */
export async function estadoDelCanal() {
  const contextoSeguro = typeof window !== 'undefined' && window.isSecureContext;
  const configurado = hayConfiguracion();
  const vapid = hayClaveVapid();

  let soportado = false;
  try {
    const { isSupported } = await cargarSdk();
    soportado = await isSupported();
  } catch {
    soportado = false;
  }

  const permiso =
    typeof Notification === 'undefined' ? 'no_disponible' : Notification.permission;

  let motivo = null;
  if (!soportado) {
    motivo =
      'Este navegador no admite Web Push. En iPhone solo funciona si la aplicacion fue agregada a la pantalla de inicio.';
  } else if (!contextoSeguro) {
    motivo = 'Las notificaciones requieren HTTPS. En desarrollo funcionan unicamente en localhost.';
  } else if (!configurado) {
    motivo = 'Falta completar la configuracion de Firebase en el archivo .env.';
  } else if (!vapid) {
    motivo = 'Falta la clave VAPID del proyecto de Firebase en el archivo .env.';
  }

  return { soportado, contextoSeguro, configurado, vapid, permiso, motivo };
}

/**
 * Pide permiso y devuelve el token de registro del dispositivo.
 *
 * Debe invocarse desde un gesto del usuario: los navegadores ignoran el pedido
 * de permiso que no nace de un toque. Esa es la razon por la que la aplicacion
 * no lo pide al arrancar sino detras de un boton en Preferencias, que ademas es
 * lo que el capitulo 15 recomienda para no destruir la confianza.
 *
 * @returns {Promise<{token: string | null, permiso: string, error: string | null}>}
 */
export async function activarNotificaciones() {
  const estado = await estadoDelCanal();
  if (estado.motivo) return { token: null, permiso: estado.permiso, error: estado.motivo };

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    return {
      token: null,
      permiso,
      error:
        permiso === 'denied'
          ? 'Las notificaciones quedaron bloqueadas. Hay que volver a habilitarlas desde la configuracion del navegador.'
          : 'No se otorgo el permiso de notificaciones.',
    };
  }

  try {
    const registro = await navigator.serviceWorker.register(RUTA_SW, { scope: ALCANCE_SW });
    await navigator.serviceWorker.ready;

    const { getToken } = await cargarSdk();
    const canal = await obtenerMensajeria();

    const token = await getToken(canal, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registro,
    });

    return { token: token ?? null, permiso, error: token ? null : 'Firebase no devolvio token.' };
  } catch (e) {
    return { token: null, permiso, error: e?.message ?? 'No se pudo obtener el token.' };
  }
}

/**
 * Escucha los mensajes que llegan con la aplicacion en primer plano.
 *
 * Es la misma distincion que se verifico en el TP6 con dos pruebas separadas:
 * con la aplicacion en segundo plano el aviso lo publica el service worker por
 * su cuenta y este codigo no corre; con la aplicacion en pantalla el SDK no
 * muestra nada y entrega el mensaje aca. Sin esta funcion, un aviso recibido
 * mientras el vecino mira la aplicacion se perderia sin dejar rastro.
 *
 * @param {(mensaje: {titulo: string, cuerpo: string, datos: object}) => void} oyente
 * @returns {() => void} funcion para cancelar la escucha
 */
export function escucharEnPrimerPlano(oyente) {
  if (!hayConfiguracion()) return () => {};

  // La suscripcion se resuelve de forma asincrona porque el SDK se carga bajo
  // demanda, pero la funcion devuelve el cancelador en el acto: React espera
  // que el efecto de limpieza este disponible de inmediato.
  let cancelar = null;
  let desmontado = false;

  (async () => {
    try {
      const canal = await obtenerMensajeria();
      if (!canal || desmontado) return;
      const { onMessage } = await cargarSdk();

      cancelar = onMessage(canal, (carga) => {
        oyente({
          titulo: carga.notification?.title ?? carga.data?.title ?? 'Servicios SF',
          cuerpo: carga.notification?.body ?? carga.data?.body ?? '',
          datos: carga.data ?? {},
        });
      });

      if (desmontado) cancelar();
    } catch {
      /* sin canal de push: la aplicacion funciona igual, sin avisos */
    }
  })();

  return () => {
    desmontado = true;
    cancelar?.();
  };
}

/**
 * Publica un aviso local, sin pasar por ningun servidor.
 *
 * Lo usan el temporizador del estacionamiento medido, el recordatorio de
 * vencimientos tributarios y la alerta por alarma cercana. Es el mecanismo que
 * el TP6 llamo notificacion local, y conviene senalar su limite en la web:
 * a diferencia de AlarmManager en Android, el navegador no permite programar un
 * aviso para que se dispare con la aplicacion cerrada. La API que lo habria
 * permitido, Notification Triggers, quedo en ensayo de origen y nunca se
 * estandarizo. De modo que en la web un aviso local solo se dispara mientras la
 * aplicacion sigue abierta.
 *
 * @param {string} titulo
 * @param {string} cuerpo
 */
export async function avisoLocal(titulo, cuerpo) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;

  try {
    const registro = await navigator.serviceWorker.getRegistration(ALCANCE_SW);
    const opciones = { body: cuerpo, icon: '/iconos/icono-192.png', tag: 'servicios-sf-local' };

    if (registro) {
      await registro.showNotification(titulo, opciones);
    } else {
      // eslint-disable-next-line no-new
      new Notification(titulo, opciones);
    }
    return true;
  } catch {
    return false;
  }
}
