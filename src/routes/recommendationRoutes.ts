import { Router } from "express";
import {
  getQuestions,
  submitPreferences,
} from "../controllers/recommendationController";

const router = Router();

router.get("/questions", getQuestions);

router.post("/recommend", async (req, res, next) => {
  try {
    await submitPreferences(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
