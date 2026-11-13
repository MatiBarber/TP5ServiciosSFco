import { peticion, consulta, noImplementadoEnRest } from './http.js';
import { ZONAS, ESTADOS_DE_ALARMA } from '../datos/alarmas.js';
import { ordenarPorCercania } from '../geo.js';
import simulado from '../mock/alarmas.js';

/** Implementacion contra la API de alarmas comunitarias. */

const zonas = () => [...ZONAS];
const estados = () => ({ ...ESTADOS_DE_ALARMA });

const listarAlarmas = () => peticion('/alarmas');

async function alarmasCercanas(ubicacion) {
  if (!ubicacion) return listarAlarmas();
  const q = consulta({ lat: ubicacion.lat, lng: ubicacion.lng });
  return ordenarPorCercania(await peticion(`/alarmas${q}`), ubicacion);
}

function suscribirEstado(_oyente) {
  noImplementadoEnRest('El estado en vivo de las alarmas');
}

const zonasSuscriptas = () => simulado.zonasSuscriptas();

/**
 * Contra la API real, cada zona es ademas un tema de Firebase Cloud Messaging:
 * el alta en el servidor y la suscripcion al tema tienen que ocurrir juntas.
 */
const suscribirZona = (zonaId, activa) =>
  peticion('/alarmas/suscripciones', {
    method: activa ? 'POST' : 'DELETE',
    body: JSON.stringify({ zona: zonaId }),
  });

// La regla de cercania es de negocio, no de transporte: misma funcion en ambas.
const { activadasCercanas } = simulado;

export default {
  zonas,
  estados,
  listarAlarmas,
  alarmasCercanas,
  suscribirEstado,
  zonasSuscriptas,
  suscribirZona,
  activadasCercanas,
};
