-- CreateIndex
CREATE INDEX `Product_status_createdAt_idx` ON `Product`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Product_status_inquiryCount_clickCount_idx` ON `Product`(`status`, `inquiryCount`, `clickCount`);

-- CreateIndex
CREATE INDEX `Product_status_publicPrice_idx` ON `Product`(`status`, `publicPrice`);

-- CreateIndex
CREATE INDEX `Product_categoryId_status_idx` ON `Product`(`categoryId`, `status`);

-- CreateIndex
CREATE INDEX `Product_brandId_status_idx` ON `Product`(`brandId`, `status`);
