import {
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { alertCircleOutline, cloudOfflineOutline, refreshOutline } from 'ionicons/icons';

/**
 * Estados compartidos de carga, error y vacio.
 *
 * Existen como componentes y no sueltos en cada pantalla porque el simulador
 * falla a proposito en una de cada doce peticiones: si cada modulo resolviera
 * el error por su cuenta, la aplicacion tendria siete comportamientos distintos
 * frente al mismo problema.
 */

export function EstadoDeCarga({ filas = 3, texto = 'Consultando el servicio municipal...' }) {
  return (
    <div className="estado" aria-live="polite" aria-busy="true">
      <div className="estado-encabezado">
        <IonSpinner name="crescent" />
        <IonText color="medium">
          <small>{texto}</small>
        </IonText>
      </div>
      {Array.from({ length: filas }).map((_, i) => (
        <div className="esqueleto-fila" key={i}>
          <IonSkeletonText animated style={{ width: '70%', height: '14px' }} />
          <IonSkeletonText animated style={{ width: '45%', height: '12px' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{error: Error & {codigo?: string}, alReintentar?: () => void}} props
 */
export function EstadoDeError({ error, alReintentar }) {
  const sinConexion = error?.codigo === 'sin_conexion' || !navigator.onLine;

  return (
    <div className="estado estado-error" role="alert">
      <IonIcon
        icon={sinConexion ? cloudOfflineOutline : alertCircleOutline}
        color="danger"
        style={{ fontSize: '2.2rem' }}
      />
      <p className="estado-titulo">
        {sinConexion ? 'Sin conexion' : 'El servicio no respondio'}
      </p>
      <p className="estado-detalle">
        {sinConexion
          ? 'Estas viendo la aplicacion sin conexion. Algunos datos pueden estar desactualizados.'
          : error?.message ?? 'Ocurrio un problema inesperado.'}
      </p>
      {alReintentar && (
        <IonButton size="small" fill="outline" onClick={alReintentar}>
          <IonIcon slot="start" icon={refreshOutline} />
          Reintentar
        </IonButton>
      )}
    </div>
  );
}

export function EstadoVacio({ titulo, detalle, icono, accion }) {
  return (
    <div className="estado">
      {icono && <IonIcon icon={icono} color="medium" style={{ fontSize: '2.2rem' }} />}
      <p className="estado-titulo">{titulo}</p>
      {detalle && <p className="estado-detalle">{detalle}</p>}
      {accion}
    </div>
  );
}
