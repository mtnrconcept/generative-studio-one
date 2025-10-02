export interface GenerationSettings {
  model: string;
  stylePreset: string;
  aspectRatio: string;
  guidanceScale: number;
  imageCount: number;
  promptMagic: boolean;
  qualityBoost: boolean;
  seed?: string;
}

export interface GenerationResult {
  id: string;
  type: string;
  category: string;
  content: string;
  preview?: string;
  previews?: string[];
  code?: string;
  prompt?: string;
  negativePrompt?: string;
  createdAt: string;
  settings?: Partial<GenerationSettings>;
}
