import { useCallback } from 'react';
import { IonBadge, IonButton, IonIcon, IonNote } from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import { cardOutline, printOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { EstadoDeCarga, EstadoDeError } from '../componentes/Estados.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useServicio } from '../ganchos/useServicio.js';
import { formatearFecha, formatearPesos } from './Tributaria.jsx';
import tributaria from '../servicios/tributaria.js';

/**
 * Emision de un cedulon.
 *
 * "Emitir" en la aplicacion significa producir un comprobante imprimible, y se
 * resuelve con window.print() sobre una hoja con estilos de impresion propios
 * en lugar de generar un PDF en el cliente. El motivo es de arquitectura y vale
 * para el informe: generar PDF exige sumar una biblioteca de varios cientos de
 * kilobytes al paquete, que es justamente lo que castiga el requisito no
 * funcional de cargar en menos de tres segundos, y el navegador ya sabe
 * imprimir y guardar como PDF.
 */
export function DetalleCedulon() {
  const { id } = useParams();
  const navegar = useNavigate();

  const peticion = useCallback(() => tributaria.obtenerCedulon(id), [id]);
  const { datos: cedulon, cargando, error, recargar } = useServicio(peticion, [id]);

  const colores = { pendiente: 'warning', vencido: 'danger', pagado: 'success' };

  return (
    <Pantalla titulo="Cedulon" volverA="/tributaria">
      <div className="contenido">
        {cargando && <EstadoDeCarga filas={2} texto="Emitiendo cedulon..." />}
        {error && <EstadoDeError error={error} alReintentar={recargar} />}

        {cedulon && (
          <>
            <AvisoDeSimulacion texto="Comprobante de demostracion. No tiene validez fiscal." />

            <div className="cedulon" id="cedulon-imprimible">
              <header>
                <div>
                  <strong>Municipalidad de San Francisco</strong>
                  <span>Direccion General Tributaria</span>
                </div>
                <IonBadge color={colores[cedulon.estado]}>{cedulon.estado}</IonBadge>
              </header>

              <dl>
                <div>
                  <dt>Tributo</dt>
                  <dd>{cedulon.tributo}</dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>{cedulon.periodo}</dd>
                </div>
                <div>
                  <dt>Cuenta</dt>
                  <dd>{cedulon.cuenta}</dd>
                </div>
                <div>
                  <dt>Vencimiento</dt>
                  <dd>{formatearFecha(cedulon.vence)}</dd>
                </div>
                {cedulon.estado === 'pagado' && (
                  <div>
                    <dt>Pagado el</dt>
                    <dd>{formatearFecha(cedulon.pagadoEl)}</dd>
                  </div>
                )}
              </dl>

              <div className="cedulon-total">
                <span>Importe</span>
                <strong>{formatearPesos(cedulon.importe)}</strong>
              </div>

              <p className="cedulon-codigo">
                {/* Linea de codigo de barras de demostracion, no interpretable por ningun lector. */}
                {`${cedulon.cuenta.replace(/\D/g, '')}${String(
                  Math.round(cedulon.importe * 100)
                ).padStart(10, '0')}`}
              </p>
              <IonNote color="medium">
                <small>Documento de demostracion generado por una aplicacion academica.</small>
              </IonNote>
            </div>

            <div className="acciones-apiladas">
              <IonButton expand="block" fill="outline" onClick={() => window.print()}>
                <IonIcon slot="start" icon={printOutline} />
                Imprimir o guardar como PDF
              </IonButton>

              {cedulon.estado !== 'pagado' && (
                <IonButton
                  expand="block"
                  onClick={() =>
                    navegar('/pago', {
                      state: {
                        origen: 'tributaria',
                        cedulonId: cedulon.id,
                        concepto: `${cedulon.tributo} - ${cedulon.periodo}`,
                        importe: cedulon.importe,
                        volverA: '/tributaria',
                      },
                    })
                  }
                >
                  <IonIcon slot="start" icon={cardOutline} />
                  Pagar {formatearPesos(cedulon.importe)}
                </IonButton>
              )}
            </div>
          </>
        )}
      </div>
    </Pantalla>
  );
}
