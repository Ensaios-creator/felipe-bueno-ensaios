import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StudioSettings {
  whatsappNumber: string;
  studioName: string;
}

const SETTINGS_KEY = "ensaios_studio_settings";
export const DEFAULT_WHATSAPP = "5537991377328";
export const DEFAULT_STUDIO_NAME = "Felipe Bueno Retratos";

export function cleanPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return DEFAULT_WHATSAPP;
  // If Brazilian number without country code (e.g. 37991377328), prefix with 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = cleanPhoneDigits(phone);
  // Format 5537991377328 -> +55 (37) 99137-7328
  if (cleaned.startsWith("55") && cleaned.length === 13) {
    const ddd = cleaned.slice(2, 4);
    const part1 = cleaned.slice(4, 9);
    const part2 = cleaned.slice(9, 13);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2);
    const part1 = cleaned.slice(2, 7);
    const part2 = cleaned.slice(7, 11);
    return `(${ddd}) ${part1}-${part2}`;
  }
  return cleaned;
}

export function getStudioSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return {
      whatsappNumber: DEFAULT_WHATSAPP,
      studioName: DEFAULT_STUDIO_NAME,
    };
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        whatsappNumber: cleanPhoneDigits(parsed.whatsappNumber || DEFAULT_WHATSAPP),
        studioName: parsed.studioName || DEFAULT_STUDIO_NAME,
      };
    }
  } catch {
    // fallback to defaults
  }

  return {
    whatsappNumber: DEFAULT_WHATSAPP,
    studioName: DEFAULT_STUDIO_NAME,
  };
}

export function getStudioWhatsApp(): string {
  return getStudioSettings().whatsappNumber;
}

export async function saveStudioSettings(settings: Partial<StudioSettings>): Promise<StudioSettings> {
  const current = getStudioSettings();
  const updated: StudioSettings = {
    whatsappNumber: settings.whatsappNumber
      ? cleanPhoneDigits(settings.whatsappNumber)
      : current.whatsappNumber,
    studioName: settings.studioName?.trim() || current.studioName,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    // Trigger custom event so other components update instantly
    window.dispatchEvent(new Event("studio_settings_updated"));
  }

  // Attempt to sync to Supabase if authenticated and table exists
  try {
    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      await supabase.from("studio_settings" as never).upsert({
        id: "default",
        studio_name: updated.studioName,
        whatsapp_number: updated.whatsappNumber,
        updated_at: new Date().toISOString(),
      } as never);
    }
  } catch {
    // Non-blocking if table doesn't exist yet
  }

  return updated;
}

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings>(getStudioSettings);

  useEffect(() => {
    const update = () => setSettings(getStudioSettings());
    window.addEventListener("studio_settings_updated", update);

    // Also attempt to fetch latest settings from Supabase if logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        supabase
          .from("studio_settings" as never)
          .select("whatsapp_number, studio_name")
          .eq("id", "default")
          .maybeSingle()
          .then(({ data: remote }: { data: { whatsapp_number?: string; studio_name?: string } | null }) => {
            if (remote?.whatsapp_number) {
              const merged: StudioSettings = {
                whatsappNumber: cleanPhoneDigits(remote.whatsapp_number),
                studioName: remote.studio_name || DEFAULT_STUDIO_NAME,
              };
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
              setSettings(merged);
            }
          });
      }
    });

    return () => window.removeEventListener("studio_settings_updated", update);
  }, []);

  return {
    settings,
    saveSettings: saveStudioSettings,
  };
}
