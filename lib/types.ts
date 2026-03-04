export interface Annotation {
  id: string;
  measureId?: string; // Reference to a specific measure if sticky
  text: string;
  type: 'text' | 'dynamic' | 'tempo' | 'marker';
  offset: { x: number; y: number };
}

export interface Section {
  id: string;
  title: string;
  startMeasure: number;
  endMeasure: number;
  subSections: Section[]; // Recursive structure
  annotations: Annotation[];
  tempo?: string;
  timeSignature?: string;
  text?: string;
  showMeasureCount?: boolean;
}

export interface Composition {
  id: string;
  title: string;
  subtitle?: string;
  composer: string;
  arranger?: string;
  createdBy?: string;
  sections: Section[];
}

export type PageSize = 'letter' | 'legal' | 'tabloid';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageConfig {
  size: PageSize;
  orientation: PageOrientation;
}
