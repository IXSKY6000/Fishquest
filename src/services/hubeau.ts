import { z } from 'zod';
import type { MapArea, Presence, SpeciesId } from '../domain/types';
import { matchSpecies, species, byId } from '../data/species';
import { getJson } from './http';

const numberOrNull = z
  .union([z.number(), z.string().transform(Number)])
  .nullable()
  .optional();
const identifier = z.union([z.string(), z.number()]).transform(String).nullable().optional();
const stationSchema = z.object({
  code_station: identifier,
  code_point_prelevement_aspe: identifier,
  libelle_station: z.string().nullable().optional(),
  longitude: numberOrNull,
  latitude: numberOrNull,
});
const observationSchema = stationSchema.extend({
  code_alternatif_taxon: z.string().nullable().optional(),
  nom_latin_taxon: z.string().nullable().optional(),
  date_operation: z.string().nullable().optional(),
  libelle_qualification_operation: z.string().nullable().optional(),
});
const pageSchema = z.object({
  data: z.array(z.unknown()),
  next: z.string().nullable().optional(),
  count: z.number().optional(),
});
const BASE = 'https://hubeau.eaufrance.fr/api/v1/etat_piscicole';
const FIELDS =
  'code_station,code_point_prelevement_aspe,code_alternatif_taxon,nom_latin_taxon,date_operation,libelle_station,libelle_qualification_operation,longitude,latitude';
export interface InventoryResult {
  presences: Presence[];
  stations: number;
  partial: boolean;
}
const bbox = (area: MapArea) => [area.west, area.south, area.east, area.north].join(',');
export function inventoryUrl(area: MapArea): string {
  return `${BASE}/stations?${new URLSearchParams({ bbox: bbox(area), size: '20', format: 'json' })}`;
}
export async function loadInventory(
  area: MapArea,
  signal: AbortSignal,
  selected: SpeciesId[] = [],
): Promise<InventoryResult> {
  if (area.east - area.west > 3 || area.north - area.south > 3)
    throw new Error(
      'Le service : rapprochez la carte pour charger un secteur de moins de 3° de côté.',
    );
  const stationPage = pageSchema.parse(await getJson(inventoryUrl(area), signal));
  const inArea = (lat: unknown, lng: unknown): lat is number =>
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lat >= area.south &&
    lat <= area.north &&
    lng >= area.west &&
    lng <= area.east;
  const stations = stationPage.data
    .flatMap((row) => {
      const parsed = stationSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    })
    .filter((s) => inArea(s.latitude, s.longitude));
  if (!stations.length) return { presences: [], stations: 0, partial: Boolean(stationPage.next) };
  // Real API returns points without a Sandre station code. Query by bounds, never discard those points.
  // Limit fields and individuals: full individual records can take over 45 s and several MB.
  const params = new URLSearchParams({
    bbox: bbox(area),
    code_alternatif_taxon: (selected.length ? selected.map((id) => byId[id]) : species)
      .map((s) => s.code)
      .join(','),
    size: '600',
    format: 'json',
    sort: 'desc',
    fields: FIELDS,
  });
  await new Promise((resolve) => setTimeout(resolve, 550));
  signal.throwIfAborted();
  const observations = pageSchema.parse(await getJson(`${BASE}/observations?${params}`, signal));
  const result = new Map<string, Presence>();
  let validRows = 0;
  for (const row of observations.data) {
    const parsed = observationSchema.safeParse(row);
    if (!parsed.success) continue;
    validRows++;
    const o = parsed.data,
      fish = matchSpecies(o.code_alternatif_taxon, o.nom_latin_taxon);
    if (!fish) continue;
    const station = stations.find((s) =>
      o.code_point_prelevement_aspe
        ? s.code_point_prelevement_aspe === o.code_point_prelevement_aspe
        : Boolean(o.code_station) && s.code_station === o.code_station,
    );
    const lat = o.latitude ?? station?.latitude,
      lng = o.longitude ?? station?.longitude;
    if (!inArea(lat, lng)) continue;
    const pointId = o.code_point_prelevement_aspe || o.code_station || `${lat},${lng}`;
    const key = `${pointId}-${fish.id}`;
    const date =
      o.date_operation && Number.isFinite(Date.parse(o.date_operation)) ? o.date_operation : null;
    const existing = result.get(key);
    if (existing && (!date || (existing.date && existing.date >= date))) continue;
    const sourceParams = new URLSearchParams({
      code_alternatif_taxon: fish.code,
      size: '20',
      format: 'json',
      sort: 'desc',
    });
    if (o.code_point_prelevement_aspe)
      sourceParams.set('code_point_prelevement_aspe', o.code_point_prelevement_aspe);
    else if (o.code_station) sourceParams.set('code_station', o.code_station);
    else sourceParams.set('bbox', bbox(area));
    result.set(key, {
      id: key,
      species: fish.id,
      layer: 'inventory',
      lat,
      lng: lng as number,
      location: o.libelle_station || station?.libelle_station || `Point de prélèvement ${pointId}`,
      date,
      source: 'Hub’Eau · inventaires piscicoles OFB / SIE',
      sourceUrl: `${BASE}/observations?${sourceParams}`,
      reliability: o.libelle_qualification_operation || 'Qualification non fournie par la source',
      demo: false,
      stationCode: o.code_station ?? undefined,
    });
  }
  if (observations.data.length && !validRows)
    throw new Error('Le service Hub’Eau a retourné un format inattendu. Aucune donnée inventée.');
  return {
    presences: [...result.values()],
    stations: stations.length,
    partial: Boolean(stationPage.next || observations.next),
  };
}
