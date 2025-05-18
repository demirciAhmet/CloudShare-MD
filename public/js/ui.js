// public/js/ui.js
import * as DOM from './dom.js';
import { getState, setThemeState } from './state.js'; // For theme state
import { getExpirationTextForDisplay } from './utils.js';

// Import all exports from this module itself under an alias (e.g., 'self' or 'uiInternal')
import * as self from './ui.js'; // <--- Key change for testability

let notificationTimeoutId;

export function setSaveStatusDisplay(status) {
    DOM.saveStatus.className = 'save-status'; // Reset
    switch (status) {
        case 'saving':
            DOM.saveStatus.textContent = 'Saving...';
            DOM.saveStatus.classList.add('saving');
            break;
        case 'saved':
            DOM.saveStatus.textContent = 'Saved';
            DOM.saveStatus.classList.add('saved');
            break;
        case 'error':
            DOM.saveStatus.textContent = 'Error saving';
            DOM.saveStatus.classList.add('error');
            break;
        default: // ready
            DOM.saveStatus.textContent = 'Ready';
            break;
    }
}

export function showNotification(message) {
    DOM.notificationMessage.textContent = message;
    DOM.notificationModal.classList.remove('hidden');
    if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
    // Call the exported version via 'self'
    notificationTimeoutId = setTimeout(() => self.closeNotification(), 3000); // <--- MODIFIED
}

export function closeNotification() {
    DOM.notificationModal.classList.add('hidden');
    // If you also wanted to ensure the timeout ID is cleared here when called directly:
    // if (notificationTimeoutId) {
    //     clearTimeout(notificationTimeoutId);
    //     notificationTimeoutId = null;
    // }
}

export function showExpiredModal() {
    DOM.expiredModal.classList.remove('hidden');
}

export function closeExpiredModal() {
    DOM.expiredModal.classList.add('hidden');
}

export function displayShareLink() {
    const { uniqueId } = getState();
    if (!uniqueId) return;
    const shareUrl = `${window.location.origin}/?view=${uniqueId}`;
    DOM.shareLinkInput.value = shareUrl;
    DOM.shareDropdown.classList.remove('hidden');
}

export function closeShareDropdown() {
    DOM.shareDropdown.classList.add('hidden');
}

export async function copyTextToClipboard(text, buttonElement, successText = 'Copied!', originalText = 'Copy') {
    try {
        await navigator.clipboard.writeText(text);
        buttonElement.textContent = successText;
        // Consider if this success notification should also be spied upon:
        // self.showNotification('Text copied successfully!'); 
        setTimeout(() => { buttonElement.textContent = originalText; }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // Call the exported version via 'self'
        self.showNotification('Failed to copy. Please copy manually.'); // <--- MODIFIED
    }
}

export function applyThemeToPage() {
    const currentTheme = getState().theme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    DOM.themeToggleBtn.textContent = currentTheme === 'light' ? '🌓' : '☀️';
}

export function toggleThemeOnPage() {
    let currentTheme = getState().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme); // Update state and localStorage
    self.applyThemeToPage(); // Call via 'self' if you ever need to spy on applyThemeToPage
}

export function setEditorPreviewMode(mode, updatePreviewCallback) {
    const isEditMode = mode === 'edit';
    DOM.markdownEditor.classList.toggle('hidden', !isEditMode);
    DOM.markdownPreview.classList.toggle('hidden', isEditMode);

    DOM.editPreviewToggle.querySelectorAll('.button-group-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (isEditMode) {
        DOM.markdownEditor.focus();
    } else {
        updatePreviewCallback();
    }
}

export function toggleSidebar() {
    DOM.sidebar.classList.toggle('collapsed');
}

export function closeSidebar() {
    DOM.sidebar.classList.add('collapsed');
}

export function renderRecentNotesList(notes, onNoteClickCallback, onRemoveClickCallback) {
    if (notes.length === 0) {
        DOM.recentNotesContainer.innerHTML = '<div class="empty-notes-message">No recent notes</div>';
        return;
    }
    DOM.recentNotesContainer.innerHTML = '';
    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        const date = new Date(note.updatedAt);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        noteItem.innerHTML = `
            <h4>${note.title}</h4>
            <p>${note.viewOnly ? 'View only' : 'Editable'} • ${formattedDate}</p>
            <button class="icon-button delete-item" title="Remove from history" data-id="${note.id || ''}" data-uniqueid="${note.uniqueId || ''}">🗑️</button>
        `;
        noteItem.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-item')) return;
            onNoteClickCallback(note);
        });
        noteItem.querySelector('.delete-item').addEventListener('click', (e) => {
            e.stopPropagation();
            onRemoveClickCallback(e.target.dataset.id, e.target.dataset.uniqueid);
        });
        DOM.recentNotesContainer.appendChild(noteItem);
    });
}

export function updateShareButtonVisibilityUI(isCreator) {
    DOM.shareBtn.classList.toggle('hidden', !isCreator);
}

export function setEditorDisabledUI(isDisabled) {
    DOM.markdownEditor.disabled = isDisabled;
}

export function setEditorValue(content) {
    DOM.markdownEditor.value = content;
}
export function setExpirationRadioUI(expiresAt) {
    let selectedValue = 'none';
    if (expiresAt) {
        const expiresDate = new Date(expiresAt);
        const now = new Date();
        const diffHours = (expiresDate - now) / (1000 * 60 * 60);

        if (diffHours <= 0) selectedValue = 'none';
        else if (diffHours <= 1) selectedValue = '1h';
        else if (diffHours <= 24) selectedValue = '1d';
        else selectedValue = '7d';
    }

    const radios = DOM.expirationRadios();
    
    // Uncheck all radios first
    radios.forEach(r => r.checked = false);

    const radioToSelect = radios.find(r => r.value === selectedValue);

    if (radioToSelect) {
        radioToSelect.checked = true;
    } else {
        const noneRadio = radios.find(r => r.value === 'none');
        if (noneRadio) {
            noneRadio.checked = true;
        } else {
            // If even the 'none' radio is not found (e.g., radios array is empty or misconfigured)
            // throw an error as per the test expectation.
            throw new Error("Cannot set expiration UI: 'none' radio button not found as a fallback."); // <--- MODIFIED
        }
    }
}