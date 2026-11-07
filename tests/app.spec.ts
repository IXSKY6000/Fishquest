import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route(
    /^https:\/\/(tile\.openstreetmap\.org|server\.arcgisonline\.com|commons\.wikimedia\.org)\//,
    (r) => r.abort(),
  );
});
test('la carte, les exemples, les filtres et le conseiller fonctionnent', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('fish-map')).toBeVisible();
  await expect(page.getByText('Démonstration · données fictives')).toHaveCount(0);
  await page.getByRole('button', { name: 'Essayer les exemples' }).click();
  await expect(page.getByText('Démonstration · données fictives')).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Ouvrir les filtres' }).click();
  await page.getByRole('button', { name: 'Brochet', exact: false }).first().click();
  await expect(page.getByRole('button', { name: 'Brochet', exact: false }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Ouvrir le guide' }).click();
  if (isMobile) await page.getByRole('button', { name: 'Fermer les filtres' }).click();
  await expect(page.getByRole('heading', { name: 'Brochet', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Trouver le bon appât' }).click();
  await page.getByRole('button', { name: 'Obtenir mes conseils' }).click();
  await expect(page.getByRole('heading', { name: 'Shad', exact: true })).toBeVisible();
  await expect(page.getByText('Profondeur inconnue', { exact: false }).first()).toBeVisible();
  await page.screenshot({
    path: `test-results/advisor-${isMobile ? 'mobile' : 'desktop'}.png`,
    fullPage: true,
  });
});
test('les échecs réseau ne produisent ni inventaires ni prévisions fictifs', async ({ page }) => {
  await page.route('https://hubeau.eaufrance.fr/**', (r) => r.abort());
  await page.route('https://api.open-meteo.com/**', (r) => r.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Charger ce secteur' }).click();
  await expect(page.getByRole('alert')).toContainText('inaccessible');
  await page.getByRole('button', { name: 'Prévisions', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Aucune prévision n’est inventée');
  await expect(page.getByText('Favorables', { exact: true })).toHaveCount(0);
});

test('la recherche choisit un vrai lieu et une recherche d’espèce reste locale', async ({
  page,
  isMobile,
}) => {
  let requests = 0;
  await page.route('https://nominatim.openstreetmap.org/search?**', (route) => {
    requests++;
    return route.fulfill({
      json: [
        {
          place_id: 1,
          display_name: 'Thonon-les-Bains, Haute-Savoie, France',
          lat: '46.373',
          lon: '6.478',
        },
      ],
    });
  });
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Ouvrir les filtres' }).click();
  await page.getByRole('textbox', { name: 'Rechercher un lieu ou une espèce' }).fill('Thonon');
  await page.getByRole('button', { name: 'Lancer la recherche' }).click();
  await page.getByRole('button', { name: 'Thonon-les-Bains, Haute-Savoie, France' }).click();
  await expect(page.locator('.location-pill')).toContainText('Thonon-les-Bains');
  await page.getByRole('textbox', { name: 'Rechercher un lieu ou une espèce' }).fill('perche');
  await page.getByRole('button', { name: 'Lancer la recherche' }).click();
  await expect(page.getByRole('button', { name: 'Perche', exact: false }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(requests).toBe(1);
  await page.getByRole('button', { name: 'Conseiller', exact: true }).click();
  await page.getByRole('button', { name: 'Carte', exact: true }).first().click();
  await expect(page.locator('.location-pill')).toContainText('Thonon-les-Bains');
});
test('les réponses des API sont intégrées et sourcées (fixtures)', async ({ page }) => {
  await page.route('https://hubeau.eaufrance.fr/**', (r) =>
    r.fulfill({
      json: r.request().url().includes('/stations?')
        ? {
            data: [
              {
                code_station: 'test-1',
                libelle_station: 'Station simulée pour test',
                latitude: 46.35,
                longitude: 6.4,
              },
            ],
          }
        : {
            data: [
              {
                code_station: 'test-1',
                code_alternatif_taxon: 'BRO',
                date_operation: '2020-10-01',
                libelle_qualification_operation: 'Qualification de test',
              },
            ],
          },
    }),
  );
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  const times = Array.from({ length: 48 }, (_, i) =>
    new Date(now.getTime() + i * 3600000).toISOString().slice(0, 16),
  );
  const values = {
    temperature_2m: 15,
    wind_speed_10m: 10,
    precipitation: 0,
    surface_pressure: 1012,
    cloud_cover: 60,
  };
  await page.route('https://api.open-meteo.com/**', (r) =>
    r.fulfill({
      json: {
        latitude: 46.3,
        longitude: 6.4,
        timezone: 'GMT',
        current: { time: times[0], ...values },
        hourly: {
          time: times,
          ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, times.map(() => v)])),
        },
        daily: {
          time: [times[0].slice(0, 10)],
          temperature_2m_min: [7],
          temperature_2m_max: [17],
          precipitation_sum: [0],
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Charger ce secteur' }).click();
  await expect(page.getByText('Inventaires historiques · Hub’Eau')).toBeVisible();
  await page.getByRole('button', { name: 'Brochet', exact: true }).click();
  await expect(page.getByText('Station simulée pour test')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Consulter les observations sources' }),
  ).toHaveAttribute('href', /code_station=test-1/);
  await page.getByRole('button', { name: 'Prévisions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Conditions actuelles' })).toBeVisible();
  await expect(page.getByText('15 °C', { exact: true })).toBeVisible();
  await expect(page.getByText('Confiance limitée · moteur de règles v1')).toBeVisible();
});
test('exploration uniquement après consentement, stockage et effacement', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.378, longitude: 6.478, accuracy: 10 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Exploration', exact: true }).click();
  await expect(page.locator('.explorer-hero p')).toContainText('0 secteur découvert · 0 XP acquis');
  await page.getByRole('button', { name: 'Commencer l’exploration GPS' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Continuer avec le GPS' }).click();
  await expect(page.getByText('100 XP acquis', { exact: false })).toBeVisible();
  await expect(page.getByText('Nouveau secteur découvert · +100 XP')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Exploration', exact: true }).click();
  await expect(page.getByText('100 XP acquis', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commencer l’exploration GPS' })).toBeVisible();
  await page.getByRole('button', { name: 'Effacer mes découvertes' }).click();
  await page.getByRole('button', { name: 'Oui, effacer' }).click();
  await expect(page.locator('.explorer-hero p')).toContainText('0 secteur découvert · 0 XP acquis');
});
test('la photo reste locale et le guide manuel ne prétend pas identifier', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Identification', exact: true }).click();
  await page.getByLabel('Choisir une photo de poisson').setInputFiles('public/icon-192.png');
  await expect(
    page.getByAltText('Votre photo, conservée uniquement dans ce navigateur'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Identification automatique inactive' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Retirer la photo' }).click();
  await expect(
    page.getByAltText('Votre photo, conservée uniquement dans ce navigateur'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Truite fario', exact: false }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Salmo trutta', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('PWA et interface sans débordement horizontal', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Essayer les exemples' }).click();
  await page.waitForTimeout(1000);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({
    path: `test-results/map-${isMobile ? 'mobile' : 'desktop'}.png`,
    fullPage: true,
  });
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).display).toBe('standalone');
  await expect
    .poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration())))
    .toBe(true);
});

test('le thème persiste et le guide reste accessible hors ligne après préparation PWA', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Activer le mode sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('fish-map')).toBeVisible();
  await page.getByRole('button', { name: 'Conseiller', exact: true }).click();
  await page.getByRole('button', { name: 'Obtenir mes conseils' }).click();
  await expect(page.getByRole('heading', { name: 'Shad', exact: true })).toBeVisible();
  await context.setOffline(false);
});
