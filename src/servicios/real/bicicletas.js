import { peticion, consulta, noImplementadoEnRest } from './http.js';
import { MOTIVOS_DE_REPORTE } from '../datos/estaciones.js';
import { ordenarPorCercania } from '../geo.js';

/** Implementacion contra la API municipal de bicicletas publicas. */

const listarEstaciones = () => peticion('/bicicletas/estaciones');

async function estacionesCercanas(ubicacion) {
  if (!ubicacion) return listarEstaciones();
  const q = consulta({ lat: ubicacion.lat, lng: ubicacion.lng, orden: 'cercania' });
  const lista = await peticion(`/bicicletas/estaciones${q}`);
  // Si el servidor no respeta el orden pedido, se ordena en el cliente.
  return ordenarPorCercania(lista, ubicacion);
}

const obtenerEstacion = (id) => peticion(`/bicicletas/estaciones/${encodeURIComponent(id)}`);

function suscribirDisponibilidad(_oyente) {
  noImplementadoEnRest('La disponibilidad en vivo');
}

const reportarProblema = (datos) =>
  peticion('/bicicletas/reportes', { method: 'POST', body: JSON.stringify(datos) });

const listarReportes = () => peticion('/bicicletas/reportes');

// El catalogo de motivos no cambia por usuario ni por sesion: no justifica un viaje.
const motivosDeReporte = () => [...MOTIVOS_DE_REPORTE];

export default {
  listarEstaciones,
  estacionesCercanas,
  obtenerEstacion,
  suscribirDisponibilidad,
  reportarProblema,
  listarReportes,
  motivosDeReporte,
};
