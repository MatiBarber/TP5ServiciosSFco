import { responder, clonar } from './red.js';
import { AVISOS_SEMILLA, TIPOS_DE_AVISO } from '../datos/notificaciones.js';
import { leer, escribir, CLAVES } from '../almacenamiento.js';

/**
 * Implementacion simulada del historial y las preferencias de avisos.
 *
 * El canal de entrega es real: lo provee Firebase Cloud Messaging (src/push/).
 * Lo que se simula aca es el lado que un municipio tendria en su backend —el
 * catalogo de avisos y las preferencias del vecino— porque no existe servidor
 * municipal que los guarde.
 */

const PREFERENCIAS_POR_DEFECTO = {
  tipos: TIPOS_DE_AVISO.reduce((acc, t) => ({ ...acc, [t.id]: true }), {}),
  frecuencia: 'inmediata',
  silencioNocturno: true,
};

function tipos() {
  return clonar(TIPOS_DE_AVISO);
}

function preferencias() {
  const guardadas = leer(CLAVES.preferencias, null);
  if (!guardadas) return clonar(PREFERENCIAS_POR_DEFECTO);
  return { ...clonar(PREFERENCIAS_POR_DEFECTO), ...guardadas };
}

/** @param {object} nuevas */
async function guardarPreferencias(nuevas) {
  const combinadas = { ...preferencias(), ...nuevas };
  escribir(CLAVES.preferencias, combinadas);
  return responder(combinadas, { mensajeDeError: 'No se pudieron guardar las preferencias.' });
}

function historialCrudo() {
  const propios = leer(CLAVES.avisos, null);
  if (propios === null) return clonar(AVISOS_SEMILLA);
  return [...propios, ...clonar(AVISOS_SEMILLA)];
}

/**
 * Historial filtrado por las preferencias del vecino.
 *
 * El filtro se aplica en la lectura y no en la escritura a proposito: si el
 * usuario vuelve a habilitar un tipo, los avisos de ese tipo que ya habian
 * llegado reaparecen en lugar de haberse perdido.
 */
async function listarAvisos() {
  const prefs = preferencias();
  const lista = historialCrudo()
    .filter((a) => prefs.tipos[a.tipo] !== false)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return responder(lista, { mensajeDeError: 'No se pudo cargar el historial de avisos.' });
}

/**
 * Agrega al historial un aviso recibido por push.
 *
 * La llama el cliente de FCM cuando entra un mensaje con la aplicacion en
 * primer plano, y tambien la pantalla de preferencias al enviar una prueba
 * local. Sin esto, el requisito de "proveer un historial de notificaciones
 * recibidas" solo tendria datos semilla.
 *
 * @param {{titulo: string, cuerpo: string, tipo?: string, zona?: string, enlace?: string}} aviso
 */
function registrarAviso(aviso) {
  const nuevo = {
    id: `av-${Date.now()}`,
    tipo: aviso.tipo ?? 'eventos',
    zona: aviso.zona ?? 'centro',
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    enlace: aviso.enlace ?? null,
    fecha: new Date().toISOString(),
    leido: false,
  };
  const propios = leer(CLAVES.avisos, []);
  escribir(CLAVES.avisos, [nuevo, ...propios].slice(0, 100));
  return nuevo;
}

/** @param {string} id */
async function marcarLeido(id) {
  const propios = leer(CLAVES.avisos, []);
  const indice = propios.findIndex((a) => a.id === id);
  if (indice !== -1) {
    propios[indice] = { ...propios[indice], leido: true };
    escribir(CLAVES.avisos, propios);
  }
  return responder({ ok: true });
}

function cantidadSinLeer() {
  const prefs = preferencias();
  return historialCrudo().filter((a) => !a.leido && prefs.tipos[a.tipo] !== false).length;
}

export default {
  tipos,
  preferencias,
  guardarPreferencias,
  listarAvisos,
  registrarAviso,
  marcarLeido,
  cantidadSinLeer,
};
