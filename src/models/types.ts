export interface Question {
  id: string;
  question: string;
  options: string[];
  weights?: Record<string, number>;
  type?: string;
  optional?: boolean;
}

export interface UserPreferences {
  favoriteGenres: string[];
  currentActivity: string;
  recommendationType: "tracks" | "artists";
  minReleaseYear?: number;
  genreScores: Record<string, number>;
  activityScore: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  preview_url: string | null;
  external_url: string;
  release_date?: string;
  popularity?: number;
  audio_features?: AudioFeatures;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  external_url: string;
  popularity?: number;
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;
}

export interface RecommendationResponse {
  tracks?: SpotifyTrack[];
  artists?: SpotifyArtist[];
  message: string;
  metadata?: {
    genreScores?: Record<string, number>;
    activityScore?: number;
    usedParameters?: Record<string, any>;
  };
}

export interface ActivityParams {
  target_energy?: number;
  target_valence?: number;
  target_tempo?: number;
  min_tempo?: number;
  max_tempo?: number;
  target_instrumentalness?: number;
  target_popularity?: number;
  [key: string]: any;
}

export interface WeightedRecommendationOptions {
  seed_genres: string[];
  limit: number;
  min_release_year?: number;
  target_energy?: number;
  target_valence?: number;
  target_tempo?: number;
  min_tempo?: number;
  max_tempo?: number;
  target_instrumentalness?: number;
  target_popularity?: number;
}