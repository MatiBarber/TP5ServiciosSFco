import { peticion } from './http.js';
import simulado from '../mock/atencion.js';

/** Implementacion contra la API del directorio de atencion al vecino. */

const listarAreas = () => peticion('/atencion/areas');

async function listarAgrupadas() {
  const areas = await peticion('/atencion/areas');
  const grupos = [];
  for (const area of areas) {
    let g = grupos.find((x) => x.nombre === area.grupo);
    if (!g) {
      g = { nombre: area.grupo, areas: [] };
      grupos.push(g);
    }
    g.areas.push(area);
  }
  return grupos;
}

// La construccion de los enlaces tel:, mailto: y wa.me es identica en las dos
// implementaciones porque no depende del origen del dato: es un esquema de URI
// del sistema operativo. Reescribirla seria duplicar codigo sin motivo.
const { enlaceDeContacto } = simulado;

export default { listarAreas, listarAgrupadas, enlaceDeContacto };
