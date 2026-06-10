/**
 * State manager - handles workflow state persistence and phase transitions
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { stringify, parse } from 'yaml';
import { newWorkflowState } from './types.js';
/** State file name */
const STATE_FILE = '.open-bookmark.yaml';
/** Valid phase transitions */
const PHASE_TRANSITIONS = {
    scan: ['dialogue'],
    dialogue: ['generate'],
    generate: ['preview'],
    preview: ['apply'],
    apply: ['verify'],
    verify: [] // Final state
};
/** State manager class */
export class StateManager {
    stateDir;
    statePath;
    state = null;
    constructor(stateDir) {
        this.stateDir = stateDir;
        this.statePath = join(stateDir, STATE_FILE);
    }
    /** Load state from file */
    async load() {
        try {
            const content = await readFile(this.statePath, 'utf-8');
            const data = parse(content);
            // Convert date strings to Date objects
            const state = {
                ...data,
                bookmarks: {
                    ...data.bookmarks,
                    lastScan: new Date(data.bookmarks.lastScan)
                },
                rules: {
                    ...data.rules,
                    lastGenerated: new Date(data.rules.lastGenerated)
                },
                backups: (data.backups || []).map((b) => ({
                    ...b,
                    created: new Date(b.created)
                })),
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                profile: {
                    ...data.profile,
                    confirmedAt: data.profile.confirmedAt
                        ? new Date(data.profile.confirmedAt)
                        : undefined
                }
            };
            this.state = state;
            return this.state;
        }
        catch {
            // File doesn't exist or is invalid, create new state
            this.state = newWorkflowState();
            return this.state;
        }
    }
    /** Save state to file */
    async save() {
        if (!this.state) {
            throw new Error('State not loaded');
        }
        // Update timestamp
        this.state.updatedAt = new Date();
        // Ensure directory exists
        await mkdir(dirname(this.statePath), { recursive: true });
        // Convert to YAML
        const content = stringify(this.state, {
            indent: 2,
            lineWidth: 120
        });
        // Write to file
        await writeFile(this.statePath, content, 'utf-8');
    }
    /** Get current state */
    getState() {
        return this.state;
    }
    /** Update bookmarks info */
    async updateBookmarks(info) {
        if (!this.state) {
            throw new Error('State not loaded');
        }
        this.state.bookmarks = info;
        await this.save();
    }
    /** Update rules info */
    async updateRules(info) {
        if (!this.state) {
            throw new Error('State not loaded');
        }
        this.state.rules = info;
        await this.save();
    }
    /** Add backup */
    async addBackup(info) {
        if (!this.state) {
            throw new Error('State not loaded');
        }
        this.state.backups.push(info);
        await this.save();
    }
    /** Update profile */
    async updateProfile(profile) {
        if (!this.state) {
            throw new Error('State not loaded');
        }
        this.state.profile = profile;
        await this.save();
    }
    /** Transition to next phase */
    async transitionTo(nextPhase) {
        if (!this.state) {
            throw new Error('State not loaded');
        }
        const currentPhase = this.state.phase;
        const allowedTransitions = PHASE_TRANSITIONS[currentPhase] || [];
        if (!allowedTransitions.includes(nextPhase)) {
            return false;
        }
        this.state.phase = nextPhase;
        await this.save();
        return true;
    }
    /** Check if transition is valid */
    canTransitionTo(nextPhase) {
        if (!this.state)
            return false;
        const allowedTransitions = PHASE_TRANSITIONS[this.state.phase] || [];
        return allowedTransitions.includes(nextPhase);
    }
    /** Get phase description */
    getPhaseDescription() {
        if (!this.state)
            return '未初始化';
        const phaseDescriptions = {
            scan: '扫描阶段 - 需要扫描书签',
            dialogue: '对话阶段 - 需要确认画像',
            generate: '生成阶段 - 需要生成规则',
            preview: '预览阶段 - 可以预览效果',
            apply: '执行阶段 - 可以执行规则',
            verify: '验证阶段 - 可以验证结果'
        };
        return phaseDescriptions[this.state.phase] || '未知阶段';
    }
    /** Get next steps */
    getNextSteps() {
        if (!this.state)
            return ['运行 init 命令初始化'];
        const steps = [];
        switch (this.state.phase) {
            case 'scan':
                steps.push('运行 init 命令扫描书签');
                break;
            case 'dialogue':
                steps.push('运行 init 命令完成对话');
                break;
            case 'generate':
                steps.push('运行 init 命令生成规则');
                break;
            case 'preview':
                steps.push('运行 preview 命令预览效果');
                steps.push('运行 apply 命令执行规则');
                break;
            case 'apply':
                steps.push('运行 apply 命令执行规则');
                steps.push('运行 verify 命令验证结果');
                break;
            case 'verify':
                steps.push('验证完成！');
                break;
        }
        return steps;
    }
}
/** Check if state file exists */
export async function stateFileExists(stateDir) {
    try {
        await access(join(stateDir, STATE_FILE));
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=manager.js.map