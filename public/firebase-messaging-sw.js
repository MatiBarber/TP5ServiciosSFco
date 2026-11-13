/**
 * Service worker de Firebase Cloud Messaging.
 *
 * Es el equivalente web de la clase ServicioMensajes que el TP6 implemento en
 * Android, y cumple la misma funcion: recibir el mensaje cuando la aplicacion
 * NO esta en primer plano. La diferencia es que aca el receptor no es una clase
 * del SDK sino un archivo que el navegador ejecuta en un hilo aparte, vivo
 * aunque la pestana este cerrada.
 *
 * Tres cosas que conviene tener presentes y que son especificas de la web:
 *
 * 1. Este archivo vive en public/ y NO lo procesa Vite. Por eso usa
 *    importScripts contra las compilaciones "compat" publicadas por Google en
 *    lugar de imports de modulo: un service worker clasico no admite la sintaxis
 *    de modulos de la aplicacion.
 *
 * 2. La configuracion esta escrita literal y no leida de .env por el mismo
 *    motivo. No es un problema de seguridad: las claves de cliente de Firebase
 *    son publicas por diseno y viajan igual en el paquete de la aplicacion; lo
 *    que protege al proyecto son las reglas de seguridad, no el secreto de
 *    estos valores.
 *
 * 3. Se registra en el alcance /firebase-cloud-messaging-push-scope para
 *    convivir con el service worker de Workbox que da el funcionamiento sin
 *    conexion y que ocupa el alcance raiz. Son dos trabajadores con dos
 *    responsabilidades distintas.
 *
 * COMPLETAR: reemplazar los valores de abajo por los del proyecto de Firebase.
 * Son los mismos que van en el archivo .env (ver README, paso 3).
 */

importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'COMPLETAR',
  authDomain: 'COMPLETAR.firebaseapp.com',
  projectId: 'COMPLETAR',
  storageBucket: 'COMPLETAR.firebasestorage.app',
  messagingSenderId: 'COMPLETAR',
  appId: 'COMPLETAR',
});

const mensajeria = firebase.messaging();

/**
 * Mensajes de datos recibidos en segundo plano.
 *
 * Igual que en Android: si el mensaje trae el bloque `notification`, el SDK lo
 * publica por su cuenta y este manejador no corre. Solo se ejecuta con mensajes
 * que traen unicamente el bloque `data`, y por eso existe: sin el, un mensaje
 * de datos llegaria al dispositivo sin que el vecino se entere de nada.
 */
mensajeria.onBackgroundMessage((carga) => {
  const titulo = carga.data?.title ?? 'Servicios San Francisco';
  const opciones = {
    body: carga.data?.body ?? '',
    icon: '/iconos/icono-192.png',
    badge: '/iconos/icono-192.png',
    tag: carga.data?.tipo ?? 'servicios-sf',
    data: { enlace: carga.data?.enlace ?? '/avisos' },
  };
  return self.registration.showNotification(titulo, opciones);
});

/**
 * Toque sobre el aviso.
 *
 * Equivale al PendingIntent del TP6, y vale la misma observacion: una
 * notificacion que no devuelve al usuario a la aplicacion no retiene a nadie,
 * interrumpe y se va. Si ya hay una ventana abierta se la enfoca en lugar de
 * abrir otra.
 */
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = evento.notification.data?.enlace ?? '/avisos';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          ventana.navigate?.(destino);
          return ventana.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
