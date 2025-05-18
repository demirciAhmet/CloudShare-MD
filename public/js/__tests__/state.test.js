import * as State from '../state.js';
import {
    THEME_STORAGE_KEY,
    DEFAULT_THEME,
    RECENT_NOTES_LIMIT,
    NOTE_TOKEN_STORAGE_PREFIX,
    SAVE_INTERVAL
} from '../config.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});
describe('Application State Management', () => {
    beforeEach(() => {
        State.resetStateForTesting(); // Reset the in-memory state
        localStorageMock.clear();     // Clear the mock localStorage
    });

    // Your 'Initial State and Getters' test should now directly reflect getInitialAppState
    describe('Initial State and Getters', () => {
        test('should return the initial default state', () => {
            const initialState = State.getState();
            expect(initialState.currentNoteId).toBeNull();
            expect(initialState.uniqueId).toBeNull();
            expect(initialState.creatorToken).toBeNull();
            expect(initialState.isCreator).toBe(false);
            expect(initialState.isNewNote).toBe(true);
            expect(initialState.content).toBe('');
            expect(initialState.lastSavedContent).toBe('');
            expect(initialState.saveInterval).toBe(SAVE_INTERVAL); // From config
            expect(initialState.recentNotes).toEqual([]);
            expect(initialState.theme).toBe(DEFAULT_THEME); // From config
            // Add checks for isLoading, errorMessage, isDirty if you kept them
            expect(initialState.isLoading).toBe(false);
            expect(initialState.errorMessage).toBeNull();
            expect(initialState.isDirty).toBe(false);
        });
    });

    describe('updateState', () => {
        test('should update the state with new values', () => {
            State.updateState({ content: 'New Content', isNewNote: false });
            const updatedState = State.getState();
            expect(updatedState.content).toBe('New Content');
            expect(updatedState.isNewNote).toBe(false);
            expect(updatedState.theme).toBe(DEFAULT_THEME); // Should remain from initial
        });

        test('should only update specified properties', () => {
            const initialContent = State.getState().content; // Will be ''
            State.updateState({ currentNoteId: '123' });
            const updatedState = State.getState();
            expect(updatedState.currentNoteId).toBe('123');
            expect(updatedState.content).toBe(initialContent);
        });
    });

    describe('Theme Management', () => {
        test('initializeThemeState should load theme from localStorage if present', () => {
            localStorageMock.setItem(THEME_STORAGE_KEY, 'dark');
            State.initializeThemeState();
            expect(State.getState().theme).toBe('dark');
        });

        test('initializeThemeState should use DEFAULT_THEME if nothing in localStorage', () => {
            State.initializeThemeState();
            expect(State.getState().theme).toBe(DEFAULT_THEME);
        });

        test('setThemeState should update appState and localStorage', () => {
            State.setThemeState('custom_theme');
            expect(State.getState().theme).toBe('custom_theme');
            expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBe('custom_theme');
        });
    });

    describe('Note Token Storage', () => {
        const testNoteId = 'note123';
        const testToken = 'tokenAbc';

        test('storeNoteTokenInStorage should save token to localStorage', () => {
            State.storeNoteTokenInStorage(testNoteId, testToken);
            expect(localStorageMock.getItem(`${NOTE_TOKEN_STORAGE_PREFIX}${testNoteId}`)).toBe(testToken);
        });

        test('getNoteTokenFromStorage should retrieve token from localStorage', () => {
            localStorageMock.setItem(`${NOTE_TOKEN_STORAGE_PREFIX}${testNoteId}`, testToken);
            const retrievedToken = State.getNoteTokenFromStorage(testNoteId);
            expect(retrievedToken).toBe(testToken);
        });

        test('getNoteTokenFromStorage should return null if token not found', () => {
            const retrievedToken = State.getNoteTokenFromStorage('nonExistentId');
            expect(retrievedToken).toBeNull();
        });
    });

    describe('Recent Notes Management', () => {
        const note1 = { id: '1', uniqueId: 'u1', title: 'Note 1', updatedAt: new Date().toISOString(), viewOnly: false };
        const note2 = { id: '2', uniqueId: 'u2', title: 'Note 2', updatedAt: new Date().toISOString(), viewOnly: true };
        const note3 = { id: '3', uniqueId: 'u3', title: 'Note 3', updatedAt: new Date().toISOString(), viewOnly: false };

        beforeEach(() => {
            // Ensure a clean state for recentNotes tests
            State.updateState({ recentNotes: [] });
            localStorageMock.removeItem('recent_notes');
        });

        test('loadRecentNotesState should load notes from localStorage', () => {
            const notesToStore = [note1, note2];
            localStorageMock.setItem('recent_notes', JSON.stringify(notesToStore));
            State.loadRecentNotesState();
            expect(State.getState().recentNotes).toEqual(notesToStore);
        });

        test('loadRecentNotesState should handle parsing errors gracefully', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
            localStorageMock.setItem('recent_notes', 'invalid json');
            State.loadRecentNotesState();
            expect(State.getState().recentNotes).toEqual([]);
        
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing stored notes:', expect.any(SyntaxError));
            
            consoleErrorSpy.mockRestore();
        });

        test('addOrUpdateRecentNoteInState should add a new note to the beginning', () => {
            State.addOrUpdateRecentNoteInState(note1);
            expect(State.getState().recentNotes[0]).toEqual(note1);
            State.addOrUpdateRecentNoteInState(note2);
            expect(State.getState().recentNotes[0]).toEqual(note2);
            expect(State.getState().recentNotes[1]).toEqual(note1);
            expect(JSON.parse(localStorageMock.getItem('recent_notes'))[0]).toEqual(note2);
        });

        test('addOrUpdateRecentNoteInState should update an existing note by id and move to beginning', () => {
            State.addOrUpdateRecentNoteInState(note1);
            const updatedNote1 = { ...note1, title: 'Updated Note 1' };
            State.addOrUpdateRecentNoteInState(updatedNote1);
            const recentNotes = State.getState().recentNotes;
            expect(recentNotes.length).toBe(1);
            expect(recentNotes[0].title).toBe('Updated Note 1');
        });
        
        test('addOrUpdateRecentNoteInState should update an existing note by uniqueId and move to beginning', () => {
            const viewOnlyNote = { uniqueId: 'u1', title: 'View Only', updatedAt: new Date().toISOString(), viewOnly: true };
            State.addOrUpdateRecentNoteInState(viewOnlyNote);
            const updatedViewOnlyNote = { ...viewOnlyNote, title: 'Updated View Only' };
            State.addOrUpdateRecentNoteInState(updatedViewOnlyNote);
            const recentNotes = State.getState().recentNotes;
            expect(recentNotes.length).toBe(1);
            expect(recentNotes[0].title).toBe('Updated View Only');
        });


        test('addOrUpdateRecentNoteInState should respect RECENT_NOTES_LIMIT', () => {
            for (let i = 0; i < RECENT_NOTES_LIMIT + 2; i++) {
                State.addOrUpdateRecentNoteInState({ id: `${i}`, uniqueId: `u${i}`, title: `Note ${i}`, updatedAt: new Date().toISOString(), viewOnly: false });
            }
            expect(State.getState().recentNotes.length).toBe(RECENT_NOTES_LIMIT);
            expect(State.getState().recentNotes[0].id).toBe(`${RECENT_NOTES_LIMIT + 1}`); // Most recent
        });

        test('updateRecentNoteTitleInState should update title and timestamp', () => {
            State.addOrUpdateRecentNoteInState(note1);
            const newTitle = "New Awesome Title";
            const originalTimestamp = State.getState().recentNotes[0].updatedAt;
            
            // Ensure a slight delay for timestamp comparison if needed, or mock Date
            return new Promise(resolve => setTimeout(() => {
                State.updateRecentNoteTitleInState(note1.id, newTitle);
                const updatedNote = State.getState().recentNotes.find(n => n.id === note1.id);
                expect(updatedNote.title).toBe(newTitle);
                expect(new Date(updatedNote.updatedAt).getTime()).toBeGreaterThan(new Date(originalTimestamp).getTime());
                expect(JSON.parse(localStorageMock.getItem('recent_notes'))[0].title).toBe(newTitle);
                resolve();
            }, 10)); // 10ms delay
        });

        test('removeNoteFromHistoryInState should remove a note by id', () => {
            State.addOrUpdateRecentNoteInState(note1);
            State.addOrUpdateRecentNoteInState(note2);
            State.removeNoteFromHistoryInState(note1.id, null); // Pass null for uniqueId if removing by id
            const recentNotes = State.getState().recentNotes;
            expect(recentNotes.length).toBe(1);
            expect(recentNotes[0].id).toBe(note2.id);
            expect(JSON.parse(localStorageMock.getItem('recent_notes')).length).toBe(1);
        });

        test('removeNoteFromHistoryInState should remove a note by uniqueId', () => {
            State.addOrUpdateRecentNoteInState(note1);
            State.addOrUpdateRecentNoteInState(note2);
            State.removeNoteFromHistoryInState(null, note2.uniqueId); // Pass null for id if removing by uniqueId
            const recentNotes = State.getState().recentNotes;
            expect(recentNotes.length).toBe(1);
            expect(recentNotes[0].uniqueId).toBe(note1.uniqueId);
        });

        test('clearHistoryInState should remove all recent notes', () => {
            State.addOrUpdateRecentNoteInState(note1);
            State.addOrUpdateRecentNoteInState(note2);
            State.clearHistoryInState();
            expect(State.getState().recentNotes.length).toBe(0);
            expect(localStorageMock.getItem('recent_notes')).toBeNull();
        });
    });
});