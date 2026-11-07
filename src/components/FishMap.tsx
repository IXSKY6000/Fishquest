import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Circle,
  Marker,
  Tooltip,
  Polygon,
  useMap,
  useMapEvents,
  ScaleControl,
} from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import { Compass, LocateFixed, Minus, Plus, RotateCw } from 'lucide-react';
import type { Coordinates, ExplorationVisit, LayerId, MapArea, Presence } from '../domain/types';
import { byId } from '../data/species';
import { SourceLink } from './Common';
interface Props {
  presences: Presence[];
  layers: Record<LayerId, boolean>;
  focus: Coordinates & { zoom?: number };
  onArea: (area: MapArea) => void;
  onSelect: (presence: Presence) => void;
  selected?: string;
  fog: boolean;
  visits: ExplorationVisit[];
  position: Coordinates | null;
  onLocate: () => void;
  locating: boolean;
  satellite: boolean;
  onSatellite: (value: boolean) => void;
}
function mapArea(map: L.Map): MapArea {
  const b = map.getBounds();
  return {
    west: b.getWest(),
    east: b.getEast(),
    north: b.getNorth(),
    south: b.getSouth(),
    zoom: map.getZoom(),
  };
}
function Controls({
  focus,
  onArea,
  onLocate,
  locating,
  satellite,
  onSatellite,
}: {
  focus: Props['focus'];
  onArea: Props['onArea'];
  onLocate: () => void;
  locating: boolean;
  satellite: boolean;
  onSatellite: (v: boolean) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([focus.lat, focus.lng], focus.zoom ?? 11, { duration: 1 });
  }, [focus, map]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    onArea(mapArea(map));
    return () => observer.disconnect();
  }, [map, onArea]);
  useMapEvents({ moveend: () => onArea(mapArea(map)) });
  return (
    <>
      <div className="map-tools leaflet-control">
        <button title="Zoomer" aria-label="Zoomer" onClick={() => map.zoomIn()}>
          <Plus size={20} />
        </button>
        <button title="Dézoomer" aria-label="Dézoomer" onClick={() => map.zoomOut()}>
          <Minus size={20} />
        </button>
        <hr />
        <button
          aria-label="Recentrer sur le lac Léman"
          title="Recentrer sur le lac Léman"
          onClick={() => map.flyTo([46.369, 6.472], 10)}
        >
          <Compass size={20} />
        </button>
        <button
          title="Utiliser ma position"
          aria-label="Utiliser ma position"
          onClick={onLocate}
          disabled={locating}
        >
          <LocateFixed size={20} className={locating ? 'spin' : ''} />
        </button>
      </div>
      <div className="basemap-toggle leaflet-control">
        <button className={!satellite ? 'active' : ''} onClick={() => onSatellite(false)}>
          Carte
        </button>
        <button className={satellite ? 'active' : ''} onClick={() => onSatellite(true)}>
          Satellite
        </button>
      </div>
    </>
  );
}
function ClusteredMarkers({
  presences,
  selected,
  onSelect,
}: {
  presences: Presence[];
  selected?: string;
  onSelect: Props['onSelect'];
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const clusters = useMemo(() => {
    const cells = new Map<string, Presence[]>();
    for (const p of presences) {
      const point = map.project([p.lat, p.lng], zoom);
      const key = zoom >= 15 ? p.id : `${Math.floor(point.x / 65)},${Math.floor(point.y / 65)}`;
      cells.set(key, [...(cells.get(key) || []), p]);
    }
    return [...cells.entries()].map(([key, items]) => ({
      key,
      items,
      lat: items.reduce((a, p) => a + p.lat, 0) / items.length,
      lng: items.reduce((a, p) => a + p.lng, 0) / items.length,
    }));
  }, [map, presences, zoom]);
  return clusters.map((c) => {
    const fish = c.items[0];
    const multiple = c.items.length > 1;
    // At high zoom spread icons in pixels while retaining each true station coordinate.
    const neighbours =
      zoom >= 15 ? presences.filter((p) => p.lat === fish.lat && p.lng === fish.lng) : [];
    const index = neighbours.findIndex((p) => p.id === fish.id);
    const angle = (index / Math.max(1, neighbours.length)) * Math.PI * 2;
    const offset =
      neighbours.length > 1 ? { x: Math.cos(angle) * 55, y: Math.sin(angle) * 55 } : { x: 0, y: 0 };
    const icon = L.divIcon({
      className: 'fish-marker-wrapper',
      iconSize: multiple ? [48, 48] : [62, 52],
      iconAnchor: multiple ? [24, 24] : [31 - offset.x, 26 - offset.y],
      html: multiple
        ? `<span class="cluster-marker">${c.items.length}</span>`
        : `<span class="fish-marker ${selected === fish.id ? 'selected' : ''} ${fish.demo ? 'demo-marker' : ''}" style="--fish-color:${byId[fish.species].color}"><img alt="" src="/fish/${fish.species}.svg"/><i></i></span>`,
    });
    return (
      <Marker
        key={c.key}
        position={[c.lat, c.lng]}
        icon={icon}
        title={
          multiple
            ? `${c.items.length} indications regroupées`
            : `${byId[fish.species].name}${fish.demo ? ' · exemple fictif' : ''}`
        }
        eventHandlers={{
          click: () =>
            multiple
              ? map.fitBounds(L.latLngBounds(c.items.map((p) => [p.lat, p.lng] as L.LatLngTuple)), {
                  padding: [70, 70],
                  maxZoom: 16,
                })
              : onSelect(fish),
        }}
      >
        <Tooltip direction="top">
          {multiple ? `${c.items.length} indications · zoomer` : byId[fish.species].name}
          {fish.demo ? ' · démonstration' : ''}
        </Tooltip>
      </Marker>
    );
  });
}
function Fog({ visits }: { visits: ExplorationVisit[] }) {
  const outer: L.LatLngExpression[] = [
    [-85, -180],
    [85, -180],
    [85, 180],
    [-85, 180],
  ];
  const holes: L.LatLngExpression[][] = visits.map((v) =>
    Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return [
        v.lat + Math.sin(a) * 0.00225,
        v.lng + (Math.cos(a) * 0.00225) / Math.cos((v.lat * Math.PI) / 180),
      ] as L.LatLngTuple;
    }),
  );
  return (
    <Polygon
      positions={[outer, ...holes]}
      pathOptions={{
        fillColor: '#153b38',
        fillOpacity: 0.28,
        stroke: false,
        interactive: false,
        fillRule: 'evenodd',
      }}
    />
  );
}
export default function FishMap(props: Props) {
  const [vectors, setVectors] = useState<GeoJsonObject[]>([]);
  const [tileError, setTileError] = useState(false);
  const [tileReady, setTileReady] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    Promise.all(
      ['ne_10m_lakes.geojson', 'ne_10m_rivers_lake_centerlines.geojson'].map((f) =>
        fetch(`/data/${f}`, { signal: c.signal }).then((r) => r.json()),
      ),
    )
      .then(setVectors)
      .catch(() => {});
    return () => c.abort();
  }, []);
  useEffect(() => {
    setTileError(false);
    setTileReady(false);
  }, [props.satellite, retry]);
  useEffect(() => {
    if (tileReady) return;
    const timeout = setTimeout(() => setTileError(true), 12000);
    return () => clearTimeout(timeout);
  }, [props.satellite, retry, tileReady]);
  const url = props.satellite
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const visible = props.presences.filter((p) => props.layers[p.layer]);
  return (
    <div className="map-stage" data-testid="fish-map">
      <MapContainer
        center={[props.focus.lat, props.focus.lng]}
        zoom={props.focus.zoom ?? 10}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        preferCanvas
        worldCopyJump
      >
        {!tileReady &&
          vectors.map((data, i) => (
            <GeoJSON
              key={i}
              data={data}
              style={{ color: '#86b9b3', weight: 2, fillColor: '#b8dcda', fillOpacity: 1 }}
              interactive={false}
            />
          ))}
        <TileLayer
          key={`${url}-${retry}`}
          url={url}
          maxZoom={props.satellite ? 18 : 19}
          attribution={
            props.satellite
              ? 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => {
              setTileReady(true);
              setTileError(false);
            },
          }}
        />
        {props.layers.estimated &&
          props.presences
            .filter((p) => p.layer === 'inventory')
            .map((p) => (
              <Circle
                key={`est-${p.id}`}
                center={[p.lat, p.lng]}
                radius={200}
                pathOptions={{
                  color: '#c39955',
                  weight: 1,
                  dashArray: '4 5',
                  fillColor: '#e3b65b',
                  fillOpacity: 0.18,
                }}
              >
                <Tooltip>
                  Zone indicative de 200 m autour d’un inventaire{p.demo ? ' fictif' : ''}.
                  Confiance faible : bathymétrie, habitat et eau non mesurés. Le cercle peut inclure
                  des terres.
                </Tooltip>
              </Circle>
            ))}
        {props.fog && <Fog visits={props.visits} />}
        <ClusteredMarkers presences={visible} onSelect={props.onSelect} selected={props.selected} />
        {props.visits.map((v) => (
          <Circle
            key={v.id}
            center={[v.lat, v.lng]}
            radius={250}
            pathOptions={{ color: '#4b8f6b', weight: 1, fillOpacity: 0.08 }}
          >
            <Tooltip>
              Secteur exploré personnel · {new Date(v.date).toLocaleDateString('fr-FR')}
            </Tooltip>
          </Circle>
        ))}
        {props.position && (
          <Circle
            center={[props.position.lat, props.position.lng]}
            radius={35}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#2762d5', fillOpacity: 1 }}
          />
        )}
        <ScaleControl position="bottomright" imperial={false} />
        <Controls
          focus={props.focus}
          onArea={props.onArea}
          onLocate={props.onLocate}
          locating={props.locating}
          satellite={props.satellite}
          onSatellite={props.onSatellite}
        />
      </MapContainer>
      {(!tileReady || tileError) && (
        <div className="tile-notice" role="status">
          <span>
            {tileError
              ? tileReady
                ? 'Certaines tuiles sont indisponibles.'
                : 'Fond cartographique inaccessible.'
              : 'Chargement du fond cartographique…'}{' '}
            {tileReady
              ? 'Réessayez pour compléter le fond de carte.'
              : props.satellite
                ? 'Satellite indisponible sans accès au fournisseur.'
                : 'Repères hydrographiques Natural Earth simplifiés en secours ; ce fond ne permet pas une navigation précise.'}
          </span>
          <button aria-label="Réessayer le fond de carte" onClick={() => setRetry((v) => v + 1)}>
            <RotateCw size={15} />
          </button>
        </div>
      )}
      {!tileReady && (
        <div className="map-attribution-extra">
          <SourceLink href="https://www.naturalearthdata.com/about/terms-of-use/">
            Natural Earth · domaine public
          </SourceLink>
        </div>
      )}
    </div>
  );
}
