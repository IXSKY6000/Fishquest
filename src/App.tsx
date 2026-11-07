import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Camera,
  CloudSun,
  Compass,
  Fish,
  Leaf,
  Map,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { Capacitor } from '@capacitor/core';
import { App as AndroidApp } from '@capacitor/app';
import {
  clearLocationWatch,
  currentPosition,
  locationAvailable,
  requestLocationPermission,
  watchPosition,
} from './services/location';
import type { LocationError, LocationPosition, LocationWatch } from './services/location';
import type { Coordinates, ExplorationVisit, Page, SpeciesId } from './domain/types';
import { recordVisit, progress } from './domain/exploration';
import { useStored } from './hooks/useStored';
import MapPage from './pages/MapPage';
import ForecastPage from './pages/ForecastPage';
import AdvisorPage from './pages/AdvisorPage';
import IdentifyPage from './pages/IdentifyPage';
import ExplorePage from './pages/ExplorePage';
import SpeciesDetail from './components/SpeciesDetail';
import { Notice } from './components/Common';
const visitSchema = z
  .array(
    z.object({
      id: z.string(),
      date: z.string().datetime(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().min(0).max(100),
    }),
  )
  .max(1000);
const validVisits = (value: unknown): value is ExplorationVisit[] =>
  visitSchema.safeParse(value).success;
const nav = [
  { id: 'map', label: 'Carte', icon: Map },
  { id: 'forecast', label: 'Prévisions', icon: CloudSun },
  { id: 'advisor', label: 'Conseiller', icon: Sparkles },
  { id: 'identify', label: 'Identification', icon: Camera },
  { id: 'explore', label: 'Exploration', icon: Compass },
] as const;
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function App() {
  const [page, setPage] = useState<Page>('map');
  const [fishId, setFishId] = useState<SpeciesId>('brochet');
  const [guide, setGuide] = useState<SpeciesId | null>(null);
  const [point, setPoint] = useState<Coordinates>({ lat: 46.369, lng: 6.472 });
  const [locationLabel, setLocationLabel] = useState('Lac Léman');
  const [dark, setDark, themeWarning] = useStored(
    'fishquest.theme.v1',
    false,
    (x): x is boolean => typeof x === 'boolean',
  );
  const [visits, saveVisits, storageWarning] = useStored<ExplorationVisit[]>(
    'fishquest.visits.v1',
    [],
    validVisits,
  );
  const visitsRef = useRef(visits);
  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);
  const [fog, setFog] = useState(false);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [locating, setLocating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [consent, setConsent] = useState<'position' | 'exploration' | null>(null);
  const consentRef = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState('');
  const watch = useRef<LocationWatch | null>(null);
  const gpsRequest = useRef(0);
  const trackingRef = useRef(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const p = progress(visits);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = AndroidApp.addListener('backButton', () => {
      if (consent) setConsent(null);
      else if (guide) setGuide(null);
      else if (installHelp) setInstallHelp(false);
      else if (page !== 'map') setPage('map');
      else void AndroidApp.exitApp();
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [page, consent, guide, installHelp]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const update = () => setUpdateAvailable(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('fishquest-update', update);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('fishquest-update', update);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);
  useEffect(
    () => () => {
      gpsRequest.current++;
      if (watch.current !== null) clearLocationWatch(watch.current);
    },
    [],
  );
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && trackingRef.current) {
        stopTracking();
        setToast('Exploration GPS arrêtée : page en arrière-plan.');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    if (!consent && !installHelp && !guide) return;
    const previous = document.activeElement as HTMLElement | null;
    const initialFocus = document.querySelector<HTMLElement>('[role="dialog"] button');
    (consentRef.current || initialFocus)?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConsent(null);
        setInstallHelp(false);
        setGuide(null);
      }
      if (e.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
        const buttons = dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input,select,[tabindex="0"]',
        );
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      previous?.focus();
    };
  }, [consent, installHelp, guide]);
  function gpsFailure(error: LocationError) {
    setLocating(false);
    setGpsError(
      error.code === 1
        ? 'Géolocalisation refusée. Vous pouvez continuer à explorer la carte librement.'
        : error.code === 2
          ? 'Position indisponible. Vérifiez le GPS et réessayez.'
          : 'Le GPS n’a pas répondu à temps. Réessayez à ciel ouvert.',
    );
    if (watch.current !== null) clearLocationWatch(watch.current);
    watch.current = null;
    trackingRef.current = false;
    setTracking(false);
  }
  function receivePosition(pos: LocationPosition) {
    setLocating(false);
    setGpsError('');
    const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setPosition(next);
    if (trackingRef.current) {
      const old = visitsRef.current;
      const nextVisits = recordVisit(old, next, pos.coords.accuracy);
      if (nextVisits !== old) {
        visitsRef.current = nextVisits;
        saveVisits(nextVisits);
        setToast('Nouveau secteur découvert · +100 XP');
      } else if (pos.coords.accuracy > 100)
        setGpsError(
          `Précision GPS insuffisante (±${Math.round(pos.coords.accuracy)} m) : aucun secteur révélé. Réessayez à ciel ouvert.`,
        );
    }
  }
  async function startGps() {
    const exploration = consent === 'exploration';
    setConsent(null);
    setGpsError('');
    if (!Capacitor.isNativePlatform() && !window.isSecureContext) {
      setGpsError('La géolocalisation exige HTTPS ou localhost.');
      return;
    }
    if (!locationAvailable()) {
      setGpsError('Ce navigateur ne propose pas la géolocalisation.');
      return;
    }
    setLocating(true);
    const request = ++gpsRequest.current;
    try {
      await requestLocationPermission();
      if (request !== gpsRequest.current) return;
      if (exploration) {
        trackingRef.current = true;
        setTracking(true);
        const handle = await watchPosition(receivePosition, gpsFailure);
        if (request !== gpsRequest.current || !trackingRef.current) clearLocationWatch(handle);
        else watch.current = handle;
      } else await currentPosition(receivePosition, gpsFailure);
    } catch (error) {
      gpsFailure(error as LocationError);
    }
  }
  function stopTracking() {
    gpsRequest.current++;
    if (watch.current !== null) clearLocationWatch(watch.current);
    watch.current = null;
    trackingRef.current = false;
    setTracking(false);
    setLocating(false);
  }
  function toggleTracking() {
    if (tracking) stopTracking();
    else setConsent('exploration');
  }
  function advise(id: SpeciesId) {
    setFishId(id);
    setGuide(null);
    setPage('advisor');
  }
  async function installApp() {
    if (install) {
      await install.prompt();
      const result = await install.userChoice;
      if (result.outcome === 'accepted') setToast('Installation demandée au navigateur.');
      setInstall(null);
    } else setInstallHelp(true);
  }
  return (
    <div className={`app-shell ${page === 'map' ? 'is-map' : ''}`}>
      <nav className="main-nav" aria-label="Navigation principale">
        <a
          className="brand"
          href="#carte"
          onClick={(e) => {
            e.preventDefault();
            setPage('map');
          }}
          aria-label="FishQuest, carte d’accueil"
        >
          <img src="/icon.svg" alt="" />
          <span>
            fish<span>quest</span>
            <i>EXPLORER. COMPRENDRE. PÊCHER.</i>
          </span>
        </a>
        <span className="nav-section-label">VOTRE TERRAIN DE JEU</span>
        <div className="nav-links">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? 'active' : ''}
              aria-current={page === n.id ? 'page' : undefined}
              onClick={() => {
                setPage(n.id);
                setGuide(null);
              }}
            >
              <n.icon size={21} strokeWidth={1.7} />
              <span>{n.label}</span>
              {page === n.id && <i />}
            </button>
          ))}
        </div>
        <div className="nav-bottom">
          <div className="nature-note">
            <Leaf size={21} />
            <p>
              La nature se découvre.
              <br />
              <b>Et se respecte.</b>
            </p>
            <span>Remettez vos déchets dans votre sac. Laissez les berges plus belles.</span>
          </div>
          <button
            className="theme-button"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? 'Mode clair' : 'Mode sombre'}</span>
            <span className={`mini-toggle ${dark ? 'on' : ''}`} />
          </button>
          <div className="nav-signature">
            <Fish size={16} />
            <span>Au plus près du vivant.</span>
          </div>
        </div>
      </nav>
      <div className="workspace">
        <header className="top-header">
          <div className="breadcrumb">
            L’aventure au fil de l’eau<span>/</span>
            <b>{nav.find((n) => n.id === page)?.label}</b>
          </div>
          <div className="header-right">
            <span className="responsible">
              <span className="status-dot live" />
              Libre d’explorer
            </span>
            <button
              className="icon-button mobile-only"
              aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {!Capacitor.isNativePlatform() && (
              <button className="install-button" onClick={() => void installApp()}>
                <ArrowDownToLine size={16} />
                <span>Installer l’app</span>
              </button>
            )}
            <button
              className="explorer-avatar"
              aria-label={`Mon exploration, niveau ${p.level}`}
              onClick={() => setPage('explore')}
            >
              <Compass size={21} />
              <i>{p.level}</i>
            </button>
          </div>
        </header>
        {(gpsError || storageWarning || themeWarning) && (
          <div className="global-notices">
            <Notice kind="error">
              {gpsError || storageWarning || themeWarning}
              <button className="text-button" onClick={() => setGpsError('')}>
                Fermer
              </button>
            </Notice>
          </div>
        )}
        {updateAvailable && (
          <div className="global-notices">
            <Notice>
              Une mise à jour est disponible. Fermez puis rouvrez tous les onglets FishQuest pour
              l’activer.
            </Notice>
          </div>
        )}
        <main>
          {page === 'map' && (
            <MapPage
              initialLocation={point}
              initialLabel={locationLabel}
              onAdvise={advise}
              onLocation={(p, label) => {
                setPoint({ lat: p.lat, lng: p.lng });
                setLocationLabel(label);
              }}
              visits={visits}
              position={position}
              locating={locating}
              onLocate={() => setConsent('position')}
              fog={fog}
              onFog={setFog}
              onExplore={() => setPage('explore')}
            />
          )}
          {page === 'forecast' && (
            <ForecastPage point={point} label={locationLabel} fishId={fishId} onFish={setFishId} />
          )}
          {page === 'advisor' && <AdvisorPage fishId={fishId} onFish={setFishId} />}
          {page === 'identify' && <IdentifyPage onGuide={setGuide} />}
          {page === 'explore' && (
            <ExplorePage
              visits={visits}
              tracking={tracking}
              onTracking={toggleTracking}
              onClear={() => {
                stopTracking();
                saveVisits([]);
                visitsRef.current = [];
              }}
              onMap={() => setPage('map')}
              fog={fog}
              onFog={setFog}
            />
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Sparkles size={20} />
          {toast}
        </div>
      )}
      {(consent || installHelp || guide) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setConsent(null);
            setInstallHelp(false);
            setGuide(null);
          }}
        >
          <section
            className={`modal ${guide ? 'guide-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              consent
                ? 'Autoriser la géolocalisation'
                : guide
                  ? 'Guide des espèces'
                  : 'Installer FishQuest'
            }
            onClick={(e) => e.stopPropagation()}
          >
            {guide ? (
              <SpeciesDetail
                id={guide}
                onClose={() => setGuide(null)}
                onAdvise={() => advise(guide)}
              />
            ) : (
              <>
                <button
                  className="icon-button close"
                  ref={consentRef}
                  aria-label="Fermer la fenêtre"
                  onClick={() => {
                    setConsent(null);
                    setInstallHelp(false);
                  }}
                >
                  <X size={20} />
                </button>
                <span className="modal-icon">
                  {consent ? <Compass size={32} /> : <ArrowDownToLine size={30} />}
                </span>
                <span className="eyebrow">
                  {consent ? 'VOUS GARDEZ LA MAIN' : 'VOTRE COMPAGNON AU BORD DE L’EAU'}
                </span>
                <h2>{consent ? 'Explorer avec votre position ?' : 'Emportez FishQuest.'}</h2>
                {consent ? (
                  <>
                    <p>
                      {consent === 'exploration'
                        ? 'Le GPS suivra votre position tant que cette page reste ouverte, pour révéler les secteurs visités. Vous pourrez arrêter à tout moment depuis Exploration.'
                        : 'Votre position servira à recentrer la carte une seule fois.'}
                    </p>
                    <p>
                      Vos découvertes restent dans ce navigateur. Les fournisseurs de carte
                      reçoivent le secteur affiché ; Open-Meteo recevra les coordonnées
                      sélectionnées si vous ouvrez Prévisions. Aucune position n’est publiée.
                    </p>
                    <button className="primary full" onClick={startGps}>
                      Continuer avec le GPS
                    </button>
                    <button className="text-button full" onClick={() => setConsent(null)}>
                      Continuer sans géolocalisation
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      Dans Chrome ou Edge, utilisez l’icône d’installation dans la barre d’adresse.
                      Sur iPhone : Partager → Sur l’écran d’accueil.
                    </p>
                    <p>
                      L’interface, le guide et vos découvertes restent accessibles après une
                      première ouverture. Les fonds de carte, la recherche et les données en direct
                      nécessitent Internet.
                    </p>
                    <a
                      className="secondary"
                      href="https://www.openstreetmap.org/copyright"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Cartographie © OpenStreetMap
                      <ArrowUpRight size={14} />
                    </a>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
