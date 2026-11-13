import { responder, clonar } from './red.js';
import { crearCanal, entreEnteros } from './tiempoReal.js';
import { ALARMAS_SEMILLA, ZONAS, ESTADOS_DE_ALARMA } from '../datos/alarmas.js';
import { distanciaEnMetros, ordenarPorCercania } from '../geo.js';
import { leer, escribir, CLAVES } from '../almacenamiento.js';
import { RADIO_CERCANIA_M } from '../../config.js';

/**
 * Implementacion simulada del monitoreo de alarmas comunitarias.
 *
 * El canal cambia el estado de alguna alarma cada doce segundos y vuelve a
 * apagarla al rato, imitando una activacion real. Las alarmas fuera de linea se
 * quedan quietas a proposito: un sistema donde todo responde siempre no deja
 * ver la diferencia entre "normal" y "sin comunicacion".
 */

const INTERVALO_MS = 12000;

const canal = crearCanal({
  estadoInicial: ALARMAS_SEMILLA,
  intervaloMs: INTERVALO_MS,
  mutar(alarmas) {
    const candidatas = alarmas.filter((a) => a.estado !== 'fuera_de_linea');
    if (candidatas.length === 0) return alarmas;

    // Primero se apagan las que estaban activadas: una activacion dura poco.
    for (const a of candidatas) {
      if (a.estado === 'activada' && Math.random() < 0.6) a.estado = 'desactivada';
    }

    // Y con baja probabilidad se activa una nueva.
    if (Math.random() < 0.35) {
      const elegida = candidatas[entreEnteros(0, candidatas.length - 1)];
      elegida.estado = 'activada';
    }

    return alarmas;
  },
});

function zonas() {
  return clonar(ZONAS);
}

function estados() {
  return clonar(ESTADOS_DE_ALARMA);
}

async function listarAlarmas() {
  return responder(canal.leer(), {
    mensajeDeError: 'No se pudo consultar el estado de las alarmas.',
  });
}

/** @param {{lat: number, lng: number} | null} ubicacion */
async function alarmasCercanas(ubicacion) {
  return responder(ordenarPorCercania(canal.leer(), ubicacion), {
    mensajeDeError: 'No se pudo calcular las alarmas cercanas.',
  });
}

/**
 * Suscripcion al estado en vivo de las alarmas.
 * @param {(alarmas: typeof ALARMAS_SEMILLA) => void} oyente
 */
function suscribirEstado(oyente) {
  return canal.suscribir(oyente);
}

/** Zonas a las que el vecino esta suscripto. @returns {string[]} */
function zonasSuscriptas() {
  return leer(CLAVES.suscripciones, ['centro']);
}

/**
 * Alta o baja de la suscripcion a una zona.
 *
 * Cada zona equivale a un tema de Firebase Cloud Messaging. Hoy la suscripcion
 * solo gobierna que avisos muestra la aplicacion; el dia que el disparo sea
 * real, esta funcion es la que llama a subscribeToTopic.
 *
 * @param {string} zonaId
 * @param {boolean} activa
 */
async function suscribirZona(zonaId, activa) {
  const actuales = new Set(zonasSuscriptas());
  if (activa) actuales.add(zonaId);
  else actuales.delete(zonaId);
  const lista = [...actuales];
  escribir(CLAVES.suscripciones, lista);
  return responder(lista, { mensajeDeError: 'No se pudo cambiar la suscripcion.' });
}

/**
 * Alarmas activadas que estan cerca del usuario y pertenecen a una zona suscripta.
 *
 * Es la regla que decide si corresponde avisar por el requisito "enviar
 * notificaciones al usuario si se activa alguna alarma cercana". Es una funcion
 * pura y por eso se puede probar sin navegador ni permisos.
 *
 * @param {typeof ALARMAS_SEMILLA} alarmas
 * @param {{lat: number, lng: number} | null} ubicacion
 * @param {string[]} suscripciones
 * @param {number} [radioM]
 */
function activadasCercanas(alarmas, ubicacion, suscripciones, radioM = RADIO_CERCANIA_M) {
  return alarmas.filter((a) => {
    if (a.estado !== 'activada') return false;
    const porZona = suscripciones.includes(a.zona);
    const porDistancia =
      ubicacion !== null && distanciaEnMetros(ubicacion, a) <= radioM;
    return porZona || porDistancia;
  });
}

/** Expuesto solo para las pruebas. */
function _avanzarTiempoReal() {
  return canal.avanzar();
}

export default {
  zonas,
  estados,
  listarAlarmas,
  alarmasCercanas,
  suscribirEstado,
  zonasSuscriptas,
  suscribirZona,
  activadasCercanas,
  _avanzarTiempoReal,
};
