export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
}

export interface GeneratedResult {
  type: string;
  category: string;
  content?: string;
  preview?: string;
  code?: string;
  prompt: string;
  version: number;
  modification?: string;
  files?: GeneratedFile[];
  instructions?: string;
  projectName?: string;
  projectType?: string;
}
