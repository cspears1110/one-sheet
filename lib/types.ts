export interface Annotation {
  id: string;
  type: 'dynamic' | 'text' | 'tempo' | 'marker' | 'clef' | 'articulation' | 'bowing' | 'line';
  value: string;
  offset: { x: number; y: number };
  color?: string;
  scale?: number;
  width?: number; // Useful for line annotations like crescendo
  hidden?: boolean;
}

export interface SectionStyle {
  // Start Measure
  startMeasureShape?: 'square' | 'circle' | 'none';
  startMeasureTextModifiers?: ('bold' | 'italic' | 'underline')[];
  startMeasureColor?: string;
  hideStartMeasure?: boolean;

  // Measure Range
  measureRangeTextModifiers?: ('bold' | 'italic' | 'underline')[];
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
  tempoColor?: string;
  hideTempo?: boolean;

  // Barlines
  startBarlineShape?: 'single' | 'double' | 'dashed' | 'end' | 'repeat-start' | 'repeat-end' | 'double-repeat';
  startBarlineColor?: string;
  hideStartBarline?: boolean;

  endBarlineShape?: 'single' | 'double' | 'dashed' | 'end' | 'repeat-start' | 'repeat-end' | 'double-repeat';
  endBarlineColor?: string;
  hideEndBarline?: boolean;
}

export interface Section {
  id: string;
  title: string;
  editorLabel?: string;
  startMeasure: number;
  startMeasureLabel?: string;
  endMeasure?: number;
  measureRangeLabel?: string;
  subSections: Section[]; // Recursive structure
  annotations: Annotation[];
  tempo?: string;
  timeSignature?: string;
  text?: string;
  showMeasureCount?: boolean;
  style?: SectionStyle;
}

export interface GlobalStyle {
  // Global Title
  titleModifiers?: ('bold' | 'italic' | 'underline')[];
  titleColor?: string;
  hideTitle?: boolean;

  // Global Subtitle
  subtitleModifiers?: ('bold' | 'italic' | 'underline')[];
  subtitleColor?: string;
  hideSubtitle?: boolean;

  // Composer
  composerModifiers?: ('bold' | 'italic' | 'underline')[];
  composerColor?: string;
  hideComposer?: boolean;

  // Arranger
  arrangerModifiers?: ('bold' | 'italic' | 'underline')[];
  arrangerColor?: string;
  hideArranger?: boolean;

  // Created By
  createdByModifiers?: ('bold' | 'italic' | 'underline')[];
  createdByColor?: string;
  hideCreatedBy?: boolean;
}

export interface Composition {
  id: string;
  title: string;
  subtitle?: string;
  composer: string;
  arranger?: string;
  createdBy?: string;
  sections: Section[];
  style?: GlobalStyle;
}

export type PageSize = 'letter' | 'legal' | 'tabloid';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageConfig {
  size: PageSize;
  orientation: PageOrientation;
}
