-- Phase 27: singleton web identity settings.

CREATE TABLE `SiteSetting` (
    `id` VARCHAR(191) NOT NULL,
    `singletonKey` VARCHAR(191) NOT NULL DEFAULT 'default',
    `siteName` VARCHAR(191) NOT NULL DEFAULT 'Rama Computer Katalog',
    `storeName` VARCHAR(191) NOT NULL DEFAULT 'Rama Komputer',
    `tagline` TEXT NOT NULL,
    `logoUrl` TEXT NULL,
    `faviconUrl` TEXT NULL,
    `primaryColor` VARCHAR(7) NOT NULL DEFAULT '#1A3D6A',
    `secondaryColor` VARCHAR(7) NOT NULL DEFAULT '#2E4E79',
    `accentColor` VARCHAR(7) NOT NULL DEFAULT '#C8A91E',
    `whatsappNumber` VARCHAR(32) NOT NULL DEFAULT '6280000000000',
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `googleMapsUrl` TEXT NULL,
    `businessHours` TEXT NULL,
    `footerDescription` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteSetting_singletonKey_key`(`singletonKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
