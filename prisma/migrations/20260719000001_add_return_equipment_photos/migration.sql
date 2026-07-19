-- Store 1–3 equipment condition photos captured at return time.
-- The legacy single-photo columns remain populated with the first photo.
ALTER TABLE "BorrowingReturn"
  ADD COLUMN "equipmentPhotos" JSONB;

ALTER TABLE "EquipmentItemReturnHistory"
  ADD COLUMN "equipmentPhotos" JSONB;
