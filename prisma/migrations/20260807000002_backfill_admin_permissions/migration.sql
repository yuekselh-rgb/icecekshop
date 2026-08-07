-- Admins created before AdminPermission rows were eagerly created at
-- admin-creation time were left with no row at all, which
-- getAdminWithPermissions() treats as "every permission false" —
-- even though the schema's own defaults imply baseline view access.
INSERT INTO "AdminPermission" ("id", "userId", "viewProducts", "viewCategories", "viewStock", "viewOrders")
SELECT gen_random_uuid()::text, u.id, true, true, true, true
FROM "User" u
LEFT JOIN "AdminPermission" ap ON ap."userId" = u.id
WHERE u.role = 'ADMIN' AND ap.id IS NULL;
