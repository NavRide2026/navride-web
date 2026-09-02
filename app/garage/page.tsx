import type { Metadata } from "next";
import GarageClient, { type GarageItem } from "./GarageClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NavRide Garage",
  description: "Haz que NavRide sea tuyo. Personaliza puck, HUD, ruta y más.",
};

export const revalidate = 60;

async function loadPublishedCatalog(): Promise<GarageItem[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("garage_catalog_items")
      .select(
        "id,slug,name,description,category,status,preview_path,is_free,version,metadata",
      )
      .eq("status", "published")
      .order("category")
      .order("name");
    if (error || !data) return [];
    return data as GarageItem[];
  } catch {
    return [];
  }
}

export default async function GaragePage() {
  const initialItems = await loadPublishedCatalog();
  return <GarageClient initialItems={initialItems} />;
}
