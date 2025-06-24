import { Request, Response } from "express";
import { getRecommendations } from "../services/spotifyService";
import { UserPreferences } from "../models/types";

const GENRE_WEIGHTS: Record<string, { min: number; max: number }> = {
  acoustic: { min: 5, max: 25 },
  afrobeat: { min: 10, max: 30 },
  "alt-rock": { min: 15, max: 35 },
  alternative: { min: 10, max: 30 },
  ambient: { min: 5, max: 25 },
  anime: { min: 10, max: 30 },
  "black-metal": { min: 15, max: 35 },
  bluegrass: { min: 10, max: 30 },
  blues: { min: 10, max: 30 },
  bossanova: { min: 5, max: 25 },
  brazil: { min: 10, max: 30 },
  breakbeat: { min: 15, max: 35 },
  british: { min: 10, max: 30 },
  cantopop: { min: 10, max: 30 },
  "chicago-house": { min: 15, max: 35 },
  children: { min: 5, max: 25 },
  chill: { min: 10, max: 30 },
  classical: { min: 10, max: 30 },
  club: { min: 15, max: 35 },
  comedy: { min: 5, max: 25 },
  country: { min: 10, max: 30 },
  dance: { min: 15, max: 35 },
  dancehall: { min: 10, max: 30 },
  "death-metal": { min: 15, max: 35 },
  "deep-house": { min: 10, max: 30 },
  "detroit-techno": { min: 15, max: 35 },
  disco: { min: 10, max: 30 },
  disney: { min: 5, max: 25 },
  "drum-and-bass": { min: 15, max: 35 },
  dub: { min: 10, max: 30 },
  dubstep: { min: 15, max: 35 },
  edm: { min: 15, max: 35 },
  electro: { min: 10, max: 30 },
  electronic: { min: 10, max: 30 },
  emo: { min: 10, max: 30 },
  folk: { min: 10, max: 30 },
  forro: { min: 10, max: 30 },
  french: { min: 10, max: 30 },
  funk: { min: 10, max: 30 },
  garage: { min: 10, max: 30 },
  german: { min: 10, max: 30 },
  gospel: { min: 10, max: 30 },
  goth: { min: 10, max: 30 },
  grindcore: { min: 15, max: 35 },
  groove: { min: 10, max: 30 },
  grunge: { min: 15, max: 35 },
  guitar: { min: 10, max: 30 },
  happy: { min: 5, max: 25 },
  "hard-rock": { min: 15, max: 35 },
  hardcore: { min: 15, max: 35 },
  hardstyle: { min: 15, max: 35 },
  "heavy-metal": { min: 15, max: 35 },
  "hip-hop": { min: 15, max: 35 },
  holidays: { min: 5, max: 25 },
  "honky-tonk": { min: 10, max: 30 },
  house: { min: 15, max: 35 },
  idm: { min: 10, max: 30 },
  indian: { min: 10, max: 30 },
  indie: { min: 10, max: 30 },
  "indie-pop": { min: 10, max: 30 },
  industrial: { min: 15, max: 35 },
  iranian: { min: 10, max: 30 },
  "j-dance": { min: 10, max: 30 },
  "j-idol": { min: 10, max: 30 },
  "j-pop": { min: 10, max: 30 },
  "j-rock": { min: 15, max: 35 },
  jazz: { min: 10, max: 30 },
  "k-pop": { min: 15, max: 35 },
  kids: { min: 5, max: 25 },
  latin: { min: 10, max: 30 },
  latino: { min: 10, max: 30 },
  malay: { min: 10, max: 30 },
  mandopop: { min: 10, max: 30 },
  metal: { min: 15, max: 35 },
  "metal-misc": { min: 15, max: 35 },
  metalcore: { min: 15, max: 35 },
  "minimal-techno": { min: 10, max: 30 },
  movies: { min: 5, max: 25 },
  mpb: { min: 10, max: 30 },
  "new-age": { min: 5, max: 25 },
  "new-release": { min: 10, max: 30 },
  opera: { min: 10, max: 30 },
  pagode: { min: 10, max: 30 },
  party: { min: 15, max: 35 },
  "philippines-opm": { min: 10, max: 30 },
  piano: { min: 5, max: 25 },
  pop: { min: 15, max: 35 },
  "pop-film": { min: 5, max: 25 },
  "post-dubstep": { min: 10, max: 30 },
  "power-pop": { min: 10, max: 30 },
  "progressive-house": { min: 15, max: 35 },
  "psych-rock": { min: 10, max: 30 },
  punk: { min: 15, max: 35 },
  "punk-rock": { min: 15, max: 35 },
  "r-n-b": { min: 10, max: 30 },
  "rainy-day": { min: 5, max: 25 },
  reggae: { min: 10, max: 30 },
  reggaeton: { min: 15, max: 35 },
  "road-trip": { min: 10, max: 30 },
  rock: { min: 15, max: 35 },
  "rock-n-roll": { min: 10, max: 30 },
  rockabilly: { min: 10, max: 30 },
  romance: { min: 5, max: 25 },
  sad: { min: 5, max: 25 },
  salsa: { min: 10, max: 30 },
  samba: { min: 10, max: 30 },
  sertanejo: { min: 30, max: 50 },
  "show-tunes": { min: 5, max: 25 },
  "singer-songwriter": { min: 10, max: 30 },
  ska: { min: 10, max: 30 },
  sleep: { min: 5, max: 25 },
  songwriter: { min: 10, max: 30 },
  soul: { min: 10, max: 30 },
  soundtracks: { min: 5, max: 25 },
  spanish: { min: 10, max: 30 },
  study: { min: 5, max: 25 },
  summer: { min: 10, max: 30 },
  swedish: { min: 10, max: 30 },
  "synth-pop": { min: 10, max: 30 },
  tango: { min: 10, max: 30 },
  techno: { min: 15, max: 35 },
  trance: { min: 15, max: 35 },
  "trip-hop": { min: 10, max: 30 },
  turkish: { min: 10, max: 30 },
  "work-out": { min: 15, max: 35 },
  "world-music": { min: 10, max: 30 },
};

export const getQuestions = (req: Request, res: Response) => {
  const questions = [
    {
      id: "favoriteGenres",
      question: "Quais são seus gêneros musicais preferidos? (Máximo 15)",
      options: Object.keys(GENRE_WEIGHTS),
      maxSelections: 15,
    },
    {
      id: "currentActivity",
      question: "O que você está fazendo agora?",
      options: [
        "Trabalhando",
        "Estudando",
        "Exercitando",
        "Relaxando",
        "Socializando",
      ],
    },
    {
      id: "recommendationType",
      question: "Você quer que recomende músicas ou artistas?",
      options: ["Músicas", "Artistas"],
    },
    {
      id: "minReleaseYear",
      question: "Deseja filtrar por ano mínimo de lançamento? (opcional)",
      type: "number",
      optional: true,
    },
  ];

  res.json(questions);
};

export const submitPreferences = async (req: Request, res: Response) => {
  try {
    const userToken = req.headers.authorization?.split(" ")[1];
    if (!userToken) {
      return res.status(401).json({
        error: "Autenticação necessária",
        authUrl: "/auth/login",
      });
    }

    const body = req.body;

    if (body.favoriteGenres && body.favoriteGenres.length > 15) {
      return res.status(400).json({
        error: "Por favor, selecione no máximo 15 gêneros musicais",
      });
    }

    const preferences: UserPreferences = {
      favoriteGenres: body.favoriteGenres,
      genreWeights: body.favoriteGenres?.reduce(
        (acc: Record<string, number>, genre: string) => {
          if (GENRE_WEIGHTS[genre]) {
            const { min, max } = GENRE_WEIGHTS[genre];
            acc[genre] = Math.floor(Math.random() * (max - min + 1)) + min;
          }
          return acc;
        },
        {}
      ),
      currentActivity: body.currentActivity,
      recommendationType:
        body.recommendationType === "Artistas" ? "artists" : "tracks",
      minReleaseYear: body.minReleaseYear
        ? parseInt(body.minReleaseYear)
        : undefined,
    };

    if (
      !preferences.favoriteGenres ||
      !preferences.currentActivity ||
      !preferences.recommendationType
    ) {
      return res.status(400).json({
        error: "Por favor, responda todas as perguntas obrigatórias",
      });
    }

    const recommendations = await getRecommendations(preferences, userToken);
    res.json(recommendations);
  } catch (error: any) {
    console.error("Erro detalhado:", error);

    if (error.message.includes("Token de acesso inválido")) {
      return res.status(401).json({
        error: "Token inválido ou expirado",
        authUrl: "/auth/login",
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        error: "Permissões insuficientes",
        solution: "Reautentique-se com escopos adicionais",
      });
    }

    res.status(500).json({
      error: "Erro ao processar suas preferências",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
