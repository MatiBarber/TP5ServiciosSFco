import { useCallback, useEffect, useState } from 'react';

/**
 * Gancho de geolocalizacion del navegador.
 *
 * La API exige contexto seguro: funciona en localhost y por HTTPS, y falla en
 * cualquier otro origen. Es uno de los motivos por los que el proyecto se
 * publica en Firebase Hosting desde el primer dia en lugar de al final.
 *
 * Lo usan bicicletas (estaciones cercanas), alarmas (alerta por cercania) y
 * estacionamiento (en que zona estoy parado).
 *
 * @param {{automatico?: boolean}} [opciones]
 */
export function useGeolocalizacion({ automatico = false } = {}) {
  const [ubicacion, setUbicacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const soportada = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const pedirUbicacion = useCallback(() => {
    if (!soportada) {
      setError('Este navegador no permite compartir la ubicacion.');
      return;
    }

    setCargando(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude,
          precisionM: posicion.coords.accuracy,
        });
        setCargando(false);
      },
      (fallo) => {
        const mensajes = {
          1: 'Permiso de ubicacion denegado. Podes habilitarlo desde la configuracion del navegador.',
          2: 'No se pudo determinar la ubicacion. Probá al aire libre o con el GPS activado.',
          3: 'La ubicacion tardo demasiado en responder.',
        };
        setError(mensajes[fallo.code] ?? 'No se pudo obtener la ubicacion.');
        setCargando(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [soportada]);

  useEffect(() => {
    if (automatico) pedirUbicacion();
  }, [automatico, pedirUbicacion]);

  return { ubicacion, cargando, error, soportada, pedirUbicacion };
}
