/**
 * Enhanced Analyzer Agent - Multi-dimensional semantic analysis
 */

import type { Agent, AgentConfig, AgentResult, AnalysisResult, ScanResult } from './types.js'
import { BLOG_DOMAINS, AI_DOMAINS, DEVOPS_DOMAINS, DOC_DOMAINS, CODE_DOMAINS } from '../../config/domains.js'

/** Analyzer Agent configuration */
const ANALYZER_CONFIG: AgentConfig = {
  name: 'Enhanced Analyzer Agent',
  description: 'Multi-dimensional semantic analysis with hierarchical classification',
  maxRetries: 3,
  timeout: 60000
}

/** Hierarchical topic patterns with specificity levels */
const HIERARCHICAL_TOPICS: Record<string, { keywords: string[], parent?: string, specificity: number }> = {
  // DevOps 子类
  'DevOps/Containers': {
    keywords: ['docker', 'container', 'podman', 'containerd', 'cri-o'],
    parent: 'DevOps',
    specificity: 3
  },
  'DevOps/Orchestration': {
    keywords: ['kubernetes', 'k8s', 'helm', 'istio', 'openshift', 'rancher'],
    parent: 'DevOps',
    specificity: 3
  },
  'DevOps/CI-CD': {
    keywords: ['jenkins', 'gitlab-ci', 'github-actions', 'circleci', 'travis', 'argo', 'tekton'],
    parent: 'DevOps',
    specificity: 3
  },
  'DevOps/Monitoring': {
    keywords: ['prometheus', 'grafana', 'elk', 'elasticsearch', 'kibana', 'logstash', 'datadog', 'zabbix'],
    parent: 'DevOps',
    specificity: 3
  },
  'DevOps/IaC': {
    keywords: ['terraform', 'ansible', 'puppet', 'chef', 'cloudformation', 'pulumi'],
    parent: 'DevOps',
    specificity: 3
  },
  'DevOps': {
    keywords: ['devops', 'sre', 'infrastructure', 'deployment', '运维', '服务器', 'linux', 'ubuntu', 'centos'],
    specificity: 2
  },

  // Frontend 子类
  'Frontend/React': {
    keywords: ['react', 'reactjs', 'nextjs', 'gatsby', 'redux', 'hooks'],
    parent: 'Frontend',
    specificity: 3
  },
  'Frontend/Vue': {
    keywords: ['vue', 'vuejs', 'nuxt', 'vuex', 'pinia'],
    parent: 'Frontend',
    specificity: 3
  },
  'Frontend/Angular': {
    keywords: ['angular', 'angularjs', 'ngrx', 'rxjs'],
    parent: 'Frontend',
    specificity: 3
  },
  'Frontend/CSS': {
    keywords: ['css', 'sass', 'less', 'tailwind', 'bootstrap', 'styled-components', 'postcss'],
    parent: 'Frontend',
    specificity: 3
  },
  'Frontend': {
    keywords: ['frontend', 'front-end', 'ui', 'ux', 'responsive', '前端', '网页', 'web'],
    specificity: 2
  },

  // Backend 子类
  'Backend/Node': {
    keywords: ['nodejs', 'node.js', 'express', 'fastify', 'nestjs', 'koa'],
    parent: 'Backend',
    specificity: 3
  },
  'Backend/Python': {
    keywords: ['django', 'flask', 'fastapi', 'celery', 'python', 'pip', 'virtualenv'],
    parent: 'Backend',
    specificity: 3
  },
  'Backend/Go': {
    keywords: ['golang', 'go', 'gin', 'echo', 'fiber'],
    parent: 'Backend',
    specificity: 3
  },
  'Backend/Database': {
    keywords: ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'database', 'sql', 'nosql', '数据库'],
    parent: 'Backend',
    specificity: 3
  },
  'Backend/API': {
    keywords: ['api', 'rest', 'graphql', 'grpc', 'swagger', 'openapi'],
    parent: 'Backend',
    specificity: 3
  },
  'Backend': {
    keywords: ['backend', 'back-end', 'server', '后端', '服务端'],
    specificity: 2
  },

  // AI/ML 子类
  'AI/LLM': {
    keywords: ['llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'ollama', 'transformer', 'bert'],
    parent: 'AI',
    specificity: 3
  },
  'AI/Frameworks': {
    keywords: ['tensorflow', 'pytorch', 'keras', 'scikit-learn', 'huggingface'],
    parent: 'AI',
    specificity: 3
  },
  'AI/Applications': {
    keywords: ['machine learning', 'deep learning', 'nlp', 'computer vision', 'reinforcement learning'],
    parent: 'AI',
    specificity: 3
  },
  'AI': {
    keywords: ['ai', 'artificial intelligence', '人工智能', '机器学习', '深度学习', '智能'],
    specificity: 2
  },

  // Cloud 子类
  'Cloud/AWS': {
    keywords: ['aws', 'amazon web services', 'lambda', 's3', 'ec2', 'ecs', 'eks'],
    parent: 'Cloud',
    specificity: 3
  },
  'Cloud/Azure': {
    keywords: ['azure', 'microsoft cloud', 'azure devops'],
    parent: 'Cloud',
    specificity: 3
  },
  'Cloud/GCP': {
    keywords: ['gcp', 'google cloud', 'firebase', 'bigquery'],
    parent: 'Cloud',
    specificity: 3
  },
  'Cloud': {
    keywords: ['cloud', 'serverless', 'microservices', '云原生', '云服务'],
    specificity: 2
  },

  // Security 子类（精确匹配）
  'Security/Authentication': {
    keywords: ['oauth', 'oidc', 'saml', 'jwt', 'jwt token', 'authentication', 'authorization', 'rbac', 'abac'],
    parent: 'Security',
    specificity: 3
  },
  'Security/Encryption': {
    keywords: ['encryption', 'cryptography', 'tls', 'certificate', 'pki', 'hashing'],
    parent: 'Security',
    specificity: 3
  },
  'Security/Network': {
    keywords: ['firewall', 'vpn', 'proxy', 'waf', 'ids', 'ips', 'network security'],
    parent: 'Security',
    specificity: 3
  },
  'Security': {
    keywords: ['security', 'cybersecurity', 'vulnerability', 'penetration testing', '安全', '漏洞'],
    specificity: 2
  },

  // 数据相关
  'Data/Analytics': {
    keywords: ['analytics', 'bi', 'business intelligence', 'tableau', 'powerbi', 'metabase'],
    parent: 'Data',
    specificity: 3
  },
  'Data/Engineering': {
    keywords: ['etl', 'data pipeline', 'airflow', 'kafka', 'spark', 'hadoop', 'data warehouse'],
    parent: 'Data',
    specificity: 3
  },
  'Data': {
    keywords: ['data', 'database', '大数据', '数据分析', '数据处理'],
    specificity: 2
  },

  // 博客/文档（基于域名）
  'Blog/Tech': {
    keywords: ['blog', 'article', 'post', 'tutorial', '博客', '文章'],
    parent: 'Blog',
    specificity: 2
  },
  'Documentation': {
    keywords: ['docs', 'documentation', 'reference', 'manual', 'guide', '文档', '教程', '手册'],
    specificity: 2
  },

  // 工具
  'Tools/Dev': {
    keywords: ['ide', 'editor', 'vscode', 'vim', 'git', 'github', 'gitlab', 'bitbucket'],
    parent: 'Tools',
    specificity: 3
  },
  'Tools/FileManagement': {
    keywords: ['file manager', 'file management', 'kodbox', 'nextcloud', 'owncloud', '文件管理'],
    parent: 'Tools',
    specificity: 3
  },
  'Tools/Communication': {
    keywords: ['slack', 'discord', 'telegram', 'wechat', 'email', '通讯', '聊天'],
    parent: 'Tools',
    specificity: 3
  },
  'Tools': {
    keywords: ['tool', 'utility', '工具', '在线工具', '软件'],
    specificity: 2
  },

  // 运维/系统管理
  'System/Admin': {
    keywords: ['admin', 'administration', 'system', '管理', '后台', '控制台'],
    parent: 'System',
    specificity: 3
  },
  'System/Network': {
    keywords: ['network', 'dns', 'dhcp', 'firewall', '网络', '网关'],
    parent: 'System',
    specificity: 3
  },
  'System': {
    keywords: ['system', '系统', '运维', '服务器'],
    specificity: 2
  },

  // 业务/工作
  'Work/Business': {
    keywords: ['business', 'work', 'project', '管理', '业务', '工作'],
    parent: 'Work',
    specificity: 3
  },
  'Work/HR': {
    keywords: ['hr', 'human resources', 'recruitment', '招聘', '人事'],
    parent: 'Work',
    specificity: 3
  },
  'Work': {
    keywords: ['work', 'office', '工作', '办公', '公司'],
    specificity: 2
  },

  // 学习/教育
  'Learning/Course': {
    keywords: ['course', 'tutorial', 'lesson', '课程', '教程', '学习'],
    parent: 'Learning',
    specificity: 3
  },
  'Learning/Book': {
    keywords: ['book', 'ebook', 'reading', '书', '阅读'],
    parent: 'Learning',
    specificity: 3
  },
  'Learning': {
    keywords: ['learn', 'study', 'education', '学习', '教育', '培训'],
    specificity: 2
  },

  // 娱乐
  'Entertainment/Video': {
    keywords: ['video', 'movie', 'tv', '视频', '电影', '电视'],
    parent: 'Entertainment',
    specificity: 3
  },
  'Entertainment/Game': {
    keywords: ['game', 'gaming', '游戏'],
    parent: 'Entertainment',
    specificity: 3
  },
  'Entertainment/Music': {
    keywords: ['music', 'spotify', 'netease', '音乐'],
    parent: 'Entertainment',
    specificity: 3
  },
  'Entertainment': {
    keywords: ['entertainment', 'fun', '娱乐', '休闲'],
    specificity: 2
  }
}

/** Domain-based classification rules */
const DOMAIN_RULES: Record<string, { category: string, confidence: number }> = {
  // 代码托管
  'github.com': { category: 'Code/GitHub', confidence: 0.95 },
  'gitlab.com': { category: 'Code/GitLab', confidence: 0.95 },
  'bitbucket.org': { category: 'Code/Bitbucket', confidence: 0.95 },
  'gitee.com': { category: 'Code/Gitee', confidence: 0.95 },

  // 技术博客
  'blog.csdn.net': { category: 'Blog/CSDN', confidence: 0.9 },
  'www.cnblogs.com': { category: 'Blog/Cnblogs', confidence: 0.9 },
  'www.jianshu.com': { category: 'Blog/Jianshu', confidence: 0.9 },
  'juejin.cn': { category: 'Blog/Juejin', confidence: 0.9 },
  'segmentfault.com': { category: 'Blog/SegmentFault', confidence: 0.9 },
  'dev.to': { category: 'Blog/DevTo', confidence: 0.9 },
  'medium.com': { category: 'Blog/Medium', confidence: 0.9 },
  'zhuanlan.zhihu.com': { category: 'Blog/Zhihu', confidence: 0.9 },
  'www.zhihu.com': { category: 'Blog/Zhihu', confidence: 0.9 },
  'mp.weixin.qq.com': { category: 'Blog/WeChat', confidence: 0.9 },

  // 知识库
  'www.yuque.com': { category: 'Knowledge/Yuque', confidence: 0.9 },
  'hzjt.yuque.com': { category: 'Knowledge/Yuque', confidence: 0.9 },
  'www.notion.so': { category: 'Knowledge/Notion', confidence: 0.9 },
  'mubu.com': { category: 'Knowledge/NoteTaking', confidence: 0.9 },
  'www.wolai.com': { category: 'Knowledge/NoteTaking', confidence: 0.9 },

  // 官方文档
  'kubernetes.io': { category: 'Documentation/Kubernetes', confidence: 0.95 },
  'docs.docker.com': { category: 'Documentation/Docker', confidence: 0.95 },
  'react.dev': { category: 'Documentation/React', confidence: 0.95 },
  'vuejs.org': { category: 'Documentation/Vue', confidence: 0.95 },
  'angular.io': { category: 'Documentation/Angular', confidence: 0.95 },
  'docs.python.org': { category: 'Documentation/Python', confidence: 0.95 },
  'developer.aliyun.com': { category: 'Documentation/Aliyun', confidence: 0.9 },
  'www.aliyun.com': { category: 'Cloud/Aliyun', confidence: 0.9 },
  'cloud.tencent.com': { category: 'Cloud/Tencent', confidence: 0.9 },

  // AI 平台
  'chat.openai.com': { category: 'AI/ChatGPT', confidence: 0.95 },
  'claude.ai': { category: 'AI/Claude', confidence: 0.95 },
  'huggingface.co': { category: 'AI/HuggingFace', confidence: 0.9 },

  // 视频
  'www.bilibili.com': { category: 'Video/Bilibili', confidence: 0.9 },
  'www.youtube.com': { category: 'Video/YouTube', confidence: 0.9 },

  // 搜索引擎
  'www.google.com': { category: 'Search/Google', confidence: 0.9 },
  'www.baidu.com': { category: 'Search/Baidu', confidence: 0.9 },

  // 文件管理
  'kodcloud.com': { category: 'Tools/FileManagement', confidence: 0.9 },
  'nextcloud.com': { category: 'Tools/FileManagement', confidence: 0.9 },
  'owncloud.com': { category: 'Tools/FileManagement', confidence: 0.9 },

  // 数据库工具
  'yearning.io': { category: 'Backend/Database', confidence: 0.9 },
  'navicat.com': { category: 'Backend/Database', confidence: 0.9 },
  'dbeaver.io': { category: 'Backend/Database', confidence: 0.9 },

  // 监控工具
  'prometheus.io': { category: 'DevOps/Monitoring', confidence: 0.9 },
  'grafana.com': { category: 'DevOps/Monitoring', confidence: 0.9 },
  'zabbix.com': { category: 'DevOps/Monitoring', confidence: 0.9 },

  // 容器工具
  'docker.com': { category: 'DevOps/Containers', confidence: 0.9 },
  'hub.docker.com': { category: 'DevOps/Containers', confidence: 0.9 },

  // CI/CD
  'jenkins.io': { category: 'DevOps/CI-CD', confidence: 0.9 },

  // 服务网格
  'www.servicemesher.com': { category: 'DevOps/ServiceMesh', confidence: 0.9 },
  'istio.io': { category: 'DevOps/ServiceMesh', confidence: 0.9 },

  // 博客平台
  'halo.run': { category: 'Blog/Halo', confidence: 0.9 },
  'wordpress.com': { category: 'Blog/WordPress', confidence: 0.9 },
  'typecho.org': { category: 'Blog/Typecho', confidence: 0.9 },

  // 学习平台
  'leetcode-cn.com': { category: 'Learning/LeetCode', confidence: 0.9 },
  'leetcode.com': { category: 'Learning/LeetCode', confidence: 0.9 },
  'www.coursera.org': { category: 'Learning/Coursera', confidence: 0.9 },
  'www.udemy.com': { category: 'Learning/Udemy', confidence: 0.9 },

  // 购物
  'www.tmall.com': { category: 'Shopping/Tmall', confidence: 0.9 },
  'www.jd.com': { category: 'Shopping/JD', confidence: 0.9 },
  'www.taobao.com': { category: 'Shopping/Taobao', confidence: 0.9 },

  // 工具
  'clash.razord.top': { category: 'Tools/VPN', confidence: 0.9 },
  'mega.nz': { category: 'Tools/CloudStorage', confidence: 0.9 },
  'www.d3planner.com': { category: 'Tools/Calculator', confidence: 0.9 },

  // 内部服务
  '192.168.31.2': { category: 'Internal/Router', confidence: 0.9 },
  '172.16.6.201': { category: 'Internal/Server', confidence: 0.9 },
}

/** URL path patterns */
const URL_PATH_PATTERNS: Array<{ pattern: string, category: string, confidence: number }> = [
  { pattern: '/docs/', category: 'Documentation', confidence: 0.8 },
  { pattern: '/documentation/', category: 'Documentation', confidence: 0.8 },
  { pattern: '/api/', category: 'API/Reference', confidence: 0.8 },
  { pattern: '/reference/', category: 'Documentation/Reference', confidence: 0.8 },
  { pattern: '/blog/', category: 'Blog', confidence: 0.7 },
  { pattern: '/article/', category: 'Blog/Article', confidence: 0.7 },
  { pattern: '/tutorial/', category: 'Tutorial', confidence: 0.8 },
  { pattern: '/guide/', category: 'Guide', confidence: 0.8 },
  { pattern: '/examples/', category: 'Examples', confidence: 0.7 },
  { pattern: '/releases/', category: 'Releases', confidence: 0.7 },
  { pattern: '/issues/', category: 'Issues', confidence: 0.7 },
  { pattern: '/pull/', category: 'Pull Requests', confidence: 0.7 },
  { pattern: '/wiki/', category: 'Documentation', confidence: 0.7 },
  { pattern: '/faq/', category: 'Documentation', confidence: 0.7 },
  { pattern: '/download/', category: 'Downloads', confidence: 0.7 },
  { pattern: '/install/', category: 'Installation', confidence: 0.7 },
  { pattern: '/config/', category: 'Configuration', confidence: 0.7 },
  { pattern: '/admin/', category: 'Admin', confidence: 0.7 },
  { pattern: '/dashboard/', category: 'Dashboard', confidence: 0.7 },
  { pattern: '/login/', category: 'Authentication', confidence: 0.7 },
  { pattern: '/signup/', category: 'Authentication', confidence: 0.7 },
  { pattern: '/pricing/', category: 'Pricing', confidence: 0.7 },
  { pattern: '/about/', category: 'About', confidence: 0.7 },
  { pattern: '/contact/', category: 'Contact', confidence: 0.7 },
]

/** Classification result with confidence */
interface ClassificationCandidate {
  category: string
  confidence: number
  source: 'domain' | 'keyword' | 'url-path' | 'folder' | 'ai'
  details: string
}

/** Detect classifications from multiple sources */
function detectClassifications(
  url: string,
  name: string,
  folder: string,
  existingFolders: string[]
): ClassificationCandidate[] {
  const candidates: ClassificationCandidate[] = []
  const lowerUrl = url.toLowerCase()
  const lowerName = name.toLowerCase()

  // 1. Domain-based classification (highest priority)
  try {
    const domain = new URL(url).hostname
    if (DOMAIN_RULES[domain]) {
      candidates.push({
        category: DOMAIN_RULES[domain].category,
        confidence: DOMAIN_RULES[domain].confidence,
        source: 'domain',
        details: `Domain match: ${domain}`
      })
    }
  } catch {
    // Invalid URL
  }

  // 2. URL path patterns
  for (const { pattern, category, confidence } of URL_PATH_PATTERNS) {
    if (lowerUrl.includes(pattern)) {
      candidates.push({
        category,
        confidence,
        source: 'url-path',
        details: `URL path match: ${pattern}`
      })
      break // Only first match
    }
  }

  // 3. Keyword-based classification (hierarchical)
  for (const [topic, config] of Object.entries(HIERARCHICAL_TOPICS)) {
    const matchedKeywords = config.keywords.filter(kw =>
      lowerUrl.includes(kw) || lowerName.includes(kw)
    )

    if (matchedKeywords.length > 0) {
      // Higher specificity = higher confidence
      const baseConfidence = 0.5 + (config.specificity * 0.1)
      // More keyword matches = higher confidence
      const keywordBoost = Math.min(matchedKeywords.length * 0.05, 0.2)

      candidates.push({
        category: topic,
        confidence: Math.min(baseConfidence + keywordBoost, 0.95),
        source: 'keyword',
        details: `Keywords: ${matchedKeywords.join(', ')}`
      })
    }
  }

  // 4. Folder structure analysis
  if (folder) {
    // Check if folder path contains useful information
    const folderLower = folder.toLowerCase()
    for (const [topic, config] of Object.entries(HIERARCHICAL_TOPICS)) {
      if (config.keywords.some(kw => folderLower.includes(kw))) {
        candidates.push({
          category: topic,
          confidence: 0.6,
          source: 'folder',
          details: `Folder match: ${folder}`
        })
        break
      }
    }
  }

  return candidates
}

/** Resolve conflicts using dynamic priority */
function resolveConflicts(candidates: ClassificationCandidate[]): ClassificationCandidate | null {
  if (candidates.length === 0) return null

  // Sort by confidence (descending), then by source priority
  const sourcePriority: Record<string, number> = {
    'domain': 5,
    'keyword': 4,
    'url-path': 3,
    'folder': 2,
    'ai': 1
  }

  candidates.sort((a, b) => {
    // First by confidence
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence
    }
    // Then by source priority
    return sourcePriority[b.source] - sourcePriority[a.source]
  })

  return candidates[0]
}

/** Get parent category */
function getParentCategory(category: string): string | undefined {
  const parts = category.split('/')
  return parts.length > 1 ? parts[0] : undefined
}

/** Analyzer Agent implementation */
export class EnhancedAnalyzerAgent implements Agent<ScanResult, AnalysisResult> {
  config = ANALYZER_CONFIG

  async execute(scanResult: ScanResult): Promise<AgentResult<AnalysisResult>> {
    const startTime = Date.now()

    try {
      const contentTypes = new Map<string, string[]>()
      const topics = new Map<string, string[]>()
      const complexity = new Map<string, 'simple' | 'moderate' | 'complex'>()
      const semanticGroups: AnalysisResult['semanticGroups'] = []

      // Get existing folders for reference
      const existingFolders = scanResult.bookmarks
        .map(b => b.folder)
        .filter(Boolean)

      // Analyze each bookmark
      for (const bookmark of scanResult.bookmarks) {
        // Content type (simplified)
        const contentType = 'general'
        const typeList = contentTypes.get(contentType) || []
        typeList.push(bookmark.id)
        contentTypes.set(contentType, typeList)

        // Multi-dimensional classification
        const candidates = detectClassifications(
          bookmark.url,
          bookmark.name,
          bookmark.folder,
          existingFolders
        )

        // Resolve conflicts
        const bestMatch = resolveConflicts(candidates)

        if (bestMatch) {
          // Add to specific topic
          const topicList = topics.get(bestMatch.category) || []
          topicList.push(bookmark.id)
          topics.set(bestMatch.category, topicList)

          // Also add to parent topic if exists
          const parent = getParentCategory(bestMatch.category)
          if (parent) {
            const parentList = topics.get(parent) || []
            if (!parentList.includes(bookmark.id)) {
              parentList.push(bookmark.id)
              topics.set(parent, parentList)
            }
          }
        } else {
          // Default to General
          const generalList = topics.get('General') || []
          generalList.push(bookmark.id)
          topics.set('General', generalList)
        }

        // Complexity based on path depth
        const pathDepth = bookmark.pathSegments.length
        if (pathDepth <= 2) {
          complexity.set(bookmark.id, 'simple')
        } else if (pathDepth <= 4) {
          complexity.set(bookmark.id, 'moderate')
        } else {
          complexity.set(bookmark.id, 'complex')
        }
      }

      // Build semantic groups from domain clusters
      for (const [domain, bookmarkIds] of scanResult.domainClusters.entries()) {
        if (bookmarkIds.length >= 3) {
          semanticGroups.push({
            name: `Domain: ${domain}`,
            description: `Bookmarks from ${domain}`,
            bookmarkIds,
            confidence: 0.9
          })
        }
      }

      return {
        status: 'completed',
        data: {
          contentTypes,
          topics,
          complexity,
          semanticGroups
        },
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
