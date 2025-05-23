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
        preferences.favoriteGenres[0],
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
        })),
        message: `Aqui estão alguns artistas recomendados para você enquanto ${preferences.currentActivity}`,
      };
    } else {
      const tracks = await searchTracksByGenre(
        preferences.favoriteGenres[0],
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
        })),
        message: `Aqui estão algumas músicas recomendadas para você enquanto ${preferences.currentActivity}`,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar recomendações:", error);
    throw new Error("Falha ao obter recomendações do Spotify");
  }
};

async function searchTracksByGenre(
  genre: string,
  token: string,
  minYear?: number
): Promise<any[]> {
  let query = `genre:"${genre}"`;
  if (minYear) {
    query += ` year:${minYear}-${new Date().getFullYear()}`;
  }

  const response = await axios.get(`${SPOTIFY_API}/search`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: query,
      type: "track",
      limit: 50,
    },
  });

  return response.data.tracks.items;
}

async function searchArtistsByGenre(
  genre: string,
  token: string,
  minYear?: number
): Promise<any[]> {
  let query = `genre:"${genre}"`;
  if (minYear) {
    query += ` year:${minYear}-${new Date().getFullYear()}`;
  }

  const response = await axios.get(`${SPOTIFY_API}/search`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: query,
      type: "artist",
      limit: 50,
    },
  });

  return response.data.artists.items;
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
