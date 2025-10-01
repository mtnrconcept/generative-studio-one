import { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { X } from "lucide-react";
import { toast } from "sonner";
import PromptSidebar from "@/components/PromptSidebar";
import ProjectFileTree from "@/components/ProjectFileTree";
import ProjectSandpack from "@/components/ProjectSandpack";
import PromptInput from "@/components/PromptInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import ResultDisplay from "@/components/ResultDisplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { GeneratedResult, GeneratedFile } from "@/types/result";
import type { ContextualEditPayload } from "@/types/editor";
import type { GeneratedProject, ProjectGeneratorMode } from "@/lib/project-generator";
import { generateProjectFromPrompt } from "@/lib/project-generator";

const loadingSteps = [
  "Analyse du prompt et compréhension du contexte",
  "Sélection du meilleur modèle IA pour la demande",
  "Génération du contenu en cours",
  "Préparation du rendu final",
];

export type CategoryId = "website" | "app" | "image" | "music" | "agent" | "game";

type CategoryType = "project" | "content";

interface CategoryConfig {
  id: CategoryId;
  title: string;
  description: string;
  type: CategoryType;
  defaultPrompt: string;
  sidebarDescription?: string;
  sidebarHints?: string[];
  promptPlaceholder?: string;
  helperText?: string;
}

const categoryConfig: Record<CategoryId, CategoryConfig> = {
  website: {
    id: "website",
    title: "Sites Web",
    description: "Créez des sites modernes",
    type: "project",
    defaultPrompt: ["Crée un site vitrine pour une startup", "Nom: NovaFlow", "Ajouter un bouton vert"].join("\n"),
    sidebarDescription:
      "Décris la page web à générer. Utilise <code>Nom: ...</code> pour nommer le projet et liste les sections attendues.",
    sidebarHints: ["Landing page moderne", "Section témoignages", "Formulaire de contact", "Mode sombre"],
    promptPlaceholder: "Landing page\nNom: NovaFlow\nCTA principal vert",
  },
  app: {
    id: "app",
    title: "Applications",
    description: "Développez des apps",
    type: "project",
    defaultPrompt: ["Tableau de bord SaaS pour suivre les ventes", "Nom: PulseBoard", "Inclure un bouton vert"].join("\n"),
    sidebarDescription:
      "Décris l'application ou le tableau de bord désiré. Ajoute des modules comme statistiques, tâches ou notifications.",
    sidebarHints: ["Tableau de bord", "Gestion d'équipe", "Suivi des KPI", "Mode sombre"],
    promptPlaceholder: "Application analytics\nNom: PulseBoard\nModules: KPI, tâches, timeline",
  },
  image: {
    id: "image",
    title: "Images",
    description: "Générez des visuels uniques",
    type: "content",
    defaultPrompt: "Illustration futuriste d'une ville néon au crépuscule",
    helperText:
      "Décrivez l'ambiance, le style artistique, les couleurs ou la composition pour guider la génération d'image.",
  },
  music: {
    id: "music",
    title: "Musique",
    description: "Composez des mélodies",
    type: "content",
    defaultPrompt: "Mélodie ambient relaxante avec touches électroniques et piano",
    helperText:
      "Précisez le style musical, les instruments souhaités et l'émotion à transmettre dans la composition.",
  },
  agent: {
    id: "agent",
    title: "Agents",
    description: "Automatisez vos tâches",
    type: "content",
    defaultPrompt: "Agent IA pour automatiser la planification des réunions et relances",
    helperText:
      "Décrivez la mission, les sources de données et le ton attendu pour l'agent conversationnel.",
  },
  game: {
    id: "game",
    title: "Jeux Vidéo",
    description: "Créez des jeux interactifs",
    type: "content",
    defaultPrompt: "Concept de jeu de plateforme rétro avec mécaniques de temps ralentis",
    helperText:
      "Indiquez le genre de jeu, les mécaniques clés, le style graphique et les plateformes visées.",
  },
};

const stripCodeFence = (code: string) => {
  const trimmed = code.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9-]*\n([\s\S]*?)```$/);

  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
};

const parseFilesFromResponse = (data: unknown): GeneratedFile[] | undefined => {
  if (!data) return undefined;

  if (Array.isArray((data as { files?: unknown }).files)) {
    const files = (data as { files: GeneratedFile[] }).files;
    return files.filter((file) => file?.path && typeof file.path === "string");
  }

  if (typeof (data as { files?: unknown }).files === "string") {
    try {
      const parsed = JSON.parse(stripCodeFence((data as { files: string }).files));
      if (Array.isArray(parsed)) {
        return parsed.filter((file) => file?.path && typeof file.path === "string");
      }
      if (Array.isArray(parsed?.files)) {
        return parsed.files.filter((file: GeneratedFile) => file?.path && typeof file.path === "string");
      }
    } catch (error) {
      console.error("Impossible de parser le manifeste de fichiers fourni", error);
    }
  }

  if (typeof (data as { code?: unknown }).code === "string") {
    const candidate = stripCodeFence((data as { code: string }).code);
    const firstChar = candidate.trim()[0];

    if (firstChar === "{" || firstChar === "[") {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed?.files)) {
          return parsed.files.filter((file: GeneratedFile) => file?.path && typeof file.path === "string");
        }
        if (Array.isArray(parsed)) {
          return parsed.filter((file: GeneratedFile) => file?.path && typeof file.path === "string");
        }
      } catch (error) {
        console.error("Impossible de parser le code comme un projet multi-fichiers", error);
      }
    }
  }

  return undefined;
};

const extractInstructions = (data: unknown) => {
  if (!data) return undefined;

  if (typeof (data as { instructions?: string }).instructions === "string") {
    return (data as { instructions: string }).instructions;
  }

  if (typeof (data as { readme?: string }).readme === "string") {
    return (data as { readme: string }).readme;
  }

  if (typeof (data as { documentation?: string }).documentation === "string") {
    return (data as { documentation: string }).documentation;
  }

  return undefined;
};

const buildGeneratedResult = (
  data: Record<string, unknown>,
  base: Pick<GeneratedResult, "prompt" | "version" | "category" | "type"> & {
    modification?: string;
  },
): GeneratedResult => {
  const files = parseFilesFromResponse(data);

  return {
    type: (data["type"] as string) || base.type,
    category: (data["category"] as string) || base.category,
    content:
      typeof data["content"] === "string"
        ? (data["content"] as string)
        : base.category === "website" && !files
          ? (data["code"] as string)
          : "",
    preview: typeof data["preview"] === "string" ? (data["preview"] as string) : undefined,
    code: typeof data["code"] === "string" ? (data["code"] as string) : undefined,
    prompt: base.prompt,
    version: base.version,
    modification: base.modification,
    files,
    instructions: extractInstructions(data),
    projectName: typeof data["projectName"] === "string" ? (data["projectName"] as string) : undefined,
    projectType: typeof data["projectType"] === "string"
      ? (data["projectType"] as string)
      : files
        ? "react"
        : undefined,
  };
};

interface ProjectGeneratorSectionProps {
  category: CategoryConfig;
}

const ProjectGeneratorSection = ({ category }: ProjectGeneratorSectionProps) => {
  const mode: ProjectGeneratorMode = category.id === "app" ? "application" : "website";
  const [prompt, setPrompt] = useState(category.defaultPrompt);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error("Décris ton projet avant de lancer la génération.");
      return;
    }

    try {
      setIsGenerating(true);
      const generated = generateProjectFromPrompt(prompt, mode);
      setProject(generated);

      const preferredFile = generated.files.find((file) =>
        file.path === "src/App.tsx" || file.path === "src/main.tsx",
      );
      setActiveFile(preferredFile?.path ?? generated.files[0]?.path);
      toast.success("Projet React + Vite généré !");
    } catch (error) {
      console.error("Erreur pendant la génération", error);
      toast.error("Impossible de générer le projet. Réessaie avec un prompt différent.");
    } finally {
      setIsGenerating(false);
    }
  }, [mode, prompt]);

  const handleExport = useCallback(async () => {
    if (!project) return;

    try {
      setIsExporting(true);
      const zip = new JSZip();

      project.files.forEach((file) => {
        zip.file(file.path, file.content);
      });

      if (project.instructions) {
        zip.file("README.md", project.instructions);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = project.projectName.replace(/\s+/g, "-").toLowerCase();
      link.href = url;
      link.download = `${slug || (mode === "application" ? "react-app" : "react-website")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Archive du projet prête à être téléchargée !");
    } catch (error) {
      console.error("Erreur lors de l'export", error);
      toast.error("Impossible de créer l'archive du projet.");
    } finally {
      setIsExporting(false);
    }
  }, [mode, project]);

  const projectFiles = useMemo(() => project?.files ?? [], [project]);

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <div className="grid h-full w-full grid-cols-[minmax(280px,340px)_minmax(240px,280px)_1fr] bg-background/80">
        <PromptSidebar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onExport={handleExport}
          isGenerating={isGenerating}
          isExporting={isExporting}
          canExport={Boolean(projectFiles.length) && !isExporting}
          projectName={project?.projectName}
          instructions={project?.instructions}
          title={`Générateur ${category.title}`}
          description={category.sidebarDescription}
          hints={category.sidebarHints}
          promptPlaceholder={category.promptPlaceholder}
          generateLabel={mode === "application" ? "Générer l'application" : "Générer le site"}
          exportLabel="Exporter le projet"
          instructionsLabel="Guide du projet"
        />

        <ProjectFileTree
          files={projectFiles}
          activeFile={activeFile}
          onSelect={setActiveFile}
        />

        <ProjectSandpack files={projectFiles} activeFile={activeFile} />
      </div>
    </div>
  );
};

interface ContentGeneratorSectionProps {
  category: CategoryConfig;
}

const ContentGeneratorSection = ({ category }: ContentGeneratorSectionProps) => {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [resultHistory, setResultHistory] = useState<GeneratedResult[]>([]);
  const [lastPrompt, setLastPrompt] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wasLoading, setWasLoading] = useState(false);

  const handlePromptSubmit = async (prompt: string) => {
    setWasLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("");
    setLoadingHistory([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt,
          category: category.id,
        },
      });

      if (error) throw error;

      const normalizedData =
        data && typeof data === "object" ? (data as Record<string, unknown>) : {};

      const generatedResult = buildGeneratedResult(normalizedData, {
        type: category.id,
        category: category.id,
        prompt,
        version: 1,
      });

      setLastPrompt(prompt);
      setResult(generatedResult);
      setResultHistory([generatedResult]);

      toast.success("Création réussie !");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de la génération");
      setLoadingMessage("Une erreur est survenue lors de la génération");
      setLoadingHistory((prev) => {
        if (prev[prev.length - 1] === "Une erreur est survenue lors de la génération") {
          return prev;
        }

        return [...prev, "Une erreur est survenue lors de la génération"];
      });
      setLoadingProgress(100);
      setWasLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineSubmit = async (modification: string) => {
    if (!result || !modification.trim()) {
      return;
    }

    setWasLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("");
    setLoadingHistory([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt: lastPrompt,
          category: category.id,
          modification,
          existingContent: result.code || result.content,
        },
      });

      if (error) throw error;

      const version = resultHistory.length + 1;
      const normalizedData =
        data && typeof data === "object" ? (data as Record<string, unknown>) : {};

      const refinedResult = buildGeneratedResult(normalizedData, {
        type: category.id,
        category: category.id,
        prompt: lastPrompt,
        version,
        modification,
      });

      setResult(refinedResult);
      setResultHistory((prev) => [...prev, refinedResult]);

      toast.success("Révision générée !");
    } catch (error) {
      console.error("Erreur lors de la révision:", error);
      toast.error("Impossible d'appliquer la modification");
      setLoadingMessage("Une erreur est survenue lors de la révision");
      setLoadingHistory((prev) => {
        if (prev[prev.length - 1] === "Une erreur est survenue lors de la révision") {
          return prev;
        }

        return [...prev, "Une erreur est survenue lors de la révision"];
      });
      setLoadingProgress(100);
      setWasLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextualEdit = (payload: ContextualEditPayload) => {
    const details = [`Cible sélectionnée : ${payload.targetSelector}`];

    if (payload.textContent) {
      details.push(`Texte actuel : "${payload.textContent}"`);
    }

    const contextualInstruction = `${details.join("\n")}`.concat(
      `\n\nInstruction : ${payload.instruction}`,
      `\n\nHTML actuel :\n${payload.outerHTML}`,
    );

    return handleRefineSubmit(contextualInstruction);
  };

  useEffect(() => {
    let stepIndex = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isLoading) {
      setLoadingHistory([loadingSteps[0]]);
      setLoadingMessage(loadingSteps[0]);
      setLoadingProgress(Math.round((1 / loadingSteps.length) * 100));

      interval = setInterval(() => {
        stepIndex += 1;

        if (stepIndex < loadingSteps.length) {
          const nextMessage = loadingSteps[stepIndex];
          setLoadingMessage(nextMessage);
          setLoadingHistory((prev) => {
            if (prev[prev.length - 1] === nextMessage) {
              return prev;
            }

            return [...prev, nextMessage];
          });
          setLoadingProgress(Math.min(95, Math.round(((stepIndex + 1) / loadingSteps.length) * 100)));
        } else if (interval) {
          clearInterval(interval);
        }
      }, 1500);
    } else if (!isLoading && wasLoading) {
      setLoadingProgress(100);
      setLoadingMessage("Finalisation terminée");
      setLoadingHistory((prev) => {
        if (!prev.length || prev[prev.length - 1] === "Finalisation terminée") {
          return prev.length ? prev : ["Finalisation terminée"];
        }

        return [...prev, "Finalisation terminée"];
      });
      setWasLoading(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, wasLoading]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="grid h-full w-full gap-8 overflow-hidden bg-background/80 p-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-4 overflow-y-auto pr-2">
          <Card className="border-border/60 bg-card/60 p-5">
            <h3 className="text-lg font-semibold text-foreground">Lancer une génération</h3>
            <p className="mt-2 text-sm text-muted-foreground">{category.helperText}</p>
            {category.defaultPrompt && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Exemple de prompt
                </p>
                <pre className="whitespace-pre-wrap rounded-lg border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                  {category.defaultPrompt}
                </pre>
              </div>
            )}
          </Card>

          <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
            <PromptInput
              onSubmit={handlePromptSubmit}
              onRefineSubmit={handleRefineSubmit}
              isLoading={isLoading}
              selectedCategory={category.title}
              hasResult={!!result}
              history={resultHistory}
            />
          </div>

          {(loadingHistory.length > 0 || isLoading) && (
            <LoadingIndicator
              progress={loadingProgress}
              message={loadingMessage}
              history={loadingHistory}
              isActive={isLoading}
            />
          )}
        </div>

        <div className="flex h-full min-h-0 flex-col">
          {result ? (
            <ResultDisplay
              result={result}
              history={resultHistory}
              onContextEdit={handleContextualEdit}
            />
          ) : (
            <Card className="h-full min-h-[320px] border-dashed border-border/60 bg-card/30">
              <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
                <div className="rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
                  <span className="text-3xl">✨</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Prévisualisation en attente</h3>
                  <p className="text-muted-foreground">
                    Lancez une génération pour afficher ici le rendu correspondant à votre création.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

interface CategoryGeneratorOverlayProps {
  categoryId: CategoryId;
  onClose: () => void;
}

const CategoryGeneratorOverlay = ({ categoryId, onClose }: CategoryGeneratorOverlayProps) => {
  const category = categoryConfig[categoryId];

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl">
        <header className="flex items-start justify-between border-b border-border/50 px-8 py-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">{category.description}</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{category.title}</h2>
            {category.type === "project" ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Génère un squelette React + Vite prêt à être personnalisé et exporté.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Décris ta vision, l'IA se charge de produire un premier résultat que tu pourras affiner.
              </p>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </header>

        {category.type === "project" ? (
          <ProjectGeneratorSection category={category} />
        ) : (
          <ContentGeneratorSection category={category} />
        )}
      </div>
    </div>
  );
};

export default CategoryGeneratorOverlay;
