import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";

import PromptSidebar from "@/components/PromptSidebar";
import ProjectFileTree from "@/components/ProjectFileTree";
import ProjectSandpack from "@/components/ProjectSandpack";
import GenerationPlanView from "@/components/GenerationPlanView";
import GenerationProgress from "@/components/GenerationProgress";
import type { GeneratedProject } from "@/lib/project-generator";
import {
  createProjectPlan,
  generateProjectFromPrompt,
} from "@/lib/project-generator";
import type {
  GenerationPlan,
  PlanExecutionStep,
  PlanStepStatus,
} from "@/types/plan";
import { cn } from "@/lib/utils";

export type SiteAppMode = "website" | "application";

interface SiteAppGeneratorProps {
  mode: SiteAppMode;
}

type Phase = "idle" | "planning" | "generating" | "complete";

const DEFAULT_PROMPTS: Record<SiteAppMode, string> = {
  website: [
    "Crée une landing page moderne",
    "Nom: Mon Super Site",
    "Ajoute un bouton vert",
  ].join("\n"),
  application: [
    "Prototype d'application dashboard",
    "Nom: Mon App Produit",
    "Inclut suivi des statistiques",
  ].join("\n"),
};

const HINTS: Record<SiteAppMode, string[]> = {
  website: [
    "Landing page SaaS",
    "Section témoignages",
    "Nom: Startup Nova",
    "Bouton vert",
  ],
  application: [
    "Dashboard analytique",
    "Vue Kanban",
    "Nom: Flow Manager",
    "Mode sombre",
  ],
};

const LABELS: Record<
  SiteAppMode,
  { title: string; description: string; generate: string }
> = {
  website: {
    title: "Générateur de site web",
    description:
      "Décris la landing page ou le site marketing que tu veux obtenir. Utilise <code>Nom: ...</code> pour définir le nom du projet.",
    generate: "Générer le plan",
  },
  application: {
    title: "Générateur d'application",
    description:
      "Décris l'application React que tu souhaites prototyper. Mentionne <code>Nom: ...</code> pour personnaliser le dossier.",
    generate: "Générer le plan",
  },
};

const createExecutionSteps = (plan: GenerationPlan): PlanExecutionStep[] => {
  const mapped = plan.sections.flatMap((section) =>
    section.steps.map((step) => ({
      ...step,
      section: section.title,
      status: "pending" as PlanStepStatus,
    })),
  );

  if (mapped.length === 0) {
    return [
      {
        id: "initialisation",
        title: "Initialiser le projet",
        description:
          "Préparer la structure Vite et les fichiers React de base.",
        deliverable: "Projet React opérationnel",
        section: plan.title,
        status: "pending",
      },
    ];
  }

  return mapped;
};

const SiteAppGenerator = ({ mode }: SiteAppGeneratorProps) => {
  const defaultPrompt = useMemo(() => DEFAULT_PROMPTS[mode], [mode]);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<GenerationPlan | null>(null);
  const [executionSteps, setExecutionSteps] = useState<PlanExecutionStep[]>([]);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const timersRef = useRef<number[]>([]);
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((identifier) => window.clearTimeout(identifier));
    timersRef.current = [];
  }, []);

  const clearGeneration = useCallback(() => {
    clearTimers();
    setProject(null);
    setActiveFile(undefined);
    setExecutionSteps([]);
    setStatusHistory([]);
    setStatusMessage("");
    setIsFileTreeCollapsed(false);
  }, [clearTimers]);

  const resetWorkflow = useCallback(() => {
    clearGeneration();
    setPlan(null);
    setPhase("idle");
  }, [clearGeneration]);

  useEffect(() => {
    setPrompt(defaultPrompt);
    resetWorkflow();
  }, [defaultPrompt, resetWorkflow]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const projectFiles = useMemo(() => project?.files ?? [], [project]);

  const handleGeneratePlan = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(
        "Ajoute quelques instructions avant de lancer la génération.",
      );
      return;
    }

    clearGeneration();
    setIsGenerating(true);

    const run = async () => {
      try {
        const generatedPlan = await createProjectPlan(prompt, mode);
        setPlan(generatedPlan);
        setPhase("planning");
        setStatusMessage(
          "Plan généré · vérifie les étapes avant de lancer la génération.",
        );
        setStatusHistory(["Plan proposé à partir du brief"]);
        toast.success("Plan d'action généré !");
      } catch (error) {
        console.error("Erreur pendant la génération du plan", error);
        toast.error(
          "Impossible de créer un plan pour ce brief. Réessaie avec plus de détails.",
        );
        setPhase("idle");
      } finally {
        setIsGenerating(false);
      }
    };

    void run();
  }, [clearGeneration, mode, prompt]);

  const handleConfirmPlan = useCallback(() => {
    if (!plan) return;

    clearGeneration();
    setIsGenerating(true);
    setPhase("generating");
    const steps = createExecutionSteps(plan);
    setExecutionSteps(steps);
    setStatusHistory((previous) => [
      ...previous,
      "Plan validé · lancement de la génération",
    ]);
    setStatusMessage("Initialisation du projet");

    clearTimers();

    steps.forEach((step, index) => {
      const startDelay = index * 1200;
      const endDelay = startDelay + 900;

      const startTimer = window.setTimeout(() => {
        setExecutionSteps((previous) =>
          previous.map((entry, entryIndex) => {
            if (entryIndex < index) {
              return { ...entry, status: "done" };
            }
            if (entryIndex === index) {
              return { ...entry, status: "active" };
            }
            return entry;
          }),
        );
        setStatusMessage(`${step.section} · ${step.title}`);
        setStatusHistory((previous) => [...previous, `▶️ ${step.title}`]);
      }, startDelay);

      const endTimer = window.setTimeout(() => {
        setExecutionSteps((previous) =>
          previous.map((entry, entryIndex) =>
            entryIndex === index ? { ...entry, status: "done" } : entry,
          ),
        );
        setStatusHistory((previous) => [...previous, `✅ ${step.title}`]);
      }, endDelay);

      timersRef.current.push(startTimer, endTimer);
    });

    const runGeneration = async () => {
      try {
        const generated = await generateProjectFromPrompt({
          prompt,
          kind: mode,
          plan,
        });
        setProject(generated);
        setActiveFile(generated.files[0]?.path);
        setPhase("complete");
        setStatusMessage("Génération terminée");
        setStatusHistory((previous) => [...previous, "✨ Génération terminée"]);
        toast.success(
          mode === "website"
            ? "Projet de site React + Vite généré !"
            : "Prototype d'application React généré !",
        );
      } catch (error) {
        console.error("Erreur pendant la génération du projet", error);
        toast.error("Impossible de générer le projet. Réessaie plus tard.");
        setPhase("planning");
      } finally {
        setIsGenerating(false);
      }
    };

    void runGeneration();
  }, [
    clearGeneration,
    clearTimers,
    generateProjectFromPrompt,
    mode,
    plan,
    prompt,
  ]);

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
      link.download = `${slug || "react-project"}.zip`;
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
  }, [project]);

  const handleEditPlan = useCallback(() => {
    resetWorkflow();
  }, [resetWorkflow]);

  const generateLabel =
    phase === "planning" ? "Régénérer le plan" : LABELS[mode].generate;

  return (
    <div className="flex h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div
        className={cn(
          "grid h-full w-full grid-cols-1 bg-background/60 max-lg:gap-6 max-lg:overflow-y-auto lg:overflow-hidden",
          isFileTreeCollapsed
            ? "lg:grid-cols-[minmax(260px,320px)_0px_1fr]"
            : "lg:grid-cols-[minmax(260px,320px)_minmax(260px,360px)_1fr]",
        )}
      >
        <PromptSidebar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGeneratePlan}
          onExport={handleExport}
          isGenerating={isGenerating}
          isExporting={isExporting}
          canExport={Boolean(projectFiles.length) && !isExporting}
          projectName={project?.projectName}
          instructions={project?.instructions}
          title={LABELS[mode].title}
          description={LABELS[mode].description}
          promptLabel="Brief"
          promptPlaceholder={defaultPrompt}
          hints={HINTS[mode]}
          generateLabel={generateLabel}
          exportLabel="Télécharger le projet"
        />

        {!isFileTreeCollapsed && (
          <div className="flex h-full flex-col border-t border-border/50 bg-background/60 max-lg:border-l-0 max-lg:border-r-0 lg:border-t-0 lg:border-r">
            {phase === "planning" && plan ? (
              <GenerationPlanView
                plan={plan}
                onConfirm={handleConfirmPlan}
                onEdit={handleEditPlan}
                confirmLabel={
                  mode === "website"
                    ? "Lancer la génération du site"
                    : "Lancer la génération de l'application"
                }
                isConfirming={isGenerating && phase === "planning"}
              />
            ) : (
              <div className="flex h-full flex-col overflow-hidden">
                <GenerationProgress
                  steps={executionSteps}
                  statusMessage={statusMessage}
                  history={statusHistory}
                  phase={phase}
                />
                <ProjectFileTree
                  files={projectFiles}
                  activeFile={activeFile}
                  onSelect={setActiveFile}
                  onCollapse={() => setIsFileTreeCollapsed(true)}
                />
              </div>
            )}
          </div>
        )}

        <ProjectSandpack
          files={projectFiles}
          activeFile={activeFile}
          isGenerating={phase === "generating"}
          className={cn(
            "lg:col-span-1",
            isFileTreeCollapsed && "lg:col-span-2",
          )}
          isFileTreeCollapsed={isFileTreeCollapsed}
          onExpandFileTree={() => setIsFileTreeCollapsed(false)}
        />
      </div>
    </div>
  );
};

export default SiteAppGenerator;
