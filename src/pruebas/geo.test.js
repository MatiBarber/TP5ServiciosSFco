import { describe, it, expect } from 'vitest';
import {
  distanciaEnMetros,
  ordenarPorCercania,
  dentroDelPoligono,
  formatearDistancia,
} from '../servicios/geo.js';
import { ZONAS_DE_ESTACIONAMIENTO } from '../servicios/datos/estacionamiento.js';
import { SAN_FRANCISCO } from '../config.js';

/**
 * Pruebas de las funciones geograficas.
 *
 * Las tres pantallas con mapa dependen de estas funciones, y ninguna de las
 * tres se puede verificar sin un navegador con GPS. Estas si, porque son puras.
 */

describe('distancia entre dos puntos', () => {
  it('da cero para el mismo punto', () => {
    expect(distanciaEnMetros(SAN_FRANCISCO, SAN_FRANCISCO)).toBe(0);
  });

  it('un grado de latitud son unos 111 kilometros', () => {
    const d = distanciaEnMetros({ lat: -31, lng: -62 }, { lat: -32, lng: -62 });
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it('es simetrica', () => {
    const a = { lat: -31.4257, lng: -62.0836 };
    const b = { lat: -31.4336, lng: -62.0822 };
    expect(distanciaEnMetros(a, b)).toBeCloseTo(distanciaEnMetros(b, a), 6);
  });

  it('la plaza y la terminal estan a menos de un kilometro y medio', () => {
    // Comprobacion contra una distancia conocida de la ciudad.
    const plaza = { lat: -31.4258, lng: -62.0833 };
    const terminal = { lat: -31.4336, lng: -62.0822 };
    const d = distanciaEnMetros(plaza, terminal);
    expect(d).toBeGreaterThan(700);
    expect(d).toBeLessThan(1500);
  });
});

describe('orden por cercania', () => {
  const puntos = [
    { id: 'lejos', lat: -31.4405, lng: -62.0691 },
    { id: 'cerca', lat: -31.4258, lng: -62.0833 },
    { id: 'medio', lat: -31.4316, lng: -62.0918 },
  ];

  it('ordena de la mas cercana a la mas lejana y agrega la distancia', () => {
    const ordenados = ordenarPorCercania(puntos, SAN_FRANCISCO);
    expect(ordenados.map((p) => p.id)).toEqual(['cerca', 'medio', 'lejos']);
    expect(ordenados[0].distanciaM).toBeLessThan(ordenados[2].distanciaM);
  });

  it('sin ubicacion devuelve la lista intacta y sin distancias', () => {
    const resultado = ordenarPorCercania(puntos, null);
    expect(resultado.map((p) => p.id)).toEqual(['lejos', 'cerca', 'medio']);
    expect(resultado[0].distanciaM).toBeUndefined();
  });

  it('no modifica el arreglo original', () => {
    const copia = [...puntos];
    ordenarPorCercania(puntos, SAN_FRANCISCO);
    expect(puntos).toEqual(copia);
  });
});

describe('punto dentro de poligono', () => {
  const zonaRoja = ZONAS_DE_ESTACIONAMIENTO.find((z) => z.id === 'zona-roja');

  it('reconoce un punto en el centro de la zona roja', () => {
    expect(dentroDelPoligono({ lat: -31.4258, lng: -62.0835 }, zonaRoja.poligono)).toBe(true);
  });

  it('descarta un punto claramente afuera', () => {
    expect(dentroDelPoligono({ lat: -31.4405, lng: -62.0691 }, zonaRoja.poligono)).toBe(false);
  });

  it('las tres zonas no se superponen en sus centros', () => {
    for (const zona of ZONAS_DE_ESTACIONAMIENTO) {
      const lats = zona.poligono.map((p) => p[0]);
      const lngs = zona.poligono.map((p) => p[1]);
      const centro = {
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      };

      const contenedoras = ZONAS_DE_ESTACIONAMIENTO.filter((z) =>
        dentroDelPoligono(centro, z.poligono)
      );
      expect(contenedoras.map((z) => z.id)).toEqual([zona.id]);
    }
  });
});

describe('formato de distancia', () => {
  it('usa metros por debajo del kilometro', () => {
    expect(formatearDistancia(420)).toBe('420 m');
  });

  it('usa kilometros con un decimal por encima', () => {
    expect(formatearDistancia(2350)).toBe('2.4 km');
  });

  it('devuelve cadena vacia cuando no hay distancia', () => {
    expect(formatearDistancia(undefined)).toBe('');
    expect(formatearDistancia(null)).toBe('');
  });
});
