/**
 * Candidate Management System - Frontend Application
 * Handles all UI interactions and API communication
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let currentEditId = null;
let confirmCallback = null;

// DOM Elements
const elements = {
    // Table
    candidatesTableBody: document.getElementById('candidatesTableBody'),
    emptyState: document.getElementById('emptyState'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    
    // Search and Filter
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    statusFilter: document.getElementById('statusFilter'),
    
    // Modals
    candidateModal: document.getElementById('candidateModal'),
    confirmModal: document.getElementById('confirmModal'),
    
    // Buttons
    addCandidateBtn: document.getElementById('addCandidateBtn'),
    closeModal: document.getElementById('closeModal'),
    closeConfirmModal: document.getElementById('closeConfirmModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    submitBtn: document.getElementById('submitBtn'),
    cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
    confirmActionBtn: document.getElementById('confirmActionBtn'),
    
    // Form
    candidateForm: document.getElementById('candidateForm'),
    modalTitle: document.getElementById('modalTitle'),
    
    // Messages
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage'),
    
    // Stats
    totalCount: document.getElementById('totalCount'),
    appliedCount: document.getElementById('appliedCount'),
    interviewingCount: document.getElementById('interviewingCount'),
    hiredCount: document.getElementById('hiredCount')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadCandidates();
    loadStatistics();
});

// Event Listeners
function initializeEventListeners() {
    // Add Candidate Button
    elements.addCandidateBtn.addEventListener('click', openAddModal);
    
    // Modal Close Buttons
    elements.closeModal.addEventListener('click', closeModal);
    elements.closeConfirmModal.addEventListener('click', closeConfirmModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.cancelConfirmBtn.addEventListener('click', closeConfirmModal);
    
    // Form Submit
    elements.candidateForm.addEventListener('submit', handleFormSubmit);
    
    // Search
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.clearSearch.addEventListener('click', clearSearch);
    
    // Filter
    elements.statusFilter.addEventListener('change', loadCandidates);
    
    // Close modal on outside click
    elements.candidateModal.addEventListener('click', (e) => {
        if (e.target === elements.candidateModal) closeModal();
    });
    
    elements.confirmModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) closeConfirmModal();
    });
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load Candidates
async function loadCandidates() {
    try {
        showLoading(true);
        hideMessages();
        
        const search = elements.searchInput.value.trim();
        const status = elements.statusFilter.value;
        
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (status !== 'All') queryParams.append('status', status);
        
        const endpoint = `/candidates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await apiRequest(endpoint);
        
        displayCandidates(response.data);
        loadStatistics();
    } catch (error) {
        showError('Failed to load candidates: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Display Candidates in Table
function displayCandidates(candidates) {
    elements.candidatesTableBody.innerHTML = '';
    
    if (!candidates || candidates.length === 0) {
        elements.emptyState.style.display = 'block';
        document.querySelector('.table-container table').style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    document.querySelector('.table-container table').style.display = 'table';
    
    candidates.forEach(candidate => {
        const row = createCandidateRow(candidate);
        elements.candidatesTableBody.appendChild(row);
    });
}

// Create Table Row
function createCandidateRow(candidate) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${candidate.id}</td>
        <td><strong>${escapeHtml(candidate.name)}</strong></td>
        <td>${candidate.age}</td>
        <td>${escapeHtml(candidate.email)}</td>
        <td>${escapeHtml(candidate.phone || '-')}</td>
        <td>${escapeHtml(truncate(candidate.skills || '-', 50))}</td>
        <td>${candidate.experience !== null ? candidate.experience + ' years' : '-'}</td>
        <td>${escapeHtml(candidate.applied_position || '-')}</td>
        <td><span class="status-badge status-${candidate.status.toLowerCase()}">${candidate.status}</span></td>
        <td>
            <div class="action-buttons">
                <button class="action-btn edit" onclick="editCandidate(${candidate.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteCandidate(${candidate.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await apiRequest('/candidates/stats');
        const stats = response.data;
        
        elements.totalCount.textContent = stats.total || 0;
        elements.appliedCount.textContent = stats.applied || 0;
        elements.interviewingCount.textContent = stats.interviewing || 0;
        elements.hiredCount.textContent = stats.hired || 0;
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// Open Add Modal
function openAddModal() {
    currentEditId = null;
    elements.modalTitle.textContent = 'Add New Candidate';
    elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Candidate';
    elements.candidateForm.reset();
    clearFormErrors();
    document.getElementById('candidateId').value = '';
    elements.candidateModal.classList.add('active');
}

// Edit Candidate
async function editCandidate(id) {
    try {
        const response = await apiRequest(`/candidates/${id}`);
        const candidate = response.data;
        
        currentEditId = id;
        elements.modalTitle.textContent = 'Edit Candidate';
        elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Candidate';
        
        // Populate form
        document.getElementById('candidateId').value = candidate.id;
        document.getElementById('name').value = candidate.name;
        document.getElementById('age').value = candidate.age;
        document.getElementById('email').value = candidate.email;
        document.getElementById('phone').value = candidate.phone || '';
        document.getElementById('skills').value = candidate.skills || '';
        document.getElementById('experience').value = candidate.experience || '';
        document.getElementById('applied_position').value = candidate.applied_position || '';
        document.getElementById('status').value = candidate.status;
        
        clearFormErrors();
        elements.candidateModal.classList.add('active');
    } catch (error) {
        showError('Failed to load candidate details: ' + error.message);
    }
}

// Delete Candidate
function deleteCandidate(id) {
    confirmCallback = async () => {
        try {
            await apiRequest(`/candidates/${id}`, { method: 'DELETE' });
            showSuccess('Candidate deleted successfully');
            loadCandidates();
            closeConfirmModal();
        } catch (error) {
            showError('Failed to delete candidate: ' + error.message);
        }
    };
    
    document.getElementById('confirmMessage').textContent = 
        'Are you sure you want to delete this candidate? This action cannot be undone.';
    elements.confirmModal.classList.add('active');
}

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        age: parseInt(document.getElementById('age').value),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        skills: document.getElementById('skills').value.trim(),
        experience: document.getElementById('experience').value ? 
            parseInt(document.getElementById('experience').value) : null,
        applied_position: document.getElementById('applied_position').value.trim(),
        status: document.getElementById('status').value
    };
    
    try {
        elements.submitBtn.disabled = true;
        
        if (currentEditId) {
            // Update
            await apiRequest(`/candidates/${currentEditId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showSuccess('Candidate updated successfully');
        } else {
            // Create
            await apiRequest('/candidates', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showSuccess('Candidate added successfully');
        }
        
        closeModal();
        loadCandidates();
    } catch (error) {
        if (error.message.includes('Email already exists')) {
            showFormError('email', 'This email is already registered');
        } else {
            showError('Failed to save candidate: ' + error.message);
        }
    } finally {
        elements.submitBtn.disabled = false;
    }
}

// Form Validation
function validateForm() {
    clearFormErrors();
    let isValid = true;
    
    // Name validation
    const name = document.getElementById('name').value.trim();
    if (!name) {
        showFormError('name', 'Name is required');
        isValid = false;
    } else if (name.length < 2 || name.length > 100) {
        showFormError('name', 'Name must be between 2 and 100 characters');
        isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        showFormError('name', 'Name can only contain letters, spaces, hyphens, and apostrophes');
        isValid = false;
    }
    
    // Age validation
    const age = parseInt(document.getElementById('age').value);
    if (!age) {
        showFormError('age', 'Age is required');
        isValid = false;
    } else if (age < 18 || age > 100) {
        showFormError('age', 'Age must be between 18 and 100');
        isValid = false;
    }
    
    // Email validation
    const email = document.getElementById('email').value.trim();
    if (!email) {
        showFormError('email', 'Email is required');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Phone validation (optional)
    const phone = document.getElementById('phone').value.trim();
    if (phone && !/^[\d\s\-+()]+$/.test(phone)) {
        showFormError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Experience validation (optional)
    const experience = document.getElementById('experience').value;
    if (experience && (parseInt(experience) < 0 || isNaN(parseInt(experience)))) {
        showFormError('experience', 'Experience must be a positive number');
        isValid = false;
    }
    
    return isValid;
}

// Show Form Error
function showFormError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const inputElement = document.getElementById(fieldName);
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    if (inputElement) {
        inputElement.closest('.form-group').classList.add('error');
    }
}

// Clear Form Errors
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-text');
    errorElements.forEach(el => el.textContent = '');
    
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => group.classList.remove('error'));
}

// Search Handler
function handleSearch() {
    const searchValue = elements.searchInput.value.trim();
    
    if (searchValue) {
        elements.clearSearch.classList.add('active');
    } else {
        elements.clearSearch.classList.remove('active');
    }
    
    loadCandidates();
}

// Clear Search
function clearSearch() {
    elements.searchInput.value = '';
    elements.clearSearch.classList.remove('active');
    loadCandidates();
}

// Close Modal
function closeModal() {
    elements.candidateModal.classList.remove('active');
    elements.candidateForm.reset();
    clearFormErrors();
    currentEditId = null;
}

// Close Confirm Modal
function closeConfirmModal() {
    elements.confirmModal.classList.remove('active');
    confirmCallback = null;
}

// Confirm Action
elements.confirmActionBtn.addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
    }
});

// Show/Hide Loading
function showLoading(show) {
    elements.loadingIndicator.style.display = show ? 'block' : 'none';
}

// Show Error Message
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
    
    setTimeout(() => {
        elements.errorMessage.style.display = 'none';
    }, 5000);
}

// Show Success Message
function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successMessage.style.display = 'block';
    
    setTimeout(() => {
        elements.successMessage.style.display = 'none';
    }, 3000);
}

// Hide Messages
function hideMessages() {
    elements.errorMessage.style.display = 'none';
    elements.successMessage.style.display = 'none';
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

// Export functions to global scope for inline event handlers
window.editCandidate = editCandidate;
window.deleteCandidate = deleteCandidate;