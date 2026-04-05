import { credentials, products } from '../support/testData';

const typeLabelMap: Record<string, string> = {
  'MADE_TO_ORDER': 'Made to Order',
  'MADE_TO_STOCK': 'Made to Stock',
  'RESELL': 'Resell'
};

describe('Step 3: Product CRUD & Recipe Setup', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
  });

  it('Performs full CRUD and Recipe Setup for Products', () => {
    // ── PRE-FLIGHT: ENSURE UNITS EXIST ────────────────────────────────────
    cy.contains('Units').click();
    const requiredUnits = [
      { name: 'toples', symbol: 'toples' },
      { name: 'pcs', symbol: 'pcs' },
      { name: 'mililiter', symbol: 'ml' },
      { name: 'sendok makan', symbol: 'sdm' }
    ];

    requiredUnits.forEach(unit => {
      cy.get('input[placeholder*="Cari nama atau simbol"]').clear().type(`${unit.name}{enter}`);
      cy.wait(400);
      cy.get('table').then(($table) => {
        if (!$table.text().includes(unit.name)) {
          cy.contains('button', 'Tambah Unit').click();
          cy.waitForDialog().within(() => {
            cy.get('input[placeholder*="Kilogram"]').type(unit.name);
            cy.get('input[placeholder*="kg"]').type(unit.symbol);
            cy.contains('button', 'Simpan').click();
          });
          cy.get('.p-dialog').should('not.exist');
          cy.wait(400);
        }
      });
    });

    cy.contains('Produk & Resep').click();

    // 1. DELETE FEATURE TEST (CLEANUP)
    cy.contains('button', 'Tambah Produk').click();
    cy.waitForDialog().within(() => {
      cy.get('input[placeholder*="Nama produk"]').type('Produk Sampah');
      cy.get('.p-dropdown').eq(0).click(); // Kategori
    });
    cy.contains('.p-dropdown-item', 'Kue Kering', { matchCase: false }).scrollIntoView().click({ force: true });
    
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').eq(1).click(); // Unit
    });
    cy.contains('.p-dropdown-item', 'toples', { matchCase: false }).scrollIntoView().click({ force: true });
    
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').eq(2).click(); // Tipe
    });
    cy.contains('.p-dropdown-item', 'Made to Order', { matchCase: false }).scrollIntoView().click({ force: true });

    cy.get('.p-dialog:visible').within(() => {
      cy.contains('button', 'Simpan').click();
    });
    cy.get('.p-dialog').should('not.exist');
    
    // Temukan dan hapus
    cy.get('input[placeholder*="Cari nama produk"]').clear().type('Produk Sampah{enter}');
    cy.wait(500);
    cy.get('td').contains('Produk Sampah', { matchCase: false }).closest('tr').within(() => {
      cy.contains('button', 'Hapus').click();
    });
    cy.get('.p-confirm-dialog').should('be.visible').within(() => {
      cy.contains('button', 'Hapus').click();
    });
    cy.get('.p-confirm-dialog').should('not.exist');
    cy.get('input[placeholder*="Cari nama produk"]').clear().type('{enter}');
    cy.wait(500);

    // 2. MAIN LOOP: CREATE PRODUCT -> SETUP RECIPES
    products.forEach(prod => {
      cy.get('input[placeholder*="Cari nama produk"]').clear({ force: true }).type(`${prod.name}{enter}`);
      cy.wait(600);

      cy.get('body').then(($body: any) => {
        // --- HAPUS JIKA SUDAH ADA (CLEAN SLATE) ---
        if ($body.text().includes(prod.name)) {
          cy.get('td').contains(new RegExp(`^${prod.name}$`, 'i')).closest('tr').within(() => {
            cy.contains('button', 'Hapus').click();
          });
          cy.get('.p-confirm-dialog').should('be.visible').within(() => {
            cy.contains('button', 'Hapus').click();
          });
          cy.get('.p-confirm-dialog').should('not.exist');
          cy.wait(600);
        }
      }).then(() => {
        // --- 2A. SELALU BUAT PRODUK BARU ---
        cy.contains('button', 'Tambah Produk').click();
        cy.waitForDialog().within(() => {
          cy.get('input[placeholder*="Nama produk"]').type(prod.name);
          cy.get('.p-dropdown').eq(0).click(); // Category
        });
        cy.contains('.p-dropdown-item', prod.cat, { matchCase: false }).scrollIntoView().click({ force: true });
        
        cy.get('.p-dialog:visible').within(() => {
          cy.get('.p-dropdown').eq(1).click(); // Unit
        });
        // AddProductModal expects the full 'name' (e.g. 'Pieces') not the symbol ('pcs')
        const unitNameMap: Record<string, string> = { 'pcs': 'Pieces', 'toples': 'Toples' };
        const unitLabel = unitNameMap[prod.unit] || prod.unit;
        cy.contains('.p-dropdown-item', unitLabel, { matchCase: false }).scrollIntoView().click({ force: true });

        cy.get('.p-dialog:visible').within(() => {
          cy.get('.p-dropdown').eq(2).click(); // Type
        });
        const typeLabelMap: Record<string, string> = { 'MADE_TO_STOCK': 'Made to Stock', 'MADE_TO_ORDER': 'Made to Order' };
        const typeLabel = typeLabelMap[prod.type] || 'Made to Order';
        cy.contains('.p-dropdown-item', typeLabel, { matchCase: false }).scrollIntoView().click({ force: true });
        
        cy.get('.p-dialog:visible').within(() => {
          cy.contains('button', 'Simpan').click();
        });
        cy.get('.p-dialog').should('not.exist');
        cy.wait(600);

        // Segarkan list
        cy.get('input[placeholder*="Cari nama produk"]').clear({ force: true }).type(`${prod.name}{enter}`);
        cy.wait(600);

        // --- 2B. MASUKAN RESEP KE DALAM PRODUK ---
        cy.get('td').contains(new RegExp(`^${prod.name}$`, 'i')).closest('tr').within(() => {
          cy.contains('button', 'Resep').click();
        });
        
        // Wait for the modal to open and API to finish loading recipes
        cy.waitForDialog();
        cy.wait(1000); // Wait aggressively for the API fetch and React render (spinner goes away)
        
        cy.get('.p-dialog:visible').then(($dialog) => {
          // Hanya tambahkan resep jika "Belum ada resep aktif" terlihat (pasti belum ada karena barusan dibuat baru)
          if ($dialog.text().includes('Belum ada resep aktif') && prod.recipe && prod.recipe.length > 0) {
            cy.wrap($dialog).within(() => {
              // 1. Estimasi Hasil Batch (InputNumber eq 0)
              cy.get('.p-inputnumber-input').eq(0).click().type('{selectall}{backspace}').type(`${prod.yield}{enter}`, { delay: 100 });
              cy.wait(300);
            });

            // 2. Loop bahan-bahan (Recipe Items)
            prod.recipe.forEach((item, idx) => {
              // Tambah kolom baru kecuali untuk baris pertama (yg sudah otomatis terbuat)
              if (idx > 0) {
                cy.get('.p-dialog:visible').within(() => {
                  cy.contains('button', 'Tambah Bahan').click();
                });
              }

              // Untuk setiap baris (idx): Dropdown Bahan (idx * 2), Dropdown Unit (idx * 2 + 1), Input Qty (idx + 1)
              // Ingredient dropdown has a filter input — type to narrow, then click the first (only) result
              cy.get('.p-dialog:visible').within(() => {
                cy.get('.p-dropdown').eq(idx * 2).click();
              });
              cy.get('.p-dropdown-filter').clear().type(item.ing);
              cy.wait(300);
              // itemTemplate renders name + unitSymbol so regex anchors fail; click first filtered item instead
              cy.get('.p-dropdown-item').first().scrollIntoView().click({ force: true });

              cy.get('.p-dialog:visible').within(() => {
                // Input qty (bergeser by 1 karena eq 0 adalah Estimasi Hasil)
                cy.get('.p-inputnumber-input').eq(idx + 1).click().type('{selectall}{backspace}').type(`${item.qty}{enter}`, { delay: 100 });
                
                // Dropdown Unit (no filter — click then pick by symbol text)
                cy.get('.p-dropdown').eq(idx * 2 + 1).click();
              });
              // Unit dropdown shows symbol only (no custom template), so anchored regex gives exact match.
              // Plain string .contains('g') would also match 'kg' — anchors prevent that.
              cy.contains('.p-dropdown-item', new RegExp(`^${item.unit}$`, 'i')).scrollIntoView().click({ force: true });
            });

            // Tunggu sebentar biarkan form dan preview Cost Per Unit stabil, lalu simpan
            cy.wait(600);
            cy.get('.p-dialog:visible').within(() => {
              cy.contains('button', 'Simpan Resep').click();
            });
            cy.get('.p-dialog').should('not.exist');
            cy.wait(600);
          } else {
            // Tutup aja kalau resep udah ada
            cy.get('.p-dialog-header-close').click();
            cy.get('.p-dialog').should('not.exist');
          }
        });
      });
    });
  });
});
