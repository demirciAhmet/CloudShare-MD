export function extractTitleFromContent(content) {
    if (!content) return 'Untitled Note';
    const headingMatch = content.match(/^# (.+)$/m);
    if (headingMatch) return headingMatch[1];
    const firstLine = content.split('\n')[0].trim();
    if (firstLine) return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
    return 'Untitled Note';
}

export function getExpirationTextForDisplay(option) {
    switch (option) {
        case '1h': return '1 hour';
        case '1d': return '1 day';
        case '7d': return '7 days';
        case 'none': return 'No expiration';
        default: return option;
    }
}

export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}