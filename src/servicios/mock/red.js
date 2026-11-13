import { RED_SIMULADA } from '../../config.js';
import { ErrorDeServicio } from '../seleccion.js';

/**
 * Simulador de red.
 *
 * Interpone demora y fallas entre el dato semilla y la pantalla, para que los
 * estados de carga y de error de la interfaz se ejerciten durante el
 * desarrollo y no recien en la demostracion.
 */

let ajustes = { ...RED_SIMULADA };

/**
 * Reemplaza los ajustes del simulador.
 *
 * Las pruebas lo usan para desactivar demora y fallas: un simulador aleatorio
 * da pruebas que fallan a veces, que es peor que no tener pruebas.
 *
 * @param {{demoraMinMs?: number, demoraMaxMs?: number, tasaDeFallas?: number}} nuevos
 */
export function configurarRed(nuevos) {
  ajustes = { ...ajustes, ...nuevos };
}

/** Restaura los ajustes declarados en config.js. */
export function restablecerRed() {
  ajustes = { ...RED_SIMULADA };
}

/** @returns {{demoraMinMs: number, demoraMaxMs: number, tasaDeFallas: number}} */
export function ajustesActuales() {
  return { ...ajustes };
}

function esperar(ms) {
  return new Promise((listo) => setTimeout(listo, ms));
}

/**
 * Simula una respuesta del servicio.
 *
 * Devuelve una copia profunda del dato para que la pantalla no pueda mutar la
 * semilla por accidente, que es lo que hace una API real y lo que un simulador
 * ingenuo no hace.
 *
 * @template T
 * @param {T} datos
 * @param {{mensajeDeError?: string}} [opciones]
 * @returns {Promise<T>}
 */
export async function responder(datos, opciones = {}) {
  const rango = Math.max(0, ajustes.demoraMaxMs - ajustes.demoraMinMs);
  await esperar(ajustes.demoraMinMs + Math.random() * rango);

  if (Math.random() < ajustes.tasaDeFallas) {
    throw new ErrorDeServicio(
      opciones.mensajeDeError ??
        'El servicio municipal no responde. Volve a intentar en unos segundos.',
      'servicio_no_disponible'
    );
  }

  return clonar(datos);
}

/**
 * Copia profunda sin depender de structuredClone, que no existe en todos los
 * navegadores moviles que la consigna pide soportar.
 *
 * @template T
 * @param {T} valor
 * @returns {T}
 */
export function clonar(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (valor instanceof Date) return /** @type {any} */ (new Date(valor.getTime()));
  if (Array.isArray(valor)) return /** @type {any} */ (valor.map(clonar));
  const salida = {};
  for (const clave of Object.keys(valor)) salida[clave] = clonar(valor[clave]);
  return /** @type {any} */ (salida);
}
