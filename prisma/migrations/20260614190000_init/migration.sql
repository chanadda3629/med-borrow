-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" VARCHAR(13) NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "phoneNumber" VARCHAR(10) NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "moo" TEXT,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,
    "postalCode" VARCHAR(5) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "googleMapsUrl" TEXT NOT NULL,
    "chronicDiseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "walkingAbility" TEXT NOT NULL,
    "selfCareAbility" TEXT NOT NULL,
    "patientCondition" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalAssessment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "chronicDiseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "walkingAbility" TEXT NOT NULL,
    "selfCareAbility" TEXT NOT NULL,
    "patientCondition" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "checklistAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "altText" TEXT,
    "patientId" TEXT,
    "borrowingRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "equipmentCode" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "currentLoanRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItemStatusHistory" (
    "id" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByUserId" TEXT,
    "note" TEXT,

    CONSTRAINT "EquipmentItemStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowingRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestedEquipmentType" TEXT NOT NULL,
    "aiRecommendationResult" JSONB,
    "assignedEquipmentItemId" TEXT,
    "workflowStatus" TEXT NOT NULL,
    "approvalDecision" TEXT,
    "deliveryStatus" TEXT,
    "dueOrReturnDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowingRequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByUserId" TEXT,
    "note" TEXT,

    CONSTRAINT "BorrowingRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowingReturn" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "receivingStaffName" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "damageNote" TEXT,
    "equipmentPhotoUrl" TEXT NOT NULL,
    "equipmentPhotoPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowingReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItemReturnHistory" (
    "id" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,
    "requestId" TEXT,
    "condition" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "receivingStaffName" TEXT NOT NULL,
    "damageNote" TEXT,
    "equipmentPhotoUrl" TEXT NOT NULL,
    "equipmentPhotoPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentItemReturnHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "requestId" TEXT,
    "channelType" TEXT NOT NULL,
    "channelValue" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceValue" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_nationalId_key" ON "Patient"("nationalId");

-- CreateIndex
CREATE INDEX "Patient_province_district_subdistrict_idx" ON "Patient"("province", "district", "subdistrict");

-- CreateIndex
CREATE INDEX "Patient_latitude_longitude_idx" ON "Patient"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalAssessment_patientId_key" ON "MedicalAssessment"("patientId");

-- CreateIndex
CREATE INDEX "MedicalAssessment_patientId_idx" ON "MedicalAssessment"("patientId");

-- CreateIndex
CREATE INDEX "MediaAsset_kind_idx" ON "MediaAsset"("kind");

-- CreateIndex
CREATE INDEX "MediaAsset_patientId_idx" ON "MediaAsset"("patientId");

-- CreateIndex
CREATE INDEX "MediaAsset_borrowingRequestId_idx" ON "MediaAsset"("borrowingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentItem_equipmentCode_key" ON "EquipmentItem"("equipmentCode");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentItem_assetNumber_key" ON "EquipmentItem"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentItem_currentLoanRequestId_key" ON "EquipmentItem"("currentLoanRequestId");

-- CreateIndex
CREATE INDEX "EquipmentItem_equipmentType_idx" ON "EquipmentItem"("equipmentType");

-- CreateIndex
CREATE INDEX "EquipmentItem_currentStatus_idx" ON "EquipmentItem"("currentStatus");

-- CreateIndex
CREATE INDEX "EquipmentItemStatusHistory_equipmentItemId_changedAt_idx" ON "EquipmentItemStatusHistory"("equipmentItemId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowingRequest_requestNumber_key" ON "BorrowingRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "BorrowingRequest_patientId_workflowStatus_idx" ON "BorrowingRequest"("patientId", "workflowStatus");

-- CreateIndex
CREATE INDEX "BorrowingRequest_assignedEquipmentItemId_idx" ON "BorrowingRequest"("assignedEquipmentItemId");

-- CreateIndex
CREATE INDEX "BorrowingRequest_requestedEquipmentType_idx" ON "BorrowingRequest"("requestedEquipmentType");

-- CreateIndex
CREATE INDEX "BorrowingRequestStatusHistory_requestId_changedAt_idx" ON "BorrowingRequestStatusHistory"("requestId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowingReturn_requestId_key" ON "BorrowingReturn"("requestId");

-- CreateIndex
CREATE INDEX "BorrowingReturn_equipmentItemId_returnDate_idx" ON "BorrowingReturn"("equipmentItemId", "returnDate");

-- CreateIndex
CREATE INDEX "EquipmentItemReturnHistory_equipmentItemId_returnDate_idx" ON "EquipmentItemReturnHistory"("equipmentItemId", "returnDate");

-- CreateIndex
CREATE INDEX "NotificationHistory_trigger_deliveryStatus_idx" ON "NotificationHistory"("trigger", "deliveryStatus");

-- CreateIndex
CREATE INDEX "NotificationHistory_patientId_requestId_idx" ON "NotificationHistory"("patientId", "requestId");

-- CreateIndex
CREATE INDEX "ReferenceValue_category_sortOrder_idx" ON "ReferenceValue"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceValue_category_code_key" ON "ReferenceValue"("category", "code");

-- AddForeignKey
ALTER TABLE "MedicalAssessment" ADD CONSTRAINT "MedicalAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_borrowingRequestId_fkey" FOREIGN KEY ("borrowingRequestId") REFERENCES "BorrowingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_currentLoanRequestId_fkey" FOREIGN KEY ("currentLoanRequestId") REFERENCES "BorrowingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentItemStatusHistory" ADD CONSTRAINT "EquipmentItemStatusHistory_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingRequest" ADD CONSTRAINT "BorrowingRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingRequest" ADD CONSTRAINT "BorrowingRequest_assignedEquipmentItemId_fkey" FOREIGN KEY ("assignedEquipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingRequestStatusHistory" ADD CONSTRAINT "BorrowingRequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BorrowingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingReturn" ADD CONSTRAINT "BorrowingReturn_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BorrowingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowingReturn" ADD CONSTRAINT "BorrowingReturn_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentItemReturnHistory" ADD CONSTRAINT "EquipmentItemReturnHistory_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentItemReturnHistory" ADD CONSTRAINT "EquipmentItemReturnHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BorrowingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationHistory" ADD CONSTRAINT "NotificationHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationHistory" ADD CONSTRAINT "NotificationHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BorrowingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
