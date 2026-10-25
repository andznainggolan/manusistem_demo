import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { IS_SCHOOL } from '@/lib/demoProfile'
import { SCHOOL_CANDIDATES, SCHOOL_REQUISITIONS } from '@/data/schoolSeed'
import { makeSampleCv } from '@/lib/cvPdf'

// Documents attached to a candidate application (CV, ijazah, KTP, dll.) —
// separate from employeeDocumentStore since a candidate isn't an employee
// yet. Which document types exist (and which are mandatory) still comes
// from the same Master Document Types configured under System Admin >
// Settings > Master Document Types (documentTypeStore).

export const CANDIDATE_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

let _id = 1

// School demo: every seeded candidate has a (sample) CV so the candidate popup has something to show.
// Ids start high so they never collide with documents uploaded later.
const SEED_CV_ID = 900000
const schoolSampleCvs = () => !IS_SCHOOL ? [] : SCHOOL_CANDIDATES.map(c => {
  const { dataUrl, size } = makeSampleCv(c, SCHOOL_REQUISITIONS.find(r => r.id === c.requisitionId)?.positionTitle)
  return {
    id: SEED_CV_ID + c.id, candidateId: c.id, category: 'CV / Resume', fileName: `CV-${c.name.replace(/\s+/g, '-')}.pdf`,
    fileType: 'application/pdf', fileSize: size, dataUrl, uploadedAt: `${c.appliedDate}T09:00:00.000Z`,
  }
})

export const useCandidateDocumentStore = create(persist(
  (set, get) => ({
    // { id, candidateId, category, fileName, fileType, fileSize, dataUrl, uploadedAt }
    documents: schoolSampleCvs(),

    documentsFor: (candidateId) => get().documents
      .filter(d => d.candidateId === candidateId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),

    addDocument: (doc) => set(s => ({ documents: [...s.documents, { id: _id++, ...doc }] })),
    deleteDocument: (id) => set(s => ({ documents: s.documents.filter(d => d.id !== id) })),
  }),
  {
    name: 'hcm-candidate-documents-v1',
    storage: createJSONStorage(() => dbStorage),
    // v1 -> v2: data saved before the sample CVs existed gets them once (later deletions stay deleted).
    version: 2,
    migrate: (state, version) => {
      if (version < 2 && IS_SCHOOL && state) {
        const have = new Set((state.documents || []).map(d => d.id))
        state.documents = [...(state.documents || []), ...schoolSampleCvs().filter(d => !have.has(d.id))]
      }
      return state
    },
    onRehydrateStorage: () => (state) => {
      // Uploaded documents number up from the highest id below the sample CVs.
      const ids = (state?.documents || []).map(d => d.id).filter(i => i < SEED_CV_ID)
      if (ids.length) _id = Math.max(0, ...ids) + 1
    },
  },
))
