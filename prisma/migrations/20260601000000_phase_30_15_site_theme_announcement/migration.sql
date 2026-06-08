-- Phase 30.15: dark premium 60/30/10 theme fields and public announcement settings.

ALTER TABLE `SiteSetting`
  ADD COLUMN `textColor` VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN `mutedColor` VARCHAR(7) NOT NULL DEFAULT '#A1A1AA',
  ADD COLUMN `whatsappColor` VARCHAR(7) NOT NULL DEFAULT '#25D366',
  ADD COLUMN `announcementEnabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `announcementText` TEXT NULL,
  ADD COLUMN `announcementSpeed` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `announcementLink` TEXT NULL;

ALTER TABLE `SiteSetting`
  MODIFY `primaryColor` VARCHAR(7) NOT NULL DEFAULT '#0A0A0A',
  MODIFY `secondaryColor` VARCHAR(7) NOT NULL DEFAULT '#141414',
  MODIFY `accentColor` VARCHAR(7) NOT NULL DEFAULT '#C41E3A';

UPDATE `SiteSetting`
SET
  `primaryColor` = CASE WHEN UPPER(`primaryColor`) = '#1A3D6A' THEN '#0A0A0A' ELSE `primaryColor` END,
  `secondaryColor` = CASE WHEN UPPER(`secondaryColor`) = '#2E4E79' THEN '#141414' ELSE `secondaryColor` END,
  `accentColor` = CASE WHEN UPPER(`accentColor`) = '#C8A91E' THEN '#C41E3A' ELSE `accentColor` END,
  `announcementText` = COALESCE(`announcementText`, 'Katalog komputer dan aksesoris premium - cek stok dan konsultasi via WhatsApp');
