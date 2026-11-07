// Replace this adapter with a real validated provider. Never infer an ID from a file name.
export interface VisionCandidate {
  scientificName: string;
  confidence: number | null;
  source: string;
}
export interface VisionProvider {
  available: boolean;
  identify: (file: File, signal: AbortSignal) => Promise<VisionCandidate[]>;
}
export const visionProvider: VisionProvider = {
  available: false,
  async identify() {
    throw new Error(
      'Identification automatique inactive : aucun modèle de reconnaissance connecté.',
    );
  },
};
export function validatePhoto(file: File): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Choisissez une image JPEG, PNG ou WebP.';
  if (!file.size) return 'Le fichier est vide.';
  if (file.size > 10 * 1024 * 1024)
    return 'L’image dépasse 10 Mo. Choisissez un fichier plus léger.';
  return null;
}
