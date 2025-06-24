export interface UserPreferences {
  favoriteGenres: string[];
  currentActivity: string;
  recommendationType: "tracks" | "artists";
  minReleaseYear?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  preview_url: string | null;
  external_url: string;
  release_date: string;
  album_image: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  external_url: string;
  popularity?: number;
}

export interface RecommendationResponse {
  tracks?: SpotifyTrack[];
  artists?: SpotifyArtist[];
  message: string;
}
