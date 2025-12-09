/*
  # Update Category Colors

  Updates the default categories to use the new color palette:
  - Regal Navy: #1e3f71
  - Deep Mocha: #493d45
  - Dust Grey: #d7d6cd
  - Dry Sage: #abad94
  - Raspberry Plum: #a13c87
*/

UPDATE categories SET color = '#1e3f71' WHERE name = 'Work';
UPDATE categories SET color = '#abad94' WHERE name = 'Personal';
UPDATE categories SET color = '#a13c87' WHERE name = 'Health';
UPDATE categories SET color = '#493d45' WHERE name = 'Learning';
UPDATE categories SET color = '#1e3f71' WHERE name = 'Shopping';
