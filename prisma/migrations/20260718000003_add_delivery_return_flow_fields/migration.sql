-- Add delivery / approval / return workflow fields to BorrowingRequest.
ALTER TABLE "BorrowingRequest"
  ADD COLUMN "approverName" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "requestDetail" TEXT,
  ADD COLUMN "deliveryDate" TIMESTAMP(3),
  ADD COLUMN "delivererName" TEXT,
  ADD COLUMN "loanDetail" TEXT,
  ADD COLUMN "receivedDate" TIMESTAMP(3);
