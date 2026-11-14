import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
  IonLabel,
  IonText,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import {
  bicycleOutline,
  cashOutline,
  callOutline,
  chatbubbleEllipsesOutline,
  carOutline,
  notificationsOutline,
  shieldCheckmarkOutline,
  settingsOutline,
} from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';
import { USAR_SIMULADOR } from '../config.js';

/**
 * Pantalla de inicio.
 *
 * La grilla de siete accesos es la navegacion principal del trabajo, y el orden
 * no es el de la consigna sino el de uso previsible: lo que un vecino abre
 * seguido primero, y lo que consulta de vez en cuando despues.
 */

const MODULOS = [
  {
    ruta: '/bicicletas',
    titulo: 'Bicicletas publicas',
    detalle: 'Estaciones y disponibilidad en vivo',
    icono: bicycleOutline,
    color: '#0b6b3a',
  },
  {
    ruta: '/reclamos',
    titulo: 'Centro de reclamos',
    detalle: 'Reclamos y seguimiento',
    icono: chatbubbleEllipsesOutline,
    color: '#b45309',
  },
  {
    ruta: '/tributaria',
    titulo: 'Tributaria',
    detalle: 'Cedulones, pagos y vencimientos',
    icono: cashOutline,
    color: '#1d4ed8',
  },
  {
    ruta: '/estacionamiento',
    titulo: 'Estacionamiento medido',
    detalle: 'Zonas, tarifas y temporizador',
    icono: carOutline,
    color: '#be123c',
  },
  {
    ruta: '/alarmas',
    titulo: 'Alarmas comunitarias',
    detalle: 'Estado en vivo y suscripciones',
    icono: shieldCheckmarkOutline,
    color: '#6d28d9',
  },
  {
    ruta: '/atencion',
    titulo: 'Lineas de atencion',
    detalle: 'Telefonos, correo y mensajeria',
    icono: callOutline,
    color: '#0f766e',
  },
  {
    ruta: '/avisos',
    titulo: 'Notificaciones',
    detalle: 'Novedades e historial',
    icono: notificationsOutline,
    color: '#0369a1',
  },
];

export function Inicio() {
  const navegar = useNavigate();
  const { sinLeer } = useAvisos();

  return (
    <Pantalla
      titulo="Servicios San Francisco"
      sinVolver
      acciones={
        <button
          type="button"
          className="boton-barra"
          aria-label="Preferencias"
          onClick={() => navegar('/preferencias')}
        >
          <IonIcon icon={settingsOutline} />
        </button>
      }
    >
      <div className="contenido">
        <IonText color="medium">
          <p className="bajada">
            Accedé a los servicios municipales desde el telefono. Elegí un servicio para
            empezar.
          </p>
        </IonText>

        <AvisoDeSimulacion
          texto={
            USAR_SIMULADOR
              ? 'Modo demostracion: los datos provienen de un simulador local, no de servicios municipales reales.'
              : undefined
          }
        />

        <div className="grilla-modulos">
          {MODULOS.map((m) => (
            <IonCard
              key={m.ruta}
              button
              className="tarjeta-modulo"
              onClick={() => navegar(m.ruta)}
            >
              <IonCardContent>
                <span className="circulo-icono" style={{ background: m.color }}>
                  <IonIcon icon={m.icono} />
                </span>
                <h3>
                  {m.titulo}
                  {m.ruta === '/avisos' && sinLeer > 0 && (
                    <IonBadge color="danger" className="badge-modulo">
                      {sinLeer}
                    </IonBadge>
                  )}
                </h3>
                <p>{m.detalle}</p>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        <div className="pie-institucional">
          <IonChip outline>
            <IonLabel>UTN FRSFco</IonLabel>
          </IonChip>
          <IonText color="medium">
            <small>
              Trabajo Practico 5 - Arquitecturas Moviles - Aplicacion web movil no nativa
            </small>
          </IonText>
        </div>
      </div>
    </Pantalla>
  );
}
