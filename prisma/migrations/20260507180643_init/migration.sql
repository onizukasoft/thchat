-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "id", "isRead", "receiverId", "senderId") SELECT "content", "createdAt", "id", "isRead", "receiverId", "senderId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
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
    "coverImage" TEXT,
    "relationship" TEXT DEFAULT 'single',
    "starScore" INTEGER NOT NULL DEFAULT 0,
    "voteMonthScore" INTEGER NOT NULL DEFAULT 0,
    "voteTotalScore" INTEGER NOT NULL DEFAULT 0,
    "vipLevel" TEXT,
    "vipUntil" DATETIME,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showProfileFrame" BOOLEAN NOT NULL DEFAULT false,
    "profileFrameId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("age", "avatar", "bio", "coins", "createdAt", "email", "gender", "id", "isOnline", "lastSeen", "latitude", "longitude", "nickname", "password", "profileFrameId", "province", "showOnlineStatus", "showProfileFrame", "updatedAt", "username", "vipLevel", "vipUntil") SELECT "age", "avatar", "bio", "coins", "createdAt", "email", "gender", "id", "isOnline", "lastSeen", "latitude", "longitude", "nickname", "password", "profileFrameId", "province", "showOnlineStatus", "showProfileFrame", "updatedAt", "username", "vipLevel", "vipUntil" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
