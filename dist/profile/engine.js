/**
 * Profile inference engine - rule-based user profiling
 */
/** Built-in profile rules */
const ROLE_RULES = [
    {
        condition: (a) => a.patterns.devopsCount > 10,
        result: { role: 'DevOps Engineer' },
        confidence: 'high',
        reason: 'DevOps 域名书签数量较多'
    },
    {
        condition: (a) => a.patterns.githubCount > 20,
        result: { role: 'Software Engineer' },
        confidence: 'medium',
        reason: 'GitHub 书签数量较多'
    },
    {
        condition: (a) => a.patterns.aiCount > 10,
        result: { role: 'AI/ML Engineer' },
        confidence: 'medium',
        reason: 'AI 平台书签数量较多'
    }
];
const LANGUAGE_RULES = [
    {
        condition: (a) => {
            const blogDomains = a.patterns.blogDomains;
            const zhBlogCount = blogDomains
                .filter(d => ['csdn.net', 'cnblogs.com', 'jianshu.com', 'zhihu.com', 'juejin.im', '51cto.com'].includes(d.domain))
                .reduce((sum, d) => sum + d.count, 0);
            return zhBlogCount > 50;
        },
        result: { language: 'zh' },
        confidence: 'high',
        reason: '中文技术博客书签数量较多'
    },
    {
        condition: (a) => {
            const blogDomains = a.patterns.blogDomains;
            const zhBlogCount = blogDomains
                .filter(d => ['csdn.net', 'cnblogs.com', 'jianshu.com', 'zhihu.com', 'juejin.im', '51cto.com'].includes(d.domain))
                .reduce((sum, d) => sum + d.count, 0);
            return zhBlogCount > 20 && zhBlogCount <= 50;
        },
        result: { language: 'mixed' },
        confidence: 'medium',
        reason: '中英文博客书签均有较多'
    }
];
const TECH_STACK_RULES = [
    {
        condition: (a) => a.patterns.devopsCount > 5,
        result: { techStack: ['Kubernetes', 'Docker'] },
        confidence: 'medium',
        reason: 'DevOps 域名书签'
    },
    {
        condition: (a) => {
            const topDomains = a.domains.slice(0, 10).map(d => d.domain);
            return topDomains.some(d => d.includes('python.org') || d.includes('pypi.org'));
        },
        result: { techStack: ['Python'] },
        confidence: 'medium',
        reason: 'Python 相关域名书签'
    },
    {
        condition: (a) => {
            const topDomains = a.domains.slice(0, 10).map(d => d.domain);
            return topDomains.some(d => d.includes('go.dev') || d.includes('golang.org'));
        },
        result: { techStack: ['Go'] },
        confidence: 'medium',
        reason: 'Go 相关域名书签'
    }
];
const INTEREST_RULES = [
    {
        condition: (a) => a.patterns.aiCount > 5,
        result: { interests: ['AI', 'LLM'] },
        confidence: 'medium',
        reason: 'AI 平台书签数量较多'
    },
    {
        condition: (a) => a.patterns.githubCount > 15,
        result: { interests: ['Open Source'] },
        confidence: 'medium',
        reason: 'GitHub 书签数量较多'
    }
];
/** Default profile */
const DEFAULT_PROFILE = {
    role: '',
    techStack: [],
    interests: [],
    language: 'mixed',
    preferences: {
        blogStrategy: '集中',
        protectedPaths: [],
        catchAllTarget: '99-人工待确认'
    },
    confirmed: false
};
/** Infer user profile from analysis results */
export function inferProfile(analysis) {
    const inferences = [];
    const profile = { ...DEFAULT_PROFILE };
    // Apply role rules
    for (const rule of ROLE_RULES) {
        if (rule.condition(analysis)) {
            if (rule.result.role && !profile.role) {
                profile.role = rule.result.role;
                inferences.push({
                    field: 'role',
                    value: rule.result.role,
                    confidence: rule.confidence,
                    reason: rule.reason
                });
            }
        }
    }
    // Apply language rules
    for (const rule of LANGUAGE_RULES) {
        if (rule.condition(analysis)) {
            if (rule.result.language && profile.language === 'mixed') {
                profile.language = rule.result.language;
                inferences.push({
                    field: 'language',
                    value: rule.result.language,
                    confidence: rule.confidence,
                    reason: rule.reason
                });
            }
        }
    }
    // Apply tech stack rules
    const techStackSet = new Set(profile.techStack);
    for (const rule of TECH_STACK_RULES) {
        if (rule.condition(analysis)) {
            if (rule.result.techStack) {
                for (const tech of rule.result.techStack) {
                    if (!techStackSet.has(tech)) {
                        techStackSet.add(tech);
                        inferences.push({
                            field: 'techStack',
                            value: tech,
                            confidence: rule.confidence,
                            reason: rule.reason
                        });
                    }
                }
            }
        }
    }
    profile.techStack = Array.from(techStackSet);
    // Apply interest rules
    const interestsSet = new Set(profile.interests);
    for (const rule of INTEREST_RULES) {
        if (rule.condition(analysis)) {
            if (rule.result.interests) {
                for (const interest of rule.result.interests) {
                    if (!interestsSet.has(interest)) {
                        interestsSet.add(interest);
                        inferences.push({
                            field: 'interests',
                            value: interest,
                            confidence: rule.confidence,
                            reason: rule.reason
                        });
                    }
                }
            }
        }
    }
    profile.interests = Array.from(interestsSet);
    // Infer blog strategy from blog count
    if (analysis.patterns.blogCount > 100) {
        profile.preferences.blogStrategy = '集中';
    }
    else if (analysis.patterns.blogCount > 30) {
        profile.preferences.blogStrategy = '按主题分散';
    }
    return { profile, inferences };
}
/** Get protected paths suggestion based on folder analysis */
export function suggestProtectedPaths(analysis) {
    const suggestions = [];
    // Suggest folders with many bookmarks as protected
    for (const folder of analysis.folders.slice(0, 5)) {
        if (folder.count > 50) {
            suggestions.push(folder.name);
        }
    }
    return suggestions;
}
/** Get catch-all target suggestion */
export function suggestCatchAllTarget(analysis) {
    // Look for a folder that seems like a catch-all
    const catchAllPatterns = ['待整理', '未分类', '其他', 'misc', 'uncategorized'];
    for (const folder of analysis.folders) {
        const nameLower = folder.name.toLowerCase();
        if (catchAllPatterns.some(p => nameLower.includes(p))) {
            return folder.name;
        }
    }
    return '99-人工待确认';
}
/** Save profile to JSON file */
export async function saveProfile(profile, filePath) {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });
    // Convert dates to ISO strings for JSON serialization
    const data = {
        ...profile,
        confirmedAt: profile.confirmedAt?.toISOString()
    };
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
/** Load profile from JSON file */
export async function loadProfile(filePath) {
    const { readFile } = await import('node:fs/promises');
    try {
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        // Convert ISO strings back to Date objects
        if (data.confirmedAt) {
            data.confirmedAt = new Date(data.confirmedAt);
        }
        return data;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=engine.js.map