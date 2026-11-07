import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Compass,
  Eye,
  Fish,
  Layers3,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Waves,
  X,
} from 'lucide-react';
import type {
  Coordinates,
  ExplorationVisit,
  LayerId,
  MapArea,
  Presence,
  SpeciesId,
} from '../domain/types';
import { species } from '../data/species';
import { demoPresences } from '../data/demo';
import { errorMessage } from '../services/http';
import { loadInventory } from '../services/hubeau';
import { searchPlaces } from '../services/search';
import FishMap from '../components/FishMap';
import SpeciesDetail from '../components/SpeciesDetail';
import { Empty, FishImage, Loading, Notice } from '../components/Common';
interface Props {
  initialLocation: Coordinates;
  initialLabel: string;
  onAdvise: (id: SpeciesId) => void;
  onLocation: (point: Coordinates, label: string) => void;
  visits: ExplorationVisit[];
  position: Coordinates | null;
  locating: boolean;
  onLocate: () => void;
  fog: boolean;
  onFog: (v: boolean) => void;
  onExplore: () => void;
}
export default function MapPage(props: Props) {
  const [focus, setFocus] = useState({ ...props.initialLocation, zoom: 10 });
  const [area, setArea] = useState<MapArea>({
    west: 6.08,
    south: 46.18,
    east: 6.85,
    north: 46.54,
    zoom: 10,
  });
  const [label, setLabel] = useState(props.initialLabel);
  const [demo, setDemo] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [stationCount, setStationCount] = useState(0);
  const [selected, setSelected] = useState<{ id: SpeciesId; presence?: Presence } | null>(null);
  const [filters, setFilters] = useState<SpeciesId[]>([]);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    inventory: true,
    observations: true,
    estimated: false,
  });
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof searchPlaces>>>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const inventoryController = useRef<AbortController | null>(null);
  const searchController = useRef<AbortController | null>(null);
  const lastLoad = useRef(0);
  useEffect(
    () => () => {
      inventoryController.current?.abort();
      searchController.current?.abort();
    },
    [],
  );
  const updateArea = useCallback((next: MapArea) => setArea(next), []);
  async function reload() {
    if (Date.now() - lastLoad.current < 1200) return;
    lastLoad.current = Date.now();
    inventoryController.current?.abort();
    const c = new AbortController();
    inventoryController.current = c;
    setStatus('loading');
    setError('');
    setPresences([]);
    props.onLocation(
      { lat: (area.north + area.south) / 2, lng: (area.east + area.west) / 2 },
      'Secteur de la carte',
    );
    setLabel('Secteur de la carte');
    try {
      const result = await loadInventory(area, c.signal, filters);
      setPresences(result.presences);
      setStationCount(result.stations);
      setStatus('success');
    } catch (e) {
      if (!c.signal.aborted) {
        setError(errorMessage(e));
        setStatus('error');
      }
    }
  }
  async function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    const match = species.filter((s) =>
      `${s.name} ${s.scientific}`.toLocaleLowerCase('fr').includes(term.toLocaleLowerCase('fr')),
    );
    if (match.length) {
      setFilters(match.map((s) => s.id));
      setSelected({ id: match[0].id });
      setPlaces([]);
      setSearchError('');
      return;
    }
    searchController.current?.abort();
    const c = new AbortController();
    searchController.current = c;
    setSearching(true);
    setSearchError('');
    setPlaces([]);
    try {
      const result = await searchPlaces(term, c.signal);
      setPlaces(result);
      if (!result.length)
        setSearchError('Aucun lieu trouvé. Essayez un nom de ville ou de cours d’eau.');
    } catch (e) {
      if (!c.signal.aborted) setSearchError(errorMessage(e));
    } finally {
      if (!c.signal.aborted) setSearching(false);
    }
  }
  useEffect(() => {
    if (props.position) {
      setFocus({ ...props.position, zoom: 13 });
      setLabel('Ma position');
      props.onLocation(props.position, 'Ma position');
    }
  }, [props.position]); // eslint-disable-line
  const data = demo ? demoPresences : presences;
  const filtered = data.filter((p) => !filters.length || filters.includes(p.species));
  const toggleSpecies = (id: SpeciesId) =>
    setFilters((old) => (old.includes(id) ? old.filter((i) => i !== id) : [...old, id]));
  function selectPlace(place: (typeof places)[number]) {
    setFocus({ ...place, zoom: 12 });
    const name = place.label.split(',')[0];
    setLabel(name);
    props.onLocation(place, name);
    setPlaces([]);
    setQuery('');
    setSelected(null);
  }
  return (
    <div className="map-layout">
      <aside
        className={`discovery-panel ${mobileFilters ? 'mobile-open' : ''}`}
        aria-label="Recherche et filtres"
      >
        <div className="panel-intro">
          <div>
            <span className="eyebrow">L’AVENTURE COMMENCE ICI</span>
            <h1>
              Au fil de l’eau<span>.</span>
            </h1>
            <p>Un nouveau coin. Une nouvelle histoire.</p>
          </div>
          <button
            className="icon-button mobile-only"
            onClick={() => setMobileFilters(false)}
            aria-label="Fermer les filtres"
          >
            <X size={20} />
          </button>
        </div>
        <form className="search-field" onSubmit={search}>
          <Search size={18} />
          <input
            aria-label="Rechercher un lieu ou une espèce"
            placeholder="Un lac, une ville, un poisson…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            minLength={2}
            maxLength={150}
          />
          <button type="submit" aria-label="Lancer la recherche" disabled={searching}>
            {searching ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={17} />}
          </button>
        </form>
        {searchError && <Notice kind="error">{searchError}</Notice>}
        {places.length > 0 && (
          <ul className="search-results">
            {places.map((p) => (
              <li key={p.id}>
                <button onClick={() => selectPlace(p)}>
                  <MapPin size={16} />
                  {p.label}
                </button>
              </li>
            ))}
            <li>
              <small>Recherche © contributeurs OpenStreetMap · Nominatim</small>
            </li>
          </ul>
        )}
        <div className="section-label">
          <h2>Qu’allez-vous découvrir ?</h2>
          <span>{species.length} espèces</span>
        </div>
        <div className="species-grid">
          {species.map((s) => (
            <button
              key={s.id}
              className={`species-filter ${filters.includes(s.id) ? 'selected' : ''}`}
              aria-pressed={filters.includes(s.id)}
              onClick={() => toggleSpecies(s.id)}
            >
              <FishImage id={s.id} />
              <span>{s.name}</span>
              <i>{filters.includes(s.id) ? '✓' : '+'}</i>
            </button>
          ))}
        </div>
        <div className="filter-reset">
          <button onClick={() => setFilters([])} disabled={!filters.length}>
            Toutes les espèces
          </button>
          <button onClick={() => setSelected({ id: filters[0] || 'brochet' })}>
            Ouvrir le guide
            <ArrowRight size={12} />
          </button>
        </div>
        <div className="section-label layers-title">
          <h2>
            <Layers3 size={16} />
            Les couches de la carte
          </h2>
        </div>
        <div className="layer-list">
          {(
            [
              {
                id: 'inventory',
                label: 'Poissons recensés',
                sub: 'Inventaires scientifiques',
                icon: Fish,
                color: 'green',
              },
              {
                id: 'observations',
                label: 'Observations',
                sub: demo ? 'Exemples fictifs uniquement' : 'Aucune source publique connectée',
                icon: Eye,
                color: 'blue',
              },
              {
                id: 'estimated',
                label: 'Zones indicatives',
                sub: 'Autour des inventaires · confiance faible',
                icon: Sparkles,
                color: 'amber',
              },
            ] as const
          ).map((layer) => (
            <label className="layer-row" key={layer.id}>
              <span className={`layer-icon ${layer.color}`}>
                <layer.icon size={17} />
              </span>
              <span>
                <b>{layer.label}</b>
                <small>{layer.sub}</small>
              </span>
              <input
                type="checkbox"
                checked={layers[layer.id]}
                onChange={(e) => setLayers((old) => ({ ...old, [layer.id]: e.target.checked }))}
              />
              <span className="switch" />
            </label>
          ))}
        </div>
        {layers.estimated && (
          <p className="fine-print">
            Cercles de contexte de 200 m, sans bathymétrie ni habitat mesuré. Ils peuvent inclure
            des terres et ne prédisent pas une capture.
          </p>
        )}
        <div className="explore-teaser">
          <div className="teaser-orbit">
            <Compass size={27} />
          </div>
          <span className="eyebrow">L’EAU VOUS APPELLE</span>
          <h3>
            Chaque rive est
            <br />
            une découverte.
          </h3>
          <p>Partez explorer, révélez de nouveaux secteurs et progressez à votre rythme.</p>
          <button onClick={props.onExplore}>
            Mon exploration
            <ArrowRight size={16} />
          </button>
        </div>
        <p className="panel-footnote">
          <ShieldIcon />
          Des sources ouvertes. Une pêche responsable.
        </p>
      </aside>
      <section className="map-main" aria-label="Carte géographique interactive">
        <FishMap
          presences={filtered}
          layers={layers}
          focus={focus}
          onArea={updateArea}
          onSelect={(p) => setSelected({ id: p.species, presence: p })}
          selected={selected?.presence?.id}
          fog={props.fog}
          visits={props.visits}
          position={props.position}
          onLocate={props.onLocate}
          locating={props.locating}
          satellite={satellite}
          onSatellite={setSatellite}
        />
        <div className="map-topbar">
          <button
            className="location-pill"
            onClick={() => {
              setFocus({ lat: 46.369, lng: 6.472, zoom: 10 });
              setLabel('Lac Léman');
              props.onLocation({ lat: 46.369, lng: 6.472 }, 'Lac Léman');
            }}
          >
            <span className="location-dot" />
            <b>{label}</b>
            <ChevronDown size={15} />
          </button>
          <button
            className="map-mode"
            aria-pressed={props.fog}
            onClick={() => props.onFog(!props.fog)}
          >
            <Compass size={16} />
            <span>Mode exploration</span>
            <span className={`mini-toggle ${props.fog ? 'on' : ''}`} />
          </button>
          <button
            className="icon-button mobile-only"
            onClick={() => setMobileFilters(true)}
            aria-label="Ouvrir les filtres"
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
        <div className="data-control">
          <div>
            <span className={`status-dot ${demo ? 'demo' : status === 'success' ? 'live' : ''}`} />
            <b>
              {demo
                ? 'Démonstration · données fictives'
                : status === 'success'
                  ? 'Inventaires historiques · Hub’Eau'
                  : 'Explorez les données publiques'}
            </b>
          </div>
          <p>
            {demo
              ? 'Aucune présence réelle attestée par ces exemples.'
              : status === 'success'
                ? `${stationCount} point(s) consulté(s) · échantillon partiel. Modifiez les espèces puis rechargez ce secteur pour affiner la recherche.`
                : 'Cadrez un secteur en France puis chargez ses inventaires.'}
          </p>
          <div className="data-actions">
            <button
              className={!demo ? 'active' : ''}
              onClick={() => {
                setDemo(false);
                setSelected(null);
              }}
              aria-pressed={!demo}
            >
              Données réelles
            </button>
            <button
              className={demo ? 'active' : ''}
              onClick={() => {
                inventoryController.current?.abort();
                if (status === 'loading') setStatus('idle');
                setDemo(true);
                setSelected(null);
              }}
              aria-pressed={demo}
            >
              Essayer les exemples
            </button>
          </div>
          {!demo && (
            <button className="load-area" onClick={reload} disabled={status === 'loading'}>
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : ''} />
              Charger ce secteur
            </button>
          )}
          {!demo && status === 'loading' && <Loading>Lecture de Hub’Eau…</Loading>}
          {!demo && error && <Notice kind="error">{error}</Notice>}
          {!demo && status === 'success' && !presences.length && (
            <Empty title="Aucune indication disponible">
              L’absence de résultat ne prouve pas l’absence de poissons.
            </Empty>
          )}
        </div>
        {!selected && (
          <div className="map-bottom-card">
            <span className="water-icon">
              <Waves size={22} />
            </span>
            <div>
              <b>Le vivant laisse des indices.</b>
              <p>
                Les marqueurs indiquent une présence historique, jamais la position d’un poisson en
                temps réel.
              </p>
            </div>
          </div>
        )}
        <div className="map-legend">
          <span>
            <i className="green" />
            Recensés
          </span>
          <span>
            <i className="blue" />
            Observations
          </span>
          <span>
            <i className="amber" />
            Indicatifs
          </span>
        </div>
        {selected && (
          <SpeciesDetail
            id={selected.id}
            presence={selected.presence}
            onClose={() => setSelected(null)}
            onAdvise={() => props.onAdvise(selected.id)}
          />
        )}
      </section>
    </div>
  );
}
function ShieldIcon() {
  return <span className="tiny-check">✓</span>;
}
