import { BASE_API } from '../../config.js';
import { ErrorDeServicio } from '../seleccion.js';

/**
 * Cliente HTTP de la implementacion real.
 *
 * No hay API municipal publicada para ninguno de los siete servicios, de modo
 * que estos modulos no se ejecutan mientras USAR_SIMULADOR sea true. Estan
 * escritos igual, y completos, porque son la mitad que vuelve demostrable la
 * decision de arquitectura: la interfaz llama a las mismas funciones con la
 * misma firma, y lo unico que cambia es de donde sale el dato.
 *
 * Traducen ademas los errores de red a ErrorDeServicio, que es el tipo que las
 * pantallas ya saben mostrar. Sin esa traduccion, cambiar la bandera romperia
 * el manejo de errores de toda la aplicacion aunque los datos llegaran bien.
 */

const TIEMPO_LIMITE_MS = 10000;

/**
 * @param {string} ruta
 * @param {RequestInit} [opciones]
 * @returns {Promise<any>}
 */
export async function peticion(ruta, opciones = {}) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(`${BASE_API}${ruta}`, {
      ...opciones,
      signal: control.signal,
      headers: {
        Accept: 'application/json',
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opciones.headers ?? {}),
      },
    });

    if (!respuesta.ok) {
      throw new ErrorDeServicio(
        `El servicio municipal respondio ${respuesta.status}.`,
        respuesta.status === 404 ? 'no_encontrado' : 'servicio_no_disponible'
      );
    }

    if (respuesta.status === 204) return null;
    return await respuesta.json();
  } catch (error) {
    if (error instanceof ErrorDeServicio) throw error;
    if (error?.name === 'AbortError') {
      throw new ErrorDeServicio('El servicio municipal tardo demasiado en responder.', 'tiempo_agotado');
    }
    throw new ErrorDeServicio('No hay conexion con el servicio municipal.', 'sin_conexion');
  }
}

/** Arma una cadena de consulta descartando los valores vacios. */
export function consulta(parametros = {}) {
  const pares = Object.entries(parametros).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (pares.length === 0) return '';
  return `?${new URLSearchParams(pares).toString()}`;
}

/**
 * Error unico para las funciones que una API REST no puede cubrir.
 *
 * El caso concreto son las suscripciones en vivo: contra la API real habria que
 * abrir un WebSocket o pasar a consulta periodica, y declararlo asi es mas
 * honesto que dejar una funcion vacia que no avisa nunca.
 */
export function noImplementadoEnRest(nombre) {
  throw new ErrorDeServicio(
    `${nombre} requiere un canal en vivo (WebSocket o consulta periodica) que la API REST no provee.`,
    'no_implementado'
  );
}
