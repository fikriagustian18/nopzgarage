-- Preserve the existing convention: MONTHLY values previously stored in dailyRate
-- are copied into the dedicated monthlyRate column.
ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "monthlyRate" DECIMAL(12, 2) NOT NULL DEFAULT 0;

UPDATE "Employee"
SET "monthlyRate" = "dailyRate"
WHERE "salaryType" = 'MONTHLY'
  AND "monthlyRate" = 0;

DO $$
BEGIN
  CREATE TYPE "PayrollStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Payroll" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "salaryType" "SalaryType" NOT NULL,
  "baseSalary" DECIMAL(12, 2) NOT NULL,
  "bonus" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "totalEarned" DECIMAL(12, 2) NOT NULL,
  "totalPaid" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "status" "PayrollStatus" NOT NULL DEFAULT 'UNPAID',
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payroll_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Payroll_employeeId_startDate_endDate_key"
  ON "Payroll"("employeeId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "Payroll_status_idx" ON "Payroll"("status");
CREATE INDEX IF NOT EXISTS "Payroll_startDate_endDate_idx" ON "Payroll"("startDate", "endDate");

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "payrollId" TEXT;
CREATE INDEX IF NOT EXISTS "Payment_payrollId_idx" ON "Payment"("payrollId");

DO $$
BEGIN
  ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_payrollId_fkey"
    FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Safely parse JSON notes used by the legacy payroll implementation. Plain-text
-- notes remain valid history and simply return NULL here.
CREATE OR REPLACE FUNCTION "_nopz_try_parse_jsonb"(input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN input::JSONB;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$;

-- Convert legacy PAYROLL payments into payroll snapshots without rewriting or
-- deleting cash history. A zero-value MONTHLY record represented the old bug,
-- not a cash payment; reconstruct its entitlement from monthlyRate as UNPAID.
INSERT INTO "Payroll" (
  "id", "employeeId", "startDate", "endDate", "salaryType",
  "baseSalary", "bonus", "totalEarned", "totalPaid", "status",
  "details", "createdAt", "updatedAt"
)
SELECT
  p."id",
  p."employeeId",
  COALESCE(
    (("_nopz_try_parse_jsonb"(p."note")->>'startDate')::TIMESTAMPTZ AT TIME ZONE 'UTC'),
    p."date"
  ),
  COALESCE(
    (("_nopz_try_parse_jsonb"(p."note")->>'endDate')::TIMESTAMPTZ AT TIME ZONE 'UTC'),
    p."date"
  ),
  e."salaryType",
  CASE
    WHEN p."amount" = 0 AND e."salaryType" = 'MONTHLY' THEN e."monthlyRate"
    ELSE p."amount"
  END,
  COALESCE(("_nopz_try_parse_jsonb"(p."note")->>'bonus')::DECIMAL, 0),
  CASE
    WHEN p."amount" = 0 AND e."salaryType" = 'MONTHLY'
      THEN e."monthlyRate" + COALESCE(("_nopz_try_parse_jsonb"(p."note")->>'bonus')::DECIMAL, 0)
    ELSE p."amount"
  END,
  p."amount",
  CASE
    WHEN p."amount" > 0 THEN 'PAID'::"PayrollStatus"
    ELSE 'UNPAID'::"PayrollStatus"
  END,
  p."note", p."createdAt", p."createdAt"
FROM "Payment" p
JOIN "Employee" e ON e."id" = p."employeeId"
WHERE p."type" = 'PAYROLL'
  AND p."employeeId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

DROP FUNCTION "_nopz_try_parse_jsonb"(TEXT);

UPDATE "Payment"
SET "payrollId" = "id"
WHERE "type" = 'PAYROLL'
  AND "payrollId" IS NULL
  AND EXISTS (SELECT 1 FROM "Payroll" WHERE "Payroll"."id" = "Payment"."id");

-- Refuse to discard unexpected data. Export/reconcile it before retrying.
DO $$
DECLARE
  has_image_data BOOLEAN := FALSE;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SystemConfig'
      AND column_name = 'imageUrl'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM "SystemConfig" WHERE "imageUrl" IS NOT NULL)'
      INTO has_image_data;
    IF has_image_data THEN
      RAISE EXCEPTION 'SystemConfig.imageUrl contains data; export/reconcile it before dropping the column';
    END IF;
  END IF;
END $$;

ALTER TABLE "SystemConfig" DROP COLUMN IF EXISTS "imageUrl";
