/**
 * Agent Pipeline - Orchestrate multi-agent bookmark analysis
 */

import type { Bookmark } from '../../chrome/types.js'
import type { ScanResult, AnalysisResult, ClassificationResult } from './types.js'
import { ScannerAgent } from './scanner.js'
import { AnalyzerAgent } from './analyzer.js'
import { ClassifierAgent } from './classifier.js'

/** Pipeline result */
export interface PipelineResult {
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

/** Run the full agent pipeline */
export async function runPipeline(bookmarks: Bookmark[]): Promise<PipelineResult> {
  const startTime = Date.now()

  // Step 1: Scan
  console.log('[Pipeline] Scanner Agent starting...')
  const scanner = new ScannerAgent()
  const scanResult = await scanner.execute(bookmarks)
  
  if (scanResult.status === 'failed' || !scanResult.data) {
    throw new Error(`Scanner failed: ${scanResult.error}`)
  }
  console.log(`[Pipeline] Scanner completed in ${scanResult.duration}ms`)

  // Step 2: Analyze
  console.log('[Pipeline] Analyzer Agent starting...')
  const analyzer = new AnalyzerAgent()
  const analysisResult = await analyzer.execute(scanResult.data)
  
  if (analysisResult.status === 'failed' || !analysisResult.data) {
    throw new Error(`Analyzer failed: ${analysisResult.error}`)
  }
  console.log(`[Pipeline] Analyzer completed in ${analysisResult.duration}ms`)

  // Step 3: Classify
  console.log('[Pipeline] Classifier Agent starting...')
  const classifier = new ClassifierAgent()
  const classificationResult = await classifier.execute({
    scan: scanResult.data,
    analysis: analysisResult.data
  })
  
  if (classificationResult.status === 'failed' || !classificationResult.data) {
    throw new Error(`Classifier failed: ${classificationResult.error}`)
  }
  console.log(`[Pipeline] Classifier completed in ${classificationResult.duration}ms`)

  const totalTime = Date.now() - startTime
  console.log(`[Pipeline] Total time: ${totalTime}ms`)

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

/** Run pipeline and output as JSON */
export async function runPipelineJson(bookmarks: Bookmark[]): Promise<string> {
  const result = await runPipeline(bookmarks)
  
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
