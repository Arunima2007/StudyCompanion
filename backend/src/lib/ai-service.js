import { env } from "../config/env.js";

export async function parsePdfWithAi(fileBuffer, fileName) {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: "application/pdf" });
  formData.append("file", blob, fileName);

  const response = await fetch(`${env.aiServiceUrl}/parse-pdf`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`AI PDF parsing failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateFlashcardsWithAi(input) {
  const response = await fetch(`${env.aiServiceUrl}/flashcards/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`AI flashcard generation failed with status ${response.status}`);
  }

  return response.json();
}

export async function reviewAnswerWithAi(input) {
  const response = await fetch(`${env.aiServiceUrl}/flashcards/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`AI review failed with status ${response.status}`);
  }

  return response.json();
}
