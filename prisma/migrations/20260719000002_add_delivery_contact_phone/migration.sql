-- Delivery contact phone (driver/staff reachable on delivery day). Captured as a
-- required field on the เตรียมจัดส่ง transition; surfaced in the delivery-completed
-- LINE notification so the patient/family has a number to call.
ALTER TABLE "BorrowingRequest"
  ADD COLUMN "deliveryContactPhone" VARCHAR(10);
