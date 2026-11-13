import { responder, clonar } from './red.js';
import {
  ZONAS_DE_ESTACIONAMIENTO,
  AVISO_PREVIO_MINUTOS,
} from '../datos/estacionamiento.js';
import { dentroDelPoligono } from '../geo.js';
import { leer, escribir, borrar, CLAVES } from '../almacenamiento.js';

/**
 * Implementacion simulada del estacionamiento medido.
 */

function zonas() {
  return clonar(ZONAS_DE_ESTACIONAMIENTO);
}

async function listarZonas() {
  return responder(ZONAS_DE_ESTACIONAMIENTO, {
    mensajeDeError: 'No se pudo cargar las zonas de estacionamiento.',
  });
}

/**
 * Zona que contiene un punto, o null si esta fuera de toda zona medida.
 * @param {{lat: number, lng: number} | null} punto
 */
function zonaDePunto(punto) {
  if (!punto) return null;
  return (
    clonar(ZONAS_DE_ESTACIONAMIENTO).find((z) => dentroDelPoligono(punto, z.poligono)) ?? null
  );
}

/**
 * Calcula el importe de un periodo.
 *
 * Cobra por fraccion empezada, que es como funciona el estacionamiento medido
 * real: media hora y un minuto se cobran como una hora si la fraccion es de
 * treinta minutos.
 *
 * @param {object} zona
 * @param {number} minutos
 * @returns {number}
 */
function calcularImporte(zona, minutos) {
  if (minutos <= 0) return 0;
  const fracciones = Math.ceil(minutos / zona.fraccionMinutos);
  const costoDeFraccion = (zona.tarifaPorHora * zona.fraccionMinutos) / 60;
  return Math.round(fracciones * costoDeFraccion);
}

/** Sesion de estacionamiento en curso, o null. */
function sesionActiva() {
  const s = leer(CLAVES.estacionamiento, null);
  if (!s) return null;
  if (new Date(s.terminaEl).getTime() <= Date.now()) {
    borrar(CLAVES.estacionamiento);
    return null;
  }
  return s;
}

/**
 * Inicia una sesion con pago SIMULADO.
 *
 * Igual que en el modulo tributario, no se reciben ni se guardan datos de
 * tarjeta: el parametro `medio` es una etiqueta.
 *
 * @param {{zonaId: string, patente: string, minutos: number, medio: string}} datos
 */
async function iniciarSesion({ zonaId, patente, minutos, medio }) {
  const zona = ZONAS_DE_ESTACIONAMIENTO.find((z) => z.id === zonaId);
  if (!zona) {
    return responder(null, { mensajeDeError: 'La zona seleccionada no existe.' });
  }

  const tope = zona.maximoHoras * 60;
  const minutosAcotados = Math.min(minutos, tope);
  const ahora = Date.now();

  const sesion = {
    id: `EM-${ahora}`,
    zonaId,
    zonaNombre: zona.nombre,
    patente: patente.toUpperCase().trim(),
    minutos: minutosAcotados,
    importe: calcularImporte(zona, minutosAcotados),
    medio,
    simulado: true,
    iniciaEl: new Date(ahora).toISOString(),
    terminaEl: new Date(ahora + minutosAcotados * 60000).toISOString(),
    avisoPrevioMinutos: AVISO_PREVIO_MINUTOS,
  };

  escribir(CLAVES.estacionamiento, sesion);
  return responder(sesion, { mensajeDeError: 'No se pudo iniciar el estacionamiento.' });
}

/**
 * Extiende la sesion en curso, respetando el maximo de la zona.
 * @param {number} minutosExtra
 */
async function extenderSesion(minutosExtra) {
  const sesion = sesionActiva();
  if (!sesion) {
    return responder(null, { mensajeDeError: 'No hay un estacionamiento en curso.' });
  }

  const zona = ZONAS_DE_ESTACIONAMIENTO.find((z) => z.id === sesion.zonaId);
  const tope = zona.maximoHoras * 60;
  const yaUsados = sesion.minutos;
  const permitidos = Math.max(0, tope - yaUsados);
  const extra = Math.min(minutosExtra, permitidos);

  if (extra === 0) {
    return responder(null, {
      mensajeDeError: `La zona permite como maximo ${zona.maximoHoras} horas seguidas.`,
    });
  }

  const extendida = {
    ...sesion,
    minutos: yaUsados + extra,
    importe: sesion.importe + calcularImporte(zona, extra),
    terminaEl: new Date(new Date(sesion.terminaEl).getTime() + extra * 60000).toISOString(),
  };

  escribir(CLAVES.estacionamiento, extendida);
  return responder(extendida, { mensajeDeError: 'No se pudo extender el tiempo.' });
}

async function finalizarSesion() {
  borrar(CLAVES.estacionamiento);
  return responder({ ok: true });
}

/** Minutos que faltan para que venza la sesion. Negativo si ya vencio. */
function minutosRestantes(sesion, ahora = Date.now()) {
  if (!sesion) return 0;
  return (new Date(sesion.terminaEl).getTime() - ahora) / 60000;
}

export default {
  zonas,
  listarZonas,
  zonaDePunto,
  calcularImporte,
  sesionActiva,
  iniciarSesion,
  extenderSesion,
  finalizarSesion,
  minutosRestantes,
};
