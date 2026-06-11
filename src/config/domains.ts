/**
 * Domain configuration for bookmark analysis
 * 
 * This file contains domain lists used for pattern detection.
 * Easy to maintain and extend without changing analysis logic.
 */

/** Blog platform domains */
export const BLOG_DOMAINS = [
  'csdn.net',
  'cnblogs.com',
  'jianshu.com',
  'zhihu.com',
  '51cto.com',
  'juejin.im',
  'segmentfault.com',
  'oschina.net',
  'fly63.com',
  'zxgj.cn',
  'medium.com',
  'dev.to',
  'hashnode.dev',
  'substack.com'
]

/** AI platform domains */
export const AI_DOMAINS = [
  'openai.com',
  'claude.ai',
  'deepseek.com',
  'chatglm.cn',
  'tongyi.aliyun.com',
  'doubao.com',
  'metaso.cn',
  'kimi.com',
  'minimaxi.com',
  'baichuan-ai.com',
  'xfyun.cn',
  'baidu.com',
  'siliconflow.cn',
  'manus.im',
  'huggingface.co',
  'ollama.ai',
  'anthropic.com'
]

/** DevOps tool domains */
export const DEVOPS_DOMAINS = [
  'kubernetes.io',
  'docker.com',
  'helm.sh',
  'istio.io',
  'envoyproxy.io',
  'prometheus.io',
  'grafana.com',
  'grafana.org',
  'elastic.co',
  'ansible.com',
  'terraform.io',
  'fluentd.org',
  'fluentbit.io',
  'cert-manager.io',
  'jenkins.io',
  'gitlab.com',
  'github.com',
  'argoproj.io',
  'tekton.dev',
  'cloud.google.com',
  'aws.amazon.com',
  'azure.microsoft.com'
]

/** Documentation platform domains */
export const DOC_DOMAINS = [
  'yuque.com',
  'notion.so',
  'confluence.atlassian.com',
  'docs.google.com',
  'feishu.cn',
  'dingtalk.com',
  'gitbook.io',
  'readthedocs.io',
  'mkdocs.org'
]

/** Code hosting domains */
export const CODE_DOMAINS = [
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'gitee.com',
  'codeberg.org',
  'sourceforge.net'
]

/** Video platform domains */
export const VIDEO_DOMAINS = [
  'youtube.com',
  'bilibili.com',
  'vimeo.com',
  'dailymotion.com',
  'twitch.tv'
]

/** Social media domains */
export const SOCIAL_DOMAINS = [
  'twitter.com',
  'x.com',
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'mastodon.social'
]

/** News domains */
export const NEWS_DOMAINS = [
  'techcrunch.com',
  'theverge.com',
  'arstechnica.com',
  'wired.com',
  'hackernews.ycombinator.com'
]

/** All domain categories for easy access */
export const DOMAIN_CATEGORIES = {
  blog: BLOG_DOMAINS,
  ai: AI_DOMAINS,
  devops: DEVOPS_DOMAINS,
  doc: DOC_DOMAINS,
  code: CODE_DOMAINS,
  video: VIDEO_DOMAINS,
  social: SOCIAL_DOMAINS,
  news: NEWS_DOMAINS
} as const

/** Get category for a domain */
export function getDomainCategory(domain: string): string | null {
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => domain.includes(d))) {
      return category
    }
  }
  return null
}

/** Check if domain matches any category */
export function isKnownDomain(domain: string): boolean {
  return getDomainCategory(domain) !== null
}
