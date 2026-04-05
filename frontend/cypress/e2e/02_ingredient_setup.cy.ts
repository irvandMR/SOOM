import { credentials, ingredients } from '../support/testData';

describe('Step 2: Ingredient CRUD & Stock Setup', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
  });

  it('Performs full CRUD and Stock In for Ingredients', () => {
    // ── PRE-FLIGHT 1: ENSURE UNITS EXIST ────────────────────────────────────
    cy.contains('Units').click();
    const requiredUnits = [
      { name: 'Kilogram', symbol: 'kg' },
      { name: 'Gram', symbol: 'g' },
      { name: 'Pieces', symbol: 'pcs' },
      { name: 'Liter', symbol: 'L' }
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

    // ── PRE-FLIGHT 2: ENSURE CATEGORIES EXIST ────────────────────────────────
    cy.contains('Kategori').click();
    const requiredCategories = [
      { name: 'Tepung', type: 'Ingredient' },
      { name: 'Mentega/Margarin', type: 'Ingredient' },
      { name: 'Gula', type: 'Ingredient' },
      { name: 'Protein', type: 'Ingredient' },
      { name: 'Minyak', type: 'Ingredient' },
      { name: 'Lain-lain', type: 'Ingredient' }
    ];

    requiredCategories.forEach(cat => {
      cy.get('input[placeholder*="Cari nama kategori"]').clear().type(`${cat.name}{enter}`);
      cy.wait(400);
      cy.get('table').then(($table) => {
        if (!$table.text().includes(cat.name)) {
          cy.contains('button', 'Tambah Kategori').click();
          cy.waitForDialog().within(() => {
            cy.get('input[placeholder*="Tepung"]').type(cat.name);
            cy.get('.p-dropdown').click();
          });
          cy.get('.p-dropdown-item').contains(cat.type).scrollIntoView().click({ force: true });
          cy.get('.p-dialog').contains('button', 'Simpan').click();
          cy.get('.p-dialog').should('not.exist');
          cy.wait(400);
        }
      });
    });

    // ── MAIN INGREDIENT FLOW ──────────────────────────────────────────────────
    cy.contains('Stok Bahan Baku').click();

    // 1. CLEANUP/DELETE FEATURE TEST
    cy.contains('button', 'Tambah Bahan Baku').click();
    cy.waitForDialog().within(() => {
      cy.get('input[placeholder*="Tepung"]').should('not.be.disabled').type('Bahan Sampah');
      cy.get('.p-dropdown').eq(0).click(); // Category
    });
    cy.get('.p-dropdown-item').contains('Tepung').scrollIntoView().click({ force: true });
    
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').eq(1).click(); // Unit
    });
    cy.get('.p-dropdown-item').contains('Kilogram').scrollIntoView().click({ force: true });
    
    cy.get('.p-dialog:visible').within(() => {
      cy.contains('button', 'Simpan').click();
    });
    cy.get('.p-dialog').should('not.exist');
    
    cy.get('input[placeholder*="Cari nama bahan"]').clear().type('Bahan Sampah{enter}');
    cy.wait(500);
    cy.get('td').contains('Bahan Sampah').closest('tr').within(() => {
      cy.contains('button', 'Hapus').click();
    });
    cy.get('.p-confirm-dialog').should('be.visible').within(() => {
      cy.contains('button', 'Hapus').click();
    });
    cy.get('.p-confirm-dialog').should('not.exist');
    cy.get('input[placeholder*="Cari nama bahan"]').clear().type('{enter}');

    // 2. MAIN LOOP: CREATE (INCLUDING MIN STOCK) -> STOCK IN
    ingredients.forEach(ing => {
      cy.get('input[placeholder*="Cari nama bahan"]').clear({ force: true }).type(`${ing.name}{enter}`);
      cy.wait(600);

      cy.get('body').then(($body: any) => {
        if (!$body.text().includes(ing.name)) {
          // CREATE NEW
          cy.contains('button', 'Tambah Bahan Baku').click();
          cy.waitForDialog().within(() => {
            cy.get('input[placeholder*="Tepung"]').type(ing.name);
            cy.get('.p-dropdown').eq(0).click();
          });
          cy.get('.p-dropdown-item').contains(ing.category).scrollIntoView().click({ force: true });
          
          cy.get('.p-dialog:visible').within(() => {
            cy.get('.p-dropdown').eq(1).click();
          });
          cy.get('.p-dropdown-item').contains(ing.unit).scrollIntoView().click({ force: true });
          
          // LANGSUNG ISI MINIMUM STOK DI MODAL TAMBAH
          const calculatedMinStock = ing.qty * 0.05;
          cy.get('.p-dialog:visible').within(() => {
            cy.get('.p-inputnumber-input').eq(0).click().type('{selectall}{backspace}').type(`${calculatedMinStock}{enter}`, { delay: 100 });
            cy.contains('button', 'Simpan').click();
          });
          cy.get('.p-dialog').should('not.exist');
          cy.wait(500);
          
          cy.get('input[placeholder*="Cari nama bahan"]').clear({ force: true }).type(`${ing.name}{enter}`);
          cy.wait(600);
        }

        // STOCK IN
        cy.get('td').contains(new RegExp(`^${ing.name}$`)).closest('tr').within(() => {
          cy.contains('button', 'Stok').click();
        });
        cy.waitForDialog().within(() => {
          cy.get('.p-inputnumber-input').eq(0).click().type('{selectall}{backspace}').type(`${ing.qty}{enter}`, { delay: 100 });
          cy.wait(300);
          cy.get('.p-inputnumber-input').eq(1).click().type('{selectall}{backspace}').type(`${ing.total}{enter}`, { delay: 100 });
          cy.contains('Harga per', { timeout: 15000 }).should('be.visible');
          cy.contains('button', 'Tambah Stok').click();
        });
        cy.get('.p-dialog').should('not.exist');
        cy.wait(600);
      });
    });
  });
});
