import { credentials } from '../support/testData';

describe('Step 6: Cash Flow Verification', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
  });

  it('Verifies all business transactions in Cash Flow', () => {
    cy.contains('Keuangan').click();

    // 1. Verify "Pembelian Bahan" (Stock In)
    cy.contains('Pembelian Bahan').should('exist');
    
    // 2. Verify "Biaya Produksi" (Production)
    cy.contains('Biaya Produksi').should('exist');
    
    // 3. Verify total balance or specific entries if needed
    cy.get('table').then(($table) => {
      const text = $table.text();
      expect(text).to.contain('Nastar Original');
      expect(text).to.contain('Donat Original');
      expect(text).to.contain('Risol Mayo');
    });

    cy.log('All financial entries verified successfully.');
  });
});
