import { responder, clonar } from './red.js';
import { crearCanal, entreEnteros, acotar } from './tiempoReal.js';
import { ESTACIONES_SEMILLA, MOTIVOS_DE_REPORTE } from '../datos/estaciones.js';
import { ordenarPorCercania } from '../geo.js';
import { leer, escribir, CLAVES } from '../almacenamiento.js';

/**
 * Implementacion simulada del servicio de bicicletas publicas.
 *
 * El canal de tiempo real mueve la disponibilidad cada ocho segundos: toma
 * algunas estaciones al azar y les suma o resta bicicletas, respetando la
 * cantidad de anclajes. Es lo que convierte "disponibilidad en tiempo real" de
 * una afirmacion del informe en algo que se ve pasar en la pantalla.
 */

const INTERVALO_MS = 8000;

const canal = crearCanal({
  estadoInicial: ESTACIONES_SEMILLA,
  intervaloMs: INTERVALO_MS,
  mutar(estaciones) {
    const cuantas = entreEnteros(1, 3);
    for (let i = 0; i < cuantas; i += 1) {
      const indice = entreEnteros(0, estaciones.length - 1);
      const estacion = estaciones[indice];
      if (estacion.estado !== 'operativa') continue;
      const delta = entreEnteros(-2, 2);
      estacion.disponibles = acotar(estacion.disponibles + delta, 0, estacion.anclajes);
    }
    return estaciones;
  },
});

/** @returns {Promise<typeof ESTACIONES_SEMILLA>} */
async function listarEstaciones() {
  return responder(canal.leer(), {
    mensajeDeError: 'No se pudo obtener la disponibilidad de las estaciones.',
  });
}

/**
 * Estaciones ordenadas por cercania a la ubicacion del usuario.
 * @param {{lat: number, lng: number} | null} ubicacion
 */
async function estacionesCercanas(ubicacion) {
  const lista = ordenarPorCercania(canal.leer(), ubicacion);
  return responder(lista, {
    mensajeDeError: 'No se pudo calcular las estaciones cercanas.',
  });
}

/** @param {string} id */
async function obtenerEstacion(id) {
  const estacion = canal.leer().find((e) => e.id === id) ?? null;
  return responder(estacion, { mensajeDeError: 'No se pudo abrir la estacion.' });
}

/**
 * Suscripcion a los cambios de disponibilidad.
 *
 * Deliberadamente no pasa por `responder`: una suscripcion no es una peticion,
 * y meterle demora y fallas al flujo continuo dejaria la pantalla parpadeando.
 *
 * @param {(estaciones: typeof ESTACIONES_SEMILLA) => void} oyente
 * @returns {() => void} funcion para cancelar
 */
function suscribirDisponibilidad(oyente) {
  return canal.suscribir(oyente);
}

/**
 * Registra un reporte de problema. Queda en el dispositivo.
 * @param {{estacionId: string, motivo: string, comentario?: string}} datos
 */
async function reportarProblema(datos) {
  const reporte = {
    id: `RB-${Date.now()}`,
    ...datos,
    fecha: new Date().toISOString(),
  };
  const previos = leer(CLAVES.reportes, []);
  escribir(CLAVES.reportes, [reporte, ...previos]);
  return responder(reporte, { mensajeDeError: 'No se pudo enviar el reporte.' });
}

async function listarReportes() {
  return responder(leer(CLAVES.reportes, []));
}

function motivosDeReporte() {
  return clonar(MOTIVOS_DE_REPORTE);
}

/** Expuesto solo para las pruebas: avanza el canal sin esperar al reloj. */
function _avanzarTiempoReal() {
  return canal.avanzar();
}

export default {
  listarEstaciones,
  estacionesCercanas,
  obtenerEstacion,
  suscribirDisponibilidad,
  reportarProblema,
  listarReportes,
  motivosDeReporte,
  _avanzarTiempoReal,
};
