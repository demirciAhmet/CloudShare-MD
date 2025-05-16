document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const markdownEditor = document.getElementById('markdown-editor');
    const markdownPreview = document.getElementById('markdown-preview');
    const saveStatus = document.getElementById('save-status');
    const newNoteBtn = document.getElementById('new-note-btn');
    const shareBtn = document.getElementById('share-btn');
    const shareDropdown = document.getElementById('share-dropdown');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const copyMarkdownBtn = document.getElementById('copy-markdown-btn');
    const editPreviewToggle = document.getElementById('edit-preview-toggle');
    const contentArea = document.getElementById('content-area');
    const recentNotes = document.getElementById('recent-notes');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const notificationModal = document.getElementById('notification-modal');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    const expirationRadios = document.querySelectorAll('input[name="expiration"]');
    const expiredModal = document.getElementById('expired-modal');
    const expiredOkBtn = document.getElementById('expired-ok-btn');
    const closeShareBtn = document.getElementById('close-share');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Application State
    let appState = {
        currentNoteId: null,
        uniqueId: null,
        creatorToken: null,
        isCreator: false,
        isNewNote: true,
        content: '',
        lastSavedContent: '',
        saveTimeout: null,
        saveInterval: 2000, // 2 seconds
        recentNotes: [],
        theme: localStorage.getItem('theme') || 'light'
    };

    // Initialize marked options for Markdown rendering
    marked.setOptions({
        highlight: function(code, language) {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(code, { language: language }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true,
        langPrefix: 'hljs language-'  // Add this line
    });

    // Add this line after marked.setOptions
    hljs.highlightAll();

    // Set up event listeners
    function initializeEventListeners() {
        // Editor changes
        markdownEditor.addEventListener('input', handleEditorInput);
        
        // Buttons
        newNoteBtn.addEventListener('click', createNewNote);
        shareBtn.addEventListener('click', toggleShareDropdown);
        copyLinkBtn.addEventListener('click', copyShareLink);
        copyMarkdownBtn.addEventListener('click', copyMarkdownContent);
        
        // Edit/Preview toggle
        editPreviewToggle.addEventListener('click', handleEditPreviewToggle);
        
        // Sidebar
        closeSidebarBtn.addEventListener('click', closeSidebar);
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
        
        // Theme toggle
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        // Clear history
        clearHistoryBtn.addEventListener('click', clearHistory);
        
        // Modal
        notificationClose.addEventListener('click', closeNotification);
        expiredOkBtn.addEventListener('click', closeExpiredModal);
        closeShareBtn.addEventListener('click', closeShareModal);
        
        // Expiration options
        expirationRadios.forEach(radio => {
            radio.addEventListener('change', updateExpiration);
        });
        
        // Outside click for modals
        window.addEventListener('click', function(event) {
            if (event.target === shareDropdown) {
                shareDropdown.classList.add('hidden');
            }
            if (event.target === notificationModal) {
                closeNotification();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (appState.isNewNote && appState.content.trim()) {
                    saveInitialNote();
                } else if (!appState.isNewNote && appState.isCreator) {
                    saveNoteChanges();
                }
            }
            
            // Ctrl/Cmd + D to toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                toggleTheme();
            }
            
            // Esc to close modals
            if (e.key === 'Escape') {
                if (!shareDropdown.classList.contains('hidden')) {
                    closeShareModal();
                }
                if (!notificationModal.classList.contains('hidden')) {
                    closeNotification();
                }
                if (!sidebar.classList.contains('collapsed')) {
                    closeSidebar();
                }
            }
        });
    }

    // Theme toggle
    function toggleTheme() {
        const newTheme = appState.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        appState.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        
        // Update theme emoji
        themeToggleBtn.textContent = newTheme === 'light' ? '🌓' : '☀️';
    }

    // Initialize theme
    function initializeTheme() {
        document.documentElement.setAttribute('data-theme', appState.theme);
        themeToggleBtn.textContent = appState.theme === 'light' ? '🌓' : '☀️';
    }

    // Clear history
    function clearHistory() {
        if (confirm('Are you sure you want to clear your note history?')) {
            appState.recentNotes = [];
            localStorage.removeItem('recent_notes');
            renderRecentNotes();
            showNotification('History cleared');
        }
    }

    // Remove note from history
    function removeNoteFromHistory(noteId, uniqueId) {
        appState.recentNotes = appState.recentNotes.filter(note => {
            if (noteId && note.id === noteId) return false;
            if (uniqueId && note.uniqueId === uniqueId) return false;
            return true;
        });
        
        localStorage.setItem('recent_notes', JSON.stringify(appState.recentNotes));
        renderRecentNotes();
    }

    // Handle edit/preview toggle
    function handleEditPreviewToggle(event) {
        if (!event.target.classList.contains('button-group-item')) return;
        
        const mode = event.target.dataset.mode;
        const editor = document.getElementById('markdown-editor');
        const preview = document.getElementById('markdown-preview');
        const toggleButtons = document.querySelectorAll('.button-group-item');
        
        toggleButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        if (mode === 'edit') {
            editor.classList.remove('hidden');
            preview.classList.add('hidden');
            editor.focus();
        } else {
            editor.classList.add('hidden');
            preview.classList.remove('hidden');
            // Ensure preview is up to date
            updatePreview();
        }
    }

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
    }
    
    // Close sidebar
    function closeSidebar() {
        sidebar.classList.add('collapsed');
    }

    // Load application based on URL
    function initializeApp() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get('view');
        const editId = urlParams.get('edit');
        
        loadRecentNotes();
        renderRecentNotes();
        initializeTheme();
        
        if (viewId) {
            // Viewer mode
            loadNoteForViewing(viewId);
        } else if (editId) {
            // Creator editing existing note
            const storedToken = localStorage.getItem(`note_token_${editId}`);
            if (storedToken) {
                loadNoteForEditing(editId, storedToken);
            } else {
                showNotification('Creator token not found for this note.');
                createNewNote();
            }
        } else {
            // New note
            createNewNote();
        }
    }

    // Handle editor input with debounced saving
    function handleEditorInput() {
        const content = markdownEditor.value;
        appState.content = content;
        
        // Update preview in real-time if in preview mode
        if (markdownPreview.classList.contains('hidden') === false) {
            updatePreview();
        }
        
        // Only auto-save if creator and not a new unsaved note
        if (appState.isCreator && !appState.isNewNote) {
            setSaveStatus('saving');
            
            // Clear existing timeout
            if (appState.saveTimeout) {
                clearTimeout(appState.saveTimeout);
            }
            
            // Set new timeout for saving
            appState.saveTimeout = setTimeout(() => {
                saveNoteChanges();
            }, appState.saveInterval);
        }
    }

    function updatePreview() {
        try {
            const renderedHTML = marked.parse(appState.content);
            markdownPreview.innerHTML = renderedHTML;
            
            // Apply syntax highlighting to code blocks
            markdownPreview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
            
            // If in preview mode, scroll to match editor's relative position
            if (!markdownPreview.classList.contains('hidden')) {
                const editorScrollRatio = markdownEditor.scrollTop / 
                    (markdownEditor.scrollHeight - markdownEditor.clientHeight || 1);
                const previewScrollTarget = editorScrollRatio * 
                    (markdownPreview.scrollHeight - markdownPreview.clientHeight || 1);
                markdownPreview.scrollTop = previewScrollTarget;
            }
        } catch (error) {
            console.error('Error rendering markdown:', error);
            markdownPreview.innerHTML = '<p class="error">Error rendering Markdown</p>';
        }
    }

    // Create a new empty note
    function createNewNote() {
        // Reset state
        appState.currentNoteId = null;
        appState.uniqueId = null;
        appState.creatorToken = null;
        appState.isCreator = true;
        appState.isNewNote = true;
        appState.content = '';
        appState.lastSavedContent = '';
        
        // Clear editor
        markdownEditor.value = '';
        updatePreview();
        
        // Update UI
        setSaveStatus('ready');
        
        // Enable editor
        markdownEditor.disabled = false;
        
        // Show share button (fix for the issue)
        shareBtn.classList.remove('hidden');
        
        // Switch to edit mode
        const editButton = document.querySelector('.button-group-item[data-mode="edit"]');
        if (editButton && !editButton.classList.contains('active')) {
            editButton.click();
        }
        
        // Update URL without parameters
        history.pushState({}, '', '/');
        
        // Focus on editor
        markdownEditor.focus();
    }

    // Save initial note to get ID and token
    async function saveInitialNote() {
        if (!appState.content.trim()) {
            showNotification('Cannot save empty note');
            return; // Don't save empty notes
        }
        
        setSaveStatus('saving');
        
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: appState.content
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create note');
            }
            
            const data = await response.json();
            
            // Update state with new note data
            appState.currentNoteId = data.id;
            appState.uniqueId = data.uniqueId;
            appState.creatorToken = data.creatorToken;
            appState.isCreator = true;
            appState.isNewNote = false;
            appState.lastSavedContent = appState.content;
            
            // Store token in local storage
            localStorage.setItem(`note_token_${data.id}`, data.creatorToken);
            
            // Update URL with edit parameter
            history.pushState({}, '', `/?edit=${data.id}`);
            
            // Add to recent notes
            addToRecentNotes({
                id: data.id,
                uniqueId: data.uniqueId,
                title: extractTitleFromContent(appState.content),
                updatedAt: new Date()
            });
            
            setSaveStatus('saved');
            
            // Show share options
            showShareLink();
            
        } catch (error) {
            console.error('Error saving note:', error);
            setSaveStatus('error');
            showNotification('Failed to save note. Please try again.');
        }
    }

    // Save changes to an existing note
    async function saveNoteChanges() {
        if (!appState.currentNoteId || !appState.creatorToken) {
            if (appState.isNewNote && appState.content.trim()) {
                saveInitialNote();
            }
            return;
        }
        
        // Don't save if content hasn't changed
        if (appState.content === appState.lastSavedContent) {
            setSaveStatus('saved');
            return;
        }
        
        setSaveStatus('saving');
        
        try {
            const response = await fetch(`/api/notes/${appState.currentNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Creator-Token': appState.creatorToken
                },
                body: JSON.stringify({
                    content: appState.content
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save changes');
            }
            
            appState.lastSavedContent = appState.content;
            setSaveStatus('saved');
            
            // Update recent notes title
            updateRecentNoteTitle(appState.currentNoteId, extractTitleFromContent(appState.content));
            
        } catch (error) {
            console.error('Error saving changes:', error);
            setSaveStatus('error');
            showNotification('Failed to save changes. Please try again.');
        }
    }

    // Load a note for viewing (public read-only mode)
    async function loadNoteForViewing(uniqueId) {
        try {
            const response = await fetch(`/api/notes/${uniqueId}`);
            
            if (response.status === 410) {
                // Note has expired
                showExpiredModal();
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to load note');
            }
            
            const data = await response.json();
            
            // Check if we are the creator of this note
            const creatorToken = localStorage.getItem(`note_token_${data.id}`);
            
            // Update state
            appState.content = data.content;
            appState.uniqueId = uniqueId;
            
            if (creatorToken) {
                // We are the creator!
                appState.creatorToken = creatorToken;
                appState.currentNoteId = data.id;
                appState.isCreator = true;
                appState.isNewNote = false;
                appState.lastSavedContent = data.content;
                
                // Show creator controls
                shareBtn.classList.remove('hidden');
                markdownEditor.disabled = false;
            } else {
                // We are just a viewer
                appState.isCreator = false;
                
                // Hide creator-only controls
                shareBtn.classList.add('hidden');
                markdownEditor.disabled = true; // Read-only
            }
            
            // Update UI
            markdownEditor.value = data.content;
            updatePreview();
            
            // Switch to preview mode for viewers
            if (!appState.isCreator) {
                const previewButton = document.querySelector('.button-group-item[data-mode="preview"]');
                if (previewButton) {
                    previewButton.click();
                }
            }
            
            // Add to recent notes
            addToRecentNotes({
                id: appState.isCreator ? data.id : null,
                uniqueId: uniqueId,
                title: extractTitleFromContent(data.content),
                updatedAt: new Date(data.updatedAt),
                viewOnly: !appState.isCreator
            });
            
        } catch (error) {
            console.error('Error loading note for viewing:', error);
            showNotification('Failed to load note. It may have been removed or expired.');
        }
    }

    // Load a note for editing (creator mode)
    async function loadNoteForEditing(noteId, creatorToken) {
        try {
            const response = await fetch(`/api/notes/edit/${noteId}`, {
                headers: {
                    'X-Creator-Token': creatorToken
                }
            });
            
            if (response.status === 410) {
                // Note has expired
                showExpiredModal();
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to load note for editing');
            }
            
            const data = await response.json();
            
            // Update state
            appState.currentNoteId = data.id;
            appState.uniqueId = data.uniqueId;
            appState.creatorToken = creatorToken;
            appState.content = data.content;
            appState.lastSavedContent = data.content;
            appState.isCreator = true;
            appState.isNewNote = false;
            
            // Update UI
            markdownEditor.value = data.content;
            markdownEditor.disabled = false;
            updatePreview();
            
            // Switch to edit mode for creators
            const editButton = document.querySelector('.button-group-item[data-mode="edit"]');
            if (editButton) {
                editButton.click();
            }
            
            // Show creator controls
            shareBtn.classList.remove('hidden');
            
            // Set expiration radio if exists
            if (data.expiresAt) {
                const expiresAt = new Date(data.expiresAt);
                const now = new Date();
                const diffHours = (expiresAt - now) / (1000 * 60 * 60);
                
                if (diffHours <= 1) {
                    document.querySelector('input[value="1h"]').checked = true;
                } else if (diffHours <= 24) {
                    document.querySelector('input[value="1d"]').checked = true;
                } else {
                    document.querySelector('input[value="7d"]').checked = true;
                }
            } else {
                document.querySelector('input[value="none"]').checked = true;
            }
            
            // Add to recent notes
            addToRecentNotes({
                id: data.id,
                uniqueId: data.uniqueId,
                title: extractTitleFromContent(data.content),
                updatedAt: new Date(data.updatedAt)
            });
            
        } catch (error) {
            console.error('Error loading note for editing:', error);
            showNotification('Failed to load note for editing. You may not have permission.');
            createNewNote();
        }
    }

    // Update expiration setting
    async function updateExpiration(event) {
        if (!appState.currentNoteId || !appState.creatorToken) {
            return;
        }
        
        const expirationOption = event.target.value;
        
        try {
            const response = await fetch(`/api/notes/${appState.currentNoteId}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Creator-Token': appState.creatorToken
                },
                body: JSON.stringify({
                    expirationOption: expirationOption
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to set expiration');
            }
            
            showNotification(`Expiration set: ${getExpirationText(expirationOption)}`);
            
        } catch (error) {
            console.error('Error setting expiration:', error);
            showNotification('Failed to set expiration.');
        }
    }

    // Helper to get human-readable expiration text
    function getExpirationText(option) {
        switch (option) {
            case '1h': return '1 hour';
            case '1d': return '1 day';
            case '7d': return '7 days';
            case 'none': return 'No expiration';
            default: return option;
        }
    }

    // Show share link in dropdown
    function showShareLink() {
        if (!appState.uniqueId) {
            return;
        }
        
        // Generate full URL for sharing
        const shareUrl = `${window.location.origin}/?view=${appState.uniqueId}`;
        shareLink.value = shareUrl;
        shareDropdown.classList.remove('hidden');
    }

    // Toggle share dropdown
    function toggleShareDropdown() {
        if (appState.isNewNote) {
            // Need to save first to get a shareable link
            if (appState.content.trim()) {
                saveInitialNote().then(() => {
                    showShareLink();
                });
            } else {
                showNotification('Please add content before sharing.');
            }
        } else {
            // Show modal
            showShareLink();
        }
    }

    // Close share modal
    function closeShareModal() {
        shareDropdown.classList.add('hidden');
    }

    // Copy share link to clipboard
    function copyShareLink() {
        shareLink.select();
        navigator.clipboard.writeText(shareLink.value)
            .then(() => {
                copyLinkBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyLinkBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy link. Please copy it manually.');
            });
    }

    // Copy raw markdown content
    function copyMarkdownContent() {
        navigator.clipboard.writeText(appState.content)
            .then(() => {
                copyMarkdownBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyMarkdownBtn.textContent = 'Copy Markdown';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy markdown. Please select and copy manually.');
            });
    }

    // Extract title from content (first heading or first line)
    function extractTitleFromContent(content) {
        if (!content) return 'Untitled Note';
        
        // Try to find first heading
        const headingMatch = content.match(/^# (.+)$/m);
        if (headingMatch) {
            return headingMatch[1];
        }
        
        // Fall back to first line, truncated
        const firstLine = content.split('\n')[0].trim();
        if (firstLine) {
            return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
        }
        
        return 'Untitled Note';
    }

    // Set save status with visual indicator
    function setSaveStatus(status) {
        saveStatus.className = 'save-status';
        
        switch (status) {
            case 'saving':
                saveStatus.textContent = 'Saving...';
                saveStatus.classList.add('saving');
                break;
            case 'saved':
                saveStatus.textContent = 'Saved';
                saveStatus.classList.add('saved');
                break;
            case 'error':
                saveStatus.textContent = 'Error saving';
                saveStatus.classList.add('error');
                break;
            default:
                saveStatus.textContent = 'Ready';
                break;
        }
    }

    // Show notification modal
    function showNotification(message) {
        notificationMessage.textContent = message;
        notificationModal.classList.remove('hidden');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            closeNotification();
        }, 3000);
    }

    // Close notification modal
    function closeNotification() {
        notificationModal.classList.add('hidden');
    }

    // Show expired note modal
    function showExpiredModal() {
        expiredModal.classList.remove('hidden');
    }

    // Close expired note modal
    function closeExpiredModal() {
        expiredModal.classList.add('hidden');
        createNewNote();
    }

    // Load recent notes from localStorage
    function loadRecentNotes() {
        const storedNotes = localStorage.getItem('recent_notes');
        if (storedNotes) {
            try {
                appState.recentNotes = JSON.parse(storedNotes);
            } catch (e) {
                console.error('Error parsing stored notes:', e);
                appState.recentNotes = [];
            }
        }
    }

    // Add a note to recent notes list
    function addToRecentNotes(note) {
        // Remove existing entry with same ID if exists
        appState.recentNotes = appState.recentNotes.filter(item => {
            if (note.id && item.id === note.id) return false;
            if (note.uniqueId && item.uniqueId === note.uniqueId) return false;
            return true;
        });
        
        // Add to beginning of array
        appState.recentNotes.unshift(note);
        
        // Limit to 10 items
        if (appState.recentNotes.length > 10) {
            appState.recentNotes = appState.recentNotes.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('recent_notes', JSON.stringify(appState.recentNotes));
        
        // Update UI
        renderRecentNotes();
    }

    // Update title of a recent note
    function updateRecentNoteTitle(noteId, newTitle) {
        const noteIndex = appState.recentNotes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            appState.recentNotes[noteIndex].title = newTitle;
            appState.recentNotes[noteIndex].updatedAt = new Date();
            
            // Save to localStorage
            localStorage.setItem('recent_notes', JSON.stringify(appState.recentNotes));
            
            // Update UI
            renderRecentNotes();
        }
    }

    // Render recent notes in sidebar
    function renderRecentNotes() {
        if (appState.recentNotes.length === 0) {
            recentNotes.innerHTML = '<div class="empty-notes-message">No recent notes</div>';
            return;
        }
        
        recentNotes.innerHTML = '';
        
        appState.recentNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            
            const date = new Date(note.updatedAt);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            noteItem.innerHTML = `
                <h4>${note.title}</h4>
                <p>${note.viewOnly ? 'View only' : 'Editable'} • ${formattedDate}</p>
                <button class="icon-button delete-item" title="Remove from history" data-id="${note.id || ''}" data-uniqueid="${note.uniqueId || ''}">🗑️</button>
            `;
            
            // Click on note item to open it
            noteItem.addEventListener('click', (e) => {
                // Don't trigger if clicking the delete button
                if (e.target.classList.contains('delete-item')) return;
                
                if (note.viewOnly || !note.id) {
                    window.location.href = `/?view=${note.uniqueId}`;
                } else {
                    window.location.href = `/?edit=${note.id}`;
                }
            });
            
            // Add delete button event listener
            const deleteBtn = noteItem.querySelector('.delete-item');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening the note
                const noteId = e.target.getAttribute('data-id');
                const uniqueId = e.target.getAttribute('data-uniqueid');
                removeNoteFromHistory(noteId, uniqueId);
            });
            
            recentNotes.appendChild(noteItem);
        });
    }

    // Initialize the app
    initializeEventListeners();
    initializeApp();
});