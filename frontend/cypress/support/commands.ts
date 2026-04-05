/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Waits for a PrimeReact dialog to be fully visible (opacity: 1).
       */
      waitForDialog(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('waitForDialog', () => {
  return cy.get('.p-dialog:visible', { timeout: 10000 }).should('have.css', 'opacity', '1');
});

export {};
