// src/navigation/paths.ts
export const paths = {
  // ...existing entries
  curriculaList: () => `/curricula`,
  curriculum: (curriculumId: string) => `/curricula/${curriculumId}`,
  lesson: (curriculumId: string, lessonId: string) => `/curricula/${curriculumId}/lesson/${lessonId}`,

  // NEW:
  techniquesList: () => `/(tabs)/techniques`,
  editTechnique: (id: string) => `/edit/${id}`,
};
