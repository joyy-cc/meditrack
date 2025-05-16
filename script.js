// Initialize Firebase (make sure to add your config)
const firebaseConfig = {
  apiKey: "AIzaSyCQNxNukLfEwmWS32kyXWX7Q7fO9yJOD3Q",
  authDomain: "meditrack-8a1d7.firebaseapp.com",
  projectId: "meditrack-8a1d7",
  storageBucket: "meditrack-8a1d7.firebasestorage.app",
  messagingSenderId: "595300198271",
  appId: "1:595300198271:web:9e179853730d4c5e475c4a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Check authentication state
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    // Load data when user is authenticated
    loadDashboardData();
    loadEquipment();
    loadMaintenance();
    loadInventory();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Navigation handling
  const sections = document.querySelectorAll('section.content-section');
  const navLinks = document.querySelectorAll('.navbar .nav-link[href^="#"], .sidebar .list-group-item[href^="#"]');

  function handleNavClick(e) {
    e.preventDefault();
    const targetID = this.getAttribute('href').substring(1);
    if (!targetID) return;
    const targetSection = document.getElementById(targetID);
    if (!targetSection) return;

    sections.forEach(sec => {
      sec.classList.add('d-none');
      if (sec.id === targetID) {
        sec.classList.remove('d-none');
      }
    });

    document.querySelectorAll('.navbar .nav-link.active, .sidebar .list-group-item.active')
            .forEach(link => link.classList.remove('active'));

    document.querySelectorAll(`.navbar .nav-link[href="#${targetID}"], .sidebar .list-group-item[href="#${targetID}"]`)
            .forEach(link => link.classList.add('active'));
  }

  navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });

  // User profile and settings
  document.getElementById('profileBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById('profileModal')).show();
  });

  document.getElementById('settingsBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    loadUserSettings();
    new bootstrap.Modal(document.getElementById('settingsModal')).show();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById('logoutModal')).show();
  });

  document.getElementById('saveSettingsBtn')?.addEventListener('click', function() {
    saveUserSettings();
    bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
    showToast('Settings saved successfully!');
  });

  document.getElementById('confirmLogoutBtn')?.addEventListener('click', function() {
    if (document.getElementById('rememberLogout').checked) {
      localStorage.setItem('logoutPreference', 'remembered');
    }
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  });

  // Save Equipment
  document.getElementById('saveEquipmentBtn')?.addEventListener('click', async function() {
    const equipmentData = {
      name: document.getElementById('equipmentName').value,
      model: document.getElementById('equipmentModel').value,
      serialNumber: document.getElementById('serialNumber').value,
      manufacturer: document.getElementById('manufacturer').value,
      purchaseDate: document.getElementById('purchaseDate').value,
      installationDate: document.getElementById('installationDate').value,
      location: document.getElementById('location').value,
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value,
      warrantyStart: document.getElementById('warrantyStart').value,
      warrantyEnd: document.getElementById('warrantyEnd').value,
      contractStart: document.getElementById('contractStart').value,
      contractEnd: document.getElementById('contractEnd').value,
      isCritical: document.getElementById('criticalEquipment').checked,
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('equipment').add(equipmentData);
      showToast('Equipment saved successfully!');
      document.getElementById('equipmentForm').reset();
      bootstrap.Modal.getInstance(document.getElementById('addEquipmentModal')).hide();
      loadEquipment();
    } catch (error) {
      console.error("Error saving equipment:", error);
      showToast('Failed to save equipment', 'danger');
    }
  });

  // Add Part to Maintenance
  document.getElementById('addPartBtn')?.addEventListener('click', function() {
    const partsTable = document.getElementById('partsTable').getElementsByTagName('tbody')[0];
    const newRow = partsTable.insertRow();
    
    newRow.innerHTML = `
      <td><input type="text" class="form-control form-control-sm part-number" placeholder="Part No."></td>
      <td><input type="text" class="form-control form-control-sm part-desc" placeholder="Description"></td>
      <td><input type="number" class="form-control form-control-sm part-qty" min="1" value="1"></td>
      <td><span class="badge bg-secondary">Not checked</span></td>
      <td><button class="btn btn-sm btn-outline-danger remove-part"><i class="fas fa-times"></i></button></td>
    `;
    
    newRow.querySelector('.remove-part').addEventListener('click', function() {
      partsTable.removeChild(newRow);
    });
  });

  // Save Maintenance
  document.getElementById('saveMaintenanceBtn')?.addEventListener('click', async function() {
    const parts = [];
    const rows = document.querySelectorAll('#partsTable tbody tr');
    
    rows.forEach(row => {
      parts.push({
        partNumber: row.querySelector('.part-number').value,
        description: row.querySelector('.part-desc').value,
        quantity: parseInt(row.querySelector('.part-qty').value) || 1
      });
    });

    const maintenanceData = {
      equipmentId: document.getElementById('maintenanceEquipment').value,
      equipmentName: document.getElementById('maintenanceEquipment').options[document.getElementById('maintenanceEquipment').selectedIndex].text,
      type: document.getElementById('maintenanceType').value,
      scheduledDate: document.getElementById('scheduledDate').value,
      priority: document.getElementById('priority').value,
      assignedTo: document.getElementById('assignedTo').value,
      estimatedDuration: parseInt(document.getElementById('estimatedDuration').value) || 1,
      notes: document.getElementById('maintenanceNotes').value,
      parts: parts,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('maintenance').add(maintenanceData);
      showToast('Maintenance scheduled successfully!');
      document.getElementById('maintenanceForm').reset();
      bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal')).hide();
      loadMaintenance();
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      showToast('Failed to schedule maintenance', 'danger');
    }
  });

  // Save Inventory Item
  document.getElementById('saveInventoryBtn')?.addEventListener('click', async function() {
    const inventoryData = {
      partNumber: document.getElementById('partNumber').value,
      partName: document.getElementById('partName').value,
      equipment: document.getElementById('equipmentForPart').value,
      category: document.getElementById('partCategory').value,
      quantity: parseInt(document.getElementById('quantity').value) || 0,
      minQuantity: parseInt(document.getElementById('minQuantity').value) || 1,
      unit: document.getElementById('unit').value,
      supplier: document.getElementById('supplier').value,
      supplierContact: document.getElementById('supplierContact').value,
      notes: document.getElementById('partNotes').value,
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('inventory').add(inventoryData);
      showToast('Inventory item saved successfully!');
      document.getElementById('inventoryForm').reset();
      bootstrap.Modal.getInstance(document.getElementById('addInventoryModal')).hide();
      loadInventory();
    } catch (error) {
      console.error("Error saving inventory:", error);
      showToast('Failed to save inventory item', 'danger');
    }
  });

  // Generate Report
  document.getElementById('reportForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const equipmentFilter = document.getElementById('equipmentFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    // In a real app, you would generate a report based on these filters
    showToast(`Report generated for ${reportType} from ${dateFrom} to ${dateTo}`);
    console.log('Generating report with filters:', {
      reportType, dateFrom, dateTo, equipmentFilter, statusFilter, priorityFilter
    });
  });

  // Export to Excel
  document.getElementById('exportExcelBtn')?.addEventListener('click', function() {
    showToast('Export to Excel functionality would be implemented here');
    console.log('Exporting to Excel...');
  });
});

// Load dashboard data
function loadDashboardData() {
  // Equipment counts
  db.collection('equipment').get().then(snapshot => {
    document.getElementById('totalEquipment').textContent = snapshot.size;
    
    const activeCount = snapshot.docs.filter(doc => 
      doc.data().status === 'active').length;
    document.getElementById('activeEquipment').textContent = activeCount;
  });

  // Maintenance counts
  db.collection('maintenance').where('status', '==', 'scheduled').get()
    .then(snapshot => {
      document.getElementById('pendingMaintenance').textContent = snapshot.size;
    });

  // Critical alerts
  db.collection('maintenance').where('priority', '==', 'high').get()
    .then(snapshot => {
      document.getElementById('criticalAlerts').textContent = snapshot.size;
    });

  // Recent activities
  db.collection('maintenance').orderBy('createdAt', 'desc').limit(5).get()
    .then(snapshot => {
      const activitiesContainer = document.getElementById('recentActivities');
      activitiesContainer.innerHTML = '';
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item mb-3';
        activityItem.innerHTML = `
          <div class="d-flex justify-content-between">
            <strong>${data.type} maintenance</strong>
            <small class="text-muted">${new Date(data.createdAt).toLocaleString()}</small>
          </div>
          <div>${data.equipmentName}</div>
          <div class="text-muted">Scheduled: ${data.scheduledDate}</div>
        `;
        activitiesContainer.appendChild(activityItem);
      });
    });
}

// Load equipment data
function loadEquipment() {
  db.collection('equipment').get().then(snapshot => {
    const tableBody = document.querySelector('#equipmentTable tbody');
    tableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${doc.id.substring(0, 8)}</td>
        <td>${data.name}</td>
        <td>${data.model}</td>
        <td>${data.serialNumber}</td>
        <td>${data.manufacturer}</td>
        <td>${data.location}</td>
        <td><span class="badge ${getStatusBadgeClass(data.status)}">${data.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-equipment" data-id="${doc.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary edit-equipment" data-id="${doc.id}">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // Populate equipment dropdowns in other forms
    populateEquipmentDropdowns();
  });
}

// Load maintenance data
function loadMaintenance() {
  db.collection('maintenance').get().then(snapshot => {
    const tableBody = document.querySelector('#maintenanceTable tbody');
    tableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${doc.id.substring(0, 8)}</td>
        <td>${data.equipmentName}</td>
        <td>${data.type}</td>
        <td>${data.scheduledDate}</td>
        <td><span class="badge ${getStatusBadgeClass(data.status)}">${data.status}</span></td>
        <td>${data.assignedTo}</td>
        <td><span class="badge ${getPriorityBadgeClass(data.priority)}">${data.priority}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-maintenance" data-id="${doc.id}">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// Load inventory data
function loadInventory() {
  db.collection('inventory').get().then(snapshot => {
    const tableBody = document.querySelector('#inventoryTable tbody');
    tableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const status = data.quantity <= data.minQuantity ? 'Low Stock' : 'In Stock';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${data.partNumber}</td>
        <td>${data.partName}</td>
        <td>${data.equipment}</td>
        <td>${data.category}</td>
        <td>${data.quantity} ${data.unit}</td>
        <td>${data.minQuantity}</td>
        <td><span class="badge ${status === 'Low Stock' ? 'bg-warning' : 'bg-success'}">${status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-inventory" data-id="${doc.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary edit-inventory" data-id="${doc.id}">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// Helper functions
function getStatusBadgeClass(status) {
  switch(status.toLowerCase()) {
    case 'active': return 'bg-success';
    case 'inactive': return 'bg-secondary';
    case 'maintenance': return 'bg-warning';
    case 'completed': return 'bg-success';
    case 'scheduled': return 'bg-info';
    case 'in-progress': return 'bg-primary';
    case 'cancelled': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

function getPriorityBadgeClass(priority) {
  switch(priority.toLowerCase()) {
    case 'high': return 'bg-danger';
    case 'medium': return 'bg-warning';
    case 'low': return 'bg-success';
    default: return 'bg-secondary';
  }
}

function populateEquipmentDropdowns() {
  db.collection('equipment').get().then(snapshot => {
    const dropdowns = [
      document.getElementById('maintenanceEquipment'),
      document.getElementById('equipmentForPart'),
      document.getElementById('equipmentFilter')
    ];
    
    dropdowns.forEach(dropdown => {
      if (!dropdown) return;
      
      // Clear existing options except the first one
      while (dropdown.options.length > 1) {
        dropdown.remove(1);
      }
      
      // Add equipment options
      snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${data.name} (${data.model})`;
        dropdown.appendChild(option);
      });
    });
  });
}

function loadUserSettings() {
  const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
  
  document.getElementById('notificationPref').value = savedSettings.notifications || 'important';
  document.getElementById('themePref').value = savedSettings.theme || 'light';
  document.getElementById('emailNotifications').checked = savedSettings.emailNotifications !== false;
  document.getElementById('smsNotifications').checked = savedSettings.smsNotifications || false;
  document.getElementById('timezonePref').value = savedSettings.timezone || 'EST';
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
}

function showToast(message, type = 'success') {
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${type}`;
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

// Check authentication state and display user info
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    // Update profile modal fields
    document.getElementById("userName").textContent = user.displayName || "N/A";
    document.getElementById("userEmail").textContent = user.email || "N/A";
    document.getElementById("userPhone").textContent = user.phoneNumber || "Not Provided";
    document.getElementById("userRole").textContent = "Biomedical Engineer"; // You can change this if dynamic
    document.getElementById("userDepartment").textContent = "Biomedical Equipment Services";
    if (user.metadata?.lastSignInTime) {
      document.getElementById("userLastLogin").textContent = new Date(user.metadata.lastSignInTime).toLocaleString();
    }

    // Load data after login
    loadDashboardData();
    loadEquipment();
    loadMaintenance();
    loadInventory();
  }
});
// Generate Report
  document.getElementById('reportForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const equipmentFilter = document.getElementById('equipmentFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    const reportResults = document.getElementById('reportResults');
    reportResults.innerHTML = '<p>Loading...</p>';

    try {
      let query;
      if (reportType === 'maintenance') {
        query = db.collection('maintenance');
        if (statusFilter !== 'all') query = query.where('status', '==', statusFilter);
        if (priorityFilter !== 'all') query = query.where('priority', '==', priorityFilter);
        const snapshot = await query.get();
        let html = '<h5>Maintenance Report</h5><table class="table"><thead><tr><th>Equipment</th><th>Type</th><th>Status</th><th>Date</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
          const d = doc.data();
          html += `<tr><td>${d.equipmentName}</td><td>${d.type}</td><td>${d.status}</td><td>${d.scheduledDate}</td></tr>`;
        });
        html += '</tbody></table>';
        reportResults.innerHTML = html;
      } else if (reportType === 'equipment') {
        query = db.collection('equipment');
        const snapshot = await query.get();
        let html = '<h5>Equipment Report</h5><table class="table"><thead><tr><th>Name</th><th>Model</th><th>Status</th><th>Location</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
          const d = doc.data();
          html += `<tr><td>${d.name}</td><td>${d.model}</td><td>${d.status}</td><td>${d.location}</td></tr>`;
        });
        html += '</tbody></table>';
        reportResults.innerHTML = html;
      } else if (reportType === 'inventory') {
        query = db.collection('inventory');
        const snapshot = await query.get();
        let html = '<h5>Inventory Report</h5><table class="table"><thead><tr><th>Part No</th><th>Name</th><th>Category</th><th>Quantity</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
          const d = doc.data();
          html += `<tr><td>${d.partNumber}</td><td>${d.partName}</td><td>${d.category}</td><td>${d.quantity}</td></tr>`;
        });
        html += '</tbody></table>';
        reportResults.innerHTML = html;
      } else if (reportType === 'downtime') {
        reportResults.innerHTML = '<p>Downtime analysis report not yet implemented.</p>';
      }
    } catch (err) {
      console.error("Report error:", err);
      reportResults.innerHTML = '<p class="text-danger">Failed to generate report.</p>';
    }
  });





