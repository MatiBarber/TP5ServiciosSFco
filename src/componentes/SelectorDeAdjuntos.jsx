import { useRef, useState } from 'react';
import { IonButton, IonIcon, IonText } from '@ionic/react';
import { cameraOutline, closeCircle, documentAttachOutline } from 'ionicons/icons';

/**
 * Selector de adjuntos del centro de reclamos.
 *
 * El atributo capture del input abre la camara directamente en el telefono, que
 * es el caso de uso real: el vecino esta parado frente al bache.
 *
 * Las imagenes se reducen antes de guardarlas. Una foto del Moto G31 pesa
 * varios megabytes y el localStorage tiene una cuota de unos cinco: guardar el
 * original agota el almacen con el primer reclamo y la aplicacion deja de poder
 * registrar nada. Reducir a 1024 pixeles de lado mayor y recomprimir a JPEG
 * deja cada adjunto en el orden de los cien kilobytes.
 */

const LADO_MAXIMO = 1024;
const CALIDAD = 0.7;
const MAXIMO_ADJUNTOS = 3;

/** Reduce una imagen y la devuelve como data URL. */
function reducirImagen(archivo) {
  return new Promise((listo, fallo) => {
    const lector = new FileReader();
    lector.onerror = () => fallo(new Error('No se pudo leer el archivo.'));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => fallo(new Error('El archivo no es una imagen valida.'));
      imagen.onload = () => {
        const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(imagen.width * escala);
        lienzo.height = Math.round(imagen.height * escala);
        lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        listo(lienzo.toDataURL('image/jpeg', CALIDAD));
      };
      imagen.src = String(lector.result);
    };
    lector.readAsDataURL(archivo);
  });
}

/**
 * @param {{adjuntos: any[], alCambiar: (adjuntos: any[]) => void}} props
 */
export function SelectorDeAdjuntos({ adjuntos, alCambiar }) {
  const entrada = useRef(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  async function manejarArchivos(evento) {
    const archivos = Array.from(evento.target.files ?? []);
    if (archivos.length === 0) return;

    setProcesando(true);
    setError(null);

    try {
      const nuevos = [];
      for (const archivo of archivos.slice(0, MAXIMO_ADJUNTOS - adjuntos.length)) {
        if (!archivo.type.startsWith('image/')) {
          setError('Por ahora solo se admiten imagenes.');
          continue;
        }
        nuevos.push({
          nombre: archivo.name,
          tipo: 'image/jpeg',
          tamanoOriginal: archivo.size,
          datos: await reducirImagen(archivo),
        });
      }
      alCambiar([...adjuntos, ...nuevos]);
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(false);
      if (entrada.current) entrada.current.value = '';
    }
  }

  function quitar(indice) {
    alCambiar(adjuntos.filter((_, i) => i !== indice));
  }

  return (
    <div className="adjuntos">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={manejarArchivos}
      />

      <IonButton
        fill="outline"
        size="small"
        expand="block"
        disabled={procesando || adjuntos.length >= MAXIMO_ADJUNTOS}
        onClick={() => entrada.current?.click()}
      >
        <IonIcon slot="start" icon={adjuntos.length ? documentAttachOutline : cameraOutline} />
        {procesando
          ? 'Procesando imagen...'
          : `Adjuntar foto (${adjuntos.length}/${MAXIMO_ADJUNTOS})`}
      </IonButton>

      {error && (
        <IonText color="danger">
          <small>{error}</small>
        </IonText>
      )}

      {adjuntos.length > 0 && (
        <div className="miniaturas">
          {adjuntos.map((a, i) => (
            <div className="miniatura" key={i}>
              <img src={a.datos} alt={`Adjunto ${i + 1}: ${a.nombre}`} />
              <button
                type="button"
                aria-label={`Quitar adjunto ${i + 1}`}
                onClick={() => quitar(i)}
              >
                <IonIcon icon={closeCircle} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
