import { API_BASE_URL } from './config.js';

async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (response.status === 410) return { error: 'expired', status: response.status };
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Server error details unavailable' }));
            throw new Error(errorData.message || `HTTP error ${response.status}`);
        }
        // Handle 204 No Content for successful PUT/DELETE without a body
        if (response.status === 204) return { data: null, status: response.status };
        return { data: await response.json(), status: response.status };
    } catch (error) {
        console.error('API Call Failed:', error.message, 'URL:', url, 'Options:', options);
        return { error: error.message || 'Network request failed' };
    }
}

export function saveInitialNoteAPI(content) {
    return fetchAPI(API_BASE_URL, { // Assuming API_BASE_URL is like '/api/notes'
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
}

export function saveNoteChangesAPI(noteId, content, token) {
    return fetchAPI(`${API_BASE_URL}/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Creator-Token': token },
        body: JSON.stringify({ content })
    });
}

export function loadNoteForViewingAPI(uniqueId) {
    return fetchAPI(`${API_BASE_URL}/${uniqueId}`);
}

export function loadNoteForEditingAPI(noteId, token) {
    return fetchAPI(`${API_BASE_URL}/edit/${noteId}`, { // Assuming distinct endpoint for edit loading
        headers: { 'X-Creator-Token': token }
    });
}

export function updateNoteExpirationAPI(noteId, token, expirationOption) {
    return fetchAPI(`${API_BASE_URL}/${noteId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Creator-Token': token },
        body: JSON.stringify({ expirationOption })
    });
}