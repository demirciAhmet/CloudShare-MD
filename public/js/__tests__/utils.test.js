import { getTitleFromContent, getExpirationTextForDisplay, debounce } from '../utils.js'; // Note the '../'

describe('getTitleFromContent', () => {
    test('should extract title from H1 markdown', () => {
        expect(getTitleFromContent("# Hello World\nThis is content.")).toBe("Hello World");
    });

    test('should use the first line if no H1', () => {
        expect(getTitleFromContent("This is the first line.\nAnd another.")).toBe("This is the first line.");
    });

    test('should truncate long first lines', () => {
        const longLine = "This is a very very very very long first line that should be truncated.";
        expect(getTitleFromContent(longLine)).toBe("This is a very very very very ...");
    });

    test('should return "Untitled Note" for empty content', () => {
        expect(getTitleFromContent("")).toBe("Untitled Note");
    });

    test('should return "Untitled Note" for content with only whitespace', () => {
        expect(getTitleFromContent("   \n   ")).toBe("Untitled Note");
    });
});

describe('getExpirationTextForDisplay', () => {
    test('should return "1 hour" for "1h"', () => {
        expect(getExpirationTextForDisplay("1h")).toBe("1 hour");
    });

    test('should return "1 day" for "1d"', () => {
        expect(getExpirationTextForDisplay("1d")).toBe("1 day");
    });

    test('should return "7 days" for "7d"', () => {
        expect(getExpirationTextForDisplay("7d")).toBe("7 days");
    });

    test('should return "No expiration" for "none"', () => {
        expect(getExpirationTextForDisplay("none")).toBe("No expiration");
    });

    test('should return the input for unknown options', () => {
        expect(getExpirationTextForDisplay("invalid")).toBe("invalid");
    });
});

describe('debounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('should call the function after the specified delay', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, 100);

        debouncedFunc();
        expect(mockFunc).not.toHaveBeenCalled();

        jest.advanceTimersByTime(50);
        expect(mockFunc).not.toHaveBeenCalled();

        jest.advanceTimersByTime(50);
        expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    test('should only call the function once for multiple rapid calls', () => {
        const mockFunc = jest.fn();
        const debouncedFunc = debounce(mockFunc, 100);

        debouncedFunc(); // Call 1
        debouncedFunc(); // Call 2
        debouncedFunc(); // Call 3

        jest.advanceTimersByTime(100);
        expect(mockFunc).toHaveBeenCalledTimes(1);
    });
});