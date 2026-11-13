import { peticion } from './http.js';
import simulado from '../mock/estacionamiento.js';
import { ZONAS_DE_ESTACIONAMIENTO } from '../datos/estacionamiento.js';

/** Implementacion contra la API de estacionamiento medido. */

const zonas = () => [...ZONAS_DE_ESTACIONAMIENTO];
const listarZonas = () => peticion('/estacionamiento/zonas');

// Geometria y tarifas son calculo local sobre datos ya descargados: no viajan.
const { zonaDePunto, calcularImporte, minutosRestantes, sesionActiva } = simulado;

const iniciarSesion = (datos) =>
  peticion('/estacionamiento/sesiones', { method: 'POST', body: JSON.stringify(datos) });

const extenderSesion = (minutosExtra) =>
  peticion('/estacionamiento/sesiones/actual/extender', {
    method: 'POST',
    body: JSON.stringify({ minutos: minutosExtra }),
  });

const finalizarSesion = () =>
  peticion('/estacionamiento/sesiones/actual', { method: 'DELETE' });

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
