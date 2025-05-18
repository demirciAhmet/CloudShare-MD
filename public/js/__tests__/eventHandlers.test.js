// public/js/__tests__/eventHandlers.test.js

// Mocked module variables - these need to be accessible by jest.mock factories
var mockDOM_elements; // Renamed to avoid conflict with the DOM global
var mockUI;
var mockNoteManager;
var mockEditor;
var mockGetState;
let consoleLogSpy; // For spying on console.log

// --- Mocking External Modules ---

// Factory for DOM mocks
const createMockDomElements = () => ({
    shareLinkInput: { value: 'http://example.com/share' },
    copyLinkBtn: { textContent: 'Copy' },
    copyMarkdownBtn: { textContent: 'Copy Markdown' },
    sidebar: { classList: { contains: jest.fn().mockReturnValue(true) } },
    notificationModal: { classList: { contains: jest.fn().mockReturnValue(true) } },
    shareDropdown: { classList: { contains: jest.fn().mockReturnValue(true) } },
    // Add other DOM elements if directly accessed by handlers in a way that needs mocking
});

jest.mock('../dom.js', () => {
    mockDOM_elements = createMockDomElements();
    return {
        __esModule: true,
        ...mockDOM_elements
    };
});

jest.mock('../ui.js', () => {
    mockUI = {
        displayShareLink: jest.fn(),
        showNotification: jest.fn(),
        copyTextToClipboard: jest.fn(),
        setEditorPreviewMode: jest.fn(),
        closeSidebar: jest.fn(),
        toggleSidebar: jest.fn(),
        toggleThemeOnPage: jest.fn(),
        closeNotification: jest.fn(),
        closeExpiredModal: jest.fn(),
        closeShareDropdown: jest.fn(),
        getExpirationTextForDisplay: jest.fn(val => `Formatted: ${val}`),
    };
    return {
        __esModule: true,
        ...mockUI
    };
});

jest.mock('../noteManager.js', () => {
    mockNoteManager = {
        createNewNoteFlow: jest.fn(),
        saveNewNote: jest.fn(),
        clearAllRecentHistory: jest.fn(),
        updateNoteExpirationSetting: jest.fn(),
        triggerManualSave: jest.fn(),
    };
    return {
        __esModule: true,
        ...mockNoteManager
    };
});

jest.mock('../editor.js', () => {
    mockEditor = {
        updateMarkdownPreview: jest.fn(),
    };
    return {
        __esModule: true,
        ...mockEditor
    };
});

jest.mock('../state.js', () => {
    mockGetState = jest.fn();
    return {
        __esModule: true,
        getState: mockGetState,
    };
});


describe('Event Handlers Module', () => {
    let Handlers;

    beforeEach(() => {
        jest.resetModules();
        Handlers = require('../eventHandlers.js');
        
        mockDOM_elements = require('../dom.js');
        mockUI = require('../ui.js');
        mockNoteManager = require('../noteManager.js');
        mockEditor = require('../editor.js');
        const stateModule = require('../state.js');
        mockGetState = stateModule.getState;

        // Spy on console.log and suppress its output
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        mockGetState.mockClear().mockReturnValue({
            isNewNote: true,
            content: '',
        });

        Object.values(mockUI).forEach(mockFn => { if (jest.isMockFunction(mockFn)) mockFn.mockClear(); });
        Object.values(mockNoteManager).forEach(mockFn => { if (jest.isMockFunction(mockFn)) mockFn.mockClear(); });
        Object.values(mockEditor).forEach(mockFn => { if (jest.isMockFunction(mockFn)) mockFn.mockClear(); });

        mockDOM_elements.sidebar.classList.contains.mockClear().mockReturnValue(true);
        mockDOM_elements.notificationModal.classList.contains.mockClear().mockReturnValue(true);
        mockDOM_elements.shareDropdown.classList.contains.mockClear().mockReturnValue(true);
    });

    afterEach(() => {
        // Restore console.log to its original implementation
        if (consoleLogSpy) {
            consoleLogSpy.mockRestore();
        }
    });

    describe('onNewNoteClick', () => {
        test('should call NoteManager.createNewNoteFlow', () => {
            Handlers.onNewNoteClick();
            expect(mockNoteManager.createNewNoteFlow).toHaveBeenCalledTimes(1);
        });
    });

    describe('onShareClick', () => {
        test('should call NoteManager.saveNewNote and UI.displayShareLink if new note with content', async () => {
            mockGetState.mockReturnValue({ isNewNote: true, content: 'Some content' });
            mockNoteManager.saveNewNote.mockResolvedValue({ id: '123' });

            await Handlers.onShareClick();

            expect(mockNoteManager.saveNewNote).toHaveBeenCalledTimes(1);
            expect(mockUI.displayShareLink).toHaveBeenCalledTimes(1);
            expect(mockUI.showNotification).not.toHaveBeenCalled();
        });

        test('should call UI.showNotification if new note with empty content', async () => {
            mockGetState.mockReturnValue({ isNewNote: true, content: '  ' });

            await Handlers.onShareClick();

            expect(mockNoteManager.saveNewNote).not.toHaveBeenCalled();
            expect(mockUI.displayShareLink).not.toHaveBeenCalled();
            expect(mockUI.showNotification).toHaveBeenCalledWith('Add content before sharing.');
        });

        test('should call UI.displayShareLink directly if not a new note', async () => {
            mockGetState.mockReturnValue({ isNewNote: false, content: 'Existing content' });

            await Handlers.onShareClick();

            expect(mockNoteManager.saveNewNote).not.toHaveBeenCalled();
            expect(mockUI.displayShareLink).toHaveBeenCalledTimes(1);
        });

        test('should not call UI.displayShareLink if saveNewNote returns null (error case)', async () => {
            mockGetState.mockReturnValue({ isNewNote: true, content: 'Some content' });
            mockNoteManager.saveNewNote.mockResolvedValue(null);

            await Handlers.onShareClick();

            expect(mockNoteManager.saveNewNote).toHaveBeenCalledTimes(1);
            expect(mockUI.displayShareLink).not.toHaveBeenCalled();
        });
    });

    describe('onCopyLinkClick', () => {
        test('should call UI.copyTextToClipboard with shareLinkInput value and copyLinkBtn', () => {
            Handlers.onCopyLinkClick();
            expect(mockUI.copyTextToClipboard).toHaveBeenCalledWith(mockDOM_elements.shareLinkInput.value, mockDOM_elements.copyLinkBtn);
        });
    });

    describe('onCopyMarkdownClick', () => {
        test('should call UI.copyTextToClipboard with current content and copyMarkdownBtn', () => {
            const testContent = '# Markdown!';
            mockGetState.mockReturnValue({ content: testContent });
            Handlers.onCopyMarkdownClick();
            expect(mockUI.copyTextToClipboard).toHaveBeenCalledWith(testContent, mockDOM_elements.copyMarkdownBtn, 'Copied!', 'Copy Markdown');
        });
    });

    describe('onEditPreviewToggle', () => {
        test('should call UI.setEditorPreviewMode with target dataset mode and Editor.updateMarkdownPreview', () => {
            const mockEvent = { target: { dataset: { mode: 'preview' } } };
            Handlers.onEditPreviewToggle(mockEvent);
            expect(mockUI.setEditorPreviewMode).toHaveBeenCalledWith('preview', mockEditor.updateMarkdownPreview);
        });
    });

    describe('onCloseSidebar', () => {
        test('should call UI.closeSidebar', () => {
            Handlers.onCloseSidebar();
            expect(mockUI.closeSidebar).toHaveBeenCalledTimes(1);
        });
    });

    describe('onToggleSidebar', () => {
        test('should call UI.toggleSidebar', () => {
            Handlers.onToggleSidebar();
            expect(mockUI.toggleSidebar).toHaveBeenCalledTimes(1);
        });
    });

    describe('onThemeToggle', () => {
        test('should call UI.toggleThemeOnPage', () => {
            Handlers.onThemeToggle();
            expect(mockUI.toggleThemeOnPage).toHaveBeenCalledTimes(1);
        });
    });

    describe('onClearHistory', () => {
        test('should call NoteManager.clearAllRecentHistory', () => {
            Handlers.onClearHistory();
            expect(mockNoteManager.clearAllRecentHistory).toHaveBeenCalledTimes(1);
        });
    });

    describe('onNotificationClose', () => {
        test('should call UI.closeNotification', () => {
            Handlers.onNotificationClose();
            expect(mockUI.closeNotification).toHaveBeenCalledTimes(1);
        });
    });

    describe('onExpiredOk', () => {
        test('should call UI.closeExpiredModal and NoteManager.createNewNoteFlow', () => {
            Handlers.onExpiredOk();
            expect(mockUI.closeExpiredModal).toHaveBeenCalledTimes(1);
            expect(mockNoteManager.createNewNoteFlow).toHaveBeenCalledTimes(1);
        });
    });

    describe('onCloseShare', () => {
        test('should call UI.closeShareDropdown', () => {
            Handlers.onCloseShare();
            expect(mockUI.closeShareDropdown).toHaveBeenCalledTimes(1);
        });
    });

    describe('onExpirationChange', () => {
        test('should call NoteManager.updateNoteExpirationSetting with event target value', () => {
            const mockEvent = { target: { value: '1d' } };
            Handlers.onExpirationChange(mockEvent);
            expect(mockNoteManager.updateNoteExpirationSetting).toHaveBeenCalledWith('1d');
        });
    });

    describe('onWindowClick', () => {
        test('should close share dropdown if target is shareDropdown', () => {
            const mockEvent = { target: mockDOM_elements.shareDropdown };
            Handlers.onWindowClick(mockEvent);
            expect(mockUI.closeShareDropdown).toHaveBeenCalledTimes(1);
            expect(mockUI.closeNotification).not.toHaveBeenCalled();
        });

        test('should close notification modal if target is notificationModal', () => {
            const mockEvent = { target: mockDOM_elements.notificationModal };
            Handlers.onWindowClick(mockEvent);
            expect(mockUI.closeNotification).toHaveBeenCalledTimes(1);
            expect(mockUI.closeShareDropdown).not.toHaveBeenCalled();
        });

        test('should do nothing if target is neither', () => {
            const mockEvent = { target: {} };
            Handlers.onWindowClick(mockEvent);
            expect(mockUI.closeShareDropdown).not.toHaveBeenCalled();
            expect(mockUI.closeNotification).not.toHaveBeenCalled();
        });
    });

    describe('onDocumentKeydown', () => {
        let mockPreventDefault;

        beforeEach(() => {
            mockPreventDefault = jest.fn();
        });

        test('Ctrl+S should prevent default and trigger manual save', () => {
            const mockEvent = { ctrlKey: true, metaKey: false, key: 's', preventDefault: mockPreventDefault };
            Handlers.onDocumentKeydown(mockEvent);
            expect(mockPreventDefault).toHaveBeenCalledTimes(1);
            expect(mockNoteManager.triggerManualSave).toHaveBeenCalledTimes(1);
        });

        test('Meta+S (Cmd+S) should prevent default and trigger manual save', () => {
            const mockEvent = { ctrlKey: false, metaKey: true, key: 's', preventDefault: mockPreventDefault };
            Handlers.onDocumentKeydown(mockEvent);
            expect(mockPreventDefault).toHaveBeenCalledTimes(1);
            expect(mockNoteManager.triggerManualSave).toHaveBeenCalledTimes(1);
        });

        test('Ctrl+D should prevent default and toggle theme', () => {
            const mockEvent = { ctrlKey: true, metaKey: false, key: 'd', preventDefault: mockPreventDefault };
            Handlers.onDocumentKeydown(mockEvent);
            expect(mockPreventDefault).toHaveBeenCalledTimes(1);
            expect(mockUI.toggleThemeOnPage).toHaveBeenCalledTimes(1);
        });

        test('Escape key should close share dropdown if visible', () => {
            mockDOM_elements.shareDropdown.classList.contains.mockReturnValue(false);
            mockDOM_elements.notificationModal.classList.contains.mockReturnValue(true);
            mockDOM_elements.sidebar.classList.contains.mockReturnValue(true);
            const mockEvent = { key: 'Escape', preventDefault: mockPreventDefault };

            Handlers.onDocumentKeydown(mockEvent);
            expect(mockUI.closeShareDropdown).toHaveBeenCalledTimes(1);
            expect(mockUI.closeNotification).not.toHaveBeenCalled();
            expect(mockUI.closeSidebar).not.toHaveBeenCalled();
        });

        test('Escape key should close notification modal if visible (and share is hidden)', () => {
            mockDOM_elements.shareDropdown.classList.contains.mockReturnValue(true);
            mockDOM_elements.notificationModal.classList.contains.mockReturnValue(false);
            mockDOM_elements.sidebar.classList.contains.mockReturnValue(true);
            const mockEvent = { key: 'Escape', preventDefault: mockPreventDefault };

            Handlers.onDocumentKeydown(mockEvent);
            expect(mockUI.closeNotification).toHaveBeenCalledTimes(1);
            expect(mockUI.closeShareDropdown).not.toHaveBeenCalled();
            expect(mockUI.closeSidebar).not.toHaveBeenCalled();
        });

        test('Escape key should close sidebar if visible (and others are hidden)', () => {
            mockDOM_elements.shareDropdown.classList.contains.mockReturnValue(true);
            mockDOM_elements.notificationModal.classList.contains.mockReturnValue(true);
            mockDOM_elements.sidebar.classList.contains.mockReturnValue(false);
            const mockEvent = { key: 'Escape', preventDefault: mockPreventDefault };

            Handlers.onDocumentKeydown(mockEvent);
            expect(mockUI.closeSidebar).toHaveBeenCalledTimes(1);
            expect(mockUI.closeShareDropdown).not.toHaveBeenCalled();
            expect(mockUI.closeNotification).not.toHaveBeenCalled();
        });

        test('Escape key should close only the first visible item in order of check', () => {
            mockDOM_elements.shareDropdown.classList.contains.mockReturnValue(false);
            mockDOM_elements.notificationModal.classList.contains.mockReturnValue(false);
            mockDOM_elements.sidebar.classList.contains.mockReturnValue(false);
            const mockEvent = { key: 'Escape', preventDefault: mockPreventDefault };

            Handlers.onDocumentKeydown(mockEvent);
            expect(mockUI.closeShareDropdown).toHaveBeenCalledTimes(1);
            expect(mockUI.closeNotification).not.toHaveBeenCalled();
            expect(mockUI.closeSidebar).not.toHaveBeenCalled();
        });

        test('Other keys should do nothing significant', () => {
            const mockEvent = { key: 'a', preventDefault: mockPreventDefault, ctrlKey: false, metaKey: false };
            Handlers.onDocumentKeydown(mockEvent);
            expect(mockPreventDefault).not.toHaveBeenCalled();
            expect(mockNoteManager.triggerManualSave).not.toHaveBeenCalled();
            expect(mockUI.toggleThemeOnPage).not.toHaveBeenCalled();
            expect(mockUI.closeShareDropdown).not.toHaveBeenCalled();
            expect(mockUI.closeNotification).not.toHaveBeenCalled();
            expect(mockUI.closeSidebar).not.toHaveBeenCalled();
        });
    });
});