import { Link } from "react-router-dom";
import { Crown } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

const AuthPageLayout = ({ children }: { children: React.ReactNode }) => {
  const brand = useBrand();

  const { data: authImage } = useQuery({
    queryKey: ["auth-page-image"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "auth_page_image")
        .maybeSingle();
      return (data?.value as string) || DEFAULT_IMAGE;
    },
    staleTime: 300000,
  });

  const imageUrl = authImage || DEFAULT_IMAGE;

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Left Image Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden m-4 rounded-2xl">
        <img
          src={imageUrl}
          alt="Welcome"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/30 to-primary/70" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
          <Link to="/" className="inline-flex items-center gap-2 w-fit">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.brand_name} className="h-10 w-auto object-contain rounded brightness-0 invert" />
            ) : (
              <Crown className="h-8 w-8 text-white" />
            )}
          </Link>
          <div>
            <p className="text-sm font-medium opacity-80 mb-2">Welcome to</p>
            <h2 className="text-3xl xl:text-4xl font-display font-bold leading-tight">
              {brand.brand_name || "Our Platform"}
            </h2>
            {brand.tagline && (
              <p className="mt-3 text-base opacity-80 max-w-xs">{brand.tagline}</p>
            )}
          </div>
          <div className="text-xs opacity-60">
            © {new Date().getFullYear()} {brand.brand_name}. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain rounded" />
              ) : (
                <Crown className="h-8 w-8 text-primary" />
              )}
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
