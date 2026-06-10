/**
 * Rule type definitions for open-bookmark
 */
/** Check if a bookmark matches a rule */
export function matchesRule(bookmark, rule) {
    const { match } = rule;
    // MatchAll matches everything
    if (match.matchAll)
        return true;
    let matched = false;
    // Domain matching
    if (match.domain && match.domain.length > 0) {
        const domain = extractDomain(bookmark.url);
        const domainMatch = match.domain.some(d => matchDomain(d, domain));
        if (!domainMatch)
            return false;
        matched = true;
    }
    // URL regex matching
    if (match.urlRegex) {
        try {
            const re = new RegExp(match.urlRegex);
            if (!re.test(bookmark.url))
                return false;
            matched = true;
        }
        catch {
            return false;
        }
    }
    // Title contains matching
    if (match.titleContains && match.titleContains.length > 0) {
        const titleLower = bookmark.name.toLowerCase();
        const titleMatch = match.titleContains.some(kw => titleLower.includes(kw.toLowerCase()));
        if (!titleMatch)
            return false;
        matched = true;
    }
    // Title exclude
    if (match.titleExclude && match.titleExclude.length > 0) {
        const titleLower = bookmark.name.toLowerCase();
        const excluded = match.titleExclude.some(kw => titleLower.includes(kw.toLowerCase()));
        if (excluded)
            return false;
    }
    // Folder path matching
    if (match.folderPath) {
        if (bookmark.folder !== match.folderPath)
            return false;
        matched = true;
    }
    // Folder prefix matching
    if (match.folderPrefix) {
        if (!bookmark.folder.startsWith(match.folderPrefix))
            return false;
        matched = true;
    }
    return matched;
}
/** Match domain with wildcard support */
function matchDomain(pattern, domain) {
    if (pattern === domain)
        return true;
    if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1); // ".example.com"
        return domain.endsWith(suffix) || domain === pattern.slice(2);
    }
    return false;
}
/** Extract domain from URL (local helper) */
function extractDomain(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        if (!host)
            return '';
        if (parsed.port && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
            return `${host}:${parsed.port}`;
        }
        return host;
    }
    catch {
        return '';
    }
}
/** Find first matching rule for a bookmark */
export function findMatchingRule(bookmark, rules) {
    for (const rule of rules) {
        if (matchesRule(bookmark, rule)) {
            return rule;
        }
    }
    return null;
}
/** Find conflicts (bookmarks matching multiple rules, excluding catch-all) */
export function findConflicts(bookmarks, rules) {
    const conflicts = new Map();
    for (const bookmark of bookmarks) {
        const matchedRules = [];
        for (const rule of rules) {
            if (rule.match.matchAll)
                continue; // Skip catch-all
            if (matchesRule(bookmark, rule)) {
                matchedRules.push(rule.name);
            }
        }
        if (matchedRules.length > 1) {
            conflicts.set(bookmark.id, matchedRules);
        }
    }
    return conflicts;
}
//# sourceMappingURL=types.js.map