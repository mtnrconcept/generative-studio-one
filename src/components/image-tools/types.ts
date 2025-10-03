export type ImageModeId =
  | "image-to-image"
  | "style-reference"
  | "content-reference"
  | "character-reference"
  | "depth-to-image"
  | "edge-to-image"
  | "pose-to-image"
  | "text-image-input";

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  base64?: string;
}

export type AnalysisType = "depth" | "edge" | "pose" | "text";

export type ModeAnalysis =
  | {
      type: "depth" | "edge" | "pose";
      url: string;
      note: string;
    }
  | {
      type: "text";
      text: string;
      note: string;
    };

export interface ModeState {
  sources: UploadedImage[];
  analysis?: ModeAnalysis | null;
}

export interface ImageModeDefinition {
  id: ImageModeId;
  title: string;
  description: string;
  premium?: boolean;
  maxImages?: number;
  helperText?: string;
  analysisType?: AnalysisType;
  badgeLabel?: string;
  sampleResultDescription: string;
}
