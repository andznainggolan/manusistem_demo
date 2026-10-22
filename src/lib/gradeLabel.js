import { IS_SCHOOL } from '@/lib/demoProfile'

// Short label for a grade: ASN-style code in the school profile ("III/c"),
// Mercer-style "PC 54" elsewhere. `grade` may be undefined.
export const gradeShort = (grade, fallbackId) =>
  grade ? (IS_SCHOOL ? grade.code : `PC ${grade.pc ?? fallbackId}`) : (fallbackId ? (IS_SCHOOL ? String(fallbackId) : `PC ${fallbackId}`) : '')
