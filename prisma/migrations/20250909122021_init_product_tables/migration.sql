/*
  Warnings:

  - A unique constraint covering the columns `[productId,day]` on the table `Procurement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,day]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Procurement_productId_day_key" ON "Procurement"("productId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_productId_day_key" ON "Sale"("productId", "day");
