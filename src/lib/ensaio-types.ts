export type CatalogItemPublic = {
  id: string;
  imageUrl: string | null;
  sessionTypes: string[];
  peopleCount: number | null;
  gender: string | null;
  ambiance: string | null;
  style: string | null;
  vibe: string | null;
  hasCake?: boolean;
  hasAgeNumber?: boolean;
  tags?: string[];
  position: number;
};

export type CustomReference = {
  id: string;
  imageUrl: string;
  name?: string;
  createdAt?: string;
};

export type OrderConfigData = {
  session_type: string | null;
  session_subtype: string | null;
  framing: string | null;
  outfit_mode: string | null;
  makeup: string | null;
  /** Stores "manter" or a reference image ID */
  hair: string | null;
  color_palette: string | null;
  lighting_mood: string | null;
  visible_text_answer: string;
  special_notes: string;
  category_answers: Record<string, string | number | boolean | null>;
  custom_references?: CustomReference[];
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
