import { useCallback, useEffect, useRef, useState } from 'react';
import { useIonViewWillEnter } from '@ionic/react';

/**
 * Gancho unico para consumir la capa de servicios.
 *
 * Centraliza los tres estados que toda pantalla tiene —cargando, error, dato—
 * para que ninguna los implemente por su cuenta. Es lo que vuelve barato que el
 * simulador falle a proposito: el manejo del error esta escrito una sola vez.
 *
 * @template T
 * @param {() => Promise<T>} peticion
 * @param {unknown[]} dependencias
 * @param {{inicial?: T}} [opciones]
 */
export function useServicio(peticion, dependencias = [], opciones = {}) {
  const [datos, setDatos] = useState(opciones.inicial ?? null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const vigente = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(peticion, dependencias);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await ejecutar();
      if (vigente.current) setDatos(resultado);
    } catch (e) {
      // Un fallo del servicio no debe dejar la pantalla en blanco: se conserva
      // el ultimo dato bueno y se muestra el error encima.
      if (vigente.current) setError(e);
    } finally {
      if (vigente.current) setCargando(false);
    }
  }, [ejecutar]);

  useEffect(() => {
    vigente.current = true;
    recargar();
    return () => {
      vigente.current = false;
    };
  }, [recargar]);

  const yaEntro = useRef(false);
  useIonViewWillEnter(() => {
    // Ionic no desmonta la pantalla al navegar. Al volver de una pantalla hija
    // el efecto de montaje no se repite, de modo que los datos quedan viejos.
    // La primera entrada ya la cubre el efecto de montaje.
    if (yaEntro.current) recargar();
    else yaEntro.current = true;
  });

  return { datos, cargando, error, recargar, setDatos };
}
