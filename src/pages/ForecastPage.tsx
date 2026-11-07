import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CloudSun,
  Droplets,
  Gauge,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import type { Coordinates, SpeciesId, Weather } from '../domain/types';
import { byId, species } from '../data/species';
import { loadWeather } from '../services/weather';
import { errorMessage } from '../services/http';
import { estimateConditions } from '../domain/forecast';
import {
  displayNumber,
  Empty,
  FishImage,
  Loading,
  Notice,
  PageIntro,
  SourceLink,
} from '../components/Common';
export default function ForecastPage({
  point,
  label,
  fishId,
  onFish,
}: {
  point: Coordinates;
  label: string;
  fishId: SpeciesId;
  onFish: (id: SpeciesId) => void;
}) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setWeather(null);
    setError('');
    loadWeather(point, c.signal)
      .then(setWeather)
      .catch((e) => {
        if (!c.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [point.lat, point.lng, retry]);
  const selected = byId[fishId];
  const estimate = weather ? estimateConditions(weather.current, selected, point) : null;
  const hours = weather?.hours.filter((h) => Date.parse(h.time) >= Date.now()).slice(0, 24) || [];
  const best = hours
    .map((h) => ({ hour: h, estimate: estimateConditions(h, selected, point) }))
    .filter((x) => x.estimate.score !== null)
    .sort((a, b) => b.estimate.score! - a.estimate.score!)
    .slice(0, 3);
  const hourLabel = (time: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    }).format(new Date(time));
  return (
    <div className="content-page">
      <PageIntro eyebrow="OBSERVER AVANT DE LANCER" title="Le bon moment, au bon endroit.">
        La météo donne le tempo. Découvrez ce qu’elle peut nous dire sur votre prochaine sortie.
      </PageIntro>
      <div className="page-toolbar">
        <span>
          <span className="location-dot" />
          {label}{' '}
          <small>
            {point.lat.toFixed(3)}°, {point.lng.toFixed(3)}° · lieu sélectionné sur la carte
          </small>
        </span>
        <div>
          <label>
            Espèce
            <select value={fishId} onChange={(e) => onFish(e.target.value as SpeciesId)}>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary" onClick={() => setRetry((i) => i + 1)} disabled={loading}>
            <RefreshCw size={15} />
            Actualiser
          </button>
        </div>
      </div>
      {loading && <Loading>Consultation d’Open-Meteo…</Loading>}
      {error && (
        <Notice kind="error">
          {error} Aucune prévision n’est inventée. Autorisez api.open-meteo.com si nécessaire.
        </Notice>
      )}
      {!weather && !loading && (
        <Empty title="La météo est indisponible">
          La carte et le conseiller restent utilisables. Réessayez lorsque le service est
          accessible.
        </Empty>
      )}
      {weather && estimate && (
        <>
          <div className="forecast-main">
            <div className="conditions-hero">
              <span className="eyebrow">CONDITIONS ESTIMÉES · {selected.name.toUpperCase()}</span>
              <div className="condition-heading">
                <CloudSun size={64} strokeWidth={1} />
                <div>
                  <h2>{estimate.label}</h2>
                  <span>Confiance {estimate.confidence} · moteur de règles v1</span>
                </div>
              </div>
              <p>Un indice de préparation, jamais une promesse de capture.</p>
              <div className="condition-species">
                <FishImage id={fishId} />
                <div>
                  <b>{selected.name}</b>
                  <small>{selected.scientific}</small>
                </div>
              </div>
            </div>
            <section className="card weather-current">
              <div className="section-label">
                <h2>Conditions actuelles</h2>
                <span>{hourLabel(weather.current.time)} · Paris</span>
              </div>
              <div className="weather-metrics">
                {[
                  {
                    icon: Thermometer,
                    title: 'Température de l’air',
                    value: displayNumber(weather.current.temperature, '°C'),
                  },
                  {
                    icon: Wind,
                    title: 'Vent à 10 m',
                    value: displayNumber(weather.current.wind, 'km/h'),
                  },
                  {
                    icon: Droplets,
                    title: 'Précipitations',
                    value: displayNumber(weather.current.rain, 'mm'),
                  },
                  {
                    icon: Gauge,
                    title: 'Pression en surface',
                    value: displayNumber(weather.current.pressure, 'hPa'),
                  },
                  {
                    icon: CloudSun,
                    title: 'Nébulosité',
                    value: displayNumber(weather.current.cloud, '%'),
                  },
                ].map((m) => (
                  <div key={m.title}>
                    <m.icon size={21} />
                    <span>{m.title}</span>
                    <b>{m.value}</b>
                  </div>
                ))}
              </div>
            </section>
          </div>
          {estimate.safety.map((s) => (
            <Notice key={s} kind="error">
              {s}
            </Notice>
          ))}
          <section className="card hourly-card">
            <div className="section-label">
              <h2>
                <Sun size={18} />
                Les prochaines 24 heures
              </h2>
              <span>Heure de Paris</span>
            </div>
            {hours.length ? (
              <div className="hourly-scroll">
                {hours.map((h) => {
                  const e = estimateConditions(h, selected, point);
                  return (
                    <div className="hour-column" key={h.time}>
                      <span>{hourLabel(h.time)}</span>
                      <CloudSun size={22} />
                      <b>{displayNumber(h.temperature, '°')}</b>
                      <span className="rain-value">{displayNumber(h.rain, 'mm')}</span>
                      <div className="score-bar">
                        <i style={{ height: `${e.score ?? 0}%` }} />
                      </div>
                      <small>{e.score === null ? 'Indisponible' : e.label}</small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Notice>Aucun créneau futur disponible dans la réponse du service.</Notice>
            )}
          </section>
          <div className="two-columns">
            <section className="card">
              <div className="section-label">
                <h2>
                  <CalendarDays size={18} />
                  Les prochains jours
                </h2>
              </div>
              {weather.days.map((d) => (
                <div className="day-row" key={d.time}>
                  <b>
                    {new Intl.DateTimeFormat('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      timeZone: 'Europe/Paris',
                    }).format(new Date(d.time + 'T12:00:00Z'))}
                  </b>
                  <CloudSun size={21} />
                  <span>
                    {displayNumber(d.min, '°')} / {displayNumber(d.max, '°')}
                  </span>
                  <small>{displayNumber(d.rain, 'mm')}</small>
                </div>
              ))}
            </section>
            <section className="card">
              <div className="section-label">
                <h2>Vos créneaux à envisager</h2>
              </div>
              {best.map((b, i) => (
                <div className="best-slot" key={b.hour.time}>
                  <span>0{i + 1}</span>
                  <div>
                    <b>
                      {hourLabel(b.hour.time)} · {b.estimate.label}
                    </b>
                    <small>
                      {new Date(b.hour.time).toLocaleDateString('fr-FR', {
                        timeZone: 'Europe/Paris',
                      })}{' '}
                      · même règle, sans garantie
                    </small>
                  </div>
                </div>
              ))}
              <p className="fine-print">
                Classement des seules 24 prochaines heures disponibles. Des créneaux équivalents
                peuvent être ex æquo.
              </p>
            </section>
          </div>
          <section className="card">
            <div className="section-label">
              <h2>Pourquoi cette estimation ?</h2>
              <span>Règles transparentes</span>
            </div>
            <ul className="factor-list">
              {estimate.factors.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <h3>Comparaison indicative des espèces</h3>
            <div className="tags">
              {species.map((s) => (
                <button key={s.id} onClick={() => onFish(s.id)}>
                  {s.name} · {estimateConditions(weather.current, s, point).label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      <Notice>
        Température de l’eau, profondeur et débit : <b>Données indisponibles</b>. Aucun débit d’une
        station voisine n’est attribué automatiquement à ce lieu. Vérifiez les alertes météo et la
        réglementation avant de partir.
      </Notice>
      <div className="source-line">
        Source : <SourceLink href="https://open-meteo.com/">Open-Meteo · CC BY 4.0</SourceLink> ·
        API gratuite réservée aux usages non commerciaux.{' '}
        {weather &&
          `Consultée le ${new Date(weather.fetchedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} (Paris).`}
      </div>
    </div>
  );
}
