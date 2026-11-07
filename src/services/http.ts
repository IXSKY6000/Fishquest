export async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(18000)])
      : AbortSignal.timeout(18000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok)
    throw new Error(`Le service a répondu ${response.status}. Réessayez plus tard.`);
  return response.json();
}
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.name === 'TimeoutError')
    return 'Le service met trop de temps à répondre. Réessayez.';
  if (error instanceof Error && error.message.startsWith('Le service')) return error.message;
  return 'Service inaccessible. Vérifiez la connexion et les autorisations réseau.';
}
