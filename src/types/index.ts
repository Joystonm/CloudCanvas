export type Tool = 'select' | 'crop' | 'move' | 'lasso' | 'heal' | 'magic-remove' | 'expand' | 'text' | 'generate' | 'shape';
export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'star' | 'arrow';

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape';
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  // image-specific
  src?: string;
  cloudinaryPublicId?: string;
  transformations?: string[];
  naturalWidth?: number;   // original pixel dimensions of the uploaded image
  naturalHeight?: number;
  // shape-specific
  shapeKind?: 'rect' | 'ellipse' | 'triangle' | 'star' | 'arrow'
  strokeColor?: string
  strokeWidth?: number
  text?: string;
  fontSize?: number;
  fill?: string;
  fontFamily?: string;
  fontStyle?: string;   // 'normal' | 'bold' | 'italic' | 'bold italic'
  textDecoration?: string; // 'underline' | ''
  align?: string;       // 'left' | 'center' | 'right'
}

export interface TransformationNode {
  id: string;
  label: string;
  transformation: string;
  children: TransformationNode[];
  url?: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  snapshot: Layer[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  layers: Layer[];
  history: HistoryEntry[];
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string; // 'transparent' | '#ffffff' | '#000000' | any hex
  transformationGraph: TransformationNode | null;
  exports: ExportEntry[];
}

export interface ExportEntry {
  id: string;
  label: string;
  format: 'png' | 'jpg' | 'webp';
  width: number;
  height: number;
  url: string;
  originalSize?: number;
  finalSize?: number;
}

export type GenerationPreset = 'photo' | 'illustration' | 'product' | 'poster' | 'thumbnail' | 'branding';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
}
