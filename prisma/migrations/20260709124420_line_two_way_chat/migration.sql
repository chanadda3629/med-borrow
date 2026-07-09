-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "lineLinkedAt" TIMESTAMP(3),
ADD COLUMN     "lineUserId" TEXT;

-- CreateTable
CREATE TABLE "LineLinkToken" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineMessage" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "staffUserId" TEXT,
    "body" TEXT NOT NULL,
    "deliveryStatus" TEXT,
    "lineMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineLinkToken_patientId_key" ON "LineLinkToken"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "LineLinkToken_nonce_key" ON "LineLinkToken"("nonce");

-- CreateIndex
CREATE INDEX "LineMessage_patientId_createdAt_idx" ON "LineMessage"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_lineUserId_key" ON "Patient"("lineUserId");

-- AddForeignKey
ALTER TABLE "LineLinkToken" ADD CONSTRAINT "LineLinkToken_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineMessage" ADD CONSTRAINT "LineMessage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
