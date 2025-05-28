import { getBlobImage } from "./blob-storage";

export function getPlaceholderFishImage(): string {
  return "https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com/default-image.jpg";
}

export async function getFishImageUrl(
  name: string,
  scientificName: string,
): Promise<string> {
  // Try scientific name first
  if (scientificName) {
    const blobImage = await getBlobImage(scientificName);
    if (blobImage) return blobImage;
  }

  // Try common name
  if (name) {
    const blobImage = await getBlobImage(name);
    if (blobImage) return blobImage;
  }

  return getPlaceholderFishImage();
}

export function getFishImageUrlSync(
  name?: string,
  scientificName?: string,
): string {
  return getPlaceholderFishImage();
}

export function handleFishImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fishName: string,
): void {
  const img = event.currentTarget;
  if (!img) return;

  if (!img.src.includes("placeholder.jpg")) {
    img.src = getPlaceholderFishImage();
  }
}
