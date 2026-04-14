ALTER TABLE "FlashCard" DROP COLUMN IF EXISTS "difficultyLabel";
ALTER TABLE "ReviewAttempt" DROP COLUMN IF EXISTS "difficultyLabel";
DROP TYPE IF EXISTS "DifficultyLabel";
