-- Phase 24 reopen: replace manual promo-banner voucher code with voucher id,
-- add flash-sale audience flags, and support audience-specific flash prices.

ALTER TABLE `PromoBanner`
  ADD COLUMN `linkType` ENUM('STANDALONE', 'VOUCHER') NOT NULL DEFAULT 'STANDALONE',
  ADD COLUMN `voucherId` VARCHAR(191) NULL;

SET @backfillPromoBannerVoucherId := (
  SELECT IF(
    COUNT(*) > 0,
    'UPDATE `PromoBanner` pb INNER JOIN `Voucher` v ON v.`code` = pb.`voucherCode` SET pb.`voucherId` = v.`id`, pb.`linkType` = ''VOUCHER'' WHERE pb.`voucherCode` IS NOT NULL AND pb.`voucherCode` <> ''''',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PromoBanner'
    AND COLUMN_NAME = 'voucherCode'
);
PREPARE backfillPromoBannerVoucherIdStmt FROM @backfillPromoBannerVoucherId;
EXECUTE backfillPromoBannerVoucherIdStmt;
DEALLOCATE PREPARE backfillPromoBannerVoucherIdStmt;

SET @dropPromoBannerVoucherCode := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `PromoBanner` DROP COLUMN `voucherCode`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PromoBanner'
    AND COLUMN_NAME = 'voucherCode'
);
PREPARE dropPromoBannerVoucherCodeStmt FROM @dropPromoBannerVoucherCode;
EXECUTE dropPromoBannerVoucherCodeStmt;
DEALLOCATE PREPARE dropPromoBannerVoucherCodeStmt;

CREATE INDEX `PromoBanner_voucherId_idx` ON `PromoBanner`(`voucherId`);

ALTER TABLE `FlashSale`
  ADD COLUMN `showForPublic` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `showForRetail` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `FlashSaleProduct`
  MODIFY `flashSalePrice` DECIMAL(14, 2) NULL,
  ADD COLUMN `flashSaleRetailPrice` DECIMAL(14, 2) NULL;
