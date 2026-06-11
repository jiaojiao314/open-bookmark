/**
 * Enhanced Agent Pipeline - Multi-dimensional analysis with hierarchical classification
 */

import type { Bookmark } from '../../chrome/types.js'
import type { ScanResult, AnalysisResult, ClassificationResult } from './types.js'
import { ScannerAgent } from './scanner.js'
import { EnhancedAnalyzerAgent } from './enhanced-analyzer.js'
import { EnhancedClassifierAgent } from './enhanced-classifier.js'

/** Pipeline result */
export interface EnhancedPipelineResult {
  scan: ScanResult
  analysis: AnalysisResult
  classification: ClassificationResult
  timing: {
    scan: number
    analysis: number
    classification: number
    total: number
  }
}

/** Run the enhanced agent pipeline */
export async function runEnhancedPipeline(bookmarks: Bookmark[]): Promise<EnhancedPipelineResult> {
  const startTime = Date.now()

  // Step 1: Scan
  console.log('[Enhanced Pipeline] Scanner Agent starting...')
  const scanner = new ScannerAgent()
  const scanResult = await scanner.execute(bookmarks)

  if (scanResult.status === 'failed' || !scanResult.data) {
    throw new Error(`Scanner failed: ${scanResult.error}`)
  }
  console.log(`[Enhanced Pipeline] Scanner completed in ${scanResult.duration}ms`)

  // Step 2: Enhanced Analyze
  console.log('[Enhanced Pipeline] Enhanced Analyzer Agent starting...')
  const analyzer = new EnhancedAnalyzerAgent()
  const analysisResult = await analyzer.execute(scanResult.data)

  if (analysisResult.status === 'failed' || !analysisResult.data) {
    throw new Error(`Analyzer failed: ${analysisResult.error}`)
  }
  console.log(`[Enhanced Pipeline] Enhanced Analyzer completed in ${analysisResult.duration}ms`)

  // Step 3: Enhanced Classify
  console.log('[Enhanced Pipeline] Enhanced Classifier Agent starting...')
  const classifier = new EnhancedClassifierAgent()
  const classificationResult = await classifier.execute({
    scan: scanResult.data,
    analysis: analysisResult.data
  })

  if (classificationResult.status === 'failed' || !classificationResult.data) {
    throw new Error(`Classifier failed: ${classificationResult.error}`)
  }
  console.log(`[Enhanced Pipeline] Enhanced Classifier completed in ${classificationResult.duration}ms`)

  const totalTime = Date.now() - startTime
  console.log(`[Enhanced Pipeline] Total time: ${totalTime}ms`)

  return {
    scan: scanResult.data,
    analysis: analysisResult.data,
    classification: classificationResult.data,
    timing: {
      scan: scanResult.duration || 0,
      analysis: analysisResult.duration || 0,
      classification: classificationResult.duration || 0,
      total: totalTime
    }
  }
}

/** Run enhanced pipeline and output as JSON */
export async function runEnhancedPipelineJson(bookmarks: Bookmark[]): Promise<string> {
  const result = await runEnhancedPipeline(bookmarks)

  // Convert Maps to objects for JSON serialization
  const serializable = {
    ...result,
    scan: {
      ...result.scan,
      domainClusters: Object.fromEntries(result.scan.domainClusters)
    },
    analysis: {
      ...result.analysis,
      contentTypes: Object.fromEntries(result.analysis.contentTypes),
      topics: Object.fromEntries(result.analysis.topics),
      complexity: Object.fromEntries(result.analysis.complexity)
    }
  }

  return JSON.stringify(serializable, null, 2)
}
