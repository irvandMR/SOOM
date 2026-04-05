describe('SOOM Complete Business Flow', () => {
  const credentials = {
    email: 'rizky@gmail.com',
    password: 'rizky123'
  };

  const ingredients = [
    // Tepung & Gandum
    { name: 'Tepung Terigu Pro Tinggi', unit: 'Kilogram', qty: 10, total: 130000, category: 'Tepung & Gandum' },
    { name: 'Tepung Maizena', unit: 'Gram', qty: 500, total: 15000, category: 'Tepung & Gandum' },
    
    // Beras & Serealia
    { name: 'Beras Pandan Wangi', unit: 'Kilogram', qty: 25, total: 375000, category: 'Beras & Serealia' },
    { name: 'Ketan Putih', unit: 'Kilogram', qty: 5, total: 75000, category: 'Beras & Serealia' },
    
    // Produk Susu & Telur
    { name: 'Susu UHT Full Cream', unit: 'Liter', qty: 12, total: 216000, category: 'Produk Susu & Telur' },
    { name: 'Keju Cheddar', unit: 'Gram', qty: 2000, total: 180000, category: 'Produk Susu & Telur' },
    { name: 'Telor Ayam Negeri', unit: 'Pieces', qty: 90, total: 165000, category: 'Produk Susu & Telur' },
    { name: 'Mentega Wisman', unit: 'Gram', qty: 454, total: 180000, category: 'Produk Susu & Telur' },
    
    // Sayur & Jamur
    { name: 'Bawang Merah Besar', unit: 'Kilogram', qty: 2, total: 70000, category: 'Sayur & Jamur' },
    { name: 'Bawang Putih Kating', unit: 'Kilogram', qty: 2, total: 60000, category: 'Sayur & Jamur' },
    { name: 'Cabai Rawit Merah', unit: 'Kilogram', qty: 1, total: 55000, category: 'Sayur & Jamur' },
    
    // Minyak & Lemak
    { name: 'Minyak Goreng Sawit', unit: 'Liter', qty: 10, total: 190000, category: 'Minyak & Lemak' },
    { name: 'Margarin Blue Band', unit: 'Gram', qty: 2000, total: 95000, category: 'Minyak & Lemak' },
    
    // Bahan Kue & Pemanis
    { name: 'Gula Pasir Kristal', unit: 'Kilogram', qty: 10, total: 170000, category: 'Bahan Kue & Pemanis' },
    { name: 'Gula Halus Rosbrand', unit: 'Gram', qty: 1000, total: 25000, category: 'Bahan Kue & Pemanis' },
    { name: 'Ragi Instan Fermipan', unit: 'Pieces', qty: 5, total: 35000, category: 'Bahan Kue & Pemanis' },
    
    // Saus & Kondimen
    { name: 'Mayonaise Maestro', unit: 'Kilogram', qty: 3, total: 72000, category: 'Saus & Kondimen' },
    { name: 'Saos Sambal ABC', unit: 'Liter', qty: 2, total: 40000, category: 'Saus & Kondimen' },
    
    // Rempah & Bumbu
    { name: 'Garam Dapur', unit: 'Pieces', qty: 10, total: 20000, category: 'Rempah & Bumbu' },
    { name: 'Merica Bubuk Ladaku', unit: 'Pieces', qty: 20, total: 30000, category: 'Rempah & Bumbu' },
    
    // Buah & Umbi
    { name: 'Selai Nanas Homemade', unit: 'Kilogram', qty: 5, total: 250000, category: 'Buah & Umbi' },
    { name: 'Kentang Dieng', unit: 'Kilogram', qty: 5, total: 90000, category: 'Buah & Umbi' }
  ];

  beforeEach(() => {
    // 1. LOGIN
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();

    // Tunggu sampai Dashboard benar-benar termuat untuk memastikan login sukses
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
  });

  it('Executes full business flow: Categories -> Ingredients -> Products -> Recipes -> Production -> Order', () => {
    // ── STEP 0: UNIT SETUP ──────────────────────────────────────────────────
    cy.contains('Units').click();
    const unitList = [
      { name: 'Kilogram', symbol: 'Kg' },
      { name: 'Gram', symbol: 'g' },
      { name: 'Pieces', symbol: 'Pcs' },
      { name: 'Mililiter', symbol: 'ml' },
      { name: 'Liter', symbol: 'L' },
      { name: 'Toples', symbol: 'Tpls' }
    ];

    unitList.forEach(unit => {
      cy.get('input[placeholder*="Cari nama atau simbol"]').clear({ force: true }).type(unit.name);
      cy.wait(500);
      cy.get('table').then(($table) => {
        if ($table.text().includes(unit.name)) {
          cy.log(`Unit ${unit.name} already exists.`);
        } else {
          cy.contains('button', 'Tambah Unit').filter(':visible').click();
          cy.get('.p-dialog').should('be.visible').within(() => {
            cy.get('input[placeholder*="Nama"]').type(unit.name);
            cy.get('input[placeholder*="Simbol"]').type(unit.symbol);
            cy.contains('button', 'Simpan').click();
          });
          cy.get('.p-dialog').should('not.exist');
        }
      });
    });
    cy.contains('button', 'Reset').filter(':visible').click();

    // ── STEP 1: CATEGORY SETUP ──────────────────────────────────────────
    cy.contains('Kategori').click();
    
    // Pastikan filter dalam kondisi bersih (opsional jika tombol muncul)
    cy.get('body').then(($body) => {
      if ($body.text().includes('Reset')) {
        cy.contains('Reset').click();
      }
    });
    cy.wait(500);
    
    const categories = [
      { name: 'Tepung & Gandum', type: 'Ingredient' },
      { name: 'Beras & Serealia', type: 'Ingredient' },
      { name: 'Produk Susu & Telur', type: 'Ingredient' },
      { name: 'Sayur & Jamur', type: 'Ingredient' },
      { name: 'Minyak & Lemak', type: 'Ingredient' },
      { name: 'Bahan Kue & Pemanis', type: 'Ingredient' },
      { name: 'Saus & Kondimen', type: 'Ingredient' },
      { name: 'Rempah & Bumbu', type: 'Ingredient' },
      { name: 'Buah & Umbi', type: 'Ingredient' },
      { name: 'Kue Kering', type: 'Product' },
      { name: 'Snack Box', type: 'Product' }
    ];

    categories.forEach(cat => {
      // Cari kategori spesifik lewat kotak pencarian untuk memastikan ia terdeteksi (meskipun di halaman lain)
      cy.get('input[placeholder*="Cari nama kategori"]').clear().type(cat.name);
      cy.wait(300); // Tunggu filter beraksi

      cy.get('table').then(($table) => {
        if ($table.text().includes(cat.name)) {
          cy.log(`Category ${cat.name} already exists.`);
        } else {
          cy.contains('button', 'Tambah Kategori').filter(':visible').click();
          
          // Gunakan within agar Cypress hanya mencari di dalam Modal yang terbuka
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('input[placeholder*="Contoh: Tepung"]').type(cat.name);
            cy.get('.p-dropdown').click();
          });
          
          // Pilih item dropdown di luar .within jika ia dirender di body (Portal)
          cy.contains('.p-dropdown-item', cat.type).click();
          
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.contains('button', 'Simpan').click();
          });
          
          cy.wait(1000);
        }
      });
    });

    // Reset filter
    cy.contains('button', 'Reset').filter(':visible').click();

    // Reset filter setelah selesai agar langkah selanjutnya tidak terganggu
    cy.get('body').then(($body) => {
      if ($body.text().includes('Reset')) {
        cy.contains('Reset').click();
      }
    });

    // ── STEP 2: INGREDIENTS & STOCK IN ─────────────────────────────────────
    cy.contains('Stok Bahan Baku').click();
    ingredients.forEach(ing => {
      // ── CARI DULU UNTUK CEK KEBERADAAN ──
      cy.get('input[placeholder*="Cari nama bahan"]').clear({ force: true }).type(ing.name);
      cy.wait(500);

      cy.get('table').then(($table) => {
        if ($table.text().includes(ing.name)) {
          cy.log(`Ingredient ${ing.name} already exists. Skipping creation.`);
        } else {
          // Buat baru jika belum ada
          cy.contains('button', 'Tambah Bahan Baku').filter(':visible').click();
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('input[placeholder*="Tepung"]').clear().type(ing.name);
            cy.get('.p-dropdown').eq(0).click();
          });
          cy.contains('.p-dropdown-item', ing.category).click();
          
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('.p-dropdown').eq(1).click();
          });
          cy.contains('.p-dropdown-item', ing.unit).click();
          
          // ── AUTO CALCULATE MIN STOCK (5% OF QTY) ──
          const minStock = ing.qty * 0.05;
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('.p-inputnumber-input').clear().type(minStock.toString());
            cy.contains('button', 'Simpan').click();
          });
          // Tunggu sampai modal benar-benar hilang agar tidak menghalangi elemen lain
          cy.get('.p-dialog').should('not.exist');
          
          // Cari ulang agar barisnya muncul (mengatasi paginasi)
          cy.get('input[placeholder*="Cari nama bahan"]').clear({ force: true }).type(ing.name);
          cy.wait(300);
        }
      });

      // ── TAMBAH STOK ──
      // Cari sel TD yang isinya persis nama bahan, lalu klik tombol Stok di baris tersebut
      cy.get('td').contains(new RegExp(`^${ing.name}$`)).closest('tr').contains('button', 'Stok').click();
      
      cy.get('.p-dialog').filter(':visible').within(() => {
        cy.get('.p-inputnumber-input').eq(0).click().type('{selectall}{backspace}').type(ing.qty.toString());
        cy.get('.p-inputnumber-input').eq(1).click().type('{selectall}{backspace}').type(ing.total.toString());
        cy.contains('button', 'Tambah Stok').click();
      });
      cy.get('.p-dialog').should('not.exist');
      cy.wait(500);
    });

    // ── STEP 3: PRODUCTS & RECIPES ──────────────────────────────────────────
    cy.contains('Produk & Resep').click();

    const products = [
      {
        name: 'Nastar Toples 500g', type: 'Made to Stock', cat: 'Kue Kering', unit: 'Toples',
        recipe: [
          { ing: 'Tepung Terigu Pro Tinggi', qty: 250, unit: 'Gram' },
          { ing: 'Margarin Blue Band', qty: 150, unit: 'Gram' },
          { ing: 'Selai Nanas Homemade', qty: 200, unit: 'Gram' },
          { ing: 'Telor Ayam Negeri', qty: 2, unit: 'Pieces' }
        ]
      },
      {
        name: 'Putri Salju Keju', type: 'Made to Stock', cat: 'Kue Kering', unit: 'Toples',
        recipe: [
          { ing: 'Tepung Terigu Pro Tinggi', qty: 300, unit: 'Gram' },
          { ing: 'Margarin Blue Band', qty: 200, unit: 'Gram' },
          { ing: 'Gula Pasir Kristal', qty: 100, unit: 'Gram' }
        ]
      },
      {
        name: 'Kastengel Premium', type: 'Made to Stock', cat: 'Kue Kering', unit: 'Toples',
        recipe: [
          { ing: 'Tepung Terigu Pro Tinggi', qty: 200, unit: 'Gram' },
          { ing: 'Telor Ayam Negeri', qty: 3, unit: 'Pieces' },
          { ing: 'Margarin Blue Band', qty: 150, unit: 'Gram' }
        ]
      },
      {
        name: 'Donat Gula Halus', type: 'Made to Order', cat: 'Snack Box', unit: 'Pieces',
        recipe: [
          { ing: 'Tepung Terigu Pro Tinggi', qty: 500, unit: 'Gram' },
          { ing: 'Susu UHT Full Cream', qty: 200, unit: 'Mililiter' },
          { ing: 'Gula Pasir Kristal', qty: 50, unit: 'Gram' }
        ]
      },
      {
        name: 'Risol Mayo Spesial', type: 'Made to Order', cat: 'Snack Box', unit: 'Pieces',
        recipe: [
          { ing: 'Tepung Terigu Pro Tinggi', qty: 250, unit: 'Gram' },
          { ing: 'Telor Ayam Negeri', qty: 4, unit: 'Pieces' },
          { ing: 'Minyak Goreng Sawit', qty: 200, unit: 'Mililiter' }
        ]
      }
      // Kita bisa tambahkan sampai 10+ item di sini dengan pola yang sama
    ];

    products.forEach(p => {
      // ── CARI DULU UNTUK CEK KEBERADAAN ──
      cy.get('input[placeholder*="Cari nama produk"]').clear({ force: true }).type(p.name);
      cy.wait(500);

      cy.get('table').then(($table) => {
        if ($table.text().includes(p.name)) {
          cy.log(`Product ${p.name} already exists. Skipping creation.`);
        } else {
          // Buat baru jika belum ada
          cy.contains('button', 'Tambah Produk').filter(':visible').click();
          
          // Tunggu modal muncul
          cy.get('.p-dialog').should('be.visible').within(() => {
            cy.get('input[placeholder="Nama produk"]').type(p.name);
            cy.get('.p-dropdown').eq(0).click();
          });
          cy.contains('.p-dropdown-item', p.cat).click();
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('.p-dropdown').eq(1).click();
          });
          cy.contains('.p-dropdown-item', p.unit).click();
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('.p-dropdown').eq(2).click();
          });
          cy.contains('.p-dropdown-item', p.type).click();
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.contains('button', 'Simpan').click();
          });
          cy.get('.p-dialog').should('not.exist');

          // Cari ulang agar baris muncul
          cy.get('input[placeholder*="Cari nama produk"]').clear({ force: true }).type(p.name);
          cy.wait(300);

          // ── KELOLA RESEP ──
          cy.get('td').contains(new RegExp(`^${p.name}$`)).closest('tr').contains('button', 'Resep').click();
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.contains('button', 'Tambah Versi Baru').click();
          });
          p.recipe.forEach(item => {
            cy.get('.p-dialog').filter(':visible').within(() => {
              cy.contains('button', 'Tambah Bahan').click();
              cy.get('.p-dropdown').last().click();
            });
            cy.contains('.p-dropdown-item', item.ing).click();
            cy.get('.p-dialog').filter(':visible').within(() => {
              cy.get('.p-inputnumber-input').last().click().type(item.qty.toString());
            });
          });
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.contains('button', 'Simpan Resep').click();
          });
          cy.contains('button', 'Aktifkan').filter(':visible').click();
          cy.get('.p-dialog').filter(':visible').within(() => {
            cy.get('.p-dialog-header-icon').click();
          });
          cy.get('.p-dialog').should('not.exist');
        }
      });
      cy.wait(500);
    });

    // Reset filter produk
    cy.contains('button', 'Reset').filter(':visible').click();

    // ── STEP 4: PRODUCTION ──────────────────────────────────────────────────
    cy.contains('Produksi').click();
    const productions = [
      { name: 'Nastar Toples 500g', qty: 3 },
      { name: 'Putri Salju Keju', qty: 5 },
      { name: 'Donat Gula Halus', qty: 25 }
    ];

    productions.forEach(prod => {
      cy.contains('button', 'Catat Produksi').filter(':visible').click();
      
      cy.get('.p-dialog').filter(':visible').within(() => {
        cy.get('.p-dropdown').eq(0).click();
      });
      cy.contains('.p-dropdown-item', new RegExp(`^${prod.name}$`)).click();
      
      cy.get('.p-dialog').filter(':visible').within(() => {
        cy.get('.p-inputnumber-input').type(prod.qty.toString());
        cy.contains('button', 'Simpan').click();
      });
      cy.wait(1000);
    });

    // ── VERIFIKASI KEUANGAN (Produksi & Pembelian) ──
    cy.contains('Keuangan').click();
    cy.wait(1000);
    cy.contains('Biaya Produksi').should('exist');
    cy.contains('Pembelian Bahan').should('exist');
    cy.log('Verified: Both production and purchase costs recorded in Cash Flow.');

    // ── STEP 5: ORDER ───────────────────────────────────────────────────────
    cy.contains('Order').click();
    cy.contains('button', 'Tambah Order').filter(':visible').click();
    
    cy.get('.p-sidebar').filter(':visible').within(() => {
      cy.get('input[placeholder*="Nama Pelanggan"]').type('Budi Cypress');
      cy.get('input[placeholder*="0812"]').type('0812345678');

      // Add items to order
      cy.contains('button', 'Tambah Item').click();
      cy.get('.p-dropdown').last().click();
    });
    cy.contains('.p-dropdown-item', 'Nastar Toples 500g').click();
    
    cy.get('.p-sidebar').filter(':visible').within(() => {
      cy.get('.p-inputnumber-input').eq(0).click().type('1'); // 1 toples
      cy.contains('button', 'Tambah Item').click();
      cy.get('.p-dropdown').last().click();
    });
    cy.contains('.p-dropdown-item', 'Donat Gula Halus').click();
    
    cy.get('.p-sidebar').filter(':visible').within(() => {
      cy.get('.p-inputnumber-input').eq(1).click().type('12'); // 12 pcs
      cy.contains('button', 'Simpan Order').click();
    });

    // Verify SUCCESS
    cy.contains('Budi Cypress', { timeout: 10000 }).should('exist');
  });
});
