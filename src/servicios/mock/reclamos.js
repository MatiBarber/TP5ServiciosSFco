import { responder, clonar } from './red.js';
import {
  CATEGORIAS_DE_RECLAMO,
  ESTADOS_DE_RECLAMO,
  RECLAMOS_SEMILLA,
} from '../datos/reclamos.js';
import { leer, escribir, CLAVES } from '../almacenamiento.js';

/**
 * Implementacion simulada del centro de reclamos.
 *
 * Los reclamos que crea el usuario se persisten en el dispositivo, de modo que
 * sobreviven a recargar la aplicacion: sin eso, el requisito de "facilitar la
 * busqueda y visualizacion de reclamos anteriores" no se puede demostrar.
 */

function todos() {
  const propios = leer(CLAVES.reclamos, null);
  if (propios === null) return clonar(RECLAMOS_SEMILLA);
  return [...propios, ...clonar(RECLAMOS_SEMILLA)];
}

function guardarPropios(lista) {
  escribir(CLAVES.reclamos, lista);
}

function categorias() {
  return clonar(CATEGORIAS_DE_RECLAMO);
}

function estados() {
  return clonar(ESTADOS_DE_RECLAMO);
}

/**
 * @param {{texto?: string, estado?: string, categoria?: string}} [filtro]
 */
async function listarReclamos(filtro = {}) {
  let lista = todos();

  if (filtro.estado) lista = lista.filter((r) => r.estado === filtro.estado);
  if (filtro.categoria) lista = lista.filter((r) => r.categoria === filtro.categoria);

  if (filtro.texto) {
    const t = filtro.texto.trim().toLowerCase();
    lista = lista.filter(
      (r) =>
        r.id.toLowerCase().includes(t) ||
        r.descripcion.toLowerCase().includes(t) ||
        (r.direccion ?? '').toLowerCase().includes(t)
    );
  }

  lista.sort((a, b) => (a.creadoEl < b.creadoEl ? 1 : -1));
  return responder(lista, { mensajeDeError: 'No se pudo consultar los reclamos.' });
}

/** @param {string} id */
async function obtenerReclamo(id) {
  const r = todos().find((x) => x.id === id) ?? null;
  return responder(r, { mensajeDeError: 'No se pudo abrir el reclamo.' });
}

/**
 * Crea un reclamo.
 *
 * Los adjuntos llegan ya reducidos a una imagen pequena en base64 (ver
 * componentes/SelectorDeAdjuntos.jsx): el localStorage tiene una cuota de unos
 * pocos megabytes y guardar la foto original de una camara de doce megapixeles
 * la agota con el primer reclamo.
 *
 * @param {{categoria: string, descripcion: string, direccion: string,
 *          lat?: number|null, lng?: number|null,
 *          adjuntos?: {nombre: string, tipo: string, datos: string}[]}} datos
 */
async function crearReclamo(datos) {
  const ahora = new Date().toISOString();
  const reclamo = {
    id: `RE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    categoria: datos.categoria,
    descripcion: datos.descripcion,
    direccion: datos.direccion,
    lat: datos.lat ?? null,
    lng: datos.lng ?? null,
    adjuntos: datos.adjuntos ?? [],
    creadoEl: ahora,
    estado: 'recibido',
    historial: [{ estado: 'recibido', fecha: ahora, nota: 'Reclamo registrado.' }],
  };

  const propios = leer(CLAVES.reclamos, []);
  const guardo = escribir(CLAVES.reclamos, [reclamo, ...propios]);

  if (!guardo) {
    // Si el navegador rechazo la escritura, casi siempre es la cuota llena por
    // los adjuntos. Se reintenta sin ellos antes de dar el reclamo por perdido.
    const sinAdjuntos = { ...reclamo, adjuntos: [], adjuntosOmitidos: true };
    escribir(CLAVES.reclamos, [sinAdjuntos, ...propios]);
    return responder(sinAdjuntos, { mensajeDeError: 'No se pudo registrar el reclamo.' });
  }

  return responder(reclamo, { mensajeDeError: 'No se pudo registrar el reclamo.' });
}

/**
 * Avanza el estado de un reclamo propio.
 *
 * En produccion este cambio lo haria el area municipal, no la aplicacion. Se
 * expone aca para poder mostrar el seguimiento de estado durante la
 * demostracion sin esperar a que exista un backend.
 *
 * @param {string} id
 * @param {string} nuevoEstado
 * @param {string} nota
 */
async function actualizarEstado(id, nuevoEstado, nota) {
  const propios = leer(CLAVES.reclamos, []);
  const indice = propios.findIndex((r) => r.id === id);
  if (indice === -1) {
    return responder(null, { mensajeDeError: 'Solo se pueden actualizar reclamos propios.' });
  }

  const fecha = new Date().toISOString();
  propios[indice] = {
    ...propios[indice],
    estado: nuevoEstado,
    historial: [
      ...propios[indice].historial,
      { estado: nuevoEstado, fecha, nota: nota?.trim() || 'Actualizacion de estado.' },
    ],
  };
  guardarPropios(propios);
  return responder(propios[indice], { mensajeDeError: 'No se pudo actualizar el estado.' });
}

export default {
  categorias,
  estados,
  listarReclamos,
  obtenerReclamo,
  crearReclamo,
  actualizarEstado,
};
