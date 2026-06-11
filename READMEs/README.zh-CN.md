# open-bookmark

<p align="left">
  <a href="../README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>
</p>

规范驱动的浏览器书签管理工具。先定义规则，再执行。

## 功能特性

- **扫描（Scan）**：读取 Chrome 书签并分析模式
- **分析（Analyze）**：识别域名、文件夹、关键词和 URL 模式
- **画像（Profile）**：推断用户角色、技术栈、兴趣和语言
- **规则（Rules）**：基于分析生成分类规则
- **预览（Preview）**：应用前展示规则的执行效果
- **应用（Apply）**：执行规则重组书签
- **验证（Verify）**：应用规则后检查结果
- **回滚（Rollback）**：必要时从备份恢复
- **AI 增强**：多 Agent 流水线实现智能分类

## 安装

```bash
npm install -g open-bookmark
```

## 快速开始

```bash
# 初始化：扫描书签、分析、生成规则
open-bookmark init

# 预览规则执行效果
open-bookmark preview

# 应用规则到书签
open-bookmark apply

# 查看和修改用户画像
open-bookmark config --show

# 为新增书签生成增量规则
open-bookmark propose

# 为 AI 平台安装 SKILL.md
open-bookmark skill install
```

## AI 增强功能

### 多 Agent 流水线

运行增强版多 Agent 流水线进行智能书签分类：

```bash
# 运行增强流水线
open-bookmark pipeline --enhanced

# 将结果保存为 JSON
open-bookmark pipeline --enhanced --json --output results.json
```

流水线使用三个 Agent：
1. **Scanner Agent**：从书签中提取特征（域名、URL、路径）
2. **Analyzer Agent**：进行语义分析与层级分类
3. **Classifier Agent**：生成带动态优先级的分类规则

### 层级分类

系统支持层级分类：
- **域名规则**：最高优先级（0.95 置信度）
- **关键词规则**：中等优先级（0.5-0.9 置信度）
- **URL 路径模式**：较低优先级（0.7-0.8 置信度）
- **文件夹结构**：最低优先级（0.6 置信度）

层级示例：
```
DevOps
├── DevOps/Containers (Docker, Podman)
├── DevOps/Orchestration (Kubernetes, Helm)
├── DevOps/CI-CD (Jenkins, GitLab CI)
├── DevOps/Monitoring (Prometheus, Grafana)
└── DevOps/IaC (Terraform, Ansible)
```

### 质量评估

评估分类质量：

```bash
# 使用增强评估器
open-bookmark evaluate --enhanced

# 输出为 JSON
open-bookmark evaluate --enhanced --json
```

评估器报告：
- 覆盖率百分比
- 分类分布
- 层级深度
- 质量分数（0-100）

### 用户反馈

收集和管理用户反馈：

```bash
# 添加反馈
open-bookmark feedback --add "id:name:from:to:reason"

# 列出待处理反馈
open-bookmark feedback --list

# 生成反馈报告
open-bookmark feedback --report
```

### 规则优化

基于反馈优化规则：

```bash
# 运行优化分析
open-bookmark optimize

# 应用优化
open-bookmark optimize --apply
```

## AI 增强工作流

为获得最佳效果，使用完整的 AI 增强工作流：

```bash
# 步骤 1：初始化并扫描书签
open-bookmark init

# 步骤 2：运行增强流水线
open-bookmark pipeline --enhanced

# 步骤 3：评估分类质量
open-bookmark evaluate --enhanced

# 步骤 4：对错误分类的书签提供反馈
open-bookmark feedback --add "id:name:from:to:reason"

# 步骤 5：基于反馈优化规则
open-bookmark optimize --apply

# 步骤 6：预览并应用
open-bookmark preview
open-bookmark apply
```

## 命令

| 命令 | 说明 |
|---------|-------------|
| `init` | 初始化 open-bookmark：扫描书签、分析、生成规则 |
| `status` | 显示当前状态和下一步 |
| `preview` | 预览规则执行效果 |
| `apply` | 应用规则到书签 |
| `verify` | 应用后验证结果 |
| `rollback` | 回滚到上次备份 |
| `analyze` | 深度分析书签（只读） |
| `config` | 查看和修改用户画像 |
| `propose` | 扫描新增书签并生成增量规则 |
| `skill` | 为 AI 平台生成和安装 SKILL.md |
| `prepare` | 为 AI 分析准备书签数据 |
| `rules` | 将 AI 生成的标签转换为规则 |
| `stats` | 为 AI 输出书签统计 |
| `pipeline` | 运行多 Agent 分析流水线 |
| `evaluate` | 评估分类质量 |
| `feedback` | 管理用户反馈 |
| `optimize` | 运行优化周期 |

## 知识图谱

为书签构建知识图谱，并以交互式、自包含的 HTML Dashboard 探索（离线可用，无需服务器）：

```bash
# 构建图谱
open-bookmark graph init

# 生成自包含 HTML Dashboard
open-bookmark graph dashboard

# 自定义输出路径
open-bookmark graph dashboard --output my-graph.html
```

## 规则格式

规则以 YAML 格式存储，包含匹配条件：

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

### 匹配条件

- `domain` — 域名匹配（支持通配符）
- `url_regex` — URL 正则匹配
- `title_contains` — 标题关键词匹配
- `title_exclude` — 标题排除
- `folder_path` — 精确文件夹路径
- `folder_prefix` — 文件夹前缀匹配
- `match_all` — 兜底规则

### 动作

- `move` — 移动书签到目标文件夹
- `skip` — 跳过书签（受保护）
- `analyze` — 标记为待分析

## AI 平台集成

open-bookmark 支持为主流 AI code 工具生成 SKILL.md：

- Claude Code
- Cursor
- OpenCode
- Codex
- Gemini CLI
- GitHub Copilot
- Cline
- Kimi

默认安装到**用户全局**目录，因此在任何项目中都可用。传入 `--project` 可改为安装到当前项目。

安装 SKILL.md：

```bash
open-bookmark skill install            # 用户全局（默认）
open-bookmark skill install --project  # 当前项目
```

本地生成 SKILL.md：

```bash
open-bookmark skill generate
```

## 文档

- [用户指南](../docs/user-guide.md) — 完整用户指南
- [API 参考](../docs/api-reference.md) — API 文档
- [开发者指南](../docs/developer-guide.md) — 贡献指南

## 许可证

MIT
