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

// State management
let config = {
    macros: []
};
let providers = [];
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

    await ipcRenderer.invoke('save-agents', config);
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
    const selectedProvider = providers.find(p => p.name === providerName);
    const models = selectedProvider?.models || [];
    modelSelect.innerHTML = models.map(model =>
        `<option value="${model}">${model}</option>`
    ).join('');
}

function updateProviderSelects (field) {
    const providerNames = document.getElementById(field);
    providerNames.innerHTML = providers.map(provider =>
        `<option value="${provider.name}">${provider.name}</option>`
    ).join('');
}

/**
 * Render all tables and update UI elements
 */
function renderTables () {
    // Render macros section
    renderMacrosTable();
    updateProviderSelects('macroProvider');

    // Initialize model options
    const providerSelect = document.getElementById('macroProvider');
    updateModelOptions(providerSelect.value);
}

function renderMacrosTable () {
    const macrosTable = document.getElementById('macrosTable');
    macrosTable.innerHTML = config.macros.map((macro, index) => `
        <tr>
            <td>${macro.name}</td>
            <td>${macro.shortcut}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editMacro(${index})" aria-label="Edit" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteMacro(${index})" aria-label="Delete" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    config = await ipcRenderer.invoke('get-config');
    providers = await ipcRenderer.invoke('get-providers');

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
    initializeModal('macroModal', 'macroForm');

    // Initial render
    renderTables();
    if (providers.length > 0) {
        updateModelOptions(providers[0].name);
    }
});

function resetAndCloseMacroModal () {
    const modal = bootstrap.Modal.getInstance(document.getElementById('macroModal'));
    document.getElementById('macroForm').reset();
    editingIndex = -1;
    modal.hide();
}

function deleteMacro (index) {
    if (confirm('Are you sure you want to delete this macro?')) {
        config.macros.splice(index, 1);
        ipcRenderer.invoke('save-agents', config);
        renderTables();
    }
}

function editMacro (index) {
    editingIndex = index;
    const macro = config.macros[index];

    document.getElementById('macroName').value = macro.name;
    document.getElementById('macroProvider').value = macro.provider;
    updateModelOptions(macro.provider);
    document.getElementById('macroModel').value = macro.model;
    document.getElementById('systemPrompt').value = macro.systemPrompt;
    document.getElementById('temperature').value = macro.temperature;
    document.getElementById('userPrompt').value = macro.userPrompt;
    document.getElementById('shortcut').value = macro.shortcut;

    new bootstrap.Modal(document.getElementById('macroModal')).show();
}
