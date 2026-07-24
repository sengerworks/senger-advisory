ALTER TABLE app_identity.collection_rounds
  ADD COLUMN display_label text;

UPDATE app_identity.collection_rounds
SET display_label = 'Organizational Capacity Collection'
WHERE display_label IS NULL;

ALTER TABLE app_identity.collection_rounds
  ALTER COLUMN display_label SET NOT NULL,
  ADD CONSTRAINT collection_round_display_label_length
    CHECK (char_length(display_label) BETWEEN 3 AND 120);
