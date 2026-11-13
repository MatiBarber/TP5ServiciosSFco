import { IonIcon } from '@ionic/react';
import { informationCircleOutline, warningOutline } from 'ionicons/icons';
import { USAR_SIMULADOR } from '../config.js';

/**
 * Cartel que declara que el dato no viene de un servicio real.
 *
 * No es decoracion. La consigna autoriza a simular los servicios sin API, y
 * declararlo en la propia pantalla —y no solo en el informe— es lo que
 * distingue una demostracion honesta de una que aparenta.
 */
export function AvisoDeSimulacion({ texto }) {
  if (!USAR_SIMULADOR) return null;

  return (
    <div className="aviso-simulacion" role="note">
      <IonIcon icon={informationCircleOutline} />
      <span>
        {texto ?? 'Datos simulados: no existe API publica municipal para este servicio.'}
      </span>
    </div>
  );
}

/**
 * Cartel de pago simulado.
 *
 * Se muestra siempre, incluso con USAR_SIMULADOR en false, porque la aplicacion
 * no integra ninguna pasarela de pagos en ninguno de los dos modos. Una
 * pantalla de pago municipal que parezca real no conviene tenerla dando vueltas
 * en un repositorio publico.
 */
export function AvisoDePagoSimulado() {
  return (
    <div className="aviso-pago" role="alert">
      <IonIcon icon={warningOutline} />
      <div>
        <strong>Pago simulado</strong>
        <p>
          Esta pantalla no procesa pagos ni se conecta a ninguna pasarela. No se solicitan
          ni se almacenan datos de tarjeta. Es una demostracion academica.
        </p>
      </div>
    </div>
  );
}
