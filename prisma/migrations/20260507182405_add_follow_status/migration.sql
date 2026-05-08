-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Follow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("followerId", "followingId"),
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Follow" ("createdAt", "followerId", "followingId") SELECT "createdAt", "followerId", "followingId" FROM "Follow";
DROP TABLE "Follow";
ALTER TABLE "new_Follow" RENAME TO "Follow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
