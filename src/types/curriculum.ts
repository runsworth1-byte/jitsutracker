// src/types/curriculum.ts
export type Curriculum = {
  id: string;
  name: string;        // e.g., "Adults", "Kids 6–9"
  label: string;       // future segment label (can mirror name)
  notes: string;       // holistic notes
  focusTags: string[]; // optional tags for coverage analytics
  createdAt?: any;
  updatedAt?: any;
};

export type Lesson = {
  id: string;
  order: number;           // 1..100
  title?: string;          // optional, defaults to "Lesson {order}"
  notes: string;           // prep + post notes combined
  durationMinutes?: number;
  items: string[];         // ordered technique IDs
  createdAt?: any;
  updatedAt?: any;
};
