import { Request, Response } from "express";
import { getRecommendations } from "../services/spotifyService";
import { UserPreferences, Question } from "../models/types";

export const getQuestions = (req: Request, res: Response) => {
  const questions: Question[] = [
    {
      id: "favoriteGenres",
      question: "Quais são seus gêneros musicais preferidos?",
      options: [
        "pop", "rock", "hip-hop", "electronic", "jazz", 
        "classical", "reggae", "country", "metal", "r-n-b"
      ],
      weights: {
        "pop": 1.0,
        "rock": 0.9,
        "hip-hop": 0.8,
        "electronic": 0.7,
        "jazz": 0.6,
        "classical": 0.5,
        "reggae": 0.4,
        "country": 0.3,
        "metal": 0.2,
        "r-n-b": 0.1
      }
    },
    {
      id: "currentActivity",
      question: "O que você está fazendo agora?",
      options: [
        "Trabalhando",
        "Estudando",
        "Exercitando",
        "Relaxando",
        "Socializando"
      ],
      weights: {
        "Trabalhando": 0.5,  // Músicas mais calmas
        "Estudando": 0.4,    // Instrumentais
        "Exercitando": 0.9,  // Músicas animadas
        "Relaxando": 0.3,    // Músicas suaves
        "Socializando": 0.7  // Músicas populares
      }
    },
    {
      id: "recommendationType",
      question: "Você quer que recomende músicas ou artistas?",
      options: ["Músicas", "Artistas"]
    },
  {
    id: "minReleaseYear",
    question: "Deseja filtrar por ano mínimo de lançamento? (opcional)",
    type: "number",
    optional: true,
    options: [] // Array vazio já que é um input numérico
  }
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
    
    // Calcular scores baseados nos pesos
    const genreScores: Record<string, number> = {};
    if (body.favoriteGenres) {
      const questions = getQuestions({} as Request, {} as Response);
      const genreQuestion = (questions as any).find((q: any) => q.id === "favoriteGenres");
      
      body.favoriteGenres.forEach((genre: string) => {
        genreScores[genre] = genreQuestion.weights?.[genre] || 0.5;
      });
    }

    const activityQuestion = (getQuestions({} as Request, {} as Response) as any)
      .find((q: any) => q.id === "currentActivity");
    const activityScore = activityQuestion.weights?.[body.currentActivity] || 0.5;

    const preferences: UserPreferences = {
      favoriteGenres: body.favoriteGenres,
      currentActivity: body.currentActivity,
      recommendationType: body.recommendationType === "Artistas" ? "artists" : "tracks",
      minReleaseYear: body.minReleaseYear ? parseInt(body.minReleaseYear) : undefined,
      genreScores,
      activityScore
    };

    if (!preferences.favoriteGenres || !preferences.currentActivity || !preferences.recommendationType) {
      return res.status(400).json({
        error: "Por favor, responda todas as perguntas obrigatórias",
      });
    }

    const recommendations = await getRecommendations(preferences, userToken);
    res.json(recommendations);
  } catch (error: any) {
    console.error("Erro detalhado:", error);
    res.status(500).json({
      error: "Erro ao processar suas preferências",
      details: error.message,
    });
  }
};