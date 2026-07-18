-- AlterTable
ALTER TABLE "MedicalAssessment" ADD COLUMN     "assessorName" TEXT,
ADD COLUMN     "assessmentSummary" TEXT,
ADD COLUMN     "prescribedEquipment" JSONB,
ADD COLUMN     "equipmentNote" TEXT;
