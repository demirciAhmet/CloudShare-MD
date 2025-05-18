export function getTitleFromContent(content) {

    if (!content || content.trim() === '') {
        return 'Untitled Note';
    }

    const headingMatch = content.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1] && headingMatch[1].trim()) {
        return headingMatch[1].trim();
    }

    const firstLine = content.split('\n')[0].trim();

    if (!firstLine) {
        return 'Untitled Note';
    }

    return firstLine.length > 30
        ? `${firstLine.substring(0, 30)}...`
        : firstLine;
}

export function getExpirationTextForDisplay(expirationOption) {
    switch (expirationOption) {
        case '1h':
            return '1 hour';
        case '1d':
            return '1 day';
        case '7d':
            return '7 days';
        case 'none':
            return 'No expiration';
        default:
            return expirationOption;
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
