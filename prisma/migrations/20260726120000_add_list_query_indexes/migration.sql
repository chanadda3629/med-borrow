-- Indexes for the hot list/dashboard queries.
--
-- BorrowingRequest is read on every navigation: the /requests list filters on
-- workflowStatus and orders by createdAt, the dashboard counts by
-- workflowStatus, and the due-soon card orders by dueOrReturnDate within the
-- active-loan statuses. Without these each of those is a sequential scan.

-- /requests filtered by status, newest first
CREATE INDEX IF NOT EXISTS "BorrowingRequest_workflowStatus_createdAt_idx"
  ON "BorrowingRequest" ("workflowStatus", "createdAt");

-- /requests with no status filter — ordering only
CREATE INDEX IF NOT EXISTS "BorrowingRequest_createdAt_idx"
  ON "BorrowingRequest" ("createdAt");

-- dashboard due-soon list + overdue count
CREATE INDEX IF NOT EXISTS "BorrowingRequest_workflowStatus_dueOrReturnDate_idx"
  ON "BorrowingRequest" ("workflowStatus", "dueOrReturnDate");

-- /inventory filtered by type and status together; also backs the reports groupBy
CREATE INDEX IF NOT EXISTS "EquipmentItem_equipmentType_currentStatus_idx"
  ON "EquipmentItem" ("equipmentType", "currentStatus");
