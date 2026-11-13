/**
 * Configuracion unica de la aplicacion.
 *
 * Esta es la pieza que sostiene la decision de arquitectura del trabajo: ninguna
 * pantalla sabe de donde salen los datos. Todas importan un modulo de
 * `src/servicios/`, y cada uno de esos modulos mira USAR_SIMULADOR para elegir
 * entre la implementacion simulada y la implementacion contra una API real.
 *
 * Pasar de simulado a real es cambiar esta bandera, no reescribir pantallas.
 */

/** Si es true, los siete modulos leen de `servicios/mock/`. Si es false, de `servicios/real/`. */
export const USAR_SIMULADOR = true;

/** Base de la API municipal, el dia que exista. Solo se usa con USAR_SIMULADOR = false. */
export const BASE_API = import.meta.env?.VITE_BASE_API ?? 'https://api.sanfrancisco.gob.ar/v1';

/**
 * Comportamiento del simulador de red.
 *
 * Un simulador que responde siempre instantaneo y siempre bien deja sin
 * ejercitar los estados de carga y de error de la interfaz. La aplicacion
 * parece andar en desarrollo y se rompe en la demostracion. Por eso el
 * simulador demora y falla a proposito.
 */
export const RED_SIMULADA = {
  demoraMinMs: 300,
  demoraMaxMs: 800,
  /** Proporcion de respuestas que fallan. 0.08 = ocho de cada cien. */
  tasaDeFallas: 0.08,
};

/** Centro de los tres mapas del trabajo. Medido en el TP7 (ClimaApi.kt de GestorLiga). */
export const SAN_FRANCISCO = {
  lat: -31.4257,
  lng: -62.0836,
  zoom: 14,
};

/** Radio en metros dentro del cual una alarma comunitaria se considera cercana. */
export const RADIO_CERCANIA_M = 800;

/** Configuracion de Firebase. Se completa desde .env (ver README). */
export const FIREBASE = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_SENDER_ID ?? '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID ?? '',
};

/** Clave publica VAPID del par de claves web push del proyecto de Firebase. */
export const VAPID_KEY = import.meta.env?.VITE_FIREBASE_VAPID_KEY ?? '';
