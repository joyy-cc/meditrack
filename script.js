document.addEventListener('DOMContentLoaded', function() {
  // Get all section elements
  const sections = document.querySelectorAll('section.content-section');
  // Get all nav (top) and sidebar links that target a section (href="#id")
  const navLinks = document.querySelectorAll('.navbar .nav-link[href^="#"], .sidebar .list-group-item[href^="#"]');

  // Function to handle nav link clicks
  function handleNavClick(e) {
    e.preventDefault();
    const targetID = this.getAttribute('href').substring(1); // e.g. "dashboard"
    // If no valid target ID or section, do nothing
    if (!targetID) return;
    const targetSection = document.getElementById(targetID);
    if (!targetSection) return;

    // Hide all sections, then show the target section
    sections.forEach(sec => {
      sec.classList.add('d-none');
      if (sec.id === targetID) {
        sec.classList.remove('d-none');
      }
    });

    // Remove 'active' class from all nav/sidebar links
    document.querySelectorAll('.navbar .nav-link.active, .sidebar .list-group-item.active')
            .forEach(link => link.classList.remove('active'));

    // Add 'active' class to the clicked link and its counterpart(s)
    document.querySelectorAll(`.navbar .nav-link[href="#${targetID}"], .sidebar .list-group-item[href="#${targetID}"]`)
            .forEach(link => link.classList.add('active'));
  }

  // Attach click listener to each relevant link
  navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  // EXISTING CODE...

  // Handle Save Equipment
  const saveEquipmentBtn = document.getElementById('saveEquipmentBtn');
  if (saveEquipmentBtn) {
    saveEquipmentBtn.addEventListener('click', () => {
      // TODO: Collect form data and send to Firebase
      alert('Save Equipment clicked. Add logic to handle saving.');
    });
  }

  // Handle Add Part
  const addPartBtn = document.getElementById('addPartBtn');
  if (addPartBtn) {
    addPartBtn.addEventListener('click', () => {
      // TODO: Dynamically add a new row to the parts table
      alert('Add Part clicked. Add logic to insert part row.');
    });
  }

  // Handle Schedule Maintenance
  const saveMaintenanceBtn = document.getElementById('saveMaintenanceBtn');
  if (saveMaintenanceBtn) {
    saveMaintenanceBtn.addEventListener('click', () => {
      // TODO: Collect maintenance form data and process
      alert('Schedule Maintenance clicked. Add logic to handle scheduling.');
    });
  }
});
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  }
})

document.addEventListener('DOMContentLoaded', function() {
  // Profile button
  document.getElementById('profileBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById('profileModal')).show();
  });

  // Settings button
  document.getElementById('settingsBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    loadUserSettings();
    new bootstrap.Modal(document.getElementById('settingsModal')).show();
  });

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById('logoutModal')).show();
  });

  // Save settings
  document.getElementById('saveSettingsBtn')?.addEventListener('click', function() {
    saveUserSettings();
    bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
    showToast('Settings saved successfully!');
  });

  // Confirm logout
  document.getElementById('confirmLogoutBtn')?.addEventListener('click', function() {
    if (document.getElementById('rememberLogout').checked) {
      localStorage.setItem('logoutPreference', 'remembered');
    }
    window.location.href = 'login.html';
  });

  function loadUserSettings() {
    document.getElementById('notificationPref').value = 'important';
    document.getElementById('themePref').value = 'light';
    document.getElementById('emailNotifications').checked = true;
    document.getElementById('smsNotifications').checked = false;
    document.getElementById('timezonePref').value = 'EST';
  }

  function saveUserSettings() {
    const settings = {
      notifications: document.getElementById('notificationPref').value,
      theme: document.getElementById('themePref').value,
      emailNotifications: document.getElementById('emailNotifications').checked,
      smsNotifications: document.getElementById('smsNotifications').checked,
      timezone: document.getElementById('timezonePref').value
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
  }

  function showToast(message) {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-success';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.style.position = 'fixed';
      toastContainer.style.top = '20px';
      toastContainer.style.right = '20px';
      toastContainer.style.zIndex = '1100';
      document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toastEl);
    new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 }).show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }
});
// Save Inventory Item
document.getElementById('saveInventoryBtn').addEventListener('click', async () => {
  const inventoryData = {
    partNumber: partNumber.value,
    partName: partName.value,
    equipment: equipmentForPart.value,
    category: partCategory.value,
    quantity: parseInt(quantity.value),
    minQuantity: parseInt(minQuantity.value),
    unit: unit.value,
    supplier: supplier.value,
    supplierContact: supplierContact.value,
    notes: partNotes.value,
    createdAt: new Date().toISOString()
  };

  try {
    await firebase.firestore().collection('inventory').add(inventoryData);
    alert("Inventory item saved!");
    document.getElementById('inventoryForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('addInventoryModal')).hide();
  } catch (error) {
    console.error(error);
    alert("Failed to save inventory.");
  }
});

// Edit and Restock Buttons (Sample logic - must be triggered from item UI)
function editInventoryItem(docId, updatedData) {
  return firebase.firestore().collection('inventory').doc(docId).update(updatedData);
}

function restockInventoryItem(docId, addQuantity) {
  const docRef = firebase.firestore().collection('inventory').doc(docId);
  return docRef.get().then(doc => {
    const currentQty = doc.data().quantity || 0;
    return docRef.update({ quantity: currentQty + addQuantity });
  });
}
