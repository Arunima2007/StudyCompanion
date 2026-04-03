import { ZodError } from "zod";

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed.",
      issues: error.issues
    });
  }

  res.status(500).json({
    message: "Something went wrong.",
    detail: process.env.NODE_ENV === "development" ? error.message : undefined
  });
}
