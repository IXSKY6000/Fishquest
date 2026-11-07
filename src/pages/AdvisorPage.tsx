import { useState } from 'react';
import { ArrowRight, Check, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { SpeciesId } from '../domain/types';
import { species } from '../data/species';
import { equipmentNames, recommend } from '../domain/advisor';
import type { AdviceInput } from '../domain/advisor';
import { FishImage, Notice, PageIntro, SourceLink } from '../components/Common';
export default function AdvisorPage({
  fishId,
  onFish,
}: {
  fishId: SpeciesId;
  onFish: (id: SpeciesId) => void;
}) {
  const month = new Date().getMonth();
  const [form, setForm] = useState<Omit<AdviceInput, 'species'>>({
    season:
      month < 2 || month === 11 ? 'hiver' : month < 5 ? 'printemps' : month < 8 ? 'été' : 'automne',
    water: 'lac',
    light: 'claire',
    current: 'faible',
    depth: null,
    temperature: null,
    wind: null,
    equipment: [],
  });
  const [submitted, setSubmitted] = useState<AdviceInput | null>(null);
  const advice = submitted ? recommend(submitted) : [];
  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((old) => ({ ...old, [key]: value }));
    setSubmitted(null);
  }
  return (
    <div className="content-page">
      <PageIntro
        eyebrow="VOTRE PROCHAINE TOUCHE COMMENCE ICI"
        title="À chaque eau, sa bonne approche."
      >
        Quelques détails sur votre sortie. Des conseils concrets, construits à partir d’une base par
        espèce.
      </PageIntro>
      <div className="advisor-layout">
        <form
          className="card advisor-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted({ ...form, species: fishId });
          }}
        >
          <div className="section-label">
            <h2>
              <SlidersHorizontal size={18} />
              Préparons votre sortie
            </h2>
          </div>
          <label>
            Quel poisson recherchez-vous ?
            <select
              value={fishId}
              onChange={(e) => {
                onFish(e.target.value as SpeciesId);
                setSubmitted(null);
              }}
            >
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Saison
              <select
                value={form.season}
                onChange={(e) => field('season', e.target.value as AdviceInput['season'])}
              >
                {['printemps', 'été', 'automne', 'hiver'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Type d’eau
              <select
                value={form.water}
                onChange={(e) => field('water', e.target.value as AdviceInput['water'])}
              >
                {['lac', 'rivière', 'étang'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Luminosité
              <select
                value={form.light}
                onChange={(e) => field('light', e.target.value as AdviceInput['light'])}
              >
                <option value="claire">Claire / eau visible</option>
                <option value="faible">Faible / ciel couvert</option>
              </select>
            </label>
            <label>
              Courant
              <select
                value={form.current}
                onChange={(e) => field('current', e.target.value as AdviceInput['current'])}
              >
                {['faible', 'modéré', 'fort'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Profondeur connue (m)
              <input
                type="number"
                min="0.5"
                max="300"
                step="0.5"
                placeholder="Inconnue"
                value={form.depth ?? ''}
                onChange={(e) =>
                  field('depth', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </label>
            <label>
              Eau mesurée (°C)
              <input
                type="number"
                min="0"
                max="40"
                step="0.5"
                placeholder="Non mesurée"
                value={form.temperature ?? ''}
                onChange={(e) =>
                  field('temperature', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </label>
            <label>
              Vent connu (km/h)
              <input
                type="number"
                min="0"
                max="200"
                placeholder="Non renseigné"
                value={form.wind ?? ''}
                onChange={(e) =>
                  field('wind', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </label>
          </div>
          <fieldset>
            <legend>
              Dans ma boîte <span>facultatif</span>
            </legend>
            <div className="equipment-list">
              {equipmentNames.map((name) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    checked={form.equipment.includes(name)}
                    onChange={(e) =>
                      field(
                        'equipment',
                        e.target.checked
                          ? [...form.equipment, name]
                          : form.equipment.filter((s) => s !== name),
                      )
                    }
                  />
                  {name}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="primary full" type="submit">
            <Sparkles size={17} />
            Obtenir mes conseils
            <ArrowRight size={17} />
          </button>
        </form>
        <section className="advisor-results" aria-live="polite">
          {!submitted ? (
            <div className="advisor-welcome">
              <FishImage id={fishId} />
              <span className="eyebrow">LE BON GESTE, PAS LA FORMULE MAGIQUE</span>
              <h2>
                Faisons connaissance
                <br />
                avec votre terrain de jeu.
              </h2>
              <p>
                Renseignez vos conditions pour découvrir deux approches adaptées. Aucun modèle d’IA
                ni donnée locale inventée.
              </p>
            </div>
          ) : (
            <>
              <div className="section-label">
                <h2>Deux pistes pour votre sortie</h2>
                <span>Connaissances générales</span>
              </div>
              {advice.map((a, i) => (
                <article className="card advice-card" key={a.name}>
                  <div className={`lure-art lure-${i}`}>
                    <LureArt bait={submitted.species === 'carpe'} />
                    <span>APPROCHE 0{i + 1}</span>
                  </div>
                  <div className="advice-body">
                    <div className="section-label">
                      <h2>{a.name}</h2>
                      {a.available && submitted.equipment.length > 0 && (
                        <span className="available">
                          <Check size={13} />
                          Dans votre boîte
                        </span>
                      )}
                    </div>
                    <div className="advice-specs">
                      <span>
                        Taille<b>{a.size}</b>
                      </span>
                      <span>
                        Poids<b>{a.weight}</b>
                      </span>
                      <span>
                        Couleur<b>{a.color}</b>
                      </span>
                    </div>
                    <h3>L’animation</h3>
                    <p>{a.animation}</p>
                    <h3>Où prospecter</h3>
                    <p>{a.depth}</p>
                    <div className="advice-reason">
                      <Sparkles size={16} />
                      <p>{a.reason}</p>
                    </div>
                    {!a.available && (
                      <p className="fine-print">
                        Cet appât ne figure pas dans votre matériel renseigné.
                      </p>
                    )}
                  </div>
                </article>
              ))}
              {submitted.temperature !== null &&
                submitted.temperature > 20 &&
                submitted.species === 'truite' && (
                  <Notice kind="error">
                    Eau chaude pour la truite : renoncez à la cibler pour limiter le stress et la
                    mortalité.
                  </Notice>
                )}
            </>
          )}
        </section>
      </div>
      <Notice>
        Les plages de taille et de lest sont indicatives, pas des mesures de ce lieu. Adaptez-les au
        matériel, au fond et à la réglementation locale. Aucun conseil ne garantit une capture.
      </Notice>
      <div className="source-line">
        Base éditoriale FishQuest · habitats et identification :{' '}
        <SourceLink href="https://doris.ffessm.fr/">DORIS / FFESSM</SourceLink> · techniques :
        recommandations générales à adapter sur place.
      </div>
    </div>
  );
}
function LureArt({ bait }: { bait: boolean }) {
  return (
    <svg
      viewBox="0 0 300 120"
      aria-label={bait ? 'Illustration d’appâts' : 'Illustration d’un leurre'}
      role="img"
    >
      {bait ? (
        <>
          <ellipse cx="125" cy="60" rx="24" ry="20" fill="#d6b05c" />
          <ellipse cx="165" cy="55" rx="22" ry="19" fill="#e4c478" />
          <ellipse cx="150" cy="81" rx="21" ry="18" fill="#bc9244" />
        </>
      ) : (
        <>
          <path d="M52 61q52-50 145-3l36-26-8 43-32-8Q102 93 52 61" fill="#6d8a72" />
          <path d="M62 65q71 22 133-4" fill="none" stroke="#cbd4ac" strokeWidth="7" />
          <circle cx="72" cy="55" r="4" fill="#172f28" />
          <path
            d="M91 73v19q0 21 16 13l7-15m29-17v19q0 21 16 13l7-15"
            fill="none"
            stroke="#6d7978"
            strokeWidth="2"
          />
          <path d="M52 62H23" stroke="#738580" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
