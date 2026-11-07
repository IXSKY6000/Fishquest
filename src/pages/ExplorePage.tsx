import {
  Compass,
  Flag,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import type { ExplorationVisit } from '../domain/types';
import { distanceMeters, progress } from '../domain/exploration';
import { formatDate, Notice, PageIntro } from '../components/Common';
export default function ExplorePage({
  visits,
  tracking,
  onTracking,
  onClear,
  onMap,
  fog,
  onFog,
}: {
  visits: ExplorationVisit[];
  tracking: boolean;
  onTracking: () => void;
  onClear: () => void;
  onMap: () => void;
  fog: boolean;
  onFog: (v: boolean) => void;
}) {
  const p = progress(visits);
  const [confirm, setConfirm] = useState(false);
  const missionLake = visits.some((v) => distanceMeters(v, { lat: 46.378, lng: 6.478 }) <= 500);
  const missions = [
    {
      name: 'Le premier pas',
      text: 'Découvrez un premier secteur avec le GPS.',
      count: Math.min(1, visits.length),
      target: 1,
    },
    {
      name: 'Au-delà du chemin connu',
      text: 'Explorez 3 secteurs séparés d’au moins 250 m.',
      count: Math.min(3, visits.length),
      target: 3,
    },
    {
      name: 'Les rives du Léman',
      text: 'Passez à moins de 500 m du port de Thonon-les-Bains. L’accès et la sécurité restent à vérifier sur place.',
      count: missionLake ? 1 : 0,
      target: 1,
    },
  ];
  return (
    <div className="content-page">
      <PageIntro
        eyebrow="LE VOYAGE COMPTE AUTANT QUE LA DESTINATION"
        title="Votre monde, un peu plus grand."
      >
        Marchez le long des rives, découvrez de nouveaux horizons. Aucune capture nécessaire pour
        avancer.
      </PageIntro>
      <div className="explorer-hero">
        <div className="explorer-emblem">
          <Compass size={76} strokeWidth={1} />
          <span>NIVEAU {p.level}</span>
        </div>
        <div>
          <span className="eyebrow">
            {p.level === 1 ? 'EXPLORATEUR EN HERBE' : 'EXPLORATEUR DES RIVES'}
          </span>
          <h2>La prochaine rive vous attend.</h2>
          <p>
            {p.places} secteur{p.places > 1 ? 's' : ''} découvert{p.places > 1 ? 's' : ''} · {p.xp}{' '}
            XP acquis
          </p>
          <div
            className="xp-progress"
            role="progressbar"
            aria-label="Progression vers le niveau suivant"
            aria-valuenow={p.withinLevel}
            aria-valuemin={0}
            aria-valuemax={500}
          >
            <i style={{ width: `${p.withinLevel / 5}%` }} />
          </div>
          <small>
            {p.withinLevel} / 500 XP vers le niveau {p.level + 1} · 100 XP par nouveau secteur
          </small>
        </div>
      </div>
      <div className="exploration-actions">
        <button className="primary" onClick={onTracking}>
          <LocateFixed size={17} />
          {tracking ? 'Arrêter l’exploration GPS' : 'Commencer l’exploration GPS'}
        </button>
        <button className="secondary" onClick={onMap}>
          <Navigation size={17} />
          Revenir sur la carte
        </button>
        <label className="fog-setting">
          <input type="checkbox" checked={fog} onChange={(e) => onFog(e.target.checked)} />
          Brouillard de découverte sur la carte
        </label>
      </div>
      <Notice>
        Le mode GPS fonctionne seulement au premier plan, après consentement, en HTTPS ou sur
        localhost. Un secteur est révélé uniquement avec une précision GPS de 100 m ou mieux.
        Déplacer la carte ne donne aucun XP.
      </Notice>
      <div className="section-label">
        <h2>
          <Flag size={18} />
          Des idées pour prendre le large
        </h2>
        <span>Missions de découverte</span>
      </div>
      <div className="missions-grid">
        {missions.map((m, i) => (
          <article
            className={`card mission ${m.count >= m.target ? 'completed' : ''}`}
            key={m.name}
          >
            <span className="mission-icon">
              {m.count >= m.target ? <Trophy size={22} /> : <Flag size={22} />}
            </span>
            <span className="eyebrow">MISSION 0{i + 1}</span>
            <h3>{m.name}</h3>
            <p>{m.text}</p>
            <div className="mission-progress">
              <i style={{ width: `${(m.count / m.target) * 100}%` }} />
            </div>
            <small>
              {m.count} / {m.target} · {m.count >= m.target ? 'Accomplie' : 'À découvrir'}
            </small>
          </article>
        ))}
      </div>
      <section className="card">
        <div className="section-label">
          <h2>
            <MapPin size={18} />
            Votre carte personnelle
          </h2>
          <span>{visits.length} secteur(s)</span>
        </div>
        {visits.length ? (
          <div className="visit-list">
            {[...visits]
              .reverse()
              .slice(0, 20)
              .map((v, i) => (
                <div key={v.id}>
                  <span className="visit-pin">
                    <MapPin size={17} />
                  </span>
                  <div>
                    <b>Secteur exploré {visits.length - i}</b>
                    <small>
                      {v.lat.toFixed(3)}°, {v.lng.toFixed(3)}° · précision ±{Math.round(v.accuracy)}{' '}
                      m
                    </small>
                  </div>
                  <span>{formatDate(v.date)}</span>
                </div>
              ))}
            {visits.length > 20 && <p>Les 20 découvertes les plus récentes sont affichées.</p>}
          </div>
        ) : (
          <div className="exploration-empty">
            <Compass size={35} />
            <h3>Tout reste à explorer.</h3>
            <p>Activez le GPS pour enregistrer votre premier secteur.</p>
          </div>
        )}
      </section>
      <div className="privacy-card">
        <ShieldCheck size={24} />
        <div>
          <b>Vos découvertes vous appartiennent.</b>
          <p>
            Positions et progression sont conservées dans le stockage de ce navigateur. Aucun
            compte, aucune publication, aucune synchronisation.
          </p>
        </div>
        {!confirm ? (
          <button className="text-button" onClick={() => setConfirm(true)}>
            <Trash2 size={15} />
            Effacer mes découvertes
          </button>
        ) : (
          <div className="delete-confirm">
            <span>Effacer toute la progression locale ?</span>
            <button
              className="danger"
              onClick={() => {
                onClear();
                setConfirm(false);
              }}
            >
              Oui, effacer
            </button>
            <button className="secondary" onClick={() => setConfirm(false)}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
