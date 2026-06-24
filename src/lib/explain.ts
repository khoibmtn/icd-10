// src/lib/explain.ts
import type { ExplainDecision, ICDRule, ClinicalConcept, SourceReference } from '../types/icd'

const OFFICIAL_PROVENANCE: SourceReference = {
  source: 'icd10_flat',
  confidence: 'exact',
  citationLevel: 'official',
  file: 'icd10_flat.json',
}

/**
 * Explain a specific ICD code — show rules, provenance. No LLM needed.
 */
export async function explainCode(
  code: string,
  rules: ICDRule[],
  _concepts: ClinicalConcept[]
): Promise<ExplainDecision> {
  const applicableRules = rules.filter(r => r.code === code)

  const provenance: SourceReference[] =
    applicableRules.length > 0
      ? applicableRules.map(r => r.provenance)
      : [OFFICIAL_PROVENANCE]

  const reasons =
    applicableRules.length > 0
      ? applicableRules.map(r => r.message)
      : [`Mã ${code} tìm thấy trong CSDL ICD-10 Việt Nam (TT06/2026).`]

  return {
    query: code,
    selectedCodes: [
      {
        code,
        confidence: 1.0,
        reasons,
        provenance,
      },
    ],
    rejectedCodes: [],
    rulesApplied: applicableRules.map(r => r.ruleType),
    mode: 'template',
  }
}

/**
 * Explain a clinical concept query — match aliases → candidate codes → reject lower-scored ones.
 * Template-only, no LLM.
 */
export async function explainConcept(
  query: string,
  rules: ICDRule[],
  concepts: ClinicalConcept[]
): Promise<ExplainDecision> {
  const queryLower = query.toLowerCase().trim()

  let matchedConcept: ClinicalConcept | undefined
  let bestMatchWeight = 0

  for (const concept of concepts) {
    for (const alias of concept.aliases) {
      if (alias.status !== 'active') continue
      const aliasLower = alias.text.toLowerCase()

      // Exact match gets full alias weight
      // Partial include gets 70% of alias weight to deprioritize vs exact match
      let matchScore = 0
      if (queryLower === aliasLower) {
        matchScore = alias.weight
      } else if (aliasLower.includes(queryLower) && queryLower.length >= 3) {
        matchScore = alias.weight * 0.7
      } else if (queryLower.includes(aliasLower) && aliasLower.length >= 3) {
        matchScore = alias.weight * 0.7
      }

      if (matchScore > bestMatchWeight) {
        bestMatchWeight = matchScore
        matchedConcept = concept
      }
    }
  }

  if (!matchedConcept || matchedConcept.candidateCodes.length === 0) {
    return {
      query,
      selectedCodes: [],
      rejectedCodes: [],
      rulesApplied: [],
      mode: 'template',
    }
  }

  const sorted = [...matchedConcept.candidateCodes].sort((a, b) => b.score - a.score)
  const top = sorted[0]
  const rejected = sorted.slice(1)

  const codeRules = rules.filter(r => r.code === top.code)

  return {
    query,
    selectedCodes: [
      {
        code: top.code,
        confidence: top.score,
        reasons: [
          `Khớp khái niệm: "${matchedConcept.concept}" (alias weight: ${bestMatchWeight.toFixed(2)})`,
          ...codeRules.map(r => r.message),
          ...(top.conditions ? [`Áp dụng khi: ${top.conditions.join(', ')}`] : []),
        ],
        provenance: [
          {
            source: 'concept_dictionary',
            confidence: 'derived',
            citationLevel: 'inferred',
            file: 'concepts.json',
          },
          ...codeRules.map(r => r.provenance),
        ],
      },
    ],
    rejectedCodes: rejected.map(r => ({
      code: r.code,
      confidence: r.score,
      reason: r.exclusions
        ? `Bị loại trừ nếu có: ${r.exclusions.join(', ')}`
        : r.conditions
          ? `Yêu cầu điều kiện: ${r.conditions.join(', ')}`
          : `Điểm phù hợp thấp hơn (${r.score.toFixed(2)} vs ${top.score.toFixed(2)})`,
    })),
    rulesApplied: codeRules.map(r => r.ruleType),
    mode: 'template',
  }
}
