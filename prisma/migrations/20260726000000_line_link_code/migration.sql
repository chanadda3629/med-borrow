-- CreateTable
CREATE TABLE "LineLinkAttempt" (
    "lineUserId" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineLinkAttempt_pkey" PRIMARY KEY ("lineUserId")
);
