/**
 * Generate a product URL using the SEO slug when available, falling back to the product ID.
 */
export const getProductUrl = (product: { id: string; seo_slug?: string | null; name?: string }): string => {
  const slug = product.seo_slug && product.seo_slug.trim().length > 0 ? product.seo_slug : product.id;
  return `/product/${slug}`;
};

/**
 * Generate a slug from a product name.
 */
export const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
