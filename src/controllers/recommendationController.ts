import { Request, Response } from "express";
import { getRecommendations } from "../services/spotifyService";
import { UserPreferences } from "../models/types";

const genreWeights: Record<string, [number, number]> = {
  brazil: [0, 20],
  rock: [10, 30],
  anime: [5, 25],
  ambient: [0, 15],
  funk: [10, 30],
  chill: [0, 20],
  "k-pop": [5, 25],
  indie: [10, 30],
  pop: [10, 30],
  "hip-hop": [10, 30],
  sertanejo: [15, 35],
};

const relevantGenres = Object.keys(genreWeights);

export const getQuestions = (req: Request, res: Response) => {
  const questions = [
    {
      id: "favoriteGenres",
      question: "Quais são seus gêneros musicais preferidos?",
      options: relevantGenres,
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

    const {
      favoriteGenres,
      currentActivity,
      recommendationType,
      minReleaseYear,
    } = req.body;

    if (!favoriteGenres || !currentActivity || !recommendationType) {
      return res.status(400).json({
        error: "Por favor, responda todas as perguntas obrigatórias",
      });
    }

    const genreScores: Record<string, number> = {};
    relevantGenres.forEach((g) => (genreScores[g] = 0));

    for (const genre of favoriteGenres) {
      if (genre in genreScores) {
        const [min, max] = genreWeights[genre];
        genreScores[genre] += (min + max) / 2;
      }
    }

    switch (currentActivity) {
      case "Trabalhando":
        genreScores.chill += 10;
        genreScores.ambient += 10;
        break;
      case "Estudando":
        genreScores.ambient += 15;
        genreScores.chill += 10;
        break;
      case "Exercitando":
        genreScores["hip-hop"] += 15;
        genreScores.funk += 10;
        break;
      case "Relaxando":
        genreScores.chill += 15;
        genreScores.indie += 5;
        break;
      case "Socializando":
        genreScores.pop += 10;
        genreScores["k-pop"] += 5;
        break;
    }

    const sortedGenres = Object.entries(genreScores)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3);

    const preferences: UserPreferences = {
      favoriteGenres: sortedGenres,
      currentActivity,
      recommendationType:
        recommendationType === "Artistas" ? "artists" : "tracks",
      minReleaseYear: minReleaseYear ? parseInt(minReleaseYear) : undefined,
    };

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
