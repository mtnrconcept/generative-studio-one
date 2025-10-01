export type ImageAspectRatio =
  | "2:3"
  | "1:1"
  | "16:9"
  | "3:2"
  | "4:5"
  | "5:4"
  | "21:9"
  | "9:16"
  | "custom";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageAdvancedSettings {
  guidanceScale: number;
  stepCount: number;
  seed: string;
  upscale: boolean;
  highResolution: boolean;
  negativePrompt: string;
}

export interface ImageGenerationSettings {
  promptEnhance: boolean;
  aspectRatio: ImageAspectRatio;
  customDimensions?: ImageDimensions;
  imageCount: number;
  isPrivate: boolean;
  stylePreset?: string;
  advanced: ImageAdvancedSettings;
}

export interface ImageStylePreset {
  id: string;
  label: string;
  description?: string;
}
