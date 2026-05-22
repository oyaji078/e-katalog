-- AlterTable - Add slug column as nullable first
ALTER TABLE `product` ADD COLUMN `slug` VARCHAR(191) NULL;

-- Add index for slug lookups
CREATE INDEX `product_slug_idx` ON `product`(`slug`);

