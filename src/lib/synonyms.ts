// src/lib/synonyms.ts
// Bảng từ đồng nghĩa: từ thông dụng → từ ICD chuyên môn
// Cả 2 hướng đều được index để tìm kiếm

export interface SynonymGroup {
  terms: string[]       // Tất cả từ đồng nghĩa
  icdTerms: string[]    // Thuật ngữ chính thức trong ICD (dùng để boost)
}

// Normalize helper (same as search.ts)
export function normalizeSynonym(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
}

// ─── Synonym groups ─────────────────────────────────────────────────────────

export const SYNONYM_GROUPS: SynonymGroup[] = [
  // Pregnancy care
  {
    terms: ['khám thai', 'kham thai', 'theo doi thai', 'theo dõi thai', 'quan ly thai', 'quản lý thai', 'antenatal', 'prenatal'],
    icdTerms: ['theo doi thai ky', 'quan ly thai ky'],
  },
  // Cancer / malignant neoplasm
  {
    terms: ['ung thư', 'ung thu', 'cancer', 'khối u ác tính', 'khoi u ac tinh', 'u ác tính', 'u ac tinh'],
    icdTerms: ['u ac tinh'],
  },
  // Diabetes
  {
    terms: ['tiểu đường', 'tieu duong', 'đái tháo đường', 'dai thao duong', 'diabetes'],
    icdTerms: ['dai thao duong', 'insulin'],
  },
  // Syphilis
  {
    terms: ['giang mai', 'giang mai', 'syphilis', 'lậu giang mai'],
    icdTerms: ['giang mai', 'syphilis'],
  },
  // Traffic accident
  {
    terms: ['tngt', 'tai nan giao thong', 'tai nạn giao thông', 'tai nan xe', 'accident'],
    icdTerms: ['tai nan giao thong', 'xe co gioi', 'xe may'],
  },
  // Kidney failure
  {
    terms: ['suy thận', 'suy than', 'kidney failure', 'renal failure'],
    icdTerms: ['suy than'],
  },
  // Head trauma
  {
    terms: ['chấn thương đầu', 'chan thuong dau', 'chấn thương sọ não', 'chan thuong so nao', 'ctsn', 'head trauma'],
    icdTerms: ['chan thuong so nao', 'so nao', 'fracture skull'],
  },
  // Normal delivery
  {
    terms: ['đẻ thường', 'de thuong', 'sinh thường', 'sinh thường', 'normal delivery', 'thường sản'],
    icdTerms: ['cuoc de', 'san'],
  },
  // Hypertension
  {
    terms: ['tăng huyết áp', 'tang huyet ap', 'cao huyết áp', 'cao huyet ap', 'hypertension', 'huyết áp cao'],
    icdTerms: ['tang huyet ap', 'huyet ap'],
  },
  // Stroke
  {
    terms: ['đột quỵ', 'dot quy', 'tai biến mạch máu não', 'tai bien mach mau nao', 'stroke', 'tbmmn'],
    icdTerms: ['tai bien mach mau nao', 'nao', 'stroke'],
  },
]

// ─── Lookup: normalize query → expanded terms ──────────────────────────────

const SYNONYM_MAP = new Map<string, string[]>()

for (const group of SYNONYM_GROUPS) {
  const normTerms = group.terms.map(normalizeSynonym)
  const normIcd = group.icdTerms.map(normalizeSynonym)
  for (const term of normTerms) {
    SYNONYM_MAP.set(term, normIcd)
  }
}

/**
 * Expand a normalized query with ICD synonyms.
 * Returns the ICD terms that should boost search if the query matches.
 */
export function expandQuery(normQuery: string): string[] {
  // Direct exact match
  if (SYNONYM_MAP.has(normQuery)) {
    return SYNONYM_MAP.get(normQuery)!
  }

  // Partial match: check if query contains or starts with a synonym key
  const expanded: string[] = []
  for (const [key, icdTerms] of SYNONYM_MAP.entries()) {
    if (normQuery.includes(key) || key.includes(normQuery)) {
      expanded.push(...icdTerms)
    }
  }
  return [...new Set(expanded)]
}
