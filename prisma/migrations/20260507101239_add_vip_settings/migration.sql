-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "gender" TEXT DEFAULT 'other',
    "age" INTEGER,
    "province" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "vipLevel" TEXT,
    "vipUntil" DATETIME,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showProfileFrame" BOOLEAN NOT NULL DEFAULT false,
    "profileFrameId" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("age", "avatar", "bio", "coins", "createdAt", "email", "gender", "id", "isOnline", "lastSeen", "latitude", "longitude", "nickname", "password", "province", "updatedAt", "username", "vipLevel", "vipUntil") SELECT "age", "avatar", "bio", "coins", "createdAt", "email", "gender", "id", "isOnline", "lastSeen", "latitude", "longitude", "nickname", "password", "province", "updatedAt", "username", "vipLevel", "vipUntil" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
