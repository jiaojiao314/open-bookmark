# open-bookmark 用户指南

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [AI 增强功能](#ai-增强功能)
- [命令参考](#命令参考)
- [规则格式](#规则格式)
- [常见问题](#常见问题)

## 安装

### 通过 npm 安装

```bash
npm install -g open-bookmark
```

### 从源码安装

```bash
git clone https://github.com/jiaojiao314/open-bookmark.git
cd open-bookmark
npm install
npm run build
```

## 快速开始

### 1. 初始化

首次使用需要初始化，扫描 Chrome 书签并生成规则：

```bash
open-bookmark init
```

初始化过程：
1. 检测 Chrome profiles
2. 扫描书签
3. 分析模式（域名、文件夹、关键词）
4. 推断用户画像（职业、技术栈、兴趣）
5. 生成分类规则

### 2. 预览

在应用规则前，先预览效果：

```bash
open-bookmark preview
```

预览会显示：
- 匹配统计
- 规则匹配详情
- 冲突信息
- 新目录结构

### 3. 应用

确认无误后，应用规则：

```bash
open-bookmark apply
```

应用过程：
1. 创建备份
2. 执行规则
3. 修改 Chrome 书签

### 4. 验证

验证应用结果：

```bash
open-bookmark verify
```

### 5. 回滚

如果出现问题，可以回滚：

```bash
open-bookmark rollback
```

## AI 增强功能

### 多 Agent 流水线

运行增强流水线，使用 AI 进行智能分类：

```bash
open-bookmark pipeline --enhanced
```

流水线包含三个 Agent：
1. **Scanner Agent**: 提取书签特征
2. **Analyzer Agent**: 语义分析
3. **Classifier Agent**: 生成分类规则

### 质量评估

评估分类质量：

```bash
open-bookmark evaluate --enhanced
```

评估报告包括：
- 覆盖率
- 分类分布
- 层次结构
- 质量评分

### 用户反馈

提供反馈以改进分类：

```bash
# 添加反馈
open-bookmark feedback --add "id:name:from:to:reason"

# 查看待处理反馈
open-bookmark feedback --list

# 生成反馈报告
open-bookmark feedback --report
```

### 规则优化

基于反馈优化规则：

```bash
# 分析反馈并生成优化建议
open-bookmark optimize

# 应用优化
open-bookmark optimize --apply
```

## 命令参考

### 基础命令

| 命令 | 说明 |
|------|------|
| `init` | 初始化：扫描书签、分析、生成规则 |
| `status` | 显示当前状态和下一步 |
| `preview` | 预览规则执行效果 |
| `apply` | 应用规则到书签 |
| `verify` | 验证应用结果 |
| `rollback` | 回滚到上次备份 |
| `analyze` | 深度分析书签（只读） |

### 配置命令

| 命令 | 说明 |
|------|------|
| `config --show` | 显示当前画像 |
| `config --set <field> <value>` | 设置字段值 |
| `config --add <field> <value>` | 添加值到数组 |
| `config --remove <field> <value>` | 从数组移除值 |

### AI 增强命令

| 命令 | 说明 |
|------|------|
| `prepare` | 为 AI 分析准备数据 |
| `stats` | 输出统计信息 |
| `rules` | 将 AI 标签转换为规则 |
| `pipeline` | 运行多 Agent 流水线 |
| `evaluate` | 评估分类质量 |
| `feedback` | 管理用户反馈 |
| `optimize` | 运行优化周期 |

### 平台命令

| 命令 | 说明 |
|------|------|
| `skill install` | 安装 SKILL.md 到各平台 |
| `skill show` | 显示 SKILL.md 内容 |
| `skill generate` | 生成 SKILL.md 到本地目录 |

## 规则格式

规则存储在 `open-bookmark/classification-rules.yaml`：

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

- `domain`: 域名匹配（支持通配符）
- `url_regex`: URL 正则匹配
- `title_contains`: 标题关键词匹配
- `title_exclude`: 标题排除
- `folder_path`: 精确文件夹路径
- `folder_prefix`: 文件夹前缀匹配
- `match_all`: 匹配所有（catch-all）

### 动作

- `move`: 移动书签到目标文件夹
- `skip`: 跳过书签（受保护）
- `analyze`: 标记为待分析

## 常见问题

### Q: 如何添加新规则？

A: 编辑 `open-bookmark/classification-rules.yaml` 文件，添加新的规则条目。

### Q: 如何保护某些书签不被移动？

A: 在规则中添加 `skip` 动作：

```yaml
- name: protect-important
  match:
    folder_prefix: "重要"
  action: skip
  reason: "保护重要书签"
```

### Q: 如何处理冲突？

A: 冲突是指书签匹配多条规则。系统会按优先级选择第一个匹配的规则。可以通过调整规则顺序或使用更具体的匹配条件来解决冲突。

### Q: 如何备份书签？

A: 运行 `open-bookmark apply` 时会自动创建备份。备份保存在 `open-bookmark/backups/` 目录。

### Q: 如何查看当前状态？

A: 运行 `open-bookmark status` 查看当前状态和下一步操作。
