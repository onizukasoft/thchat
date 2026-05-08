-- Add per-post pin flag for profile ordering.
ALTER TABLE "Post" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
