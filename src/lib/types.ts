export interface Adventure {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  adventure_id: string;
  title: string;
  story_content: string | null;
  session_date_start: string | null;
  session_date_end: string | null;
  real_world_date: string | null;
  session_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  adventure_id: string;
  name: string;
  type: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  adventure_id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
