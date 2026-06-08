SET @addCategoryLogoUrl := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `Category` ADD COLUMN `logoUrl` TEXT NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Category'
    AND COLUMN_NAME = 'logoUrl'
);

PREPARE addCategoryLogoUrlStmt FROM @addCategoryLogoUrl;
EXECUTE addCategoryLogoUrlStmt;
DEALLOCATE PREPARE addCategoryLogoUrlStmt;
