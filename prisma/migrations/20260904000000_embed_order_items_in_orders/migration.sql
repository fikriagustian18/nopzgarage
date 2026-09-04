-- Move the normalized OrderItem rows into Order.items before removing the
-- legacy table. Orders that have no OrderItem rows retain their existing JSON.
DO $$
BEGIN
  IF to_regclass('"OrderItem"') IS NOT NULL THEN
    UPDATE "Order" AS target
    SET "items" = migrated."items"
    FROM (
      SELECT
        item."orderId",
        jsonb_agg(
          jsonb_strip_nulls(
            jsonb_build_object(
              'id', item."id",
              'type', CASE lower(item."itemType")
                WHEN 'sparepart' THEN 'part'
                WHEN 'internal_fee' THEN 'fee'
                ELSE lower(item."itemType")
              END,
              'name', item."itemName",
              'qty', item."quantity",
              'price', item."unitPrice",
              'totalPrice', item."totalPrice",
              'sparePartId', item."sparePartId",
              'employeeId', item."employeeId",
              'employeeName', employee."name",
              'isPaid', item."isPaid"
            )
          )
          ORDER BY item."createdAt", item."id"
        ) AS "items"
      FROM "OrderItem" AS item
      LEFT JOIN "Employee" AS employee ON employee."id" = item."employeeId"
      GROUP BY item."orderId"
    ) AS migrated
    WHERE target."id" = migrated."orderId";

    -- Abort instead of dropping data if an order received an incomplete JSON
    -- array for any reason.
    IF EXISTS (
      SELECT 1
      FROM (
        SELECT "orderId", count(*) AS "itemCount"
        FROM "OrderItem"
        GROUP BY "orderId"
      ) AS expected
      JOIN "Order" AS target ON target."id" = expected."orderId"
      WHERE jsonb_typeof(target."items") <> 'array'
         OR jsonb_array_length(target."items") <> expected."itemCount"
    ) THEN
      RAISE EXCEPTION 'OrderItem migration verification failed; legacy table was not dropped';
    END IF;

    DROP TABLE "OrderItem";
  END IF;
END $$;

-- Keep lookups by embedded sparePartId/employeeId efficient after removing
-- the relational indexes from OrderItem.
CREATE INDEX IF NOT EXISTS "Order_items_idx" ON "Order" USING GIN ("items");
