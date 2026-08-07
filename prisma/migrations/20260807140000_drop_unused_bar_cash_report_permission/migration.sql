-- viewBarCashReport was modeled and toggleable in the permission
-- editor, but no route or page ever actually checked it (the real
-- bar sales report route uses viewBarSalesReport instead). Dropping
-- the dead column since the app no longer reads or writes it.
ALTER TABLE "AdminPermission" DROP COLUMN "viewBarCashReport";
