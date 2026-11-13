/**
 * Zonas de estacionamiento medido.
 *
 * Cada zona es un poligono dibujado sobre el mapa. Las coordenadas son
 * rectangulos aproximados alrededor del microcentro de San Francisco: alcanzan
 * para que la pantalla sea legible y para que la deteccion de "en que zona
 * estoy" tenga algo contra que probarse.
 */

export const ZONAS_DE_ESTACIONAMIENTO = [
  {
    id: 'zona-roja',
    nombre: 'Zona Roja - Microcentro',
    color: '#dc2626',
    tarifaPorHora: 1200,
    fraccionMinutos: 30,
    maximoHoras: 2,
    horario: 'Lunes a viernes 8 a 20, sabados 8 a 13',
    poligono: [
      [-31.4238, -62.0862],
      [-31.4238, -62.0808],
      [-31.4278, -62.0808],
      [-31.4278, -62.0862],
    ],
  },
  {
    id: 'zona-amarilla',
    nombre: 'Zona Amarilla - Anillo centro',
    color: '#ca8a04',
    tarifaPorHora: 800,
    fraccionMinutos: 30,
    maximoHoras: 4,
    horario: 'Lunes a viernes 8 a 20',
    poligono: [
      [-31.4212, -62.0898],
      [-31.4212, -62.0782],
      [-31.4238, -62.0782],
      [-31.4238, -62.0898],
    ],
  },
  {
    id: 'zona-verde',
    nombre: 'Zona Verde - Hospital y Terminal',
    color: '#16a34a',
    tarifaPorHora: 500,
    fraccionMinutos: 60,
    maximoHoras: 6,
    horario: 'Lunes a viernes 8 a 18',
    poligono: [
      [-31.4318, -62.0862],
      [-31.4318, -62.0792],
      [-31.4352, -62.0792],
      [-31.4352, -62.0862],
    ],
  },
];

/** Minutos antes del vencimiento en que se avisa al usuario. */
export const AVISO_PREVIO_MINUTOS = 5;
