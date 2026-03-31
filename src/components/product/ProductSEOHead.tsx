import { Helmet } from "react-helmet-async";
import { useBrand } from "@/contexts/BrandContext";
import { useLocalization } from "@/hooks/useLocalization";

interface Review {
  rating: number;
  reviewer_name: string;
  review_body: string;
  review_date: string;
}

interface ProductSEOHeadProps {
  product: any;
  productImages: string[];
  canonicalUrl: string;
  approvedReviews: Review[];
  averageRating: number;
  reviewCount: number;
}

const ProductSEOHead = ({ product, productImages, canonicalUrl, approvedReviews, averageRating, reviewCount }: ProductSEOHeadProps) => {
  const { brand } = useBrand();
  const { currencySymbol } = useLocalization();

  const siteName = brand?.brand_name || "Shop";
  const pageTitle = product.seo_title || product.name;
  const fullTitle = `${pageTitle} — ${siteName}`;
  const rawDesc = product.seo_description || product.description?.replace(/<[^>]*>/g, "").slice(0, 160) || "";
  const metaDesc = rawDesc.slice(0, 160);
  const keywords = product.seo_keywords || product.category || "";
  const primaryImage = productImages[0] || product.image_url || "";

  const currencyCode = currencySymbol === "₹" ? "INR" : currencySymbol === "$" ? "USD" : currencySymbol === "€" ? "EUR" : "INR";

  const availability = product.stock > 0
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: productImages.length > 0 ? productImages : [primaryImage],
    description: rawDesc,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: currencyCode,
      price: product.retail_price,
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability,
    },
  };

  if (reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating.toFixed(1),
      reviewCount,
    };

    const recentReviews = approvedReviews.slice(0, 10);
    if (recentReviews.length > 0) {
      jsonLd.review = recentReviews.map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: r.reviewer_name,
        },
        reviewBody: r.review_body,
        datePublished: r.review_date,
      }));
    }
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={primaryImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content={siteName} />
      <meta property="product:price:amount" content={String(product.retail_price)} />
      <meta property="product:price:currency" content={currencyCode} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={primaryImage} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default ProductSEOHead;
