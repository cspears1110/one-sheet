export interface Annotation {
  id: string;
  type: 'dynamic' | 'text' | 'tempo' | 'marker' | 'clef' | 'articulation' | 'bowing' | 'line' | 'image';
  value: string;
  offset: { x: number; y: number };
  src?: string; // Base64 data for images
  aspectRatio?: number; // Width / Height ratio for images
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
  startMeasureFontSize?: number;
  hideStartMeasure?: boolean;
  startMeasureOffset?: { x: number; y: number };

  // Measure Range
  measureRangeTextModifiers?: ('bold' | 'italic' | 'underline')[];
  measureRangeColor?: string;
  measureRangeFontSize?: number;
  hideMeasureRange?: boolean;
  measureRangeOffset?: { x: number; y: number };

  // Brace
  braceShape?: 'brace' | 'bracket' | 'line' | 'none';
  braceColor?: string;
  braceDashed?: boolean;
  hideBrace?: boolean;

  // Title
  titleModifiers?: ('bold' | 'italic' | 'underline')[];
  titleColor?: string;
  titleFontSize?: number;
  hideTitle?: boolean;
  titleOffset?: { x: number; y: number };

  // Text
  textModifiers?: ('bold' | 'italic' | 'underline')[];
  textColor?: string;
  textFontSize?: number;
  hideText?: boolean;
  textOffset?: { x: number; y: number };

  // Tempo
  tempoModifiers?: ('bold' | 'italic' | 'underline')[];
  tempoColor?: string;
  tempoFontSize?: number;
  hideTempo?: boolean;
  tempoOffset?: { x: number; y: number };

  // Time Signature
  timeSignatureOffset?: { x: number; y: number };

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
  titleFontSize?: number;
  hideTitle?: boolean;
  
  // Global Measure Numbers
  startMeasureFontSize?: number;
  measureRangeFontSize?: number;

  // Global Subtitle
  subtitleModifiers?: ('bold' | 'italic' | 'underline')[];
  subtitleColor?: string;
  subtitleFontSize?: number;
  hideSubtitle?: boolean;

  // Composer
  composerModifiers?: ('bold' | 'italic' | 'underline')[];
  composerColor?: string;
  composerFontSize?: number;
  hideComposer?: boolean;

  // Arranger
  arrangerModifiers?: ('bold' | 'italic' | 'underline')[];
  arrangerColor?: string;
  arrangerFontSize?: number;
  hideArranger?: boolean;

  // Created By
  createdByModifiers?: ('bold' | 'italic' | 'underline')[];
  createdByColor?: string;
  createdByFontSize?: number;
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
  imageGallery?: { id: string; src: string; aspectRatio: number }[];
  pageConfig?: PageConfig;
  updatedAt?: number;
}

export type PageSize = 'letter' | 'legal' | 'tabloid';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageConfig {
  size: PageSize;
  orientation: PageOrientation;
}
