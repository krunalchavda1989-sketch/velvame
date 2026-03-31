import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ProductCard from "@/components/shop/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useLocalization } from "@/hooks/useLocalization";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, isMember } = useCart();
  const { taxEnabled, taxLabel } = useLocalization();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("product_categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      setCategory(data);
      setLoading(false);
    };
    fetchCategory();
  }, [slug]);

  const filtered = category ? products.filter((p) => p.category === category.name) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40">
          <h1 className="text-2xl font-bold text-foreground">Category Not Found</h1>
          <p className="text-muted-foreground mt-2">The category you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16">
        <PageBreadcrumb
          title={category.name}
          subtitle={
            category.description ||
            (isMember
              ? `Exclusive distributor prices for members${taxEnabled ? ` (Prices excl. ${taxLabel})` : ""}`
              : `Quality products at retail prices${taxEnabled ? ` (Prices excl. ${taxLabel})` : ""}`)
          }
          pageType="category"
        />

        {/* Category Banner */}
        {category.banner_url && (
          <div className="w-full">
            <img
              src={category.banner_url}
              alt={`${category.name} banner`}
              className="w-full h-auto object-cover max-h-[300px]"
            />
          </div>
        )}

        <div className="container px-4 pt-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-muted-foreground text-lg">No products found in this category.</p>
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

export default CategoryPage;
