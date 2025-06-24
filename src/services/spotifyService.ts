import axios from "axios";
import {
  UserPreferences,
  SpotifyTrack,
  RecommendationResponse,
} from "../models/types";

const SPOTIFY_API = "https://api.spotify.com/v1";

export const getRecommendations = async (
  preferences: UserPreferences,
  userAccessToken: string
): Promise<RecommendationResponse> => {
  try {
    await checkTokenValidity(userAccessToken);

    if (preferences.recommendationType === "artists") {
      const artists = await searchArtistsByGenre(
        preferences.favoriteGenres,
        preferences.genreWeights || {},
        userAccessToken,
        preferences.minReleaseYear
      );

      return {
        artists: artists.slice(0, 10).map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          external_url: artist.external_urls.spotify,
          popularity: artist.popularity,
          image: artist.images[0]?.url || null,
        })),
        message: `Aqui estão alguns artistas recomendados para você enquanto ${preferences.currentActivity}`,
        genreWeights: preferences.genreWeights,
      };
    } else {
      const tracks = await searchTracksByGenre(
        preferences.favoriteGenres,
        preferences.genreWeights || {},
        userAccessToken,
        preferences.minReleaseYear
      );

      return {
        tracks: tracks.slice(0, 10).map((track: any) => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map((a: any) => a.name),
          album: track.album.name,
          preview_url: track.preview_url,
          external_url: track.external_urls.spotify,
          release_date: track.album.release_date,
          album_image: track.album.images[0]?.url || null,
        })),
        message: `Aqui estão algumas músicas recomendadas para você enquanto ${preferences.currentActivity}`,
        genreWeights: preferences.genreWeights,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar recomendações:", error);
    throw new Error("Falha ao obter recomendações do Spotify");
  }
};

async function searchTracksByGenre(
  genres: string[],
  weights: Record<string, number>,
  token: string,
  minYear?: number
): Promise<any[]> {
  const weightedGenres = genres.map((genre) => ({
    genre,
    weight: weights[genre] || 20,
  }));

  weightedGenres.sort((a, b) => b.weight - a.weight);

  const results: any[] = [];

  for (const { genre } of weightedGenres) {
    let query = `genre:"${genre}"`;
    if (minYear) {
      query += ` year:${minYear}-${new Date().getFullYear()}`;
    }

    try {
      const response = await axios.get(`${SPOTIFY_API}/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type: "track",
          limit: Math.floor(50 / genres.length),
        },
      });

      results.push(...response.data.tracks.items);
    } catch (error) {
      console.error(`Error searching for genre ${genre}:`, error);
    }
  }

  return results;
}

async function searchArtistsByGenre(
  genres: string[],
  weights: Record<string, number>,
  token: string,
  minYear?: number
): Promise<any[]> {
  const weightedGenres = genres.map((genre) => ({
    genre,
    weight: weights[genre] || 20,
  }));

  weightedGenres.sort((a, b) => b.weight - a.weight);

  const results: any[] = [];

  for (const { genre } of weightedGenres) {
    let query = `genre:"${genre}"`;
    if (minYear) {
      query += ` year:${minYear}-${new Date().getFullYear()}`;
    }

    try {
      const response = await axios.get(`${SPOTIFY_API}/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type: "artist",
          limit: Math.floor(50 / genres.length),
        },
      });

      results.push(...response.data.artists.items);
    } catch (error) {
      console.error(`Error searching for genre ${genre}:`, error);
    }
  }

  return results;
}

async function checkTokenValidity(token: string): Promise<void> {
  try {
    await axios.get(`${SPOTIFY_API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Token inválido:", error);
    throw new Error("Token de acesso inválido ou expirado");
  }
}
