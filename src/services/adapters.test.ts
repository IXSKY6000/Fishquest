import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadInventory, inventoryUrl } from './hubeau';
import { loadWeather } from './weather';
import { validatePhoto, visionProvider } from './vision';
afterEach(() => vi.restoreAllMocks());
const area = { west: 6, south: 46, east: 7, north: 47, zoom: 10 };
describe('Hub’Eau : contrat de normalisation (réponses simulées)', () => {
  it('conserve les points ASPE sans code de station et leurs coordonnées réelles', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                code_station: null,
                code_point_prelevement_aspe: '123',
                latitude: 46.3,
                longitude: 6.4,
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                code_station: null,
                code_point_prelevement_aspe: '123',
                latitude: 46.31,
                longitude: 6.41,
                code_alternatif_taxon: 'TRF',
                date_operation: '2026-09-02',
                libelle_station: 'Point ASPE réel',
              },
            ],
          }),
        ),
      );
    const result = await loadInventory(area, new AbortController().signal);
    expect(result.presences[0]).toMatchObject({
      species: 'truite',
      lat: 46.31,
      lng: 6.41,
      demo: false,
    });
    expect(result.presences[0].sourceUrl).toContain('code_point_prelevement_aspe=123');
  });
  it('transmet une emprise WGS84, dans le bon ordre', () => {
    expect(new URL(inventoryUrl(area)).searchParams.get('bbox')).toBe('6,46,7,47');
  });
  it('regroupe les individus par station/espèce et conserve la date la plus récente', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                code_station: 'A',
                libelle_station: 'Station test',
                latitude: 46.3,
                longitude: 6.4,
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              { code_station: 'A', code_alternatif_taxon: 'BRO', date_operation: '2020-01-01' },
              { code_station: 'A', code_alternatif_taxon: 'BRO', date_operation: '2024-01-01' },
              { code_station: 'A', code_alternatif_taxon: 'INCONNU', date_operation: '2024-01-01' },
            ],
            next: 'https://hubeau.eaufrance.fr/api/v1/etat_piscicole/observations?page=2',
          }),
        ),
      );
    const r = await loadInventory(area, new AbortController().signal);
    expect(r.presences).toHaveLength(1);
    expect(r.presences[0]).toMatchObject({ date: '2024-01-01', demo: false, species: 'brochet' });
    expect(r.partial).toBe(true);
  });
  it('ne substitue pas de données de démonstration à une panne', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));
    await expect(loadInventory(area, new AbortController().signal)).rejects.toThrow();
  });
  it('refuse une réponse dont le schéma est invalide', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'unknown' })),
    );
    await expect(loadInventory(area, new AbortController().signal)).rejects.toThrow();
  });
  it('ne traite pas des coordonnées nulles comme la latitude zéro', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ data: [{ code_station: 'X', latitude: null, longitude: null }] }),
      ),
    );
    expect((await loadInventory(area, new AbortController().signal)).presences).toEqual([]);
  });
});
describe('Open-Meteo : validation des unités et absence de mesure inventée', () => {
  it('conserve les valeurs manquantes et demande UTC et km/h', async () => {
    const values = {
      temperature_2m: null,
      wind_speed_10m: 8,
      precipitation: 0,
      surface_pressure: 1012,
      cloud_cover: 40,
    };
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          latitude: 46,
          longitude: 6,
          timezone: 'GMT',
          current: { time: '2026-11-07T12:00', ...values },
          hourly: {
            time: ['2026-11-07T12:00'],
            ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, [v]])),
          },
          daily: {
            time: ['2026-11-07'],
            temperature_2m_min: [null],
            temperature_2m_max: [10],
            precipitation_sum: [0],
          },
        }),
      ),
    );
    const r = await loadWeather({ lat: 46, lng: 6 }, new AbortController().signal);
    expect(r.current.temperature).toBeNull();
    expect(r.current.time).toBe('2026-11-07T12:00Z');
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.searchParams.get('timezone')).toBe('GMT');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
  });
});
describe('identification honnête', () => {
  it('refuse formats et tailles non supportés', () => {
    expect(validatePhoto(new File(['test'], 'test.txt', { type: 'text/plain' }))).toContain('JPEG');
    expect(validatePhoto(new File([], 'empty.jpg', { type: 'image/jpeg' }))).toContain('vide');
  });
  it('ne fournit aucun faux résultat sans fournisseur', async () => {
    expect(visionProvider.available).toBe(false);
    await expect(
      visionProvider.identify(new File(['test'], 'fish.jpg'), new AbortController().signal),
    ).rejects.toThrow('inactive');
  });
});
