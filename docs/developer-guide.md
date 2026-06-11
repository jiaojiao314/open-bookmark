# open-bookmark 开发者指南

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [贡献指南](#贡献指南)
- [扩展指南](#扩展指南)
- [测试指南](#测试指南)

## 开发环境设置

### 前置要求

- Node.js >= 20
- npm >= 9
- Git

### 安装依赖

```bash
git clone https://github.com/jiaojiao314/open-bookmark.git
cd open-bookmark
npm install
```

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
npm test
```

### 开发模式

```bash
npm run dev
```

## 项目结构

```
open-bookmark/
├── src/
│   ├── ai/                    # AI 模块
│   │   ├── agents/            # Agent 实现
│   │   │   ├── types.ts       # 类型定义
│   │   │   ├── scanner.ts     # Scanner Agent
│   │   │   ├── analyzer.ts    # Analyzer Agent
│   │   │   ├── classifier.ts  # Classifier Agent
│   │   │   ├── enhanced-analyzer.ts
│   │   │   ├── enhanced-classifier.ts
│   │   │   ├── pipeline.ts
│   │   │   ├── enhanced-pipeline.ts
│   │   │   └── index.ts
│   │   ├── prepare.ts         # 数据准备
│   │   ├── parse.ts           # 标签解析
│   │   ├── stats.ts           # 统计输出
│   │   ├── feedback.ts        # 反馈系统
│   │   ├── optimizer.ts       # 规则优化
│   │   ├── evaluator.ts       # 质量评估
│   │   ├── enhanced-evaluator.ts
│   │   └── prompts/           # Prompt 模板
│   ├── analyzer/              # 书签分析
│   ├── chrome/                # Chrome 书签读写
│   ├── cli/                   # CLI 入口
│   ├── commands/              # 命令实现
│   ├── config/                # 配置文件
│   ├── executor/              # 规则执行
│   ├── graph/                 # 知识图谱
│   ├── platforms/             # 平台集成
│   ├── profile/               # 用户画像
│   ├── rules/                 # 规则引擎
│   ├── skills/                # 技能定义
│   ├── state/                 # 状态管理
│   └── ui/                    # UI 组件
├── test/                      # 测试文件
├── bin/                       # CLI 入口
├── dist/                      # 编译输出
└── docs/                      # 文档
```

## 贡献指南

### 提交代码

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 ESM 模块格式
- 添加类型注解
- 编写测试

### 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

## 扩展指南

### 添加新 Agent

1. 在 `src/ai/agents/` 创建新文件
2. 实现 `Agent` 接口
3. 在 `pipeline.ts` 中注册
4. 添加测试

**示例：**

```typescript
import type { Agent, AgentConfig, AgentResult } from './types.js'

const MY_AGENT_CONFIG: AgentConfig = {
  name: 'My Agent',
  description: 'My custom agent',
  maxRetries: 3,
  timeout: 30000
}

export class MyAgent implements Agent<InputType, OutputType> {
  config = MY_AGENT_CONFIG

  async execute(input: InputType): Promise<AgentResult<OutputType>> {
    const startTime = Date.now()
    
    try {
      // 实现逻辑
      const result = /* ... */
      
      return {
        status: 'completed',
        data: result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
}
```

### 添加新命令

1. 在 `src/commands/` 创建新文件
2. 实现命令函数
3. 在 `src/cli/index.ts` 注册
4. 添加测试

**示例：**

```typescript
// src/commands/my-command.ts
export interface MyCommandOptions {
  option1?: string
  option2?: boolean
}

export async function myCommand(options: MyCommandOptions): Promise<void> {
  // 实现逻辑
}
```

```typescript
// src/cli/index.ts
import { myCommand } from '../commands/my-command.js'

program
  .command('my-command')
  .description('My custom command')
  .option('--option1 <value>', 'Option 1')
  .option('--option2', 'Option 2')
  .action(async (options) => {
    try {
      await myCommand(options)
    } catch (error) {
      console.error('❌ 命令失败:', error)
      process.exit(1)
    }
  })
```

### 添加新分类规则

在 `src/config/domains.ts` 添加域名规则：

```typescript
export const MY_DOMAINS = [
  'example1.com',
  'example2.com'
]
```

在 `src/ai/agents/enhanced-analyzer.ts` 添加关键词规则：

```typescript
const HIERARCHICAL_TOPICS = {
  // ...
  'MyCategory/SubCategory': {
    keywords: ['keyword1', 'keyword2'],
    parent: 'MyCategory',
    specificity: 3
  }
}
```

## 测试指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- test/my-test.test.ts

# 运行测试并监听变化
npm test -- --watch
```

### 编写测试

使用 Vitest 编写测试：

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../src/my-module.js'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('should handle errors', () => {
    expect(() => myFunction('invalid')).toThrow()
  })
})
```

### 测试覆盖率

```bash
npm test -- --coverage
```

### 测试文件位置

测试文件放在 `test/` 目录，命名为 `*.test.ts`：

```
test/
├── prepare.test.ts
├── parse.test.ts
├── agents.test.ts
└── ...
```
