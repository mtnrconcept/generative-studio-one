import { supabase } from "@/integrations/supabase/client";
import type { GenerationPlan } from "@/types/plan";
import type { GeneratedFile } from "@/types/result";

export interface GeneratedProject {
  projectName: string;
  files: GeneratedFile[];
  instructions: string;
}

export type ProjectKind = "website" | "application";

const mapKindToCategory = (kind: ProjectKind) =>
  kind === "application" ? "app" : "website";

const ensureSupabaseConfig = () => {
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error("Configuration Supabase manquante");
  }
};

const normalizeGeneratedFiles = (files: unknown): GeneratedFile[] => {
  if (!Array.isArray(files)) {
    return [];
  }

  return files
    .filter(
      (entry): entry is { path: string; content: string; language?: string } =>
        typeof entry?.path === "string" && typeof entry?.content === "string",
    )
    .map((entry) => ({
      path: entry.path,
      content: entry.content,
      language: typeof entry.language === "string" ? entry.language : undefined,
    }));
};

const fallbackInstructions = (projectName: string) =>
  [
    `# ${projectName}`,
    "",
    "## Installation",
    "```bash",
    "npm install",
    "npm run dev",
    "```",
  ].join("\n");

export const createProjectPlan = async (
  prompt: string,
  kind: ProjectKind,
  modification?: string,
  existingPlan?: GenerationPlan | null,
): Promise<GenerationPlan> => {
  ensureSupabaseConfig();

  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      prompt,
      category: mapKindToCategory(kind),
      modification: modification?.trim() ? modification : undefined,
      mode: "plan",
      existingPlan: existingPlan ?? undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as { plan?: GenerationPlan } | GenerationPlan | null;
  const plan =
    payload && "plan" in (payload as Record<string, unknown>)
      ? (payload as { plan?: GenerationPlan }).plan
      : (payload as GenerationPlan | null);

  if (!plan) {
    throw new Error("Plan non fourni par le modèle");
  }

  return plan;
};

interface ProjectGenerationOptions {
  prompt: string;
  kind: ProjectKind;
  modification?: string;
  plan?: GenerationPlan | null;
  previous?: GeneratedProject | null;
}

export const generateProjectFromPrompt = async (
  options: ProjectGenerationOptions,
): Promise<GeneratedProject> => {
  ensureSupabaseConfig();

  const { prompt, kind, modification, plan, previous } = options;

  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      prompt,
      category: mapKindToCategory(kind),
      modification: modification?.trim() ? modification : undefined,
      existingContent:
        previous && Array.isArray(previous.files) && previous.files.length > 0
          ? JSON.stringify(previous.files)
          : undefined,
      plan: plan ?? undefined,
      mode: "content",
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  const files = normalizeGeneratedFiles(payload.files);
  const projectName =
    typeof payload.projectName === "string" &&
    payload.projectName.trim().length > 0
      ? payload.projectName.trim()
      : "Projet React généré";
  const instructions =
    typeof payload.instructions === "string" &&
    payload.instructions.trim().length > 0
      ? payload.instructions.trim()
      : fallbackInstructions(projectName);

  if (!files.length) {
    throw new Error("Aucun fichier généré par le modèle");
  }

  return {
    projectName,
    files,
    instructions,
  };
};
