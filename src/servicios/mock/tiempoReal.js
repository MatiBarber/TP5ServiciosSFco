import { clonar } from './red.js';

/**
 * Canal de tiempo real simulado.
 *
 * La consigna pide disponibilidad en tiempo real en bicicletas y estado en
 * tiempo real en alarmas. Un simulador que devuelve siempre el mismo JSON no
 * demuestra ninguna de las dos cosas: lo que se ve en pantalla es un dato
 * quieto. Este canal muta el estado cada cierto intervalo y avisa a quien este
 * suscripto, de modo que la pantalla cambia sola mientras se la mira.
 *
 * El contrato de suscripcion es el mismo que expondria un WebSocket o un
 * listener de Firestore: suscribir() devuelve la funcion para cancelar. Si
 * manana el dato viene de una API real, cambia la implementacion y no las
 * pantallas.
 */

/**
 * @template T
 * @param {object} opciones
 * @param {T} opciones.estadoInicial
 * @param {number} opciones.intervaloMs
 * @param {(estado: T) => T} opciones.mutar funcion pura que produce el proximo estado
 * @returns {{
 *   leer: () => T,
 *   suscribir: (oyente: (estado: T) => void) => () => void,
 *   avanzar: () => T,
 *   detener: () => void
 * }}
 */
export function crearCanal({ estadoInicial, intervaloMs, mutar }) {
  let estado = clonar(estadoInicial);
  /** @type {Set<(estado: any) => void>} */
  const oyentes = new Set();
  /** @type {any} */
  let reloj = null;

  function notificar() {
    for (const oyente of oyentes) oyente(clonar(estado));
  }

  /** Produce el proximo estado. Expuesto aparte del reloj para poder probarlo. */
  function avanzar() {
    estado = mutar(clonar(estado));
    notificar();
    return clonar(estado);
  }

  function arrancarSiHaceFalta() {
    if (reloj === null && oyentes.size > 0) {
      reloj = setInterval(avanzar, intervaloMs);
    }
  }

  function detener() {
    if (reloj !== null) {
      clearInterval(reloj);
      reloj = null;
    }
  }

  return {
    leer: () => clonar(estado),
    avanzar,
    detener,
    suscribir(oyente) {
      oyentes.add(oyente);
      arrancarSiHaceFalta();
      oyente(clonar(estado));
      return () => {
        oyentes.delete(oyente);
        // Sin oyentes no hay motivo para seguir despertando al navegador.
        if (oyentes.size === 0) detener();
      };
    },
  };
}

/** Entero aleatorio entre min y max, ambos incluidos. */
export function entreEnteros(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Mantiene un valor dentro de un rango. */
export function acotar(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}
