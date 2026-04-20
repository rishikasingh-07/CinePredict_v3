import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/**
 * POST /predict
 * @param {Object} movieData — all movie fields from the form
 * @returns {Promise<{score, category, category_color, breakdown, confidence}>}
 */
export async function predictMovie(movieData) {
  const { data } = await api.post("/predict", movieData);
  return data;
}

/**
 * POST /ai-feedback
 * @param {Object} movieData — the original form input
 * @param {Object} prediction — the result from predictMovie()
 * @returns {Promise<{success, source, suggestions}>}
 */
export async function getAIFeedback(movieData, prediction) {
  const { data } = await api.post("/ai-feedback", {
    movie: movieData,
    prediction,
  });
  return data;
}
