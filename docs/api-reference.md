# open-bookmark API 参考

## 目录

- [CLI 命令](#cli-命令)
- [Agent 类型](#agent-类型)
- [配置文件](#配置文件)
- [规则格式](#规则格式)

## CLI 命令

### init

初始化 open-bookmark：扫描书签、分析、生成规则。

```bash
open-bookmark init [options]
```

**选项：**
- `--yes`: 跳过对话，使用默认值
- `--profile <name>`: 指定 Chrome profile

**示例：**
```bash
open-bookmark init
open-bookmark init --yes
open-bookmark init --profile "Default"
```

### status

显示当前状态和下一步操作。

```bash
open-bookmark status
```

### preview

预览规则执行效果。

```bash
open-bookmark preview
```

### apply

应用规则到书签。

```bash
open-bookmark apply [options]
```

**选项：**
- `--dry-run`: 试运行，不实际修改

**示例：**
```bash
open-bookmark apply
open-bookmark apply --dry-run
```

### verify

验证应用结果。

```bash
open-bookmark verify
```

### rollback

回滚到上次备份。

```bash
open-bookmark rollback
```

### analyze

深度分析书签（只读）。

```bash
open-bookmark analyze
```

### config

查看和修改用户画像。

```bash
open-bookmark config [options]
```

**选项：**
- `--show`: 显示当前画像
- `--set <field> <value>`: 设置字段值
- `--add <field> <value>`: 添加值到数组
- `--remove <field> <value>`: 从数组移除值

**示例：**
```bash
open-bookmark config --show
open-bookmark config --set role "DevOps Engineer"
open-bookmark config --add tech "Kubernetes"
open-bookmark config --remove tech "Python"
```

### propose

扫描新增书签并生成增量规则。

```bash
open-bookmark propose [options]
```

**选项：**
- `--dry-run`: 试运行，不保存
- `--profile <name>`: 指定 Chrome profile

### prepare

为 AI 分析准备数据。

```bash
open-bookmark prepare [options]
```

**选项：**
- `--format <format>`: 输出格式 (ai-ready, domains, keywords)
- `--sample <n>`: 限制采样数量

**示例：**
```bash
open-bookmark prepare
open-bookmark prepare --format domains
open-bookmark prepare --sample 100
```

### stats

输出统计信息。

```bash
open-bookmark stats [options]
```

**选项：**
- `--domains`: 域名统计
- `--keywords`: 关键词统计
- `--patterns`: 模式统计

**示例：**
```bash
open-bookmark stats --domains
open-bookmark stats --keywords
```

### rules

将 AI 标签转换为规则。

```bash
open-bookmark rules [options]
```

**选项：**
- `--from <file>`: AI 标签 JSON 文件
- `--merge`: 合并现有规则

**示例：**
```bash
open-bookmark rules --from ai-tags.json
open-bookmark rules --from ai-tags.json --merge
```

### pipeline

运行多 Agent 分析流水线。

```bash
open-bookmark pipeline [options]
```

**选项：**
- `--enhanced`: 使用增强流水线
- `--json`: 输出 JSON
- `--output <file>`: 保存到文件

**示例：**
```bash
open-bookmark pipeline --enhanced
open-bookmark pipeline --enhanced --json --output results.json
```

### evaluate

评估分类质量。

```bash
open-bookmark evaluate [options]
```

**选项：**
- `--enhanced`: 使用增强评估器
- `--json`: 输出 JSON

**示例：**
```bash
open-bookmark evaluate --enhanced
open-bookmark evaluate --enhanced --json
```

### feedback

管理用户反馈。

```bash
open-bookmark feedback [options]
```

**选项：**
- `--add <entry>`: 添加反馈 (id:name:from:to:reason)
- `--list`: 列出待处理反馈
- `--apply <id>`: 标记反馈为已应用
- `--report`: 生成反馈报告

**示例：**
```bash
open-bookmark feedback --add "1:书签名:Other:DevOps:分类错误"
open-bookmark feedback --list
open-bookmark feedback --report
```

### optimize

运行优化周期。

```bash
open-bookmark optimize [options]
```

**选项：**
- `--apply`: 应用优化
- `--json`: 输出 JSON

**示例：**
```bash
open-bookmark optimize
open-bookmark optimize --apply
```

## Agent 类型

### ScannerAgent

提取书签特征。

**输入：** `Bookmark[]`
**输出：** `ScanResult`

**功能：**
- 提取域名
- 提取 URL 路径
- 检测 HTTPS
- 域名聚类

### AnalyzerAgent

语义分析。

**输入：** `ScanResult`
**输出：** `AnalysisResult`

**功能：**
- 内容类型检测
- 主题识别
- 复杂度评估
- 语义分组

### ClassifierAgent

生成分类规则。

**输入：** `{ scan: ScanResult, analysis: AnalysisResult }`
**输出：** `ClassificationResult`

**功能：**
- 生成分类
- 解决冲突
- 推断用户角色
- 识别技术栈

### EnhancedAnalyzerAgent

增强语义分析。

**输入：** `ScanResult`
**输出：** `AnalysisResult`

**功能：**
- 层次分类
- 多维度分析
- 动态优先级

### EnhancedClassifierAgent

增强分类器。

**输入：** `{ scan: ScanResult, analysis: AnalysisResult }`
**输出：** `ClassificationResult`

**功能：**
- 层次分类生成
- 父分类传播
- 质量统计

## 配置文件

### domains.ts

域名配置文件，位于 `src/config/domains.ts`。

**导出：**
- `BLOG_DOMAINS`: 博客平台域名
- `AI_DOMAINS`: AI 平台域名
- `DEVOPS_DOMAINS`: DevOps 工具域名
- `DOC_DOMAINS`: 文档平台域名
- `CODE_DOMAINS`: 代码托管域名
- `VIDEO_DOMAINS`: 视频平台域名
- `SOCIAL_DOMAINS`: 社交媒体域名
- `NEWS_DOMAINS`: 新闻网站域名

**函数：**
- `getDomainCategory(domain)`: 获取域名类别
- `isKnownDomain(domain)`: 检查是否为已知域名

## 规则格式

### Rule

```typescript
interface Rule {
  name: string
  match: MatchCondition
  action: 'move' | 'skip' | 'analyze'
  target?: string
  subfolder?: string
  reason?: string
  source?: 'generated' | 'user-defined' | 'template'
}
```

### MatchCondition

```typescript
interface MatchCondition {
  domain?: string[]
  urlRegex?: string
  titleContains?: string[]
  titleExclude?: string[]
  folderPath?: string
  folderPrefix?: string
  matchAll?: boolean
}
```

### YAML 示例

```yaml
- name: kubernetes-生态
  match:
    domain:
      - kubernetes.io
      - "*.kubernetes.io"
      - helm.sh
    title_contains:
      - k8s
      - kubectl
  action: move
  target: DevOps/Kubernetes
  reason: "Kubernetes and cloud-native tools"
  source: generated
```
