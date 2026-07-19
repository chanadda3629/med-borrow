-- Record who received the equipment when the loan (รอคืน) stage begins.
ALTER TABLE "BorrowingRequest"
  ADD COLUMN "receiverName" TEXT;
