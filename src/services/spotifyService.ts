import axios from "axios";
import { 
  UserPreferences, 
  SpotifyTrack, 
  SpotifyArtist, 
  RecommendationResponse,
  AudioFeatures,
  ActivityParams,
  WeightedRecommendationOptions
} from "../models/types";

const SPOTIFY_API = "https://api.spotify.com/v1";

export const getRecommendations = async (
  preferences: UserPreferences,
  userAccessToken: string
): Promise<RecommendationResponse> => {
  try {
    await checkTokenValidity(userAccessToken);

    // 1. Processar gêneros por peso
    const sortedGenres = Object.entries(preferences.genreScores)
      .sort((a, b) => b[1] - a[1])
      .map(item => item[0]);

    // 2. Obter parâmetros baseados na atividade
    const activityParams = getActivityParams(preferences.currentActivity, preferences.activityScore);

    // 3. Adicionar parâmetros de gênero ponderados
    const recommendationOptions: WeightedRecommendationOptions = {
      seed_genres: sortedGenres.slice(0, 5), // Spotify aceita até 5 gêneros seed
      limit: 20,
      ...(preferences.minReleaseYear && { min_release_year: preferences.minReleaseYear }),
      ...activityParams
    };

    if (preferences.recommendationType === "artists") {
      return await handleArtistRecommendations(sortedGenres, userAccessToken, recommendationOptions, preferences);
    } else {
      return await handleTrackRecommendations(sortedGenres, userAccessToken, recommendationOptions, preferences);
    }
  } catch (error) {
    console.error("Erro ao buscar recomendações:", error);
    throw new Error("Falha ao obter recomendações do Spotify");
  }
};

// Função para recomendações de artistas
async function handleArtistRecommendations(
  genres: string[],
  token: string,
  options: WeightedRecommendationOptions,
  preferences: UserPreferences
): Promise<RecommendationResponse> {
  try {
    // 1. Buscar artistas por gênero
    const artists = await searchArtistsByGenre(genres[0], token, preferences.minReleaseYear);
    
    // 2. Ordenar por popularidade ajustada
    const sortedArtists = artists
      .map(artist => ({
        ...artist,
        weightedScore: (artist.popularity || 50) * preferences.activityScore
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore);

    // 3. Filtrar artistas relevantes
    const relevantArtists = sortedArtists.filter((artist: { genres: string[] }) => 
      artist.genres.some((genre: string) => genres.includes(genre))
    ).slice(0, 10);

    return {
      artists: relevantArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        external_url: artist.external_urls.spotify,
        popularity: artist.popularity,
      })),
      message: `Artistas recomendados para você enquanto ${preferences.currentActivity}`,
      metadata: {
        genreScores: preferences.genreScores,
        activityScore: preferences.activityScore,
        usedParameters: options
      }
    };
  } catch (error) {
    console.error("Erro na recomendação de artistas:", error);
    throw error;
  }
}

// Função para recomendações de músicas
async function handleTrackRecommendations(
  genres: string[],
  token: string,
  options: WeightedRecommendationOptions,
  preferences: UserPreferences
): Promise<RecommendationResponse> {
  try {
    // 1. Buscar recomendações com parâmetros ponderados
    const tracksResponse = await axios.get(`${SPOTIFY_API}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: options
    });

    // 2. Obter features de áudio para as tracks
    const trackIds = tracksResponse.data.tracks.map((track: any) => track.id).join(',');
    const audioFeaturesResponse = await axios.get(`${SPOTIFY_API}/audio-features`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { ids: trackIds }
    });

    // 3. Combinar dados das tracks com features de áudio
    const tracksWithFeatures = tracksResponse.data.tracks.map((track: any, index: number) => ({
      ...track,
      audio_features: audioFeaturesResponse.data.audio_features[index]
    }));

    // 4. Ordenar por adequação à atividade
    const sortedTracks = tracksWithFeatures
      .map((track: any) => ({
        ...track,
        activityMatchScore: calculateActivityMatchScore(track.audio_features, preferences.currentActivity)
      }))
      .sort((a: any, b: any) => b.activityMatchScore - a.activityMatchScore)
      .slice(0, 10);

    return {
      tracks: sortedTracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a: any) => a.name),
        album: track.album.name,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
        release_date: track.album.release_date,
        popularity: track.popularity,
        audio_features: track.audio_features
      })),
      message: `Músicas recomendadas para você enquanto ${preferences.currentActivity}`,
      metadata: {
        genreScores: preferences.genreScores,
        activityScore: preferences.activityScore,
        usedParameters: options
      }
    };
  } catch (error) {
    console.error("Erro na recomendação de músicas:", error);
    // Fallback para busca simples se a API de recomendações falhar
    return await fallbackTrackSearch(genres, token, preferences);
  }
}

// Fallback para busca de músicas
async function fallbackTrackSearch(
  genres: string[],
  token: string,
  preferences: UserPreferences
): Promise<RecommendationResponse> {
  console.log("Usando fallback para busca de músicas...");
  const tracks = await searchTracksByGenre(genres[0], token, preferences.minReleaseYear);
  
  return {
    tracks: tracks.slice(0, 10).map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name),
      album: track.album.name,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      release_date: track.album.release_date
    })),
    message: `Músicas no gênero ${genres[0]} (sistema alternativo)`
  };
}

// Função para calcular o score de adequação à atividade
function calculateActivityMatchScore(audioFeatures: AudioFeatures, activity: string): number {
  let score = 0;
  
  switch (activity) {
    case "Trabalhando":
      score = (1 - audioFeatures.energy) * 0.6 + audioFeatures.instrumentalness * 0.4;
      break;
    case "Estudando":
      score = audioFeatures.instrumentalness * 0.8 + (1 - audioFeatures.energy) * 0.2;
      break;
    case "Exercitando":
      score = audioFeatures.energy * 0.7 + audioFeatures.tempo / 200 * 0.3;
      break;
    case "Relaxando":
      score = (1 - audioFeatures.energy) * 0.5 + audioFeatures.valence * 0.5;
      break;
    case "Socializando":
      score = audioFeatures.valence * 0.6 + audioFeatures.danceability * 0.4;
      break;
    default:
      score = (audioFeatures.energy + audioFeatures.valence) / 2;
  }
  
  return score;
}

// Função para obter parâmetros baseados na atividade
function getActivityParams(activity: string, activityScore: number): ActivityParams {
  const params: ActivityParams = {};
  
  // Ajusta os parâmetros baseados na atividade e no score
  switch (activity) {
    case "Trabalhando":
      params.target_energy = 0.3 * activityScore;
      params.target_valence = 0.5 * activityScore;
      params.target_tempo = 90 + (20 * activityScore);
      params.max_energy = 0.6;
      params.min_instrumentalness = 0.3;
      break;
    case "Estudando":
      params.target_instrumentalness = 0.8 * activityScore;
      params.target_energy = 0.2 * activityScore;
      params.target_valence = 0.4 * activityScore;
      params.max_energy = 0.4;
      params.min_instrumentalness = 0.5;
      break;
    case "Exercitando":
      params.target_energy = 0.9 * activityScore;
      params.target_valence = 0.8 * activityScore;
      params.min_tempo = 120;
      params.min_energy = 0.7;
      break;
    case "Relaxando":
      params.target_energy = 0.2 * activityScore;
      params.target_valence = 0.6 * activityScore;
      params.max_tempo = 100;
      params.max_energy = 0.4;
      break;
    case "Socializando":
      params.target_energy = 0.7 * activityScore;
      params.target_valence = 0.8 * activityScore;
      params.target_popularity = 70;
      params.target_danceability = 0.7;
      break;
    default:
      params.target_energy = 0.5;
      params.target_valence = 0.5;
  }
  
  return params;
}

// Funções auxiliares para busca básica por gênero
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

// Verificar validade do token
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