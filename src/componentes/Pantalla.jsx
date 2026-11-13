import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { BarraInferior } from './BarraInferior.jsx';

/**
 * Envoltorio comun de las pantallas.
 *
 * Unifica encabezado, boton de retroceso y barra de accesos rapidos para que
 * las once pantallas del trabajo tengan exactamente la misma estructura. Es la
 * respuesta barata al criterio de interfaz: la consistencia no se consigue
 * recordandola en cada archivo sino poniendola en uno solo.
 */
export function Pantalla({
  titulo,
  volverA = '/inicio',
  sinVolver = false,
  acciones = null,
  herramientaExtra = null,
  children,
  conBarra = true,
}) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          {!sinVolver && (
            <IonButtons slot="start">
              <IonBackButton defaultHref={volverA} text="" />
            </IonButtons>
          )}
          <IonTitle>{titulo}</IonTitle>
          {acciones && <IonButtons slot="end">{acciones}</IonButtons>}
        </IonToolbar>
        {herramientaExtra}
      </IonHeader>

      <IonContent fullscreen>{children}</IonContent>

      {conBarra && <BarraInferior />}
    </IonPage>
  );
}
