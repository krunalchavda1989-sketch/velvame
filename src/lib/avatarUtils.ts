import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves an avatar storage path to a full public URL.
 * Returns null if the path is empty/null.
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  // If it's already a full URL, return as-is
  if (avatarPath.startsWith("http")) return avatarPath;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
  return data?.publicUrl || null;
}

/**
 * Returns the first letter of a name, uppercased.
 */
export function getInitial(name: string | null | undefined): string {
  if (!name || !name.trim()) return "?";
  return name.trim().charAt(0).toUpperCase();
}
