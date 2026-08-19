export type CatalogItemPublic = {
  id: string;
  imageUrl: string | null;
  sessionTypes: string[];
  sessionSubtypes?: string[];
  peopleCount: number | null;
  gender: string | null;
  ambiance?: string | null;
  style?: string | null;
  vibe?: string | null;
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
  /** Stores reference ID of the chosen outfit when outfit_mode === 'fixa' */
  outfit_reference_id?: string | null;
  /** Stores reference IDs of chosen outfits when outfit_mode === 'variar' */
  outfit_reference_ids?: string[];
  /** Stores 'fixo' | 'variar' */
  scenario_mode?: string | null;
  /** Stores reference ID of the chosen scenario when scenario_mode === 'fixo' */
  scenario_reference_id?: string | null;
  /** Stores reference IDs of chosen scenarios when scenario_mode === 'variar' */
  scenario_reference_ids?: string[];
  makeup: string | null;
  /** Stores "manter" or a reference image ID */
  hair: string | null;
  /** Stores expression code e.g. "sorrindo-suave", "sorrindo-dentes", "serio", "variar" */
  expression?: string | null;
  color_palette: string | null;
  lighting_mood: string | null;
  visible_text_answer: string;
  special_notes: string;
  category_answers: Record<string, string | number | boolean | null | string[]>;
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
