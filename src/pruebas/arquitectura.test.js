import { describe, it, expect } from 'vitest';
import { seleccionar, ErrorDeServicio } from '../servicios/seleccion.js';

import simuladoBicicletas from '../servicios/mock/bicicletas.js';
import realBicicletas from '../servicios/real/bicicletas.js';
import simuladoTributaria from '../servicios/mock/tributaria.js';
import realTributaria from '../servicios/real/tributaria.js';
import simuladoReclamos from '../servicios/mock/reclamos.js';
import realReclamos from '../servicios/real/reclamos.js';
import simuladoAtencion from '../servicios/mock/atencion.js';
import realAtencion from '../servicios/real/atencion.js';
import simuladoAlarmas from '../servicios/mock/alarmas.js';
import realAlarmas from '../servicios/real/alarmas.js';
import simuladoEstacionamiento from '../servicios/mock/estacionamiento.js';
import realEstacionamiento from '../servicios/real/estacionamiento.js';
import simuladoNotificaciones from '../servicios/mock/notificaciones.js';
import realNotificaciones from '../servicios/real/notificaciones.js';

/**
 * Pruebas de la decision de arquitectura.
 *
 * Son las mas importantes del trabajo, porque verifican exactamente lo que el
 * informe afirma: que las dos implementaciones de cada servicio son
 * intercambiables, y que por lo tanto cambiar USAR_SIMULADOR no puede romper
 * ninguna pantalla.
 *
 * Sin esta prueba, la afirmacion "basta con cambiar una bandera" es una
 * promesa. Con ella, agregar un metodo al simulador y olvidarse de agregarlo a
 * la implementacion real hace fallar la suite.
 */

const PARES = [
  ['bicicletas', simuladoBicicletas, realBicicletas],
  ['tributaria', simuladoTributaria, realTributaria],
  ['reclamos', simuladoReclamos, realReclamos],
  ['atencion', simuladoAtencion, realAtencion],
  ['alarmas', simuladoAlarmas, realAlarmas],
  ['estacionamiento', simuladoEstacionamiento, realEstacionamiento],
  ['notificaciones', simuladoNotificaciones, realNotificaciones],
];

/** Los metodos que empiezan con guion bajo son andamiaje de prueba, no contrato. */
const publicos = (modulo) => Object.keys(modulo).filter((k) => !k.startsWith('_')).sort();

describe('contrato entre la implementacion simulada y la real', () => {
  it.each(PARES)('%s expone el mismo conjunto de metodos en ambas', (_, simulado, real) => {
    expect(publicos(real)).toEqual(publicos(simulado));
  });

  it.each(PARES)('%s expone funciones y no otra cosa', (_, simulado, real) => {
    for (const metodo of publicos(simulado)) {
      expect(typeof simulado[metodo], `simulado.${metodo}`).toBe('function');
      expect(typeof real[metodo], `real.${metodo}`).toBe('function');
    }
  });

  it.each(PARES)('%s declara la misma cantidad de parametros', (_, simulado, real) => {
    for (const metodo of publicos(simulado)) {
      expect(real[metodo].length, `aridad de ${metodo}`).toBe(simulado[metodo].length);
    }
  });
});

describe('selector de implementacion', () => {
  it('devuelve la simulada cuando la bandera esta activa', () => {
    // seleccionar() lee USAR_SIMULADOR de config.js, que el proyecto entrega en true.
    expect(seleccionar('simulado', 'real')).toBe('simulado');
  });

  it('las siete fachadas devuelven la implementacion simulada', async () => {
    const servicios = await import('../servicios/index.js');
    expect(servicios.bicicletas).toBe(simuladoBicicletas);
    expect(servicios.tributaria).toBe(simuladoTributaria);
    expect(servicios.reclamos).toBe(simuladoReclamos);
    expect(servicios.atencion).toBe(simuladoAtencion);
    expect(servicios.alarmas).toBe(simuladoAlarmas);
    expect(servicios.estacionamiento).toBe(simuladoEstacionamiento);
    expect(servicios.notificaciones).toBe(simuladoNotificaciones);
  });
});

describe('error propio de la capa de servicios', () => {
  it('conserva mensaje y codigo, y sigue siendo un Error', () => {
    const e = new ErrorDeServicio('no responde', 'tiempo_agotado');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ErrorDeServicio');
    expect(e.message).toBe('no responde');
    expect(e.codigo).toBe('tiempo_agotado');
  });

  it('usa un codigo por defecto cuando no se indica', () => {
    expect(new ErrorDeServicio('x').codigo).toBe('servicio_no_disponible');
  });
});
