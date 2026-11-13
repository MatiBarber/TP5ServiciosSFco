import { lazy, Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
  IonSpinner,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { Inicio } from './paginas/Inicio.jsx';
import { ProveedorDeAvisos } from './push/ProveedorDeAvisos.jsx';

/**
 * Las pantallas se cargan bajo demanda.
 *
 * La de inicio se importa de forma directa porque es la primera que se dibuja y
 * diferirla solo agregaria un viaje de red antes de mostrar algo. Las otras
 * once viajan en fragmentos separados: el vecino que entra a consultar una
 * estacion de bicicletas no descarga la pantalla de cedulones ni la biblioteca
 * de mapas que usa el estacionamiento medido.
 *
 * El efecto sobre el requisito de cargar en menos de tres segundos esta medido
 * en el informe, con el tamano del paquete antes y despues del cambio.
 */
const Bicicletas = lazy(() =>
  import('./paginas/Bicicletas.jsx').then((m) => ({ default: m.Bicicletas }))
);
const Tributaria = lazy(() =>
  import('./paginas/Tributaria.jsx').then((m) => ({ default: m.Tributaria }))
);
const DetalleCedulon = lazy(() =>
  import('./paginas/DetalleCedulon.jsx').then((m) => ({ default: m.DetalleCedulon }))
);
const Reclamos = lazy(() =>
  import('./paginas/Reclamos.jsx').then((m) => ({ default: m.Reclamos }))
);
const NuevoReclamo = lazy(() =>
  import('./paginas/NuevoReclamo.jsx').then((m) => ({ default: m.NuevoReclamo }))
);
const DetalleReclamo = lazy(() =>
  import('./paginas/DetalleReclamo.jsx').then((m) => ({ default: m.DetalleReclamo }))
);
const Atencion = lazy(() =>
  import('./paginas/Atencion.jsx').then((m) => ({ default: m.Atencion }))
);
const Alarmas = lazy(() =>
  import('./paginas/Alarmas.jsx').then((m) => ({ default: m.Alarmas }))
);
const Estacionamiento = lazy(() =>
  import('./paginas/Estacionamiento.jsx').then((m) => ({ default: m.Estacionamiento }))
);
const Avisos = lazy(() => import('./paginas/Avisos.jsx').then((m) => ({ default: m.Avisos })));
const Preferencias = lazy(() =>
  import('./paginas/Preferencias.jsx').then((m) => ({ default: m.Preferencias }))
);
const Pago = lazy(() => import('./paginas/Pago.jsx').then((m) => ({ default: m.Pago })));

setupIonicReact({ mode: 'md' });

/**
 * Pantalla intermedia mientras se descarga un fragmento.
 *
 * Es un IonPage y no un div suelto a proposito: la transicion entre pantallas
 * de Ionic espera encontrar una pagina, y un marcador de posicion que no lo sea
 * produce un salto visible al completarse la carga.
 */
function Cargando() {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="estado">
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );
}

/**
 * Raiz de la aplicacion.
 *
 * Las siete rutas de primer nivel corresponden una a una a los siete servicios
 * que enumera la consigna. Las rutas de segundo nivel —detalle de cedulon,
 * detalle de reclamo, pago— se apilan sobre ellas y vuelven con el boton atras,
 * que es la navegacion que un usuario de telefono espera.
 *
 * El modo se fija en 'md' a proposito y no se deja en automatico: asi la
 * aplicacion se ve igual en el Moto G31 que en el navegador de escritorio
 * durante el desarrollo, y las capturas del informe son reproducibles.
 */
export function App() {
  return (
    <IonApp>
      <ProveedorDeAvisos>
        <IonReactRouter>
          <Suspense fallback={<Cargando />}>
            <IonRouterOutlet>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/bicicletas" element={<Bicicletas />} />
              <Route path="/tributaria" element={<Tributaria />} />
              <Route path="/tributaria/:id" element={<DetalleCedulon />} />
              <Route path="/reclamos" element={<Reclamos />} />
              <Route path="/reclamos/nuevo" element={<NuevoReclamo />} />
              <Route path="/reclamos/:id" element={<DetalleReclamo />} />
              <Route path="/atencion" element={<Atencion />} />
              <Route path="/alarmas" element={<Alarmas />} />
              <Route path="/estacionamiento" element={<Estacionamiento />} />
              <Route path="/avisos" element={<Avisos />} />
              <Route path="/preferencias" element={<Preferencias />} />
              <Route path="/pago" element={<Pago />} />
              <Route path="/" element={<Navigate to="/inicio" replace />} />
            </IonRouterOutlet>
          </Suspense>
        </IonReactRouter>
      </ProveedorDeAvisos>
    </IonApp>
  );
}
