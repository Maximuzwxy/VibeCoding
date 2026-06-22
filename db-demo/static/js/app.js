// API Base URL
const API_URL = '/api/items';

// DOM Elements
const crudForm = document.getElementById('crud-form');
const itemIdInput = document.getElementById('item-id');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const itemsTableBody = document.getElementById('items-table-body');
const viewJsonBtn = document.getElementById('view-json-btn');
const jsonModal = document.getElementById('json-modal');
const jsonContent = document.getElementById('json-content');
const modalClose = document.getElementById('modal-close');

// Load all items on page load
document.addEventListener('DOMContentLoaded', loadItems);

// Form submit event
crudForm.addEventListener('submit', handleSubmit);

// Cancel button event
cancelBtn.addEventListener('click', resetForm);

// View JSON button event
viewJsonBtn.addEventListener('click', viewJsonData);

// Close modal event
modalClose.addEventListener('click', closeModal);

// Click outside modal to close
jsonModal.addEventListener('click', function(e) {
    if (e.target === jsonModal) {
        closeModal();
    }
});

/**
 * Load all items
 */
async function loadItems() {
    try {
        const response = await fetch(API_URL);
        const items = await response.json();
        renderItems(items);
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

/**
 * Render items list (table format)
 */
function renderItems(items) {
    if (items.length === 0) {
        itemsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">No data yet, please add a new record</td>
            </tr>
        `;
        return;
    }

    itemsTableBody.innerHTML = items.map(item => `
        <tr data-id="${item.id}">
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.phone}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editItem(${item.id}, '${escapeHtml(item.name)}', '${escapeHtml(item.email)}', '${escapeHtml(item.phone)}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteItem(${item.id})">
                        🗑️ Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * HTML escape to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle form submit
 */
async function handleSubmit(e) {
    e.preventDefault();

    const itemData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    const itemId = itemIdInput.value;

    try {
        if (itemId) {
            // Update operation
            await fetch(`${API_URL}/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
        } else {
            // Create operation
            await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
        }

        resetForm();
        loadItems();
    } catch (error) {
        console.error('Operation failed:', error);
    }
}

/**
 * Edit item
 */
function editItem(id, name, email, phone) {
    itemIdInput.value = id;
    nameInput.value = name;
    emailInput.value = email;
    phoneInput.value = phone;

    submitBtn.textContent = 'Update';
    formTitle.textContent = '✏️ Edit Record';
    cancelBtn.style.display = 'inline-block';

    // Scroll to form section
    document.querySelector('.form-section').scrollIntoView({
        behavior: 'smooth'
    });
}

/**
 * Delete item
 */
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        loadItems();
    } catch (error) {
        console.error('Delete failed:', error);
    }
}

/**
 * Reset form
 */
function resetForm() {
    itemIdInput.value = '';
    nameInput.value = '';
    emailInput.value = '';
    phoneInput.value = '';

    submitBtn.textContent = 'Add';
    formTitle.textContent = '➕ Add New Record';
    cancelBtn.style.display = 'none';
}

/**
 * View JSON data
 */
async function viewJsonData() {
    try {
        const response = await fetch(API_URL);
        const items = await response.json();
        jsonContent.textContent = JSON.stringify(items, null, 2);
        jsonModal.classList.add('active');
    } catch (error) {
        console.error('Failed to load JSON:', error);
    }
}

/**
 * Close modal
 */
function closeModal() {
    jsonModal.classList.remove('active');
}