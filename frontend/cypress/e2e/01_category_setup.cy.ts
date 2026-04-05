import { credentials } from '../support/testData';

describe('Step 1: Category CRUD Setup', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
  });

  it('Performs full CRUD on Categories', () => {
    cy.contains('Kategori').click();

    // 1. SIMPLE CRUD TEST (Using trash category once)
    // Create
    cy.contains('button', 'Tambah Kategori').click();
    cy.get('.p-dialog').should('be.visible').within(() => {
      cy.get('input[placeholder*="Tepung"]').should('not.be.disabled').type('Kategori Sampah');
      cy.get('.p-dropdown').click();
    });
    cy.contains('.p-dropdown-item', 'Ingredient').should('be.visible').click();
    cy.get('.p-dialog').contains('button', 'Simpan').click();
    cy.get('.p-dialog').should('not.exist');
    
    // Edit & Search Check
    cy.get('input[placeholder*="Cari nama kategori"]').clear().type('Kategori Sampah{enter}');
    cy.contains('td', 'Kategori Sampah').closest('tr').find('button').contains('Edit').click();
    cy.get('.p-dialog').within(() => {
      cy.get('input[placeholder*="Tepung"]').clear().type('Kategori Diubah');
      cy.contains('button', 'Update').click();
    });
    cy.get('.p-confirm-dialog').contains('button', 'Update').click();
    cy.get('.p-confirm-dialog').should('not.exist');
    cy.get('input[placeholder*="Cari nama kategori"]').clear().type('{enter}');
    cy.contains('td', 'Kategori Diubah').should('exist');

    // Delete
    cy.get('input[placeholder*="Cari nama kategori"]').clear().type('Kategori Diubah{enter}');
    cy.contains('td', 'Kategori Diubah').closest('tr').find('button').contains('Hapus').click();
    cy.get('.p-confirm-dialog').contains('button', 'Hapus').click();
    cy.get('table').should('not.contain', 'Kategori Diubah');
    cy.get('input[placeholder*="Cari nama kategori"]').clear().type('{enter}');

    // 2. SETUP ESSENTIAL CATEGORIES
    // Sync with categories in support/testData.ts
    const essentials = [
      { name: 'Tepung', type: 'Ingredient' },
      { name: 'Gula', type: 'Ingredient' },
      { name: 'Minyak', type: 'Ingredient' },
      { name: 'Protein', type: 'Ingredient' },
      { name: 'Mentega/Margarin', type: 'Ingredient' },
      { name: 'Lain-lain', type: 'Ingredient' },
      { name: 'Beras', type: 'Ingredient' },
      { name: 'Kue Kering', type: 'Product' },
      { name: 'Donat & Roti', type: 'Product' },
      { name: 'Gorengan', type: 'Product' }
    ];

    essentials.forEach(cat => {
      cy.get('input[placeholder*="Cari nama kategori"]').clear().type(`${cat.name}{enter}`);
      cy.wait(400);
      cy.get('body').then(($body) => {
        if (!$body.text().includes(cat.name)) {
          cy.contains('button', 'Tambah Kategori').click();
          cy.waitForDialog().within(() => {
            cy.get('input[placeholder*="Tepung"]').type(cat.name);
            cy.get('.p-dropdown').click();
          });
          cy.contains('.p-dropdown-item', cat.type).click();
          cy.get('.p-dialog').contains('button', 'Simpan').click();
          cy.get('.p-dialog').should('not.exist');
          cy.wait(400);
        }
      });
    });
  });
});
