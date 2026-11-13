import { useEffect, useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonText,
  IonToast,
  IonToggle,
} from '@ionic/react';
import {
  copyOutline,
  notificationsOutline,
  trashOutline,
} from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';
import { activarNotificaciones, estadoDelCanal, avisoLocal } from '../push/fcm.js';
import { vaciarTodo } from '../servicios/almacenamiento.js';
import { USAR_SIMULADOR } from '../config.js';
import notificaciones from '../servicios/notificaciones.js';

/**
 * Preferencias de notificacion y estado del canal de push.
 *
 * Cubre el requisito de personalizacion —tipo de alerta y frecuencia— y ademas
 * expone el token de registro del dispositivo con copiado al portapapeles, que
 * es el mismo recurso que el TP6 agrego en GestorLiga y por el mismo motivo:
 * con 4 GB de memoria, abrir el visor de registros para leer el token compite
 * con la compilacion.
 */
export function Preferencias() {
  const { refrescar } = useAvisos();
  const [prefs, setPrefs] = useState(() => notificaciones.preferencias());
  const [canal, setCanal] = useState(null);
  const [token, setToken] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const tipos = notificaciones.tipos();

  useEffect(() => {
    estadoDelCanal().then(setCanal);
  }, []);

  async function guardar(nuevas) {
    const combinadas = { ...prefs, ...nuevas };
    setPrefs(combinadas);
    await notificaciones.guardarPreferencias(combinadas);
    refrescar();
  }

  async function activar() {
    setTrabajando(true);
    const resultado = await activarNotificaciones();
    setCanal(await estadoDelCanal());
    setToken(resultado.token);
    setMensaje(
      resultado.token
        ? 'Notificaciones activadas. Ya podes enviar una prueba desde la consola de Firebase.'
        : resultado.error
    );
    setTrabajando(false);
  }

  async function copiarToken() {
    try {
      await navigator.clipboard.writeText(token);
      setMensaje('Token copiado al portapapeles.');
    } catch {
      setMensaje('No se pudo copiar. Mantene presionado sobre el texto para seleccionarlo.');
    }
  }

  async function probarLocal() {
    const ok = await avisoLocal(
      'Aviso de prueba',
      'Si ves esto, el canal local del dispositivo funciona.'
    );
    if (!ok) setMensaje('Primero hay que conceder el permiso de notificaciones.');
  }

  function borrarDatos() {
    vaciarTodo();
    setPrefs(notificaciones.preferencias());
    refrescar();
    setMensaje('Se borraron los datos guardados en este dispositivo.');
  }

  return (
    <Pantalla titulo="Preferencias" volverA="/inicio">
      <div className="contenido">
        <IonList lines="full">
          <IonListHeader>
            <IonLabel>Tipos de aviso</IonLabel>
          </IonListHeader>

          {tipos.map((t) => (
            <IonItem key={t.id}>
              <IonToggle
                checked={prefs.tipos[t.id] !== false}
                onIonChange={(e) =>
                  guardar({ tipos: { ...prefs.tipos, [t.id]: e.detail.checked } })
                }
              >
                <IonLabel>
                  <h3>{t.etiqueta}</h3>
                  <p>{t.descripcion}</p>
                </IonLabel>
              </IonToggle>
            </IonItem>
          ))}

          <IonItem>
            <IonSelect
              label="Frecuencia"
              labelPlacement="fixed"
              value={prefs.frecuencia}
              onIonChange={(e) => guardar({ frecuencia: e.detail.value })}
            >
              <IonSelectOption value="inmediata">Apenas ocurren</IonSelectOption>
              <IonSelectOption value="diaria">Un resumen por dia</IonSelectOption>
              <IonSelectOption value="semanal">Un resumen por semana</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonToggle
              checked={prefs.silencioNocturno}
              onIonChange={(e) => guardar({ silencioNocturno: e.detail.checked })}
            >
              <IonLabel>
                <h3>Silencio nocturno</h3>
                <p>No molestar entre las 22 y las 8, salvo emergencias.</p>
              </IonLabel>
            </IonToggle>
          </IonItem>
        </IonList>

        <h3 className="titulo-seccion">Canal de notificaciones push</h3>

        {canal === null && <IonNote className="nota-bloque">Verificando el canal...</IonNote>}

        {canal && (
          <div className="panel-canal">
            <dl>
              <div>
                <dt>Navegador compatible</dt>
                <dd>{canal.soportado ? 'si' : 'no'}</dd>
              </div>
              <div>
                <dt>Contexto seguro</dt>
                <dd>{canal.contextoSeguro ? 'si (HTTPS o localhost)' : 'no'}</dd>
              </div>
              <div>
                <dt>Firebase configurado</dt>
                <dd>{canal.configurado ? 'si' : 'falta el archivo .env'}</dd>
              </div>
              <div>
                <dt>Clave VAPID</dt>
                <dd>{canal.vapid ? 'cargada' : 'falta'}</dd>
              </div>
              <div>
                <dt>Permiso</dt>
                <dd>{canal.permiso}</dd>
              </div>
            </dl>

            {canal.motivo && (
              <IonText color="warning">
                <p className="nota-bloque">{canal.motivo}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              onClick={activar}
              disabled={trabajando || Boolean(canal.motivo)}
            >
              <IonIcon slot="start" icon={notificationsOutline} />
              {trabajando ? 'Activando...' : 'Activar notificaciones'}
            </IonButton>

            <IonButton expand="block" fill="outline" size="small" onClick={probarLocal}>
              Probar un aviso local
            </IonButton>

            {token && (
              <div className="caja-token">
                <IonLabel>
                  <h3>Token de registro del dispositivo</h3>
                </IonLabel>
                <code>{token}</code>
                <IonButton size="small" fill="outline" onClick={copiarToken}>
                  <IonIcon slot="start" icon={copyOutline} />
                  Copiar
                </IonButton>
                <IonNote>
                  <small>
                    Pegalo en Firebase &gt; Messaging &gt; Enviar mensaje de prueba para dirigir
                    un aviso a este telefono.
                  </small>
                </IonNote>
              </div>
            )}
          </div>
        )}

        <h3 className="titulo-seccion">Datos y privacidad</h3>
        <IonNote className="nota-bloque">
          Los reclamos, las fotos adjuntas, los pagos simulados y estas preferencias se guardan
          unicamente en este dispositivo. La aplicacion no tiene cuenta de usuario ni envia esos
          datos a ningun servidor.
          {USAR_SIMULADOR && ' Los servicios municipales estan simulados localmente.'}
        </IonNote>

        <IonButton expand="block" fill="outline" color="danger" onClick={borrarDatos}>
          <IonIcon slot="start" icon={trashOutline} />
          Borrar mis datos de este dispositivo
        </IonButton>
      </div>

      <IonToast
        isOpen={mensaje !== null}
        message={mensaje ?? ''}
        duration={5000}
        onDidDismiss={() => setMensaje(null)}
      />
    </Pantalla>
  );
}
