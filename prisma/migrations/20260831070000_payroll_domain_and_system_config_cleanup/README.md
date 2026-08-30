# Deploy and rollback notes

Deploy after taking a database backup:

```bash
npx prisma migrate deploy
npx prisma generate
```

The migration preserves legacy `PAYROLL` payments and links each one to a
payroll snapshot. Positive cash records remain paid; zero-value monthly records
are reconstructed as unpaid entitlements using the migrated monthly rate. It
also copies the old monthly value from `dailyRate` to `monthlyRate` and removes
the unused `SystemConfig.imageUrl` column.

Rollback is intentionally manual because payment history must not be deleted.
Restore the pre-migration backup for a full rollback. For an application-only
rollback, deploy the previous application version while keeping the additive
Payroll tables/columns; do not drop migrated payroll or payment data.
