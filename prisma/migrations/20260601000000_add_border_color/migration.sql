-- Add borderColor column to SiteSetting
ALTER TABLE SiteSetting ADD COLUMN borderColor VARCHAR(7) NOT NULL DEFAULT '#D2C4B4';
