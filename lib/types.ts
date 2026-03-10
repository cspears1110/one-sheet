export interface Annotation {
  id: string;
  measureId?: string; // Reference to a specific measure if sticky
  text: string;
  type: 'text' | 'dynamic' | 'tempo' | 'marker';
  offset: { x: number; y: number };
}

export interface SectionStyle {
  // Start Measure
  startMeasureShape?: 'square' | 'circle' | 'none';
  startMeasureTextModifiers?: ('bold' | 'italic' | 'underline')[];
  startMeasureTextOverride?: string;
  startMeasureColor?: string;
  hideStartMeasure?: boolean;

  // Measure Range
  measureRangeTextModifiers?: ('bold' | 'italic' | 'underline')[];
  measureRangeTextOverride?: string;
  measureRangeColor?: string;
  hideMeasureRange?: boolean;

  // Brace
  braceShape?: 'brace' | 'bracket' | 'line' | 'none';
  braceColor?: string;
  braceDashed?: boolean;
  hideBrace?: boolean;

  // Title
  titleModifiers?: ('bold' | 'italic' | 'underline')[];
  titleColor?: string;
  hideTitle?: boolean;

  // Text
  textModifiers?: ('bold' | 'italic' | 'underline')[];
  textColor?: string;
  hideText?: boolean;

  // Tempo
  tempoModifiers?: ('bold' | 'italic' | 'underline')[];
  tempoTextOverride?: string;
  tempoColor?: string;
  hideTempo?: boolean;
}

export interface Section {
  id: string;
  title: string;
  editorLabel?: string;
  startMeasure: number;
  endMeasure?: number;
  subSections: Section[]; // Recursive structure
  annotations: Annotation[];
  tempo?: string;
  timeSignature?: string;
  text?: string;
  showMeasureCount?: boolean;
  style?: SectionStyle;
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
