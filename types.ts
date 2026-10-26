export interface Variation {
  id: number;
  label: string;
  css: (name: string, duration: number) => string;
  keyframes: (name: string) => string;
  maxUp?: number;
  maxDown?: number;
  origin?: string;
  targetChildren?: boolean;
  transformBox?: string;
  childPreset?: string;
}

export interface Effect {
  id: string;
  name: string;
  baseDuration?: number;
  variations: Variation[];
}

export interface LayerConfig {
  effectId: string;
  variation: number;
  speed: number;
}

export interface Target {
  id: string;
  name: string;
  children?: Target[];
  type: 'group' | 'shape' | 'root';
}

declare global {
  interface Window {
    html2canvas: any;
    GIF: any;
  }
}