import { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkmarkCircle, lockClosedOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { AvisoDePagoSimulado } from '../componentes/AvisoDeSimulacion.jsx';
import { formatearPesos } from './Tributaria.jsx';
import tributaria from '../servicios/tributaria.js';
import estacionamiento from '../servicios/estacionamiento.js';

/**
 * Pantalla de pago, compartida por los dos modulos que cobran.
 *
 * La consigna pide pago en linea en Tributaria y en Estacionamiento medido. No
 * hay pasarela, de modo que los dos pagos son simulados, y la decision tomada
 * es que el simulacro sea inconfundible:
 *
 *   - un cartel de demostracion fijo y visible, no un pie de pagina;
 *   - ningun campo que acepte un numero de tarjeta, un vencimiento o un codigo
 *     de seguridad: solo se elige un medio, que es una etiqueta;
 *   - el comprobante queda marcado como simulado en el historial.
 *
 * Una pantalla de pago municipal que parezca real no conviene tenerla dando
 * vueltas en un repositorio publico, y declararlo explicitamente queda mejor en
 * la defensa que disimularlo. El dia que exista pasarela, el pago no se
 * resuelve en esta pantalla: se redirige al sitio del proveedor, que es como lo
 * exige cualquier norma de seguridad de medios de pago.
 */

const MEDIOS = [
  { id: 'Tarjeta de credito (simulado)', etiqueta: 'Tarjeta de credito' },
  { id: 'Tarjeta de debito (simulado)', etiqueta: 'Tarjeta de debito' },
  { id: 'Billetera virtual (simulado)', etiqueta: 'Billetera virtual' },
  { id: 'Transferencia bancaria (simulado)', etiqueta: 'Transferencia bancaria' },
];

export function Pago() {
  const navegar = useNavigate();
  const { state } = useLocation();
  const [medio, setMedio] = useState(MEDIOS[0].id);
  const [procesando, setProcesando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  const datos = state ?? {};
  const volverA = datos.volverA ?? '/inicio';

  async function confirmar() {
    setProcesando(true);
    setError(null);
    try {
      if (datos.origen === 'tributaria') {
        await tributaria.pagarCedulon({ cedulonId: datos.cedulonId, medio });
      } else if (datos.origen === 'estacionamiento') {
        await estacionamiento.iniciarSesion({
          zonaId: datos.zonaId,
          patente: datos.patente,
          minutos: datos.minutos,
          medio,
        });
      }
      setListo(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(false);
    }
  }

  if (!state) {
    return (
      <Pantalla titulo="Pago" volverA="/inicio">
        <div className="contenido">
          <IonText color="medium">
            <p>No hay ninguna operacion pendiente de pago.</p>
          </IonText>
          <IonButton expand="block" onClick={() => navegar('/inicio')}>
            Volver al inicio
          </IonButton>
        </div>
      </Pantalla>
    );
  }

  if (listo) {
    return (
      <Pantalla titulo="Pago realizado" volverA={volverA}>
        <div className="contenido centro">
          <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: '4rem' }} />
          <h2>Operacion simulada con exito</h2>
          <p className="texto-tenue">
            {datos.concepto} · {formatearPesos(datos.importe)}
          </p>
          <AvisoDePagoSimulado />
          <IonButton expand="block" onClick={() => navegar(volverA, { replace: true })}>
            Volver
          </IonButton>
        </div>
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Pago en linea" volverA={volverA}>
      <div className="contenido">
        <AvisoDePagoSimulado />

        <div className="resumen-pago">
          <span>{datos.concepto}</span>
          <strong>{formatearPesos(datos.importe)}</strong>
        </div>

        <h3 className="titulo-seccion">Medio de pago</h3>
        <IonRadioGroup value={medio} onIonChange={(e) => setMedio(e.detail.value)}>
          {MEDIOS.map((m) => (
            <IonItem key={m.id}>
              <IonRadio value={m.id}>{m.etiqueta}</IonRadio>
            </IonItem>
          ))}
        </IonRadioGroup>

        <IonText color="medium">
          <p className="nota-seguridad">
            <IonIcon icon={lockClosedOutline} /> Esta pantalla no solicita ni almacena datos de
            tarjeta. En una implementacion real el cobro lo realizaria la pasarela del
            proveedor en su propio sitio, y la aplicacion nunca veria esos datos.
          </p>
        </IonText>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        <IonButton expand="block" onClick={confirmar} disabled={procesando}>
          {procesando ? <IonSpinner name="dots" /> : `Confirmar pago simulado`}
        </IonButton>
      </div>
    </Pantalla>
  );
}
