import { IonFooter, IonIcon, IonLabel } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  bicycleOutline,
  chatbubbleEllipsesOutline,
  gridOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';

/**
 * Barra de accesos rapidos.
 *
 * Esta escrita a mano en lugar de usar IonTabs porque la aplicacion tiene siete
 * modulos y una barra de pestanas admite comodamente cuatro o cinco: la
 * navegacion principal es la grilla de la pantalla de inicio, y esta barra solo
 * acorta el camino a los tres destinos de uso frecuente.
 *
 * Usar IonTabs habria ademas anidado un segundo outlet de ruteo dentro del
 * principal, que es complejidad que esta aplicacion no necesita.
 */

const DESTINOS = [
  { ruta: '/inicio', icono: gridOutline, etiqueta: 'Inicio' },
  { ruta: '/bicicletas', icono: bicycleOutline, etiqueta: 'Bicis' },
  { ruta: '/reclamos', icono: chatbubbleEllipsesOutline, etiqueta: 'Reclamos' },
  { ruta: '/avisos', icono: notificationsOutline, etiqueta: 'Avisos' },
];

export function BarraInferior() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const { sinLeer } = useAvisos();

  return (
    <IonFooter className="barra-inferior">
      <nav aria-label="Accesos rapidos">
        {DESTINOS.map((d) => {
          const activo = pathname === d.ruta || pathname.startsWith(`${d.ruta}/`);
          return (
            <button
              key={d.ruta}
              type="button"
              className={activo ? 'activo' : ''}
              aria-current={activo ? 'page' : undefined}
              onClick={() => navegar(d.ruta)}
            >
              <span className="icono-con-globo">
                <IonIcon icon={d.icono} />
                {d.ruta === '/avisos' && sinLeer > 0 && (
                  <span className="globo" aria-label={`${sinLeer} avisos sin leer`}>
                    {sinLeer > 9 ? '9+' : sinLeer}
                  </span>
                )}
              </span>
              <IonLabel>{d.etiqueta}</IonLabel>
            </button>
          );
        })}
      </nav>
    </IonFooter>
  );
}
