import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Droplets, ShieldCheck, Waves } from 'lucide-react';
import type { Presence, SpeciesId } from '../domain/types';
import { byId, knowledgeSource } from '../data/species';
import { Close, FishImage, formatDate, SourceLink } from './Common';
import { getJson } from '../services/http';
interface Photo {
  url: string;
  page: string;
  attribution: string;
}
function SpeciesPhoto({ id }: { id: SpeciesId }) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPhoto(null);
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `intitle:"${byId[id].scientific}" filetype:bitmap`,
      gsrnamespace: '6',
      gsrlimit: '1',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '640',
      format: 'json',
      origin: '*',
    });
    getJson(`https://commons.wikimedia.org/w/api.php?${params}`, controller.signal)
      .then((raw) => {
        const data = raw as {
          query?: {
            pages?: Record<
              string,
              {
                imageinfo?: {
                  thumburl?: string;
                  descriptionurl?: string;
                  extmetadata?: Record<string, { value: string }>;
                }[];
              }
            >;
          };
        };
        const image = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0];
        const plain = (text: string) =>
          new DOMParser().parseFromString(text, 'text/html').body.textContent || '';
        if (
          image?.thumburl?.startsWith('https://upload.wikimedia.org/') &&
          image.descriptionurl?.startsWith('https://commons.wikimedia.org/') &&
          image.extmetadata?.LicenseShortName?.value
        )
          setPhoto({
            url: image.thumburl,
            page: image.descriptionurl,
            attribution: [
              plain(image.extmetadata?.Artist?.value || 'Auteur : voir source'),
              plain(image.extmetadata?.LicenseShortName?.value || 'Licence : voir source'),
            ].join(' · '),
          });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [id]);
  return photo ? (
    <figure className="species-photo">
      <img
        src={photo.url}
        alt={`Photographie documentaire de ${byId[id].name} provenant de Wikimedia Commons`}
        onError={() => setPhoto(null)}
      />
      <figcaption>
        <SourceLink href={photo.page}>{photo.attribution}</SourceLink>
      </figcaption>
    </figure>
  ) : (
    <div className="photo-unavailable">Photographie indisponible · illustration affichée</div>
  );
}
export default function SpeciesDetail({
  id,
  presence,
  onClose,
  onAdvise,
}: {
  id: SpeciesId;
  presence?: Presence;
  onClose: () => void;
  onAdvise: () => void;
}) {
  const fish = byId[id];
  return (
    <aside className="species-detail" aria-label={`Fiche ${fish.name}`}>
      <div className="fish-hero">
        <span className="hero-label">LE GUIDE DES ESPÈCES</span>
        <Close onClick={onClose} />
        <FishImage id={id} />
        <span className="waterline" />
      </div>
      <div className="detail-body">
        <span className="eyebrow">{fish.family}</span>
        <h2>{fish.name}</h2>
        <p className="scientific">{fish.scientific}</p>
        {presence && (
          <div className={`presence-tag ${presence.demo ? 'demo' : ''}`}>
            <ShieldCheck size={15} />
            {presence.demo
              ? 'Exemple fictif · aucune présence attestée'
              : 'Présence historique recensée'}
          </div>
        )}
        <p>{fish.description}</p>
        <SpeciesPhoto id={id} />
        <div className="detail-section">
          <h3>
            <Waves size={17} />
            Son habitat
          </h3>
          <p>{fish.habitat}</p>
        </div>
        <div className="detail-section">
          <h3>
            <Clock3 size={17} />
            Quand l’observer ?
          </h3>
          <p>{fish.activity}</p>
        </div>
        <div className="detail-section">
          <h3>
            <Droplets size={17} />
            Techniques & appâts
          </h3>
          <div className="tags">
            {[...fish.techniques, ...fish.baits].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
        <details>
          <summary>Reconnaître cette espèce</summary>
          <ul>
            {fish.distinctions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </details>
        {presence && (
          <div className="provenance">
            <b>{presence.location}</b>
            <span>{formatDate(presence.date)}</span>
            <span>Fiabilité : {presence.reliability}</span>
            <span>{presence.source}</span>
            {presence.sourceUrl && (
              <SourceLink href={presence.sourceUrl}>Consulter les observations sources</SourceLink>
            )}
          </div>
        )}
        <div className="source-line">
          Connaissances générales :{' '}
          <SourceLink href={knowledgeSource.url}>{knowledgeSource.label}</SourceLink>
        </div>
        <button className="primary full" onClick={onAdvise}>
          Trouver le bon appât
          <ArrowRight size={17} />
        </button>
        <p className="fine-print">
          Vérifiez les droits d’accès, la carte de pêche, les périodes d’ouverture et les arrêtés
          locaux.
        </p>
      </div>
    </aside>
  );
}
