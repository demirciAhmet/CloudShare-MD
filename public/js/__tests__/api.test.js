// public/js/__tests__/api.test.js
import * as api from '../api.js';
import { API_BASE_URL } from '../config.js';

// Mock global fetch
global.fetch = jest.fn();

// Mock console.error to avoid cluttering test output, but allow checking if it was called
let consoleErrorSpy;

describe('API Service', () => {
    beforeEach(() => {
        fetch.mockClear();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('saveInitialNoteAPI', () => {
        const content = 'Test content';

        test('should make a POST request to the correct URL with content', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({ id: 1, uniqueId: 'abc', creatorToken: 'xyz' }),
            });

            await api.saveInitialNoteAPI(content);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
        });

        test('should return data on successful save', async () => {
            const mockResponseData = { id: 1, uniqueId: 'abc', creatorToken: 'xyz' };
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => mockResponseData,
            });

            const result = await api.saveInitialNoteAPI(content);
            expect(result.data).toEqual(mockResponseData);
            expect(result.status).toBe(201);
        });

        test('should return error on failed save', async () => {
            const errorMessage = 'Failed to create';
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ message: errorMessage }),
            });

            const result = await api.saveInitialNoteAPI(content);
            expect(result.error).toBe(errorMessage);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('should handle network errors gracefully and return the error message', async () => {
            const networkErrorMessage = 'Network failure';
            fetch.mockRejectedValueOnce(new Error(networkErrorMessage)); // Error object has a 'message' property
            const result = await api.saveInitialNoteAPI(content);
            // The fetchAPI helper returns error.message if it exists
            expect(result.error).toBe(networkErrorMessage);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('should handle network errors gracefully and return default if no message', async () => {
            fetch.mockRejectedValueOnce({}); // Simulate an error object without a 'message' property
            const result = await api.saveInitialNoteAPI(content);
            expect(result.error).toBe('Network request failed');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('saveNoteChangesAPI', () => {
        const noteId = '123';
        const content = 'Updated content';
        const token = 'test-token';

        test('should make a PUT request with content and token', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ message: 'Note saved' }),
            });

            await api.saveNoteChangesAPI(noteId, content, token);

            expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Creator-Token': token,
                },
                body: JSON.stringify({ content }),
            });
        });

        test('should handle 204 No Content response', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 204,
                // No json method for 204
            });
            const result = await api.saveNoteChangesAPI(noteId, content, token);
            expect(result.data).toBeNull();
            expect(result.status).toBe(204);
        });
    });

    describe('loadNoteForViewingAPI', () => {
        const uniqueId = 'unique-abc';

        test('should make a GET request to the correct URL with empty options object', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ id: 1, content: 'View content' }),
            });

            await api.loadNoteForViewingAPI(uniqueId);

            // fetchAPI is called as fetchAPI(url), so options defaults to {}
            // Then fetch is called as fetch(url, options)
            expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/${uniqueId}`, {});
        });

        test('should return { error: "expired" } for 410 status', async () => {
            fetch.mockResolvedValueOnce({
                ok: false, // ok is false for 4xx and 5xx
                status: 410,
            });

            const result = await api.loadNoteForViewingAPI(uniqueId);
            expect(result.error).toBe('expired');
            expect(result.status).toBe(410);
            expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('API Call Failed'), expect.anything());
        });
    });

    describe('loadNoteForEditingAPI', () => {
        const noteId = 'edit-123';
        const token = 'edit-token';

        test('should make a GET request with token in headers', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ id: 'edit-123', content: 'Editable content' }),
            });

            await api.loadNoteForEditingAPI(noteId, token);

            expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/edit/${noteId}`, {
                headers: { 'X-Creator-Token': token },
            });
        });
    });

    describe('updateNoteExpirationAPI', () => {
        const noteId = 'exp-123';
        const token = 'exp-token';
        const expirationOption = '1h';

        test('should make a PUT request with expiration option and token', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ message: 'Expiration set' }),
            });

            await api.updateNoteExpirationAPI(noteId, token, expirationOption);

            expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/${noteId}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Creator-Token': token,
                },
                body: JSON.stringify({ expirationOption }),
            });
        });
    });
});