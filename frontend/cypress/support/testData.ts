export const credentials = {
  email: 'rizky@gmail.com',
  password: 'rizky123'
};

export const ingredients = [
  { name: 'Tepung Terigu', unit: 'Kilogram', qty: 2, total: 26000, category: 'Tepung' },
  { name: 'Blue Band', unit: 'Gram', qty: 800, total: 40000, category: 'Mentega/Margarin' },
  { name: 'Wisman', unit: 'Gram', qty: 454, total: 180000, category: 'Mentega/Margarin' },
  { name: 'Gula Halus', unit: 'Gram', qty: 250, total: 8000, category: 'Gula' },
  { name: 'Gula Pasir', unit: 'Kilogram', qty: 1, total: 18000, category: 'Gula' },
  { name: 'Meizena', unit: 'Gram', qty: 500, total: 20000, category: 'Tepung' },
  { name: 'Telor', unit: 'Pieces', qty: 30, total: 60000, category: 'Protein' },
  { name: 'Ragi Instan', unit: 'Pieces', qty: 2, total: 14000, category: 'Lain-lain' },
  { name: 'Mayonaise', unit: 'Kilogram', qty: 1, total: 24000, category: 'Lain-lain' },
  { name: 'Smoke Beef', unit: 'Gram', qty: 500, total: 70000, category: 'Protein' },
  { name: 'Minyak goreng', unit: 'Liter', qty: 2, total: 41000, category: 'Minyak' },
  { name: 'Selai nanas', unit: 'Kilogram', qty: 1.5, total: 73000, category: 'Lain-lain' },
  { name: 'susu uht', unit: 'Liter', qty: 1, total: 18000, category: 'Lain-lain' }
];

export const products = [
  {
    name: 'Nastar Original', type: 'MADE_TO_STOCK', cat: 'Kue Kering', unit: 'toples',
    recipe: [
      { ing: 'Tepung Terigu', qty: 500, unit: 'g' },
      { ing: 'Wisman', qty: 150, unit: 'g' },
      { ing: 'Blue Band', qty: 200, unit: 'g' },
      { ing: 'Telor', qty: 6, unit: 'pcs' },
      { ing: 'Gula Halus', qty: 100, unit: 'g' },
      { ing: 'Selai nanas', qty: 500, unit: 'g' }
    ],
    yield: 3 // 3 toples
  },
  {
    name: 'Donat Original', type: 'MADE_TO_ORDER', cat: 'Donat & Roti', unit: 'pcs',
    recipe: [
      { ing: 'Tepung Terigu', qty: 250, unit: 'g' },
      { ing: 'Telor', qty: 1, unit: 'pcs' },
      { ing: 'Blue Band', qty: 50, unit: 'g' },
      { ing: 'Gula Pasir', qty: 40, unit: 'g' },
      { ing: 'Minyak goreng', qty: 250, unit: 'ml' },
      { ing: 'Ragi Instan', qty: 0.5, unit: 'pcs' },
      { ing: 'susu uht', qty: 150, unit: 'ml' }
    ],
    yield: 25
  },
  {
    name: 'Risol Mayo', type: 'MADE_TO_ORDER', cat: 'Gorengan', unit: 'pcs',
    recipe: [
      { ing: 'Tepung Terigu', qty: 500, unit: 'g' },
      { ing: 'Telor', qty: 10, unit: 'pcs' },
      { ing: 'Minyak goreng', qty: 500, unit: 'ml' },
      { ing: 'Meizena', qty: 1, unit: 'sdm' },
      { ing: 'Smoke Beef', qty: 250, unit: 'g' },
      { ing: 'Mayonaise', qty: 1, unit: 'kg' }
    ],
    yield: 65
  }
];
