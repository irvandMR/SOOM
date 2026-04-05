// cypress/support/e2e.ts
// Import commands.js using ES2015 syntax:
import './commands'

// Abaikan error "concurrent rendering" agar testing tidak berhenti paksa
Cypress.on('uncaught:exception', (err, runnable) => {
  // Jika error mengandung pesan concurrent rendering, biarkan saja
  if (err.message.includes('concurrent rendering')) {
    return false
  }
  // Masih laporkan error lain yang tidak terkait
  return true
})
