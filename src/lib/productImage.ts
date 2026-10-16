/** Default photo shown on every product until a listing has its own image. */
export const DEFAULT_PRODUCT_IMAGE = "/soko-eggs-hero.jpg";

export function productImageSrc(imageUrl?: string | null) {
  const value = imageUrl?.trim();
  return value || DEFAULT_PRODUCT_IMAGE;
}
