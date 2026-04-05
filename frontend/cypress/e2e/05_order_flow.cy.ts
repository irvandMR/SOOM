import { credentials } from '../support/testData';

describe('Step 5: Order Flow Validation', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(credentials.email);
    cy.get('input[type="password"]').type(credentials.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Selamat datang', { timeout: 10000 }).should('be.visible');
    cy.get('a[href="/orders"]').click();
  });

  const fillOrderCommon = (customerName: string, phone: string, address: string) => {
    cy.contains('button', 'Buat Order').click();
    cy.waitForDialog().within(() => {
      // 1. Info Customer
      cy.get('input[placeholder*="Nama customer"]').clear().type(customerName);
      cy.get('input[placeholder*="08xx"]').clear().type(phone);
      cy.get('input[placeholder*="Alamat pengiriman"]').clear().type(address);
      const reqDate = new Date();
      reqDate.setDate(reqDate.getDate() + 3);
      const yyyy = reqDate.getFullYear();
      const mm = String(reqDate.getMonth() + 1).padStart(2, '0');
      const dd = String(reqDate.getDate()).padStart(2, '0');
      cy.get('input[type="date"]').eq(1).type(`${yyyy}-${mm}-${dd}`); // Tanggal Dibutuhkan
    });
  }

  const cancelExistingOrders = (customerName: string) => {
    cy.wait(1000); // Beri waktu tabel untuk me-render data dari API
    cy.get('body').then(($body) => {
      // Cari baris yang mengandung nama customer tapi STATUS-nya BUKAN CANCELLED
      const activeRows = $body.find(`tr:contains("${customerName}")`).not(`:contains("CANCELLED")`);

      if (activeRows.length > 0) {
        cy.wrap(activeRows.first()).contains('button', 'Detail').click();

        cy.waitForDialog().first().within(() => {
          cy.contains('button', 'Update Status').click();
        });

        cy.get('.p-dialog:visible').last().within(() => {
          cy.get('.p-dropdown').click();
        });

        cy.get('body').find('.p-dropdown-item:visible').contains(/CANCELLED/i).click();

        cy.get('.p-dialog:visible').last().within(() => {
          cy.get('input[placeholder="Catatan perpindahan status"]').type('Pembersihan Test (Cypress Auto Cancel)');
          cy.contains('button', 'Update').click();
        });

        cy.wait(500);

        // Tutup Modal Detail
        cy.get('.p-dialog:visible').first().within(() => {
          cy.get('.p-dialog-header-icons button').click();
        });

        cy.wait(500);
      }
    });
  }

  it('1. Create Order with Down Payment (DP) & Manual Price Rounding', () => {
    cancelExistingOrders('Bapak Irvandi DP');
    fillOrderCommon('Bapak Irvandi DP', '08123456789', 'Jl. Mawar Merah No 1');

    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').eq(0).click();
    });
    cy.get('.p-dropdown-item').contains('Nastar Original').click();

    // Wait for recipe dropdown to become enabled once recipes are fetched
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').eq(1).should('not.have.class', 'p-disabled').click();
    });
    cy.get('.p-dropdown-item').first().click();

    // The user explicitly calculates and enters a rounded-up price and 30% DP
    // Misal: recommend-nya 55.001 -> user ketik 56.000 dengan qty 1 (karena stok cuma 1)
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-inputnumber-input').eq(0).type('{selectall}1');
    });

    cy.wait(500);
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-inputnumber-input').eq(1).type('{selectall}56000'); // User typing the rounded up price
    });

    // Subtotal will be 56,000. DP 30% is manually typed as 16,800
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-inputnumber-input').last().type('{selectall}16800');
    });

    // Select DP
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').last().click();
    });
    cy.get('.p-dropdown-item').contains('DP').click();

    cy.get('.p-dialog:visible').within(() => {
      cy.get('input[placeholder*="Catatan tambahan"]').type('Pesanan butuh kotak ekstra, DP manual');
      cy.contains('button', 'Buat Order').click();
    });

    // Verify
    cy.get('.p-dialog').should('not.exist');
    cy.contains('Bapak Irvandi DP').should('exist');
    cy.contains('Bapak Irvandi DP').parents('tr').within(() => {
      cy.contains('PENDING').should('exist');
      cy.contains('PARSIAL').should('exist');
    });
  });

  it('2. Create Order with Full Settlement (Lunas) & Manual Price Override', () => {
    cancelExistingOrders('Admin SOOM Lunas');
    fillOrderCommon('Admin SOOM Lunas', '08987654321', 'Komp. SOOM Pusat');

    const orderItems = [
      { name: 'Donat Original', qty: 1, customPrice: '8000' }
    ];

    orderItems.forEach((item, idx) => {
      cy.get('.p-dialog:visible').within(() => {
        cy.get('.p-dropdown').eq(idx * 2).click();
      });
      cy.get('.p-dropdown-item').contains(item.name).click();
      cy.wait(1000);
      cy.get('.p-dialog:visible').within(() => {
        cy.get('.p-dropdown').eq(idx * 2 + 1).should('not.have.class', 'p-disabled').click();
      });
      cy.get('.p-dropdown-item').first().click();

      cy.get('.p-inputnumber-input').last().clear().type('150000');
    });

    // Select Lunas
    cy.get('.p-dialog:visible').within(() => {
      cy.get('.p-dropdown').last().click();
    });
    cy.get('.p-dropdown-item').contains('Lunas').click();

    cy.get('.p-dialog:visible').within(() => {
      cy.get('input[placeholder*="Catatan tambahan"]').type('Lunas manual fill');
      cy.contains('button', 'Buat Order').click();
    });

    cy.get('.p-dialog').should('not.exist');
    cy.contains('Admin SOOM Lunas').should('exist');
    cy.contains('Admin SOOM Lunas').parents('tr').within(() => {
      cy.contains('PENDING').should('exist');
      cy.contains('LUNAS').should('exist');
    });
  });

  it('3. Update Order Status (Pending -> Processing -> Delivered) & Add Settlement via Modal', () => {
    // 1. Find the DP order and open details
    cy.contains('Bapak Irvandi DP').parents('tr').contains('button', 'Detail').click();

    // 2. Change Status to Processing
    cy.get('.p-dialog:visible').first().within(() => {
      cy.contains('button', 'Update Status').click();
    });
    cy.get('.p-dialog:visible').last().within(() => {
      cy.get('.p-dropdown').click();
    });
    cy.get('.p-dropdown-item').contains('PROCESSING').click();
    cy.get('.p-dialog:visible').last().within(() => {
      cy.get('input[placeholder="Catatan perpindahan status"]').type('Sedang dimasak...');
      cy.contains('button', 'Update').click();
    });

    cy.wait(500);

    // 3. Change Status to Finished
    cy.get('.p-dialog:visible').first().within(() => {
      cy.contains('button', 'Update Status').click();
    });
    cy.get('.p-dialog:visible').last().within(() => {
      cy.get('.p-dropdown').click();
    });
    cy.get('.p-dropdown-item').contains('FINISHED').click();
    cy.get('.p-dialog:visible').last().within(() => {
      cy.get('input[placeholder="Catatan perpindahan status"]').type('Selesai produksi, taruh di showcase');
      cy.contains('button', 'Update').click();
    });

    cy.wait(500);

    // Update payment
    cy.get('.p-dialog:visible').first().within(() => {
      cy.contains('button', 'Tambah Bayar').click();
    });

    cy.get('.p-dialog:visible').last().within(() => {
      cy.get('.p-dropdown').click();
    });
    cy.get('.p-dropdown-item').contains('Pelunasan').click();

    // User types in exact remaining balance. 56k - 16.8k = 39200. 
    // They are not allowed to type more than that! So we type exactly 39200.
    cy.get('.p-dialog:visible').last().within(() => {
      cy.get('.p-inputnumber-input').type('{selectall}39200');
    });
    cy.get('.p-dialog:visible').last().get('input[placeholder*="referensi"]').type('Pelunasan manual');

    cy.get('.p-dialog:visible').last().within(() => {
      cy.contains('button', 'Simpan').click();
    });

    cy.wait(500);

    cy.get('.p-dialog:visible').first().within(() => {
      cy.get('.p-tag').contains('LUNAS').should('exist');
      cy.get('.p-dialog-header-icons button').click();
    });

    cy.contains('Bapak Irvandi DP').parents('tr').within(() => {
      cy.contains('FINISHED').should('exist');
      cy.contains('LUNAS').should('exist');
    });
  });

});
