import { peticion, consulta } from './http.js';

/** Implementacion contra la API de la Direccion General Tributaria. */

const obtenerContribuyente = () => peticion('/tributaria/contribuyente');

const listarCedulones = (filtro = {}) =>
  peticion(`/tributaria/cedulones${consulta(filtro)}`);

const obtenerCedulon = (id) => peticion(`/tributaria/cedulones/${encodeURIComponent(id)}`);

const proximosVencimientos = (dias = 15) =>
  peticion(`/tributaria/vencimientos${consulta({ dias })}`);

/**
 * Contra la API real este metodo NO recibiria datos de tarjeta.
 *
 * Devolveria la URL de la pasarela de pagos para redirigir al vecino, de modo
 * que los datos sensibles nunca pasen por la aplicacion. La firma se mantiene
 * identica a la simulada para que la pantalla no cambie.
 */
const pagarCedulon = ({ cedulonId, medio }) =>
  peticion('/tributaria/pagos', {
    method: 'POST',
    body: JSON.stringify({ cedulonId, medio }),
  });

const historialDePagos = () => peticion('/tributaria/pagos');

export default {
  obtenerContribuyente,
  listarCedulones,
  obtenerCedulon,
  proximosVencimientos,
  pagarCedulon,
  historialDePagos,
};
