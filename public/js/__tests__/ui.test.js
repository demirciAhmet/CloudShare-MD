// public/js/__tests__/ui.test.js

// --- Top-level mock function variables ---
var mockGetState;
var mockSetThemeState;
var mockGetExpirationTextForDisplay;

// --- Mocking External Modules ---
jest.mock('../state.js', () => {
    mockGetState = jest.fn();
    mockSetThemeState = jest.fn();
    return { __esModule: true, getState: mockGetState, setThemeState: mockSetThemeState };
});

jest.mock('../utils.js', () => {
    mockGetExpirationTextForDisplay = jest.fn();
    return { __esModule: true, getExpirationTextForDisplay: mockGetExpirationTextForDisplay };
});

const createMockDomElementsObject = () => ({
    saveStatus: { textContent: '', className: '', classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() } },
    notificationMessage: { textContent: '' },
    notificationModal: { classList: { add: jest.fn(), remove: jest.fn() } },
    expiredModal: { classList: { add: jest.fn(), remove: jest.fn() } },
    shareLinkInput: { value: '' },
    shareDropdown: { classList: { add: jest.fn(), remove: jest.fn() } },
    themeToggleBtn: { textContent: '' },
    markdownEditor: { classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() }, focus: jest.fn(), disabled: false, value: '' },
    markdownPreview: { classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() }, innerHTML: '' },
    editPreviewToggle: { querySelectorAll: jest.fn(() => []) },
    sidebar: { classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() } },
    recentNotesContainer: { innerHTML: '', appendChild: jest.fn() },
    shareBtn: { classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() } },
    expirationRadios: jest.fn(() => []),
});

jest.mock('../dom.js', () => ({
    __esModule: true,
    ...createMockDomElementsObject()
}));

const originalNavigator = global.navigator;
const originalDocumentElementSetAttribute = document.documentElement.setAttribute;
const originalDocumentCreateElement = document.createElement;
const originalWindowLocation = window.location;
var consoleErrorSpy;

describe('UI Module', () => {
    var ui;
    var mockDom;

    beforeAll(() => {
        delete window.location;
        global.window.location = { origin: 'http://localhost', href: 'http://localhost/' };
        Object.defineProperty(global, 'navigator', {
            value: { clipboard: { writeText: jest.fn() } },
            configurable: true, writable: true,
        });
        document.documentElement.setAttribute = jest.fn();
        document.createElement = jest.fn();
    });

    beforeEach(() => {
        jest.useFakeTimers(); // Enable fake timers
        jest.spyOn(global, 'setTimeout'); // Explicitly spy on the global setTimeout
        jest.spyOn(global, 'clearTimeout'); // Explicitly spy on the global clearTimeout

        ui = require('../ui.js');
        mockDom = require('../dom.js');

        if (mockGetState) mockGetState.mockClear().mockReturnValue({ theme: 'light', uniqueId: null });
        if (mockSetThemeState) mockSetThemeState.mockClear();
        if (mockGetExpirationTextForDisplay) mockGetExpirationTextForDisplay.mockClear();

        if (mockDom) {
            mockDom.saveStatus.textContent = ''; mockDom.saveStatus.className = '';
            mockDom.saveStatus.classList.add.mockClear(); mockDom.saveStatus.classList.remove.mockClear(); mockDom.saveStatus.classList.toggle.mockClear();
            mockDom.notificationMessage.textContent = '';
            mockDom.notificationModal.classList.add.mockClear(); mockDom.notificationModal.classList.remove.mockClear();
            mockDom.expiredModal.classList.add.mockClear(); mockDom.expiredModal.classList.remove.mockClear();
            mockDom.shareLinkInput.value = '';
            mockDom.shareDropdown.classList.add.mockClear(); mockDom.shareDropdown.classList.remove.mockClear();
            mockDom.themeToggleBtn.textContent = '';
            mockDom.markdownEditor.classList.toggle.mockClear(); mockDom.markdownEditor.classList.add.mockClear(); mockDom.markdownEditor.classList.remove.mockClear();
            mockDom.markdownEditor.focus.mockClear(); mockDom.markdownEditor.disabled = false; mockDom.markdownEditor.value = '';
            mockDom.markdownPreview.classList.toggle.mockClear(); mockDom.markdownPreview.classList.add.mockClear(); mockDom.markdownPreview.classList.remove.mockClear();
            mockDom.markdownPreview.innerHTML = '';
            mockDom.editPreviewToggle.querySelectorAll.mockClear().mockReturnValue([]);
            mockDom.sidebar.classList.toggle.mockClear(); mockDom.sidebar.classList.add.mockClear(); mockDom.sidebar.classList.remove.mockClear();
            mockDom.recentNotesContainer.innerHTML = ''; mockDom.recentNotesContainer.appendChild.mockClear();
            mockDom.shareBtn.classList.toggle.mockClear(); mockDom.shareBtn.classList.add.mockClear(); mockDom.shareBtn.classList.remove.mockClear();
            const defaultMockRadioArray = [
                { value: 'none', checked: false, name: 'expiration' }, { value: '1h', checked: false, name: 'expiration' },
                { value: '1d', checked: false, name: 'expiration' }, { value: '7d', checked: false, name: 'expiration' },
            ];
            mockDom.expirationRadios.mockClear().mockReturnValue(defaultMockRadioArray);
        }

        if (navigator.clipboard) navigator.clipboard.writeText.mockClear();
        document.documentElement.setAttribute.mockClear();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.setTimeout.mockClear(); // Clear calls for the spied setTimeout
        global.clearTimeout.mockClear(); // Clear calls for the spied clearTimeout
        // jest.clearAllTimers() is still useful for clearing pending timer callbacks
    });

    afterEach(() => {
        if (consoleErrorSpy) consoleErrorSpy.mockRestore();
        
        // Restore spies on global timers
        global.setTimeout.mockRestore();
        global.clearTimeout.mockRestore();
        
        jest.useRealTimers(); // Restore real timers
        jest.resetModules();
    });

    afterAll(() => {
        global.navigator = originalNavigator;
        document.documentElement.setAttribute = originalDocumentElementSetAttribute;
        document.createElement = originalDocumentCreateElement;
        window.location = originalWindowLocation;
    });

    // --- Test Suites ---

    describe('setSaveStatusDisplay', () => {
        test('should set status to "saving"', () => {
            ui.setSaveStatusDisplay('saving');
            expect(mockDom.saveStatus.textContent).toBe('Saving...');
            expect(mockDom.saveStatus.classList.add).toHaveBeenCalledWith('saving');
        });
        test('should set status to "saved"', () => {
            ui.setSaveStatusDisplay('saved');
            expect(mockDom.saveStatus.textContent).toBe('Saved');
            expect(mockDom.saveStatus.classList.add).toHaveBeenCalledWith('saved');
        });
        test('should set status to "error"', () => {
            ui.setSaveStatusDisplay('error');
            expect(mockDom.saveStatus.textContent).toBe('Error saving');
            expect(mockDom.saveStatus.classList.add).toHaveBeenCalledWith('error');
        });
        test('should set status to "Ready" by default for unknown status', () => {
            ui.setSaveStatusDisplay('unknown');
            expect(mockDom.saveStatus.textContent).toBe('Ready');
            expect(mockDom.saveStatus.classList.add).not.toHaveBeenCalled();
        });
         test('should set status to "Ready" for no status (default case)', () => {
            ui.setSaveStatusDisplay();
            expect(mockDom.saveStatus.textContent).toBe('Ready');
        });
    });

    describe('showNotification', () => {
        var closeNotificationSpy;
        beforeEach(() => { closeNotificationSpy = jest.spyOn(ui, 'closeNotification'); });
        afterEach(() => { if (closeNotificationSpy) closeNotificationSpy.mockRestore(); });

        test('should display notification, set message, and set timeout to close it', () => {
            const message = 'Test notification';
            ui.showNotification(message);
            expect(mockDom.notificationMessage.textContent).toBe(message);
            expect(mockDom.notificationModal.classList.remove).toHaveBeenCalledWith('hidden');
            expect(global.setTimeout).toHaveBeenCalledTimes(1); // Check the spied global.setTimeout
            expect(global.setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
        });

        test('should clear existing timeout if one exists before setting a new one', () => {
            ui.showNotification('First message');
            expect(global.clearTimeout).not.toHaveBeenCalled(); // Check the spied global.clearTimeout
            ui.showNotification('Second message');
            expect(global.clearTimeout).toHaveBeenCalledTimes(1);
            expect(global.setTimeout).toHaveBeenCalledTimes(2);
        });

        test('closeNotification should be called after timeout', () => {
            ui.showNotification('A message');
            jest.runAllTimers();
            expect(closeNotificationSpy).toHaveBeenCalled();
        });
    });
    
    describe('closeNotification', () => {
        test('should hide notification modal by adding "hidden" class', () => {
            ui.closeNotification();
            expect(mockDom.notificationModal.classList.add).toHaveBeenCalledWith('hidden');
        });
    });
    
    describe('showExpiredModal', () => {
        test('should show the expired modal by removing "hidden" class', () => {
            ui.showExpiredModal();
            expect(mockDom.expiredModal.classList.remove).toHaveBeenCalledWith('hidden');
        });
    });

    describe('closeExpiredModal', () => {
        test('should hide the expired modal by adding "hidden" class', () => {
            ui.closeExpiredModal();
            expect(mockDom.expiredModal.classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    describe('displayShareLink', () => {
        test('should display share link and show dropdown if uniqueId exists', () => {
            mockGetState.mockReturnValue({ uniqueId: 'test-id123' });
            ui.displayShareLink();
            expect(mockDom.shareLinkInput.value).toBe('http://localhost/?view=test-id123');
            expect(mockDom.shareDropdown.classList.remove).toHaveBeenCalledWith('hidden');
        });
        test('should not display share link or show dropdown if uniqueId does not exist', () => {
            mockGetState.mockReturnValue({ uniqueId: null }); 
            ui.displayShareLink();
            expect(mockDom.shareLinkInput.value).toBe(''); 
            expect(mockDom.shareDropdown.classList.remove).not.toHaveBeenCalled();
        });
    });

    describe('closeShareDropdown', () => {
        test('should hide the share dropdown by adding "hidden" class', () => {
            ui.closeShareDropdown();
            expect(mockDom.shareDropdown.classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    describe('copyTextToClipboard', () => {
        const mockButtonElement = { textContent: 'Copy' };
        var showNotificationSpy;
        beforeEach(() => {
            mockButtonElement.textContent = 'Copy';
            showNotificationSpy = jest.spyOn(ui, 'showNotification');
        });
        afterEach(() => { if (showNotificationSpy) showNotificationSpy.mockRestore(); });

        test('should copy text to clipboard and update button text on success', async () => {
            navigator.clipboard.writeText.mockResolvedValue(undefined);
            await ui.copyTextToClipboard('text to copy', mockButtonElement, 'Copied!', 'Copy');
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('text to copy');
            expect(mockButtonElement.textContent).toBe('Copied!');
            jest.runAllTimers();
            expect(mockButtonElement.textContent).toBe('Copy');
        });
        test('should use default success and original text if not provided', async () => {
            navigator.clipboard.writeText.mockResolvedValue(undefined);
            await ui.copyTextToClipboard('another text', mockButtonElement);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('another text');
            expect(mockButtonElement.textContent).toBe('Copied!');
            jest.runAllTimers();
            expect(mockButtonElement.textContent).toBe('Copy');
        });
        test('should show notification and log error on clipboard write failure', async () => {
            const copyError = new Error('Clipboard write failed');
            navigator.clipboard.writeText.mockRejectedValue(copyError);
            await ui.copyTextToClipboard('failed text', mockButtonElement);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('failed text');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', copyError);
            expect(showNotificationSpy).toHaveBeenCalledWith('Failed to copy. Please copy manually.');
            expect(mockButtonElement.textContent).toBe('Copy');
        });
    });

    describe('applyThemeToPage', () => {
        test('should apply light theme correctly', () => {
            mockGetState.mockReturnValue({ theme: 'light' });
            ui.applyThemeToPage();
            expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
            expect(mockDom.themeToggleBtn.textContent).toBe('🌓');
        });
        test('should apply dark theme correctly', () => {
            mockGetState.mockReturnValue({ theme: 'dark' });
            ui.applyThemeToPage();
            expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
            expect(mockDom.themeToggleBtn.textContent).toBe('☀️');
        });
    });

    describe('toggleThemeOnPage', () => {
        test('should toggle from light to dark', () => {
            mockGetState.mockReturnValueOnce({ theme: 'light' }).mockReturnValueOnce({ theme: 'dark' });
            ui.toggleThemeOnPage();
            expect(mockSetThemeState).toHaveBeenCalledWith('dark');
            expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
            expect(mockDom.themeToggleBtn.textContent).toBe('☀️');
        });
        test('should toggle from dark to light', () => {
            mockGetState.mockReturnValueOnce({ theme: 'dark' }).mockReturnValueOnce({ theme: 'light' });
            ui.toggleThemeOnPage();
            expect(mockSetThemeState).toHaveBeenCalledWith('light');
            expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
            expect(mockDom.themeToggleBtn.textContent).toBe('🌓');
        });
    });
    
    describe('setEditorPreviewMode', () => {
        const mockUpdatePreviewCallback = jest.fn();
        let mockButtonEdit, mockButtonPreview;
        beforeEach(() => {
            mockUpdatePreviewCallback.mockClear();
            mockButtonEdit = { dataset: { mode: 'edit' }, classList: { toggle: jest.fn() } };
            mockButtonPreview = { dataset: { mode: 'preview' }, classList: { toggle: jest.fn() } };
            mockDom.editPreviewToggle.querySelectorAll.mockClear().mockReturnValue([mockButtonEdit, mockButtonPreview]);
            mockDom.markdownEditor.focus.mockClear();
        });
        test('should set to edit mode', () => {
            ui.setEditorPreviewMode('edit', mockUpdatePreviewCallback);
            expect(mockDom.markdownEditor.classList.toggle).toHaveBeenCalledWith('hidden', false);
            expect(mockDom.markdownPreview.classList.toggle).toHaveBeenCalledWith('hidden', true);
            expect(mockButtonEdit.classList.toggle).toHaveBeenCalledWith('active', true);
            expect(mockButtonPreview.classList.toggle).toHaveBeenCalledWith('active', false);
            expect(mockDom.markdownEditor.focus).toHaveBeenCalled();
            expect(mockUpdatePreviewCallback).not.toHaveBeenCalled();
        });
        test('should set to preview mode', () => {
            ui.setEditorPreviewMode('preview', mockUpdatePreviewCallback);
            expect(mockDom.markdownEditor.classList.toggle).toHaveBeenCalledWith('hidden', true);
            expect(mockDom.markdownPreview.classList.toggle).toHaveBeenCalledWith('hidden', false);
            expect(mockButtonEdit.classList.toggle).toHaveBeenCalledWith('active', false);
            expect(mockButtonPreview.classList.toggle).toHaveBeenCalledWith('active', true);
            expect(mockUpdatePreviewCallback).toHaveBeenCalled();
        });
    });
    
    describe('toggleSidebar', () => {
        test('should toggle sidebar', () => { ui.toggleSidebar(); expect(mockDom.sidebar.classList.toggle).toHaveBeenCalledWith('collapsed'); });
    });
    describe('closeSidebar', () => {
        test('should close sidebar', () => { ui.closeSidebar(); expect(mockDom.sidebar.classList.add).toHaveBeenCalledWith('collapsed'); });
    });

    describe('renderRecentNotesList', () => {
        var mockOnNoteClick, mockOnRemoveClick;
        var mockCreatedNoteItemDiv, mockCreatedDeleteButton;
        beforeEach(() => {
            mockOnNoteClick = jest.fn(); mockOnRemoveClick = jest.fn();
            mockCreatedDeleteButton = { addEventListener: jest.fn(), dataset: {}, classList: { contains: jest.fn() } };
            mockCreatedNoteItemDiv = {
                className: '', innerHTML: '', addEventListener: jest.fn(),
                querySelector: jest.fn().mockReturnValue(mockCreatedDeleteButton),
                classList: { contains: jest.fn() }
            };
            document.createElement.mockClear().mockReturnValue(mockCreatedNoteItemDiv);
        });

        test('should display empty message if no notes', () => {
            ui.renderRecentNotesList([], mockOnNoteClick, mockOnRemoveClick);
            expect(mockDom.recentNotesContainer.innerHTML).toBe('<div class="empty-notes-message">No recent notes</div>');
        });

        test('should render notes, set content, and attach event listeners', () => {
            const notes = [
                { id: 'id1', uniqueId: 'uid1', title: 'Note Alpha', updatedAt: new Date().toISOString(), viewOnly: false },
                { id: 'id2', uniqueId: 'uid2', title: 'Note Beta', updatedAt: new Date().toISOString(), viewOnly: true },
            ];
            const firstNote = notes[0]; // For testing the first item's handler
            const lastNote = notes[notes.length - 1]; // For testing the last item's handler

            ui.renderRecentNotesList(notes, mockOnNoteClick, mockOnRemoveClick);

            expect(document.createElement).toHaveBeenCalledTimes(notes.length);
            expect(mockDom.recentNotesContainer.appendChild).toHaveBeenCalledTimes(notes.length);
            
            // Test click on the first item
            const allClickHandlers = mockCreatedNoteItemDiv.addEventListener.mock.calls.filter(call => call[0] === 'click');
            const firstItemClickHandler = allClickHandlers[0][1]; // Handler for the first note
            
            mockCreatedNoteItemDiv.classList.contains.mockReturnValue(false); // Target is not delete-item
            firstItemClickHandler({ target: mockCreatedNoteItemDiv });
            expect(mockOnNoteClick).toHaveBeenCalledWith(firstNote); // Expect firstNote
            mockOnNoteClick.mockClear();

            // Test click on the last item
            const lastItemClickHandler = allClickHandlers[allClickHandlers.length - 1][1]; // Handler for the last note
            mockCreatedNoteItemDiv.classList.contains.mockReturnValue(false); // Target is not delete-item
            lastItemClickHandler({ target: mockCreatedNoteItemDiv });
            expect(mockOnNoteClick).toHaveBeenCalledWith(lastNote); // Expect lastNote

            // Test delete button click (using the handler for the last note as an example)
            mockOnNoteClick.mockClear(); // Clear from previous item click
            mockCreatedDeleteButton.classList.contains.mockReturnValue(true); // Target IS delete-item
            lastItemClickHandler({ target: mockCreatedDeleteButton }); // Event target is delete button
            expect(mockOnNoteClick).not.toHaveBeenCalled(); // Main item click should not fire

            const deleteButtonSpecificHandler = mockCreatedDeleteButton.addEventListener.mock.calls.filter(call => call[0] === 'click')[notes.length-1][1];
            const mockEvent = { stopPropagation: jest.fn(), target: { dataset: { id: lastNote.id, uniqueid: lastNote.uniqueId } } };
            deleteButtonSpecificHandler(mockEvent);
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(mockOnRemoveClick).toHaveBeenCalledWith(lastNote.id, lastNote.uniqueId);
        });
    });
    
    describe('updateShareButtonVisibilityUI', () => {
        test('should show share button if creator', () => { ui.updateShareButtonVisibilityUI(true); expect(mockDom.shareBtn.classList.toggle).toHaveBeenCalledWith('hidden', false); });
        test('should hide share button if not creator', () => { ui.updateShareButtonVisibilityUI(false); expect(mockDom.shareBtn.classList.toggle).toHaveBeenCalledWith('hidden', true); });
    });
    describe('setEditorDisabledUI', () => {
        test('should disable editor', () => { ui.setEditorDisabledUI(true); expect(mockDom.markdownEditor.disabled).toBe(true); });
        test('should enable editor', () => { ui.setEditorDisabledUI(false); expect(mockDom.markdownEditor.disabled).toBe(false); });
    });
    describe('setEditorValue', () => {
        test('should set editor value', () => { ui.setEditorValue('Content'); expect(mockDom.markdownEditor.value).toBe('Content'); });
    });
    
    describe('setExpirationRadioUI', () => {
        let testMockRadioArray; 
        beforeEach(() => {
            testMockRadioArray = [
                { value: 'none', checked: false, name: 'expiration' }, { value: '1h', checked: false, name: 'expiration' },
                { value: '1d', checked: false, name: 'expiration' }, { value: '7d', checked: false, name: 'expiration' },
            ];
            mockDom.expirationRadios.mockReturnValue(testMockRadioArray);
        });
        test('should select "none" if no expiresAt', () => { ui.setExpirationRadioUI(null); expect(testMockRadioArray.find(r=>r.value==='none').checked).toBe(true); });
        test('should select "none" if expiresAt is past', () => { ui.setExpirationRadioUI(new Date(Date.now() - 3600000).toISOString()); expect(testMockRadioArray.find(r=>r.value==='none').checked).toBe(true); });
        test('should select "1h" if expiresAt within 1 hour', () => { ui.setExpirationRadioUI(new Date(Date.now() + 1800000).toISOString()); expect(testMockRadioArray.find(r=>r.value==='1h').checked).toBe(true); });
        test('should select "1d" if expiresAt within 1 day', () => { ui.setExpirationRadioUI(new Date(Date.now() + 3600000*12).toISOString()); expect(testMockRadioArray.find(r=>r.value==='1d').checked).toBe(true); });
        test('should select "7d" if expiresAt > 1 day', () => { ui.setExpirationRadioUI(new Date(Date.now() + 3600000*25).toISOString()); expect(testMockRadioArray.find(r=>r.value==='7d').checked).toBe(true); });
        test('should default to "none" if radio not found', () => {
            const limited = [{ value: 'none', checked: false }]; mockDom.expirationRadios.mockReturnValue(limited);
            ui.setExpirationRadioUI(new Date(Date.now() + 1800000).toISOString()); expect(limited[0].checked).toBe(true);
        });
        test('should throw if "none" radio not found for fallback', () => {
            mockDom.expirationRadios.mockReturnValue([]);
            expect(() => ui.setExpirationRadioUI(new Date().toISOString())).toThrow();
        });
    });
});