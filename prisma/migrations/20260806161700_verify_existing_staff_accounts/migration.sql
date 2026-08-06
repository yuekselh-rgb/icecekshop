-- Staff/dealer accounts created before admin/driver/dealer creation
-- started auto-verifying emails were left with emailVerified = false,
-- which blocks them from logging in with no way to self-serve a fix.
UPDATE "User"
SET "emailVerified" = true
WHERE "role" IN ('ADMIN', 'SUPER_ADMIN', 'DRIVER', 'DEALER')
  AND "emailVerified" = false;
