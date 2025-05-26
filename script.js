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
    // Update profile modal fields
    document.getElementById("userName").textContent = user.displayName || "N/A";
    document.getElementById("userEmail").textContent = user.email || "N/A";
    document.getElementById("userPhone").textContent = user.phoneNumber || "Not Provided";
    document.getElementById("userRole").textContent = "Biomedical Engineer"; // You can change this if dynamic
    document.getElementById("userDepartment").textContent = "Biomedical Equipment Services";
    if (user.metadata?.lastSignInTime) {
      document.getElementById("userLastLogin").textContent = new Date(user.metadata.lastSignInTime).toLocaleString();
    }
    // Load data when user is authenticated
    loadDashboardData();
    loadEquipment();
    loadMaintenance();
    loadInventory();
    populateEquipmentDropdowns();
    populateAssignedToDropdown(); // Populate assignedTo dropdown
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
    loadUserSettings(); // Load user settings when modal is opened
    new bootstrap.Modal(document.getElementById('settingsModal')).show();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById('logoutModal')).show();
  });

  document.getElementById('saveSettingsBtn')?.addEventListener('click', function() {
    saveUserSettings(); // Save user settings
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
      populateEquipmentDropdowns(); // Update dropdowns after adding new equipment
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
      reportType,
      dateFrom,
      dateTo,
      equipmentFilter,
      statusFilter,
      priorityFilter
    });
  });

  // Export to Excel
  document.getElementById('exportExcelBtn')?.addEventListener('click', function() {
    showToast('Export to Excel functionality would be implemented here');
    console.log('Exporting to Excel...');
  });

  // Show Toast Messages
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
  new bootstrap.Toast(toastEl).show();
}

// Generate Report Data with Filters
async function generateReportData(filters) {
  const { reportType, dateFrom, dateTo, equipmentFilter, statusFilter, priorityFilter } = filters;

  let collectionName = reportType;
  let query = db.collection(collectionName);

  if (equipmentFilter) query = query.where("equipmentId", "==", equipmentFilter);
  if (statusFilter) query = query.where("status", "==", statusFilter);
  if (priorityFilter && collectionName === 'maintenance') query = query.where("priority", "==", priorityFilter);

  const snapshot = await query.get();

  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(doc => {
      const date = new Date(doc.createdAt || doc.scheduledDate || doc.purchaseDate || '');
      if (dateFrom && new Date(dateFrom) > date) return false;
      if (dateTo && new Date(dateTo) < date) return false;
      return true;
    });

  return data;
}

// Handle Generate Report
const reportForm = document.getElementById('reportForm');
reportForm?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const filters = {
    reportType: document.getElementById('reportType').value,
    dateFrom: document.getElementById('dateFrom').value,
    dateTo: document.getElementById('dateTo').value,
    equipmentFilter: document.getElementById('equipmentFilter').value,
    statusFilter: document.getElementById('statusFilter').value,
    priorityFilter: document.getElementById('priorityFilter').value
  };

  try {
    const data = await generateReportData(filters);
    window.latestReportData = data;
    showToast(`Report generated with ${data.length} record(s).`);
    console.log('Generated Report Data:', data);

    const tableHeaders = document.getElementById('reportHeaders');
    const tableBody = document.getElementById('reportBody');
    const reportContainer = document.getElementById('reportResults');

    // Clear previous results
    tableHeaders.innerHTML = '';
    tableBody.innerHTML = '';
    reportContainer.classList.remove('d-none');

    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        tableHeaders.appendChild(th);
      });

      data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
          const td = document.createElement('td');
          td.textContent = row[col] ?? '';
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
    } else {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No results found.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    showToast('Error generating report', 'danger');
  }
});

// Handle Export to Excel
const exportBtn = document.getElementById('exportExcelBtn');
exportBtn?.addEventListener('click', function () {
  const reportType = document.getElementById('reportType').value;
  const data = window.latestReportData;

  if (!data || data.length === 0) {
    showToast('Please generate a report first.', 'warning');
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
    XLSX.writeFile(workbook, `${reportType}_report.xlsx`);
    showToast('Excel file downloaded.');
  } catch (error) {
    console.error('Error exporting Excel:', error);
    showToast('Export failed.', 'danger');
  }
});

  // View Equipment Details
  document.querySelector('#equipmentTable tbody')?.addEventListener('click', async function(e) {
    if (e.target.closest('.view-equipment')) {
      const id = e.target.closest('.view-equipment').dataset.id;
      const doc = await db.collection('equipment').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('detailEquipName').textContent = data.name;
        document.getElementById('detailEquipModel').textContent = data.model;
        document.getElementById('detailEquipSerial').textContent = data.serialNumber;
        document.getElementById('detailEquipManufacturer').textContent = data.manufacturer;
        document.getElementById('detailEquipLocation').textContent = data.location;
        document.getElementById('detailEquipStatus').textContent = data.status;
        document.getElementById('detailEquipPurchaseDate').textContent = data.purchaseDate;
        document.getElementById('detailEquipInstallDate').textContent = data.installationDate;
        document.getElementById('detailEquipWarranty').textContent = `${data.warrantyStart} - ${data.warrantyEnd}`;
        document.getElementById('detailEquipContract').textContent = `${data.contractStart} - ${data.contractEnd}`;
        document.getElementById('detailEquipNotes').textContent = data.notes;
        document.getElementById('detailEquipCritical').textContent = data.isCritical ? 'Yes' : 'No';
        new bootstrap.Modal(document.getElementById('viewEquipmentModal')).show();
      }
    } else if (e.target.closest('.edit-equipment')) {
      const id = e.target.closest('.edit-equipment').dataset.id;
      const doc = await db.collection('equipment').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('editEquipmentId').value = id;
        document.getElementById('editEquipmentName').value = data.name;
        document.getElementById('editEquipmentModel').value = data.model;
        document.getElementById('editSerialNumber').value = data.serialNumber;
        document.getElementById('editManufacturer').value = data.manufacturer;
        document.getElementById('editPurchaseDate').value = data.purchaseDate;
        document.getElementById('editInstallationDate').value = data.installationDate;
        document.getElementById('editLocation').value = data.location;
        document.getElementById('editStatus').value = data.status;
        document.getElementById('editNotes').value = data.notes;
        document.getElementById('editWarrantyStart').value = data.warrantyStart;
        document.getElementById('editWarrantyEnd').value = data.warrantyEnd;
        document.getElementById('editContractStart').value = data.contractStart;
        document.getElementById('editContractEnd').value = data.contractEnd;
        document.getElementById('editCriticalEquipment').checked = data.isCritical;
        new bootstrap.Modal(document.getElementById('editEquipmentModal')).show();
      }
    } else if (e.target.closest('.delete-equipment')) {
      const id = e.target.closest('.delete-equipment').dataset.id;
      document.getElementById('confirmationMessage').textContent = 'Are you sure you want to delete this equipment record?';
      const confirmBtn = document.getElementById('confirmActionBtn');
      confirmBtn.onclick = async () => {
        try {
          await db.collection('equipment').doc(id).delete();
          showToast('Equipment deleted successfully!');
          bootstrap.Modal.getInstance(document.getElementById('confirmationModal')).hide();
          loadEquipment();
          populateEquipmentDropdowns();
        } catch (error) {
          console.error("Error deleting equipment:", error);
          showToast('Failed to delete equipment', 'danger');
        }
      };
      new bootstrap.Modal(document.getElementById('confirmationModal')).show();
    }
  });

  // Save Edited Equipment
  document.getElementById('saveEditedEquipmentBtn')?.addEventListener('click', async function() {
    const id = document.getElementById('editEquipmentId').value;
    const equipmentData = {
      name: document.getElementById('editEquipmentName').value,
      model: document.getElementById('editEquipmentModel').value,
      serialNumber: document.getElementById('editSerialNumber').value,
      manufacturer: document.getElementById('editManufacturer').value,
      purchaseDate: document.getElementById('editPurchaseDate').value,
      installationDate: document.getElementById('editInstallationDate').value,
      location: document.getElementById('editLocation').value,
      status: document.getElementById('editStatus').value,
      notes: document.getElementById('editNotes').value,
      warrantyStart: document.getElementById('editWarrantyStart').value,
      warrantyEnd: document.getElementById('editWarrantyEnd').value,
      contractStart: document.getElementById('editContractStart').value,
      contractEnd: document.getElementById('editContractEnd').value,
      isCritical: document.getElementById('editCriticalEquipment').checked,
    };
    try {
      await db.collection('equipment').doc(id).update(equipmentData);
      showToast('Equipment updated successfully!');
      bootstrap.Modal.getInstance(document.getElementById('editEquipmentModal')).hide();
      loadEquipment();
      populateEquipmentDropdowns();
    } catch (error) {
      console.error("Error updating equipment:", error);
      showToast('Failed to update equipment', 'danger');
    }
  });


  // View Maintenance Details
  document.querySelector('#maintenanceTable tbody')?.addEventListener('click', async function(e) {
    if (e.target.closest('.view-maintenance')) {
      const id = e.target.closest('.view-maintenance').dataset.id;
      const doc = await db.collection('maintenance').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('detailEquipment').textContent = data.equipmentName;
        document.getElementById('detailType').textContent = data.type;
        document.getElementById('detailScheduledDate').textContent = data.scheduledDate;
        document.getElementById('detailStatus').textContent = data.status;
        document.getElementById('detailAssignedTo').textContent = data.assignedTo;
        document.getElementById('detailPriority').textContent = data.priority;
        document.getElementById('detailEstimatedDuration').textContent = data.estimatedDuration + ' hours';
        document.getElementById('detailMaintenanceNotes').textContent = data.notes;

        const detailPartsBody = document.getElementById('detailPartsTableBody');
        detailPartsBody.innerHTML = '';
        data.parts.forEach(part => {
          const row = detailPartsBody.insertRow();
          row.innerHTML = `
            <td>${part.partNumber}</td>
            <td>${part.description}</td>
            <td>${part.quantity}</td>
          `;
        });
        new bootstrap.Modal(document.getElementById('maintenanceDetailsModal')).show();
      }
    } else if (e.target.closest('.edit-maintenance')) {
      const id = e.target.closest('.edit-maintenance').dataset.id;
      const doc = await db.collection('maintenance').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('editMaintenanceId').value = id;
        document.getElementById('editMaintenanceEquipment').value = data.equipmentId;
        document.getElementById('editMaintenanceType').value = data.type;
        document.getElementById('editScheduledDate').value = data.scheduledDate;
        document.getElementById('editPriority').value = data.priority;
        document.getElementById('editAssignedTo').value = data.assignedTo;
        document.getElementById('editEstimatedDuration').value = data.estimatedDuration;
        document.getElementById('editMaintenanceNotes').value = data.notes;

        const editPartsTableBody = document.getElementById('editPartsTableBody');
        editPartsTableBody.innerHTML = '';
        data.parts.forEach(part => {
          const newRow = editPartsTableBody.insertRow();
          newRow.innerHTML = `
            <td><input type="text" class="form-control form-control-sm edit-part-number" value="${part.partNumber}"></td>
            <td><input type="text" class="form-control form-control-sm edit-part-desc" value="${part.description}"></td>
            <td><input type="number" class="form-control form-control-sm edit-part-qty" min="1" value="${part.quantity}"></td>
            <td><button class="btn btn-sm btn-outline-danger remove-part"><i class="fas fa-times"></i></button></td>
          `;
          newRow.querySelector('.remove-part').addEventListener('click', function() {
            editPartsTableBody.removeChild(newRow);
          });
        });

        new bootstrap.Modal(document.getElementById('editMaintenanceModal')).show();
      }
    } else if (e.target.closest('.delete-maintenance')) {
      const id = e.target.closest('.delete-maintenance').dataset.id;
      document.getElementById('confirmationMessage').textContent = 'Are you sure you want to delete this maintenance record?';
      const confirmBtn = document.getElementById('confirmActionBtn');
      confirmBtn.onclick = async () => {
        try {
          await db.collection('maintenance').doc(id).delete();
          showToast('Maintenance record deleted successfully!');
          bootstrap.Modal.getInstance(document.getElementById('confirmationModal')).hide();
          loadMaintenance();
        } catch (error) {
          console.error("Error deleting maintenance:", error);
          showToast('Failed to delete maintenance', 'danger');
        }
      };
      new bootstrap.Modal(document.getElementById('confirmationModal')).show();
    }
  });

  // Save Edited Maintenance
  document.getElementById('saveEditedMaintenanceBtn')?.addEventListener('click', async function() {
    const id = document.getElementById('editMaintenanceId').value;
    const parts = [];
    document.querySelectorAll('#editPartsTableBody tr').forEach(row => {
      parts.push({
        partNumber: row.querySelector('.edit-part-number').value,
        description: row.querySelector('.edit-part-desc').value,
        quantity: parseInt(row.querySelector('.edit-part-qty').value) || 1
      });
    });

    const maintenanceData = {
      equipmentId: document.getElementById('editMaintenanceEquipment').value,
      equipmentName: document.getElementById('editMaintenanceEquipment').options[document.getElementById('editMaintenanceEquipment').selectedIndex].text,
      type: document.getElementById('editMaintenanceType').value,
      scheduledDate: document.getElementById('editScheduledDate').value,
      priority: document.getElementById('editPriority').value,
      assignedTo: document.getElementById('editAssignedTo').value,
      estimatedDuration: parseInt(document.getElementById('editEstimatedDuration').value) || 1,
      notes: document.getElementById('editMaintenanceNotes').value,
      parts: parts,
    };
    try {
      await db.collection('maintenance').doc(id).update(maintenanceData);
      showToast('Maintenance updated successfully!');
      bootstrap.Modal.getInstance(document.getElementById('editMaintenanceModal')).hide();
      loadMaintenance();
    } catch (error) {
      console.error("Error updating maintenance:", error);
      showToast('Failed to update maintenance', 'danger');
    }
  });

  // Add Part to Edit Maintenance
  document.getElementById('addPartToEditBtn')?.addEventListener('click', function() {
    const partsTable = document.getElementById('editPartsTableBody');
    const newRow = partsTable.insertRow();

    newRow.innerHTML = `
      <td><input type="text" class="form-control form-control-sm edit-part-number" placeholder="Part No."></td>
      <td><input type="text" class="form-control form-control-sm edit-part-desc" placeholder="Description"></td>
      <td><input type="number" class="form-control form-control-sm edit-part-qty" min="1" value="1"></td>
      <td><button class="btn btn-sm btn-outline-danger remove-part"><i class="fas fa-times"></i></button></td>
    `;

    newRow.querySelector('.remove-part').addEventListener('click', function() {
      partsTable.removeChild(newRow);
    });
  });


  // View Inventory Details
  document.querySelector('#inventoryTable tbody')?.addEventListener('click', async function(e) {
    if (e.target.closest('.view-inventory')) {
      const id = e.target.closest('.view-inventory').dataset.id;
      const doc = await db.collection('inventory').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('detailPartNumber').textContent = data.partNumber;
        document.getElementById('detailPartName').textContent = data.partName;
        document.getElementById('detailEquipmentForPart').textContent = data.equipment;
        document.getElementById('detailPartCategory').textContent = data.category;
        document.getElementById('detailQuantity').textContent = data.quantity;
        document.getElementById('detailMinQuantity').textContent = data.minQuantity;
        document.getElementById('detailUnit').textContent = data.unit;
        document.getElementById('detailSupplier').textContent = data.supplier;
        document.getElementById('detailSupplierContact').textContent = data.supplierContact;
        document.getElementById('detailPartNotes').textContent = data.notes;
        new bootstrap.Modal(document.getElementById('viewInventoryModal')).show();
      }
    } else if (e.target.closest('.edit-inventory')) {
      const id = e.target.closest('.edit-inventory').dataset.id;
      const doc = await db.collection('inventory').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('editInventoryId').value = id;
        document.getElementById('editPartNumber').value = data.partNumber;
        document.getElementById('editPartName').value = data.partName;
        document.getElementById('editEquipmentForPart').value = data.equipment;
        document.getElementById('editPartCategory').value = data.category;
        document.getElementById('editQuantity').value = data.quantity;
        document.getElementById('editMinQuantity').value = data.minQuantity;
        document.getElementById('editUnit').value = data.unit;
        document.getElementById('editSupplier').value = data.supplier;
        document.getElementById('editSupplierContact').value = data.supplierContact;
        document.getElementById('editPartNotes').value = data.notes;
        new bootstrap.Modal(document.getElementById('editInventoryModal')).show();
      }
    } else if (e.target.closest('.delete-inventory')) {
      const id = e.target.closest('.delete-inventory').dataset.id;
      document.getElementById('confirmationMessage').textContent = 'Are you sure you want to delete this inventory item?';
      const confirmBtn = document.getElementById('confirmActionBtn');
      confirmBtn.onclick = async () => {
        try {
          await db.collection('inventory').doc(id).delete();
          showToast('Inventory item deleted successfully!');
          bootstrap.Modal.getInstance(document.getElementById('confirmationModal')).hide();
          loadInventory();
        } catch (error) {
          console.error("Error deleting inventory:", error);
          showToast('Failed to delete inventory item', 'danger');
        }
      };
      new bootstrap.Modal(document.getElementById('confirmationModal')).show();
    }
  });

  // Save Edited Inventory
  document.getElementById('saveEditedInventoryBtn')?.addEventListener('click', async function() {
    const id = document.getElementById('editInventoryId').value;
    const inventoryData = {
      partNumber: document.getElementById('editPartNumber').value,
      partName: document.getElementById('editPartName').value,
      equipment: document.getElementById('editEquipmentForPart').value,
      category: document.getElementById('editPartCategory').value,
      quantity: parseInt(document.getElementById('editQuantity').value) || 0,
      minQuantity: parseInt(document.getElementById('editMinQuantity').value) || 1,
      unit: document.getElementById('editUnit').value,
      supplier: document.getElementById('editSupplier').value,
      supplierContact: document.getElementById('editSupplierContact').value,
      notes: document.getElementById('editPartNotes').value,
    };
    try {
      await db.collection('inventory').doc(id).update(inventoryData);
      showToast('Inventory item updated successfully!');
      bootstrap.Modal.getInstance(document.getElementById('editInventoryModal')).hide();
      loadInventory();
    } catch (error) {
      console.error("Error updating inventory:", error);
      showToast('Failed to update inventory item', 'danger');
    }
  });


  // Maintenance type filters
  document.getElementById('showAllMaintenance')?.addEventListener('click', () => loadMaintenance('all'));
  document.getElementById('showPreventive')?.addEventListener('click', () => loadMaintenance('preventive'));
  document.getElementById('showCorrective')?.addEventListener('click', () => loadMaintenance('corrective'));
  document.getElementById('showCalibration')?.addEventListener('click', () => loadMaintenance('calibration'));

  // Inventory filters
  document.getElementById('showAllInventory')?.addEventListener('click', () => loadInventory('all'));
  document.getElementById('showFastMoving')?.addEventListener('click', () => loadInventory('fast-moving'));
  document.getElementById('showSlowMoving')?.addEventListener('click', () => loadInventory('slow-moving'));
  document.getElementById('showLowStock')?.addEventListener('click', () => loadInventory('low-stock'));


});

// Global functions
function showToast(message, type = 'success') {
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
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
  new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 3000
  }).show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Load dashboard data
function loadDashboardData() {
  // EQUIPMENT
  db.collection('equipment').get().then(snapshot => {
    const equipmentArray = snapshot.docs.map(doc => doc.data());
    renderEquipmentStatusChart(equipmentArray);
    document.getElementById('totalEquipment').textContent = snapshot.size;

    const activeCount = snapshot.docs.filter(doc =>
      doc.data().status === 'active').length;
    document.getElementById('activeEquipment').textContent = activeCount;
  }).catch(error => {
    console.error("Error loading equipment data for dashboard:", error);
  });

  // MAINTENANCE
  db.collection('maintenance').get().then(snapshot => {
    const maintenanceArray = snapshot.docs.map(doc => doc.data());
    renderMaintenanceTrendsChart(maintenanceArray);

    document.getElementById('pendingMaintenance').textContent =
      maintenanceArray.filter(m => m.status === 'scheduled').length;

    document.getElementById('criticalAlerts').textContent =
      maintenanceArray.filter(m => m.priority === 'high' && m.status === 'scheduled').length;

    // Recent activities
    const recentActivities = maintenanceArray
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const activitiesContainer = document.getElementById('recentActivities');
    if (activitiesContainer) {
      activitiesContainer.innerHTML = '';
      recentActivities.forEach(item => {
        const div = document.createElement('div');
        div.className = 'activity-item mb-3';
        div.innerHTML = `
          <div class="d-flex justify-content-between">
            <strong>${item.type} Maintenance</strong>
            <small class="text-muted">${new Date(item.createdAt).toLocaleString()}</small>
          </div>
          <div>${item.equipmentName}</div>
          <div class="text-muted">Scheduled: ${item.scheduledDate}</div>
        `;
        activitiesContainer.appendChild(div);
      });
    }

    // Upcoming Maintenance
    const upcoming = maintenanceArray
      .filter(m => m.status === 'scheduled' && new Date(m.scheduledDate) > new Date())
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    const upcomingContainer = document.getElementById('upcomingMaintenance');
    if (upcomingContainer) {
      upcomingContainer.innerHTML = '';
      upcoming.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'upcoming-item mb-2';
        div.innerHTML = `
          <div class="fw-bold">${item.equipmentName}</div>
          <div class="text-muted">Type: ${item.type} | Date: ${item.scheduledDate}</div>
        `;
        upcomingContainer.appendChild(div);
      });
    }

  }).catch(error => {
    console.error("Error loading maintenance data:", error);
  });

  // INVENTORY
  db.collection('inventory').get().then(snapshot => {
    document.getElementById('totalInventoryItems').textContent = snapshot.size;
  }).catch(error => {
    console.error("Error loading inventory data:", error);
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
          <button class="btn btn-sm btn-outline-danger delete-equipment" data-id="${doc.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error("Error loading equipment:", error);
    showToast('Failed to load equipment', 'danger');
  });
}

// Helper to get status badge class
function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-success';
    case 'inactive':
      return 'bg-secondary';
    case 'under maintenance':
      return 'bg-warning';
    default:
      return 'bg-info';
  }
}

function getPriorityBadgeClass(priority) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-danger';
    case 'medium':
      return 'bg-warning';
    case 'low':
      return 'bg-info';
    default:
      return 'bg-secondary';
  }
}


// Load maintenance data with optional filter
function loadMaintenance(filter = 'all') {
  let query = db.collection('maintenance');

  if (filter !== 'all') {
    query = query.where('type', '==', filter);
  }

  query.get().then(snapshot => {
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
          <button class="btn btn-sm btn-outline-secondary edit-maintenance" data-id="${doc.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-maintenance" data-id="${doc.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error("Error loading maintenance:", error);
    showToast('Failed to load maintenance records', 'danger');
  });

  // Update active button state for maintenance filters
  document.querySelectorAll('#maintenance .btn-group .btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`show${filter.charAt(0).toUpperCase() + filter.slice(1)}`)?.classList.add('active');
}

// Load inventory data with optional filter
function loadInventory(filter = 'all') {
  let query = db.collection('inventory');

  query.get().then(snapshot => {
    let filteredDocs = snapshot.docs;

    if (filter === 'low-stock') {
      filteredDocs = snapshot.docs.filter(doc => doc.data().quantity <= doc.data().minQuantity);
    } else if (filter === 'fast-moving') {
      // This would require more complex logic and data (e.g., historical usage)
      // For now, it's a placeholder. You'd implement based on your definition of 'fast-moving'
      showToast('Fast Moving inventory filter is a placeholder and requires usage data.', 'info');
    } else if (filter === 'slow-moving') {
      // Similar to fast-moving, requires usage data
      showToast('Slow Moving inventory filter is a placeholder and requires usage data.', 'info');
    }

    const tableBody = document.querySelector('#inventoryTable tbody');
    tableBody.innerHTML = '';
    filteredDocs.forEach(doc => {
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
          <button class="btn btn-sm btn-outline-danger delete-inventory" data-id="${doc.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error("Error loading inventory:", error);
    showToast('Failed to load inventory records', 'danger');
  });

  // Update active button state for inventory filters
  document.querySelectorAll('#inventory .btn-group .btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`show${filter.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}`)?.classList.add('active');
}

// Populate equipment dropdowns for forms
function populateEquipmentDropdowns() {
  db.collection('equipment').get().then(snapshot => {
    const maintenanceEquipmentSelect = document.getElementById('maintenanceEquipment');
    const editMaintenanceEquipmentSelect = document.getElementById('editMaintenanceEquipment');
    const equipmentForPartSelect = document.getElementById('equipmentForPart');
    const editEquipmentForPartSelect = document.getElementById('editEquipmentForPart');
    const equipmentFilterSelect = document.getElementById('equipmentFilter');

    // Clear existing options, keep the first "Select..." option if any
    [maintenanceEquipmentSelect, editMaintenanceEquipmentSelect, equipmentForPartSelect, editEquipmentForPartSelect, equipmentFilterSelect].forEach(select => {
      if (select) {
        // Store the first option if it's a placeholder
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (firstOption) {
          select.appendChild(firstOption);
        } else {
          // If no placeholder, add a default one for better UX
          const defaultOption = document.createElement('option');
          defaultOption.value = "";
          defaultOption.textContent = "Select Equipment";
          select.appendChild(defaultOption);
        }
      }
    });


    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = data.name;

      if (maintenanceEquipmentSelect) maintenanceEquipmentSelect.appendChild(option.cloneNode(true));
      if (editMaintenanceEquipmentSelect) editMaintenanceEquipmentSelect.appendChild(option.cloneNode(true));
      if (equipmentForPartSelect) equipmentForPartSelect.appendChild(option.cloneNode(true));
      if (editEquipmentForPartSelect) editEquipmentForPartSelect.appendChild(option.cloneNode(true));
      if (equipmentFilterSelect) equipmentFilterSelect.appendChild(option.cloneNode(true));
    });
  }).catch(error => {
    console.error("Error populating equipment dropdowns:", error);
  });
}

// Populate Assigned To dropdown
function populateAssignedToDropdown() {
  const assignedToSelect = document.getElementById('assignedTo');
  const editAssignedToSelect = document.getElementById('editAssignedTo');

  if (assignedToSelect) {
    const firstOption = assignedToSelect.querySelector('option[value=""]');
    assignedToSelect.innerHTML = '';
    if (firstOption) {
      assignedToSelect.appendChild(firstOption);
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = "";
      defaultOption.textContent = "Select Engineer";
      assignedToSelect.appendChild(defaultOption);
    }
  }

  if (editAssignedToSelect) {
    const firstOption = editAssignedToSelect.querySelector('option[value=""]');
    editAssignedToSelect.innerHTML = '';
    if (firstOption) {
      editAssignedToSelect.appendChild(firstOption);
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = "";
      defaultOption.textContent = "Select Engineer";
      editAssignedToSelect.appendChild(defaultOption);
    }
  }


  // For now, using static engineers. In a real app, you'd fetch from a 'users' collection.
  const engineers = ['John Doe', 'Jane Smith', 'Peter Jones', 'Alice Brown'];

  engineers.forEach(engineer => {
    const option = document.createElement('option');
    option.value = engineer;
    option.textContent = engineer;
    if (assignedToSelect) assignedToSelect.appendChild(option.cloneNode(true));
    if (editAssignedToSelect) editAssignedToSelect.appendChild(option.cloneNode(true));
  });
}

// Render Equipment Status Chart
let equipmentStatusChartInstance = null; // To store the chart instance
function renderEquipmentStatusChart(equipmentData) {
  const ctx = document.getElementById('equipmentStatusChart')?.getContext('2d');
  if (!ctx) return;

  if (equipmentStatusChartInstance) {
    equipmentStatusChartInstance.destroy(); // Destroy existing chart
  }

  const statusCounts = {
    active: 0,
    'under maintenance': 0,
    inactive: 0,
    critical: 0
  };

  equipmentData.forEach(eq => {
    const status = eq.status.toLowerCase();
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
    if (eq.isCritical) statusCounts.critical++;
  });

  equipmentStatusChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Active', 'Under Maintenance', 'Inactive', 'Critical'],
      datasets: [{
        data: [
          statusCounts.active,
          statusCounts['under maintenance'],
          statusCounts.inactive,
          statusCounts.critical
        ],
        backgroundColor: ['#28a745', '#ffc107', '#6c757d', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Render Maintenance Trends Chart
let maintenanceTrendsChartInstance = null; // To store the chart instance
function renderMaintenanceTrendsChart(maintenanceData) {
  const ctx = document.getElementById('maintenanceTrendsChart')?.getContext('2d');
  if (!ctx) return;

  if (maintenanceTrendsChartInstance) {
    maintenanceTrendsChartInstance.destroy(); // Destroy existing chart
  }

  // Aggregate monthly counts by status (scheduled, completed, overdue)
  const countsByMonth = {};
  maintenanceData.forEach(item => {
    const date = new Date(item.scheduledDate);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g., "2023-10"

    if (!countsByMonth[monthKey]) {
      countsByMonth[monthKey] = {
        scheduled: 0,
        completed: 0,
        overdue: 0
      };
    }
    countsByMonth[monthKey].scheduled++;

    if (item.status.toLowerCase() === 'completed') {
      countsByMonth[monthKey].completed++;
    } else if (new Date(item.scheduledDate) < new Date() && item.status.toLowerCase() !== 'completed') {
      countsByMonth[monthKey].overdue++;
    }
  });

  // Sort months
  const sortedMonthKeys = Object.keys(countsByMonth).sort();
  const monthLabels = sortedMonthKeys.map(key => {
    const [year, month] = key.split('-');
    return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })}, ${year}`;
  });

  const scheduledCounts = sortedMonthKeys.map(key => countsByMonth[key].scheduled);
  const completedCounts = sortedMonthKeys.map(key => countsByMonth[key].completed);
  const overdueCounts = sortedMonthKeys.map(key => countsByMonth[key].overdue);


  maintenanceTrendsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Scheduled',
        data: scheduledCounts,
        borderColor: '#0d6efd',
        tension: 0.1
      }, {
        label: 'Completed',
        data: completedCounts,
        borderColor: '#28a745',
        tension: 0.1
      }, {
        label: 'Overdue',
        data: overdueCounts,
        borderColor: '#dc3545',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Maintenances'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        }
      }
    }
  });
}

// User Settings Functions
async function loadUserSettings() {
  const user = auth.currentUser;
  if (user) {
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        const settings = doc.data().settings || {};
        document.getElementById('notificationPref').value = settings.notificationPref || 'all';
        document.getElementById('themePref').value = settings.themePref || 'light';
        document.getElementById('emailNotifications').checked = settings.emailNotifications !== false;
        document.getElementById('smsNotifications').checked = settings.smsNotifications === true;
        document.getElementById('timezonePref').value = settings.timezonePref || 'EST';
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
      showToast('Failed to load settings', 'danger');
    }
  }
}

async function saveUserSettings() {
  const user = auth.currentUser;
  if (user) {
    const settings = {
      notificationPref: document.getElementById('notificationPref').value,
      themePref: document.getElementById('themePref').value,
      emailNotifications: document.getElementById('emailNotifications').checked,
      smsNotifications: document.getElementById('smsNotifications').checked,
      timezonePref: document.getElementById('timezonePref').value
    };
    try {
      // Use set with merge: true to avoid overwriting other user data
      await db.collection('users').doc(user.uid).set({
        settings: settings
      }, {
        merge: true
      });
      showToast('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving user settings:", error);
      showToast('Failed to save settings', 'danger');
    }
  }
}

