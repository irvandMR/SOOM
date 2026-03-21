
ALTER TABLE units
    ADD COLUMN IF NOT EXISTS base_unit VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS conversion_factor DECIMAL(10,4) NULL;

-- Berat → base: g
UPDATE units SET base_unit = 'g', conversion_factor = 1000    WHERE symbol = 'kg';
UPDATE units SET base_unit = 'g', conversion_factor = 1       WHERE symbol = 'g';
UPDATE units SET base_unit = 'g', conversion_factor = 0.001   WHERE symbol = 'mg';
UPDATE units SET base_unit = 'g', conversion_factor = 453.592 WHERE symbol = 'lb';

-- Volume → base: ml
UPDATE units SET base_unit = 'ml', conversion_factor = 1000   WHERE symbol = 'L';
UPDATE units SET base_unit = 'ml', conversion_factor = 1      WHERE symbol = 'mL';
UPDATE units SET base_unit = 'ml', conversion_factor = 236.588 WHERE symbol = 'cup';
UPDATE units SET base_unit = 'ml', conversion_factor = 15     WHERE symbol = 'sdm';
UPDATE units SET base_unit = 'ml', conversion_factor = 5      WHERE symbol = 'sdt';

-- Satuan → base: pcs
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'buah';
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'pcs';
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'porsi';

-- Produk jadi → base: pcs (user bisa edit faktornya)
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'pack';
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'box';
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'loyang';
UPDATE units SET base_unit = 'pcs', conversion_factor = 1     WHERE symbol = 'toples';
-- pack, box, loyang, toples → factor=1 dulu sebagai default
-- user bisa update sendiri via form unit (misal: 1 toples = 10 pcs)