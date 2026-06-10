/**
 * Rule generator - generates classification rules from analysis and profile
 */
/** Generate all rules from analysis and profile */
export function generateRules(analysis, profile) {
    const rules = [];
    // 1. Protected paths rules
    const protectRules = generateProtectedRules(profile);
    rules.push(...protectRules);
    // 2. Domain cluster rules
    const domainRules = generateDomainRules(analysis, profile);
    rules.push(...domainRules);
    // 3. Keyword rules
    const keywordRules = generateKeywordRules(analysis, profile);
    rules.push(...keywordRules);
    // 4. Catch-all rule
    const catchAllRule = generateCatchAllRule(profile);
    rules.push(catchAllRule);
    return {
        rules,
        summary: {
            totalRules: rules.length,
            protectRules: protectRules.length,
            domainRules: domainRules.length,
            keywordRules: keywordRules.length,
            catchAllRules: 1
        }
    };
}
/** Generate protected path rules */
function generateProtectedRules(profile) {
    return profile.preferences.protectedPaths.map(path => ({
        name: `protect-${path}`,
        match: {
            folderPrefix: path
        },
        action: 'skip',
        reason: `用户保护: ${path}`,
        source: 'user-defined'
    }));
}
/** Generate domain cluster rules */
function generateDomainRules(analysis, profile) {
    const rules = [];
    // Group domains by category
    const blogDomains = analysis.patterns.blogDomains.map(d => d.domain);
    const aiDomains = getDomainsByCategory(analysis, ['openai.com', 'claude.ai', 'deepseek.com', 'chatglm.cn']);
    const devopsDomains = getDomainsByCategory(analysis, ['kubernetes.io', 'docker.com', 'helm.sh', 'istio.io']);
    // Blog rules
    if (blogDomains.length > 0) {
        if (profile.preferences.blogStrategy === '集中') {
            rules.push({
                name: 'blogs-centralized',
                match: {
                    domain: blogDomains.map(d => `*.${d.replace(/^\*\./, '')}`)
                },
                action: 'move',
                target: '博客文章',
                reason: '博客集中管理',
                source: 'generated'
            });
        }
        else if (profile.preferences.blogStrategy === '按主题分散') {
            // Create individual rules for each blog domain
            for (const domain of blogDomains.slice(0, 5)) {
                rules.push({
                    name: `blog-${domain.replace(/\./g, '-')}`,
                    match: {
                        domain: [`*.${domain.replace(/^\*\./, '')}`]
                    },
                    action: 'move',
                    target: '博客文章',
                    subfolder: domain.replace(/\./g, '-'),
                    reason: `博客: ${domain}`,
                    source: 'generated'
                });
            }
        }
    }
    // AI domains
    if (aiDomains.length > 0) {
        rules.push({
            name: 'ai-platforms',
            match: {
                domain: aiDomains
            },
            action: 'move',
            target: 'AI 工具',
            reason: 'AI 平台书签',
            source: 'generated'
        });
    }
    // DevOps domains
    if (devopsDomains.length > 0) {
        rules.push({
            name: 'devops-tools',
            match: {
                domain: devopsDomains
            },
            action: 'move',
            target: '运维工具',
            reason: 'DevOps 工具书签',
            source: 'generated'
        });
    }
    // GitHub
    if (analysis.patterns.githubCount > 10) {
        rules.push({
            name: 'github',
            match: {
                domain: ['github.com', '*.github.com']
            },
            action: 'move',
            target: 'GitHub',
            reason: 'GitHub 项目书签',
            source: 'generated'
        });
    }
    return rules;
}
/** Generate keyword-based rules */
function generateKeywordRules(analysis, profile) {
    const rules = [];
    // Use top keywords to create rules
    const topKeywords = analysis.keywords.slice(0, 10);
    for (const kw of topKeywords) {
        if (kw.count >= 5) {
            // Infer target folder from keyword
            const target = inferFolderFromKeyword(kw.keyword, profile);
            rules.push({
                name: `keyword-${kw.keyword}`,
                match: {
                    titleContains: [kw.keyword]
                },
                action: 'move',
                target,
                reason: `关键词: ${kw.keyword} (${kw.count} 次)`,
                source: 'generated'
            });
        }
    }
    return rules;
}
/** Generate catch-all rule */
function generateCatchAllRule(profile) {
    return {
        name: 'catch-all',
        match: {
            matchAll: true
        },
        action: 'move',
        target: profile.preferences.catchAllTarget,
        reason: '未匹配规则的书签',
        source: 'generated'
    };
}
/** Helper: get domains that match known categories */
function getDomainsByCategory(analysis, knownDomains) {
    return analysis.domains
        .filter(d => knownDomains.some(k => d.domain.includes(k)))
        .map(d => d.domain);
}
/** Infer target folder from keyword */
function inferFolderFromKeyword(keyword, profile) {
    const keywordMap = {
        'kubernetes': '运维工具',
        'k8s': '运维工具',
        'docker': '运维工具',
        'linux': '运维工具',
        'python': '编程语言',
        'javascript': '编程语言',
        'typescript': '编程语言',
        'go': '编程语言',
        'react': '前端框架',
        'vue': '前端框架',
        'angular': '前端框架',
        'ai': 'AI 工具',
        'llm': 'AI 工具',
        'machine': 'AI 工具',
        'deep': 'AI 工具'
    };
    const keywordLower = keyword.toLowerCase();
    for (const [key, folder] of Object.entries(keywordMap)) {
        if (keywordLower.includes(key)) {
            return folder;
        }
    }
    return profile.preferences.catchAllTarget;
}
/** Validate rules */
export function validateRules(rules) {
    const errors = [];
    const warnings = [];
    // Check for empty rules
    if (rules.length === 0) {
        errors.push('规则列表为空');
    }
    // Check for duplicate rule names
    const names = new Set();
    for (const rule of rules) {
        if (names.has(rule.name)) {
            errors.push(`重复的规则名称: ${rule.name}`);
        }
        names.add(rule.name);
    }
    // Check for catch-all rule
    const hasCatchAll = rules.some(r => r.match.matchAll);
    if (!hasCatchAll) {
        warnings.push('缺少 catch-all 规则，未匹配的书签将被忽略');
    }
    // Check for move rules without target
    for (const rule of rules) {
        if (rule.action === 'move' && !rule.target) {
            errors.push(`规则 "${rule.name}" 是 move 动作但没有目标文件夹`);
        }
    }
    // Check for rules without match conditions
    for (const rule of rules) {
        const match = rule.match;
        if (!match.matchAll && !match.domain && !match.urlRegex &&
            !match.titleContains && !match.folderPath && !match.folderPrefix) {
            warnings.push(`规则 "${rule.name}" 没有匹配条件`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=generator.js.map