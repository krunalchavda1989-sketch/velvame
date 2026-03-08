import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LocalizationSettings {
  currencySymbol: string;
  defaultCurrency: string;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  defaultLanguage: string;
  loading: boolean;
}

const defaults: LocalizationSettings = {
  currencySymbol: "₹",
  defaultCurrency: "INR",
  taxEnabled: false,
  taxRate: 18,
  taxLabel: "GST",
  defaultLanguage: "en",
  loading: true,
};

let cachedSettings: LocalizationSettings | null = null;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<(s: LocalizationSettings) => void>();

const fetchSettings = async () => {
  try {
    const { data } = await supabase
      .from("localization_settings")
      .select("currency_symbol, default_currency, tax_enabled, tax_rate, tax_label, default_language")
      .limit(1)
      .single();

    if (data) {
      cachedSettings = {
        currencySymbol: data.currency_symbol || "₹",
        defaultCurrency: data.default_currency || "INR",
        taxEnabled: data.tax_enabled ?? false,
        taxRate: Number(data.tax_rate) || 0,
        taxLabel: data.tax_label || "GST",
        defaultLanguage: data.default_language || "en",
        loading: false,
      };
    } else {
      cachedSettings = { ...defaults, loading: false };
    }
  } catch {
    cachedSettings = { ...defaults, loading: false };
  }
  listeners.forEach((cb) => cb(cachedSettings!));
};

export const useLocalization = (): LocalizationSettings => {
  const [settings, setSettings] = useState<LocalizationSettings>(
    cachedSettings || defaults
  );

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      return;
    }

    listeners.add(setSettings);
    if (!fetchPromise) {
      fetchPromise = fetchSettings();
    }

    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
};

/** Format a price with localized currency symbol */
export const formatPrice = (amount: number, symbol: string) =>
  `${symbol}${amount.toFixed(2)}`;

/** Calculate tax-inclusive price */
export const withTax = (amount: number, taxRate: number, taxEnabled: boolean) =>
  taxEnabled ? amount + (amount * taxRate) / 100 : amount;

/** Calculate just the tax amount */
export const taxAmount = (amount: number, taxRate: number, taxEnabled: boolean) =>
  taxEnabled ? (amount * taxRate) / 100 : 0;
