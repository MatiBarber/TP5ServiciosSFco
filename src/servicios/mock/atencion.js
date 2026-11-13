import { responder, clonar } from './red.js';
import { AREAS_DE_ATENCION } from '../datos/atencion.js';

/**
 * Implementacion simulada de las lineas de atencion al vecino.
 *
 * Es el unico de los siete modulos donde "simulado" se limita al directorio:
 * las tres acciones que pide la consigna —llamar, enviar correo, abrir
 * mensajeria— las ejecuta el sistema operativo a traves de esquemas de URI
 * estandar, de modo que en ese punto la aplicacion no simula nada.
 */

async function listarAreas() {
  return responder(AREAS_DE_ATENCION, {
    mensajeDeError: 'No se pudo cargar el directorio de contactos.',
  });
}

/** Areas agrupadas por su campo `grupo`, en el orden en que aparecen. */
async function listarAgrupadas() {
  const grupos = [];
  for (const area of clonar(AREAS_DE_ATENCION)) {
    let g = grupos.find((x) => x.nombre === area.grupo);
    if (!g) {
      g = { nombre: area.grupo, areas: [] };
      grupos.push(g);
    }
    g.areas.push(area);
  }
  return responder(grupos, { mensajeDeError: 'No se pudo cargar el directorio.' });
}

/**
 * Construye el enlace de cada accion.
 *
 * Esta separado de los componentes para poder probarlo: una URI de WhatsApp mal
 * formada no rompe la aplicacion, abre una pantalla vacia, que es el tipo de
 * falla que no se nota hasta la demostracion.
 *
 * @param {'llamar'|'correo'|'whatsapp'} accion
 * @param {object} area
 * @param {string} [mensaje]
 * @returns {string | null}
 */
function enlaceDeContacto(accion, area, mensaje = '') {
  if (accion === 'llamar') {
    return area.telefono ? `tel:${area.telefono.replace(/[^+\d]/g, '')}` : null;
  }

  if (accion === 'correo') {
    if (!area.correo) return null;
    const asunto = encodeURIComponent(`Consulta - ${area.nombre}`);
    const cuerpo = encodeURIComponent(mensaje);
    return `mailto:${area.correo}?subject=${asunto}&body=${cuerpo}`;
  }

  if (accion === 'whatsapp') {
    if (!area.whatsapp) return null;
    const numero = area.whatsapp.replace(/\D/g, '');
    const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
    return `https://wa.me/${numero}${texto}`;
  }

  return null;
}

export default { listarAreas, listarAgrupadas, enlaceDeContacto };
