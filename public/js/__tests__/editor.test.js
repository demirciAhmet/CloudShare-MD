// public/js/__tests__/editor.test.js

// These must be declared at the top-most scope so the jest.mock factory can assign to them.
let mockMarkdownEditorInstance;
let mockMarkdownPreviewInstance;
const mockGetState = jest.fn(() => ({ content: '' })); // Also top-level for the state mock

jest.mock('../state.js', () => ({
    getState: mockGetState,
}));

jest.mock('../dom.js', () => {
    // Initialize the mock instances inside the factory and assign to the top-level variables
    mockMarkdownEditorInstance = {
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 50,
        classList: { contains: jest.fn() }
    };
    mockMarkdownPreviewInstance = {
        innerHTML: '',
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 50,
        classList: { contains: jest.fn(() => false) }, // Default: preview is visible
        querySelectorAll: jest.fn(() => [])
    };

    return {
        __esModule: true, // Important for ES6 modules
        markdownEditor: mockMarkdownEditorInstance,
        markdownPreview: mockMarkdownPreviewInstance,
    };
});


// Store original globals to restore them
const originalGlobalMarked = global.marked;
const originalGlobalHljs = global.hljs;

let consoleErrorSpy;

describe('Editor Module', () => {
    let editor; // To hold the re-imported module

    beforeEach(async () => {
        jest.resetModules(); // Reset modules to get a fresh instance of editor.js

        // Reset the state of our DOM mock instances before each test.
        // These instances are now guaranteed to be defined by the time beforeEach runs.
        if (mockMarkdownEditorInstance) { // Add checks in case they are somehow not set (defensive)
            mockMarkdownEditorInstance.scrollTop = 0;
            mockMarkdownEditorInstance.scrollHeight = 100;
            mockMarkdownEditorInstance.clientHeight = 50;
            mockMarkdownEditorInstance.classList.contains.mockClear().mockReturnValue(false);
        }

        if (mockMarkdownPreviewInstance) {
            mockMarkdownPreviewInstance.innerHTML = '';
            mockMarkdownPreviewInstance.scrollTop = 0;
            mockMarkdownPreviewInstance.scrollHeight = 100;
            mockMarkdownPreviewInstance.clientHeight = 50;
            mockMarkdownPreviewInstance.classList.contains.mockClear().mockReturnValue(false);
            mockMarkdownPreviewInstance.querySelectorAll.mockClear().mockReturnValue([]);
        }

        // Re-import the module to get the fresh instance.
        editor = await import('../editor.js');

        // Setup fresh mocks for global libraries for each test
        global.marked = {
            parse: jest.fn(content => `parsed:${content}`),
            setOptions: jest.fn(),
        };
        global.hljs = {
            getLanguage: jest.fn(lang => !!lang),
            highlight: jest.fn((code, { language }) => ({ value: `highlighted:${language}:${code}` })),
            highlightElement: jest.fn(),
        };

        mockGetState.mockClear().mockReturnValue({ content: '' });

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        // Restore original globals
        global.marked = originalGlobalMarked;
        global.hljs = originalGlobalHljs;
    });

    describe('initializeMarkdown', () => {
        test('should return true and set marked options if marked and hljs are loaded', () => {
            const result = editor.initializeMarkdown();
            expect(result).toBe(true);
            expect(global.marked.setOptions).toHaveBeenCalledWith(expect.objectContaining({
                breaks: true,
                gfm: true,
                langPrefix: 'hljs language-'
            }));
            const highlightOptionFn = global.marked.setOptions.mock.calls[0][0].highlight;
            expect(highlightOptionFn).toBeInstanceOf(Function);
            highlightOptionFn('testCode', 'js');
            expect(global.hljs.getLanguage).toHaveBeenCalledWith('js');
            expect(global.hljs.highlight).toHaveBeenCalledWith('testCode', { language: 'js' });
        });

        test('should return false and log error if marked is not loaded', () => {
            global.marked = undefined;
            const result = editor.initializeMarkdown();
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Marked.js or Highlight.js is not loaded.");
        });

        test('should return false and log error if hljs is not loaded', () => {
            global.hljs = undefined;
            const result = editor.initializeMarkdown();
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Marked.js or Highlight.js is not loaded.");
        });
    });

    describe('updateMarkdownPreview', () => {
        test('should set preview innerHTML with parsed content if initialized', () => {
            editor.initializeMarkdown();
            const testContent = 'Hello #World';
            mockGetState.mockReturnValue({ content: testContent });

            editor.updateMarkdownPreview();

            expect(global.marked.parse).toHaveBeenCalledWith(testContent);
            expect(mockMarkdownPreviewInstance.innerHTML).toBe(`parsed:${testContent}`);
        });

        test('should call hljs.highlightElement for each code block if initialized', () => {
            editor.initializeMarkdown();
            const codeBlock1 = { tagName: 'CODE' };
            const codeBlock2 = { tagName: 'CODE' };
            mockMarkdownPreviewInstance.querySelectorAll.mockReturnValue([codeBlock1, codeBlock2]);
            mockGetState.mockReturnValue({ content: '```js\nvar a=1;\n```' });

            editor.updateMarkdownPreview();

            expect(mockMarkdownPreviewInstance.querySelectorAll).toHaveBeenCalledWith('pre code');
            expect(global.hljs.highlightElement).toHaveBeenCalledTimes(2);
            expect(global.hljs.highlightElement).toHaveBeenNthCalledWith(1, codeBlock1, 0, [codeBlock1, codeBlock2]);
            expect(global.hljs.highlightElement).toHaveBeenNthCalledWith(2, codeBlock2, 1, [codeBlock1, codeBlock2]);
        });

        test('should set error message in preview if markedInstance is not initialized (initializeMarkdown failed)', () => {
            global.marked = undefined; // Cause initializeMarkdown to fail
            const initResult = editor.initializeMarkdown();
            expect(initResult).toBe(false); // Confirm initialization failed
            mockGetState.mockReturnValue({ content: 'some content that should not be parsed' });

            editor.updateMarkdownPreview();

            expect(mockMarkdownPreviewInstance.innerHTML).toBe('<p class="error">Markdown renderer not initialized.</p>');
        });

        test('should set error message and log if marked.parse throws an error (if initialized)', () => {
            editor.initializeMarkdown(); // Initialize successfully
            mockGetState.mockReturnValue({ content: 'Some content' });
            const parseError = new Error('Parsing failed');
            global.marked.parse.mockImplementationOnce(() => { throw parseError; });

            editor.updateMarkdownPreview();

            expect(mockMarkdownPreviewInstance.innerHTML).toBe('<p class="error">Error rendering Markdown.</p>');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error rendering Markdown:', parseError);
        });

        test('should synchronize scroll position if preview is visible and initialized', () => {
            editor.initializeMarkdown();
            mockGetState.mockReturnValue({ content: 'line1\nline2\nline3\nline4\nline5' });
            mockMarkdownEditorInstance.scrollTop = 25;
            mockMarkdownEditorInstance.scrollHeight = 100;
            mockMarkdownEditorInstance.clientHeight = 50;

            mockMarkdownPreviewInstance.scrollHeight = 200;
            mockMarkdownPreviewInstance.clientHeight = 100;
            mockMarkdownPreviewInstance.classList.contains.mockReturnValue(false); // Preview is visible

            editor.updateMarkdownPreview();
            expect(mockMarkdownPreviewInstance.scrollTop).toBe(50);
        });

        test('should not attempt to synchronize scroll if preview is hidden (even if initialized)', () => {
            editor.initializeMarkdown();
            mockGetState.mockReturnValue({ content: 'content' });
            mockMarkdownPreviewInstance.classList.contains.mockReturnValue(true); // Preview is hidden
            const originalScrollTop = 0; // As reset in beforeEach
            mockMarkdownPreviewInstance.scrollTop = originalScrollTop;


            editor.updateMarkdownPreview();
            expect(mockMarkdownPreviewInstance.scrollTop).toBe(originalScrollTop);
        });
    });
});