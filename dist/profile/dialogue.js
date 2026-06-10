/**
 * User dialogue module - CLI interactive prompts for profile confirmation
 */
import { select, input, checkbox, confirm } from '@inquirer/prompts';
/** Run the full dialogue flow */
export async function runDialogue(draft, analysis) {
    const profile = { ...draft.profile };
    // Step 1: Confirm role
    profile.role = await confirmRole(profile.role);
    // Step 2: Confirm tech stack
    profile.techStack = await confirmTechStack(profile.techStack);
    // Step 3: Confirm interests
    profile.interests = await confirmInterests(profile.interests);
    // Step 4: Confirm language
    profile.language = await confirmLanguage(profile.language);
    // Step 5: Blog strategy
    profile.preferences.blogStrategy = await selectBlogStrategy();
    // Step 6: Protected paths
    profile.preferences.protectedPaths = await selectProtectedPaths(analysis.folders);
    // Step 7: Catch-all target
    profile.preferences.catchAllTarget = await selectCatchAllTarget(analysis.folders);
    // Mark as confirmed
    profile.confirmed = true;
    profile.confirmedAt = new Date();
    return profile;
}
/** Confirm or modify role */
async function confirmRole(currentRole) {
    if (!currentRole) {
        return await input({
            message: '请描述你的职业:',
            default: 'Software Engineer'
        });
    }
    const confirmed = await confirm({
        message: `我推测你是 ${currentRole}，对吗？`,
        default: true
    });
    if (confirmed) {
        return currentRole;
    }
    return await input({
        message: '请描述你的职业:',
        default: currentRole
    });
}
/** Confirm or modify tech stack */
async function confirmTechStack(currentStack) {
    if (currentStack.length === 0) {
        const inputStack = await input({
            message: '请描述你的主要技术栈 (逗号分隔):',
            default: ''
        });
        return inputStack.split(',').map(s => s.trim()).filter(Boolean);
    }
    const confirmed = await confirm({
        message: `你的技术栈包括 ${currentStack.join(', ')}，对吗？`,
        default: true
    });
    if (confirmed) {
        return currentStack;
    }
    const inputStack = await input({
        message: '请描述你的主要技术栈 (逗号分隔):',
        default: currentStack.join(', ')
    });
    return inputStack.split(',').map(s => s.trim()).filter(Boolean);
}
/** Confirm or modify interests */
async function confirmInterests(currentInterests) {
    if (currentInterests.length === 0) {
        const inputInterests = await input({
            message: '请描述你的兴趣领域 (逗号分隔):',
            default: ''
        });
        return inputInterests.split(',').map(s => s.trim()).filter(Boolean);
    }
    const confirmed = await confirm({
        message: `你的兴趣领域包括 ${currentInterests.join(', ')}，对吗？`,
        default: true
    });
    if (confirmed) {
        return currentInterests;
    }
    const inputInterests = await input({
        message: '请描述你的兴趣领域 (逗号分隔):',
        default: currentInterests.join(', ')
    });
    return inputInterests.split(',').map(s => s.trim()).filter(Boolean);
}
/** Confirm or modify language */
async function confirmLanguage(currentLanguage) {
    const languageMap = {
        'zh': '中文',
        'en': '英文',
        'mixed': '中英文混合'
    };
    const confirmed = await confirm({
        message: `你的主要语言是 ${languageMap[currentLanguage]}，对吗？`,
        default: true
    });
    if (confirmed) {
        return currentLanguage;
    }
    const selected = await select({
        message: '请选择你的主要语言:',
        choices: [
            { name: '中文', value: 'zh' },
            { name: '英文', value: 'en' },
            { name: '中英文混合', value: 'mixed' }
        ]
    });
    return selected;
}
/** Select blog strategy */
async function selectBlogStrategy() {
    return await select({
        message: '博客文章想怎么处理？',
        choices: [
            { name: '集中放到一个文件夹', value: '集中' },
            { name: '按主题分散到各文件夹', value: '按主题分散' },
            { name: '跳过，不处理博客', value: '跳过' }
        ]
    });
}
/** Select protected paths */
async function selectProtectedPaths(folders) {
    if (folders.length === 0) {
        return [];
    }
    const choices = folders.map(f => ({
        name: `${f.name} (${f.count} 个书签)`,
        value: f.name,
        checked: false
    }));
    return await checkbox({
        message: '选择绝对不能动的文件夹 (空格选择，回车确认):',
        choices
    });
}
/** Select catch-all target */
async function selectCatchAllTarget(folders) {
    const choices = [
        { name: '99-人工待确认 (新建)', value: '99-人工待确认' },
        ...folders.map(f => ({
            name: f.name,
            value: f.name
        }))
    ];
    return await select({
        message: '选择 catch-all 目标文件夹 (未匹配规则的书签放这里):',
        choices
    });
}
//# sourceMappingURL=dialogue.js.map