import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, ShieldCheck, Trash2 } from 'lucide-react';
import type { SpeciesId } from '../domain/types';
import { species } from '../data/species';
import { validatePhoto, visionProvider } from '../services/vision';
import { FishImage, Notice, PageIntro } from '../components/Common';
export default function IdentifyPage({ onGuide }: { onGuide: (id: SpeciesId) => void }) {
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );
  async function choose(file?: File) {
    if (!file) return;
    setError('');
    const problem = validatePhoto(file);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const image = await createImageBitmap(file);
      const valid = image.width >= 64 && image.height >= 64;
      image.close();
      if (!valid) {
        setError('Image trop petite : choisissez une photo d’au moins 64 × 64 pixels.');
        return;
      }
      setPhoto({ file, url: URL.createObjectURL(file) });
    } catch {
      setError('Impossible de lire cette image. Le fichier est peut-être endommagé.');
    }
  }
  return (
    <div className="content-page">
      <PageIntro eyebrow="CHAQUE ESPÈCE A SON HISTOIRE" title="Qui se cache sur votre photo ?">
        Préparez votre image ou explorez les signes distinctifs de nos espèces d’eau douce.
      </PageIntro>
      <Notice>
        L’identification automatique n’est pas encore active : aucun modèle de reconnaissance
        connecté. Aucun résultat ni score de confiance ne sera inventé.
      </Notice>
      <div className="identify-layout">
        <section className="card photo-uploader">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choisir une photo de poisson"
            onChange={(e) => {
              void choose(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div
            className={`drop-zone ${photo ? 'has-photo' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void choose(e.dataTransfer.files[0]);
            }}
          >
            {photo ? (
              <>
                <img src={photo.url} alt="Votre photo, conservée uniquement dans ce navigateur" />
                <button
                  className="icon-button"
                  aria-label="Retirer la photo"
                  onClick={() => setPhoto(null)}
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <>
                <span className="upload-icon">
                  <Camera size={36} strokeWidth={1.5} />
                </span>
                <h2>Un poisson, une rencontre.</h2>
                <p>
                  Choisissez une photo ou glissez-la ici.
                  <br />
                  JPEG, PNG ou WebP · 10 Mo maximum
                </p>
                <button className="primary" onClick={() => input.current?.click()}>
                  <ImagePlus size={17} />
                  Choisir une photo
                </button>
              </>
            )}
          </div>
          {photo && (
            <div className="photo-actions">
              <span>{photo.file.name}</span>
              <button className="secondary" onClick={() => input.current?.click()}>
                Changer de photo
              </button>
            </div>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          <button className="primary full" disabled={!photo || !visionProvider.available}>
            Identification automatique inactive
          </button>
          <p className="privacy-line">
            <ShieldCheck size={16} />
            Votre image reste sur cet appareil. Aucun envoi.
          </p>
        </section>
        <section className="photo-tips">
          <span className="eyebrow">POUR UNE IMAGE UTILE</span>
          <h2>
            Les petits détails
            <br />
            font la différence.
          </h2>
          <ol>
            <li>
              <span>01</span>
              <div>
                <b>Le poisson de profil</b>
                <p>Montrez le corps entier, la tête et les nageoires.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <b>Une lumière naturelle</b>
                <p>Évitez les reflets, le contre-jour et les photos floues.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <b>Le bien-être avant tout</b>
                <p>Gardez les mains mouillées et limitez le temps hors de l’eau.</p>
              </div>
            </li>
          </ol>
          <p className="fine-print">
            Une image nette ne garantit pas l’identification. Certaines espèces et formes hybrides
            nécessitent un avis expert.
          </p>
        </section>
      </div>
      <div className="section-label">
        <h2>En attendant, ouvrez l’œil</h2>
        <span>Guide manuel · aucun résultat automatique</span>
      </div>
      <div className="guide-grid">
        {species.map((s) => (
          <button key={s.id} className="card guide-card" onClick={() => onGuide(s.id)}>
            <FishImage id={s.id} />
            <h3>{s.name}</h3>
            <p>{s.distinctions[0]}</p>
            <span>Voir les signes distinctifs →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
