import { peticion } from './http.js';
import { TIPOS_DE_AVISO } from '../datos/notificaciones.js';
import simulado from '../mock/notificaciones.js';

/** Implementacion contra la API de notificaciones al vecino. */

const tipos = () => [...TIPOS_DE_AVISO];

// Las preferencias se leen del dispositivo tambien en la implementacion real:
// son de este telefono, y guardarlas en el servidor obligaria a tener cuenta.
const { preferencias, registrarAviso, cantidadSinLeer } = simulado;

const guardarPreferencias = (nuevas) =>
  peticion('/notificaciones/preferencias', {
    method: 'PUT',
    body: JSON.stringify(nuevas),
  });

const listarAvisos = () => peticion('/notificaciones');

const marcarLeido = (id) =>
  peticion(`/notificaciones/${encodeURIComponent(id)}/leido`, { method: 'POST' });

export default {
  tipos,
  preferencias,
  guardarPreferencias,
  listarAvisos,
  registrarAviso,
  marcarLeido,
  cantidadSinLeer,
};
