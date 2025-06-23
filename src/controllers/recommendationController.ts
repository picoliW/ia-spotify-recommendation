import { Request, Response } from "express";
import { getRecommendations } from "../services/spotifyService";
import { UserPreferences } from "../models/types";

export const getQuestions = (req: Request, res: Response) => {
  const questions = [
    {
      id: "favoriteGenres",
      question: "Quais são seus gêneros musicais preferidos?",
      options: [
        "acoustic",
        "afrobeat",
        "alt-rock",
        "alternative",
        "ambient",
        "anime",
        "black-metal",
        "bluegrass",
        "blues",
        "bossanova",
        "brazil",
        "breakbeat",
        "british",
        "cantopop",
        "chicago-house",
        "children",
        "chill",
        "classical",
        "club",
        "comedy",
        "country",
        "dance",
        "dancehall",
        "death-metal",
        "deep-house",
        "detroit-techno",
        "disco",
        "disney",
        "drum-and-bass",
        "dub",
        "dubstep",
        "edm",
        "electro",
        "electronic",
        "emo",
        "folk",
        "forro",
        "french",
        "funk",
        "garage",
        "german",
        "gospel",
        "goth",
        "grindcore",
        "groove",
        "grunge",
        "guitar",
        "happy",
        "hard-rock",
        "hardcore",
        "hardstyle",
        "heavy-metal",
        "hip-hop",
        "holidays",
        "honky-tonk",
        "house",
        "idm",
        "indian",
        "indie",
        "indie-pop",
        "industrial",
        "iranian",
        "j-dance",
        "j-idol",
        "j-pop",
        "j-rock",
        "jazz",
        "k-pop",
        "kids",
        "latin",
        "latino",
        "malay",
        "mandopop",
        "metal",
        "metal-misc",
        "metalcore",
        "minimal-techno",
        "movies",
        "mpb",
        "new-age",
        "new-release",
        "opera",
        "pagode",
        "party",
        "philippines-opm",
        "piano",
        "pop",
        "pop-film",
        "post-dubstep",
        "power-pop",
        "progressive-house",
        "psych-rock",
        "punk",
        "punk-rock",
        "r-n-b",
        "rainy-day",
        "reggae",
        "reggaeton",
        "road-trip",
        "rock",
        "rock-n-roll",
        "rockabilly",
        "romance",
        "sad",
        "salsa",
        "samba",
        "sertanejo",
        "show-tunes",
        "singer-songwriter",
        "ska",
        "sleep",
        "songwriter",
        "soul",
        "soundtracks",
        "spanish",
        "study",
        "summer",
        "swedish",
        "synth-pop",
        "tango",
        "techno",
        "trance",
        "trip-hop",
        "turkish",
        "work-out",
        "world-music",
      ],
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
    const preferences: UserPreferences = {
      favoriteGenres: body.favoriteGenres,
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
