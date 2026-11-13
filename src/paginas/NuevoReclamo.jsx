import { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { locateOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { SelectorDeAdjuntos } from '../componentes/SelectorDeAdjuntos.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useGeolocalizacion } from '../ganchos/useGeolocalizacion.js';
import reclamos from '../servicios/reclamos.js';

/**
 * Alta de un reclamo.
 *
 * Cubre el formulario, los adjuntos y la ubicacion. La validacion se hace en el
 * componente y antes de llamar al servicio: un reclamo sin descripcion no
 * deberia consumir una peticion para que lo rechacen del otro lado.
 */
export function NuevoReclamo() {
  const navegar = useNavigate();
  const { ubicacion, pedirUbicacion, cargando: ubicando, error: errorUbicacion } =
    useGeolocalizacion();

  const [categoria, setCategoria] = useState('alumbrado');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [adjuntos, setAdjuntos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [tocado, setTocado] = useState(false);

  const categorias = reclamos.categorias();
  const area = categorias.find((c) => c.id === categoria)?.area;

  const descripcionValida = descripcion.trim().length >= 15;
  const direccionValida = direccion.trim().length >= 5;
  const formularioValido = descripcionValida && direccionValida;

  async function enviar() {
    setTocado(true);
    if (!formularioValido) return;

    setEnviando(true);
    setError(null);

    try {
      const creado = await reclamos.crearReclamo({
        categoria,
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
        adjuntos,
      });
      navegar(`/reclamos/${creado.id}`, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla titulo="Nuevo reclamo" volverA="/reclamos">
      <div className="contenido">
        <AvisoDeSimulacion texto="El reclamo se registra en este dispositivo. No se envia a ningun organismo." />

        <IonItem>
          <IonSelect
            label="Tipo de reclamo"
            labelPlacement="floating"
            value={categoria}
            onIonChange={(e) => setCategoria(e.detail.value)}
          >
            {categorias.map((c) => (
              <IonSelectOption key={c.id} value={c.id}>
                {c.etiqueta}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {area && (
          <IonNote className="nota-bloque">
            Se deriva a: <strong>{area}</strong>
          </IonNote>
        )}

        <IonItem>
          <IonTextarea
            label="Descripcion"
            labelPlacement="floating"
            rows={5}
            counter
            maxlength={600}
            value={descripcion}
            onIonInput={(e) => setDescripcion(e.detail.value ?? '')}
            onIonBlur={() => setTocado(true)}
            placeholder="Contá que pasa, desde cuando y en que parte de la cuadra."
          />
        </IonItem>
        {tocado && !descripcionValida && (
          <IonText color="danger">
            <small className="error-campo">
              Describí el problema con al menos quince caracteres.
            </small>
          </IonText>
        )}

        <IonItem>
          <IonInput
            label="Direccion"
            labelPlacement="floating"
            value={direccion}
            onIonInput={(e) => setDireccion(e.detail.value ?? '')}
            onIonBlur={() => setTocado(true)}
            placeholder="Calle y altura, o esquina"
          />
        </IonItem>
        {tocado && !direccionValida && (
          <IonText color="danger">
            <small className="error-campo">Indicá una direccion o esquina.</small>
          </IonText>
        )}

        <IonButton
          size="small"
          fill="outline"
          expand="block"
          onClick={pedirUbicacion}
          disabled={ubicando}
        >
          <IonIcon slot="start" icon={locateOutline} />
          {ubicando
            ? 'Obteniendo ubicacion...'
            : ubicacion
              ? `Ubicacion adjunta (±${Math.round(ubicacion.precisionM)} m)`
              : 'Adjuntar mi ubicacion'}
        </IonButton>

        {errorUbicacion && (
          <IonNote color="danger" className="nota-bloque">
            {errorUbicacion}
          </IonNote>
        )}

        <h3 className="titulo-seccion">Fotos</h3>
        <IonNote className="nota-bloque">
          Las imagenes se reducen en el telefono antes de guardarse. No salen del dispositivo.
        </IonNote>
        <SelectorDeAdjuntos adjuntos={adjuntos} alCambiar={setAdjuntos} />

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        <IonButton
          expand="block"
          className="boton-principal"
          onClick={enviar}
          disabled={enviando}
        >
          {enviando ? <IonSpinner name="dots" /> : 'Enviar reclamo'}
        </IonButton>
      </div>
    </Pantalla>
  );
}
