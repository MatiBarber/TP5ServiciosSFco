import { USAR_SIMULADOR } from '../config.js';

/**
 * Devuelve la implementacion simulada o la real segun la bandera de config.js.
 *
 * Toda la decision de arquitectura del trabajo cabe en esta funcion. Cada modulo
 * de servicio la invoca una vez y exporta el resultado; la interfaz importa ese
 * resultado sin saber cual de las dos recibio.
 *
 * @template T
 * @param {T} simulado implementacion contra datos semilla
 * @param {T} real implementacion contra la API municipal
 * @returns {T}
 */
export function seleccionar(simulado, real) {
  return USAR_SIMULADOR ? simulado : real;
}

/**
 * Error propio de la capa de servicios.
 *
 * Existe para que la interfaz distinga un fallo del servicio de un error de
 * programacion: los componentes muestran el mensaje de un ErrorDeServicio y
 * dejan propagar cualquier otro.
 */
export class ErrorDeServicio extends Error {
  /**
   * @param {string} mensaje texto mostrable al usuario
   * @param {string} [codigo] identificador para distinguir causas
   */
  constructor(mensaje, codigo = 'servicio_no_disponible') {
    super(mensaje);
    this.name = 'ErrorDeServicio';
    this.codigo = codigo;
  }
}
