import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import OffersCarousel from "@/components/shop/OffersCarousel";
import ProductCard from "@/components/shop/ProductCard";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";

interface CategoryItem {
  name: string;
  slug: string;
}

const Shop = () => {
  const { products, isMember } = useCart();
  const { taxEnabled, taxLabel } = useLocalization();
  const [filter, setFilter] = useState("All");
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("name, slug")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setCategories(data.map((c: any) => ({ name: c.name, slug: c.slug })));
    };
    fetchCategories();
  }, []);

  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);
  const loading = products.length === 0;

  const canonical = `${typeof window !== "undefined" ? window.location.origin : "https://velvame.lovable.app"}/shop`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shop — Velvame Premium Health & Wellness Products</title>
        <meta name="description" content="Shop premium health & wellness products at Velvame. Members unlock exclusive distributor pricing on every order." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Shop — Velvame" />
        <meta property="og:description" content="Premium health & wellness products with exclusive member pricing." />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      
      <div className="pb-16">
        <PageBreadcrumb
          title="Shop Products"
          subtitle={
            isMember
              ? `Exclusive distributor prices for members${taxEnabled ? ` (Prices excl. ${taxLabel})` : ""}`
              : `Quality products at retail prices${taxEnabled ? ` (Prices excl. ${taxLabel})` : ""}`
          }
          pageType="category"
        />

        <div className="container px-4 pt-8">
          <OffersCarousel />

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter("All")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === "All"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap bg-secondary text-muted-foreground hover:text-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
