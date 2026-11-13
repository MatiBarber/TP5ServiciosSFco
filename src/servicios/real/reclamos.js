import { peticion, consulta } from './http.js';
import { CATEGORIAS_DE_RECLAMO, ESTADOS_DE_RECLAMO } from '../datos/reclamos.js';

/** Implementacion contra la API del centro de reclamos. */

const categorias = () => [...CATEGORIAS_DE_RECLAMO];
const estados = () => [...ESTADOS_DE_RECLAMO];

const listarReclamos = (filtro = {}) => peticion(`/reclamos${consulta(filtro)}`);

const obtenerReclamo = (id) => peticion(`/reclamos/${encodeURIComponent(id)}`);

const crearReclamo = (datos) =>
  peticion('/reclamos', { method: 'POST', body: JSON.stringify(datos) });

const actualizarEstado = (id, estado, nota) =>
  peticion(`/reclamos/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, nota }),
  });

export default {
  categorias,
  estados,
  listarReclamos,
  obtenerReclamo,
  crearReclamo,
  actualizarEstado,
};
