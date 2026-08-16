import type { Category } from "./ensaio-options";

export type CatalogItemPublic = {
  id: string;
  code: string;
  category: Category;
  name: string;
  imageUrl: string | null;
  color: string | null;
  style: string | null;
  tags: string[];
  aiDescription: string;
};

export type OrderConfigData = {
  session_type: string | null;
  session_subtype: string | null;
  framing: string | null;
  outfit_mode: string | null;
  makeup: string | null;
  hair: string | null;
  color_palette: string | null;
  lighting_mood: string | null;
  visible_text_answer: string;
  special_notes: string;
  category_answers: Record<string, string | number | boolean | null>;
  current_step: number;
  confirmed: boolean;
};

export type PublicOrderPayload = {
  order: {
    id: string;
    orderNumber: number;
    clientName: string;
    clientPhone: string;
    photoCount: number;
    status: string;
    identityPhotosReceived: boolean;
  };
  config: OrderConfigData;
  selections: Record<string, string[]>;
  catalog: CatalogItemPublic[];
};
