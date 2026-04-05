import { credentials, products } from '../support/testData';

describe('Step 4: Production Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
  });

  it('Records production for products', () => {
    cy.contains('Produksi').click();

    // Produce 1 batch for each to achieve the user's specified yields
    const productionJobs = [
      { name: 'Nastar Original', qty: 1 }, // Yield 3 toples
      { name: 'Donat Original', qty: 1 }, // Yield 25 pcs
      { name: 'Risol Mayo', qty: 1 }      // Yield 65 pcs
    ];

    productionJobs.forEach(job => {
      cy.contains('button', 'Catat Produksi').click();
      
      cy.waitForDialog().within(() => {
        // Select Product
        cy.get('.p-dropdown').eq(0).click();
      });
      cy.contains('.p-dropdown-item', job.name).click();
      
      cy.get('.p-dialog:visible').within(() => {
        // Input Quantity
        cy.get('.p-inputnumber-input').eq(0).clear().type(job.qty.toString());
        
        // Input Notes
        cy.get('input[placeholder*="Catatan"]').type('Produksi Batch Test');
        
        // Save
        cy.contains('button', 'Simpan').click();
      });
      
      cy.get('.p-dialog').should('not.exist');
      cy.wait(1000); // Wait for processing
      cy.contains('td', job.name).should('exist');
    });
  });
});
