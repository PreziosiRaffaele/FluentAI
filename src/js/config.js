const { ipcRenderer } = require('electron');

// Constants
const MODAL_OPTIONS = {
    backdrop: 'static',
    keyboard: false
};

const VALID_MODIFIERS = ['Command', 'Cmd', 'Control', 'Ctrl', 'CommandOrControl', 'CmdOrCtrl', 'Alt', 'Option', 'AltGr', 'Shift', 'Super'];
const VALID_KEY_PATTERN = /^([A-Z0-9]|F[1-24]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen)$/i;

function isValidShortcut (shortcut) {
    if (!shortcut) return false;

    const parts = shortcut.split('+').map(part => part.trim());
    if (parts.length < 2) return false; // Must have at least one modifier

    // Check all parts except the last one are valid modifiers
    for (let i = 0; i < parts.length - 1; i++) {
        if (!VALID_MODIFIERS.includes(parts[i])) return false;
    }

    // Check the last part is a valid key
    return VALID_KEY_PATTERN.test(parts[parts.length - 1]);
}

// Data models
const providerModels = [
    {
        name: 'Open AI',
        models: [
            'gpt-4o-mini',
            'gpt-4',
            'gpt-3.5-turbo'
        ]
    }
];

// State management
let config = {
    providers: [],
    macros: []
};
let editingIndex = -1;

// Modal management
/**
 * Initialize modal behavior
 * @param {string} modalId - The ID of the modal element
 * @param {string} formId - The ID of the form element
 */
function initializeModal (modalId, formId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId), MODAL_OPTIONS);
    document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
        document.getElementById(formId).reset();
        editingIndex = -1;
    });
    return modal;
}

// Provider management
/**
 * Save provider data to config
 * @returns {Promise<void>}
 */
async function saveProvider () {
    const form = document.getElementById('providerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const provider = {
        name: document.getElementById('providerName').value,
        apiKey: document.getElementById('apiKey').value
    };

    if (editingIndex >= 0) {
        config.providers[editingIndex] = provider;
    } else {
        config.providers.push(provider);
    }

    await ipcRenderer.invoke('save-config', config);
    renderTables();
    resetAndCloseProviderModal();
}

// Macro management
/**
 * Save macro data to config
 * @returns {Promise<void>}
 */
async function saveMacro () {
    const form = document.getElementById('macroForm');
    const shortcutInput = document.getElementById('shortcut');
    const shortcutValue = shortcutInput.value;

    if (!isValidShortcut(shortcutValue)) {
        alert('Invalid shortcut format. Must include at least one modifier (Command, Ctrl, Alt, Shift) and a key.');
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const macro = {
        name: document.getElementById('macroName').value,
        provider: document.getElementById('macroProvider').value,
        model: document.getElementById('macroModel').value,
        systemPrompt: document.getElementById('systemPrompt').value,
        temperature: document.getElementById('temperature').value,
        userPrompt: document.getElementById('userPrompt').value,
        shortcut: document.getElementById('shortcut').value
    };

    if (editingIndex >= 0) {
        config.macros[editingIndex] = macro;
    } else {
        config.macros.push(macro);
    }

    await ipcRenderer.invoke('save-config', config);
    renderTables();
    resetAndCloseMacroModal();
}

// UI rendering
/**
 * Update model options based on selected provider
 * @param {string} providerName - Name of the selected provider
 */
function updateModelOptions (providerName) {
    const modelSelect = document.getElementById('macroModel');
    const models = providerModels.find(provider => provider.name === providerName)?.models ?? [];
    modelSelect.innerHTML = models.map(model =>
        `<option value="${model}">${model}</option>`
    ).join('');
}

/**
 * Render all tables and update UI elements
 */
function renderTables () {
    // Render providers section
    renderProvidersTable();
    updateProviderSelects('providerName');

    // Render macros section
    renderMacrosTable();
    updateProviderSelects('macroProvider');

    // Initialize model options
    const providerSelect = document.getElementById('macroProvider');
    updateModelOptions(providerSelect.value);
}

// Add this new function
function renderProvidersTable () {
    const providersTable = document.getElementById('providersTable');
    providersTable.innerHTML = config.providers.map((provider, index) => `
        <tr>
            <td>${provider.name}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProvider(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProvider(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateProviderSelects (field) {
    const providerNames = document.getElementById(field);
    providerNames.innerHTML = providerModels.map(provider =>
        `<option value="${provider.name}">${provider.name}</option>`
    ).join('');
}

function renderMacrosTable () {
    const macrosTable = document.getElementById('macrosTable');
    macrosTable.innerHTML = config.macros.map((macro, index) => `
        <tr>
            <td>${macro.name}</td>
            <td>${macro.shortcut}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editMacro(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMacro(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    config = await ipcRenderer.invoke('get-config');

    // Initialize event listeners
    document.getElementById('macroProvider').addEventListener('change', (e) => {
        updateModelOptions(e.target.value);
    });

    const shortcutInput = document.getElementById('shortcut');
    shortcutInput.addEventListener('input', (e) => {
        const isValid = isValidShortcut(e.target.value);
        shortcutInput.setCustomValidity(isValid ? '' : 'Invalid shortcut format');
        shortcutInput.reportValidity();
    });

    // Initialize modals
    initializeModal('providerModal', 'providerForm');
    initializeModal('macroModal', 'macroForm');

    // Initial render
    renderTables();
});

function resetAndCloseProviderModal () {
    const modal = bootstrap.Modal.getInstance(document.getElementById('providerModal'));
    document.getElementById('providerForm').reset();
    editingIndex = -1;
    modal.hide();
}

function resetAndCloseMacroModal () {
    const modal = bootstrap.Modal.getInstance(document.getElementById('macroModal'));
    document.getElementById('macroForm').reset();
    editingIndex = -1;
    modal.hide();
}

function editProvider (index) {
    editingIndex = index;
    const provider = config.providers[index];

    document.getElementById('providerName').value = provider.name;
    document.getElementById('apiKey').value = provider.apiKey;

    new bootstrap.Modal(document.getElementById('providerModal')).show();
}

async function deleteProvider (index) {
    if (confirm('Are you sure you want to delete this provider?')) {
        config.providers.splice(index, 1);
        await ipcRenderer.invoke('save-config', config);
        renderTables();
    }
}

function deleteMacro (index) {
    if (confirm('Are you sure you want to delete this macro?')) {
        config.macros.splice(index, 1);
        ipcRenderer.invoke('save-config', config);
        renderTables();
    }
}

function editMacro (index) {
    editingIndex = index;
    const macro = config.macros[index];

    document.getElementById('macroName').value = macro.name;
    document.getElementById('macroProvider').value = macro.provider;
    document.getElementById('macroModel').value = macro.model;
    document.getElementById('systemPrompt').value = macro.systemPrompt;
    document.getElementById('temperature').value = macro.temperature;
    document.getElementById('userPrompt').value = macro.userPrompt;
    document.getElementById('shortcut').value = macro.shortcut;

    new bootstrap.Modal(document.getElementById('macroModal')).show();
}

// Add edit and delete functions as needed
