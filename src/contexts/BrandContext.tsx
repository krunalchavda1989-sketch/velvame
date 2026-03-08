import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandSettings {
  brand_name: string;
  tagline: string;
  logo_url: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  website: string;
}

const defaultBrand: BrandSettings = {
  brand_name: "NexaMLM",
  tagline: "Build your network, grow your income.",
  logo_url: "",
  email: "",
  phone: "",
  address: "",
  gst_number: "",
  website: "",
};

const BrandContext = createContext<BrandSettings>(defaultBrand);

export const useBrand = () => useContext(BrandContext);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);

  useEffect(() => {
    supabase
      .from("brand_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setBrand({
            brand_name: data.brand_name || defaultBrand.brand_name,
            tagline: data.tagline || defaultBrand.tagline,
            logo_url: data.logo_url || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            gst_number: data.gst_number || "",
            website: data.website || "",
          });
          document.title = data.brand_name || defaultBrand.brand_name;
        }
      });
  }, []);

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
};
