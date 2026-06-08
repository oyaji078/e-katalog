-- Performance indexes for retail-user filtering and public voucher window queries.
-- Hand-authored and applied via `prisma migrate deploy`: the legacy migration
-- history is not cleanly replayable on a shadow database (so `migrate dev` fails
-- on an unrelated pre-existing migration). SQL generated via `prisma migrate diff`.

-- CreateIndex
CREATE INDEX `Voucher_isActive_status_startsAt_endsAt_idx` ON `Voucher`(`isActive`, `status`, `startsAt`, `endsAt`);

-- CreateIndex
CREATE INDEX `user_retailStatus_idx` ON `user`(`retailStatus`);
