import { z } from 'zod';
import { getJson } from './http';
const schema = z.array(
  z.object({ place_id: z.number(), display_name: z.string(), lat: z.string(), lon: z.string() }),
);
let lastSearch = 0;
export async function searchPlaces(query: string, signal: AbortSignal) {
  // Explicit submissions only, no autocomplete, at most one request per second.
  const wait = Math.max(0, 1100 - (Date.now() - lastSearch));
  await new Promise((resolve) => setTimeout(resolve, wait));
  signal.throwIfAborted();
  lastSearch = Date.now();
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '5',
    'accept-language': 'fr',
  });
  return schema
    .parse(await getJson(`https://nominatim.openstreetmap.org/search?${params}`, signal))
    .map((p) => ({ id: p.place_id, label: p.display_name, lat: Number(p.lat), lng: Number(p.lon) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}
