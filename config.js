const { ipcRenderer } = require('electron');

// Add model options mapping
const providerModels = [
    {
        name: 'Open AI',
        models: [
            'gpt-4o-mini',
            'gpt-4',
            'gpt-3.5-turbo'
        ]
    },
    {
        name: 'DeepSeek',
        models: [
            'deepseek-1',
            'deepseek-2',
            'deepseek-3'
        ]
    }
];

let config = {
    providers: [],
    macros: []
};

let editingIndex = -1;

// Load initial data
document.addEventListener('DOMContentLoaded', async () => {
    config = await ipcRenderer.invoke('get-config');
    renderTables();
    document.getElementById('macroProvider').addEventListener('change', (e) => {
        updateModelOptions(e.target.value);
    });

    // Configure modals to not close on backdrop
    const providerModal = new bootstrap.Modal(document.getElementById('providerModal'), {
        backdrop: 'static',
        keyboard: false
    });

    const macroModal = new bootstrap.Modal(document.getElementById('macroModal'), {
        backdrop: 'static',
        keyboard: false
    });

    // Reset forms when modals are closed
    document.getElementById('providerModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('providerForm').reset();
        editingIndex = -1;
    });

    document.getElementById('macroModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('macroForm').reset();
        editingIndex = -1;
    });
});

function renderTables () {
    // Render providers table
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

    const providerNames = document.getElementById('providerName');
    providerNames.innerHTML = providerModels.map(provider =>
        `<option value="${provider.name}">${provider.name}</option>`
    ).join('');

    // Render macros table
    const macrosTable = document.getElementById('macrosTable');
    macrosTable.innerHTML = config.macros.map((macro, index) => `
        <tr>
            <td>${macro.name}</td>
            <td>${macro.provider}</td>
            <td>${macro.model}</td>
            <td>${macro.shortcut}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editMacro(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMacro(${index})">Delete</button>
            </td>
        </tr>
    `).join('');

    // Update provider select in macro modal
    const providerSelect = document.getElementById('macroProvider');
    providerSelect.innerHTML = providerModels.map(provider =>
        `<option value="${provider.name}">${provider.name}</option>`
    ).join('');

    // Initialize model options for the first provider
    updateModelOptions(providerSelect.value);
}

// Add this new function
function updateModelOptions (providerName) {
    const modelSelect = document.getElementById('macroModel');
    const models = providerModels.find(provider => provider.name === providerName)?.models ?? [];
    modelSelect.innerHTML = models.map(model =>
        `<option value="${model}">${model}</option>`
    ).join('');
}

async function saveProvider () {
    const form = document.getElementById('providerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const name = document.getElementById('providerName').value;
    const apiKey = document.getElementById('apiKey').value;

    if (editingIndex >= 0) {
        config.providers[editingIndex] = { name, apiKey };
        editingIndex = -1;
    } else {
        config.providers.push({ name, apiKey });
    }

    await ipcRenderer.invoke('save-config', config);
    renderTables();
    resetAndCloseProviderModal();
}

async function saveMacro () {
    const form = document.getElementById('macroForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const macro = {
        name: document.getElementById('macroName').value,
        provider: document.getElementById('macroProvider').value,
        model: document.getElementById('macroModel').value,
        systemPrompt: document.getElementById('systemPrompt').value,
        userPrompt: document.getElementById('userPrompt').value,
        shortcut: document.getElementById('shortcut').value
    };

    if (editingIndex >= 0) {
        config.macros[editingIndex] = macro;
        editingIndex = -1;
    } else {
        config.macros.push(macro);
    }

    await ipcRenderer.invoke('save-config', config);
    renderTables();
    resetAndCloseMacroModal();
}

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
    document.getElementById('userPrompt').value = macro.userPrompt;
    document.getElementById('shortcut').value = macro.shortcut;

    new bootstrap.Modal(document.getElementById('macroModal')).show();
}

// Add edit and delete functions as needed
