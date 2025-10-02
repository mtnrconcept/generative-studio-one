import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import PromptInput from "@/components/PromptInput";
import ResultDisplay from "@/components/ResultDisplay";
import GenerationPlanView from "@/components/GenerationPlanView";
import GenerationProgress from "@/components/GenerationProgress";
import ImageGenerationSettings, {
  defaultImageGenerationSettings,
} from "@/components/ImageGenerationSettings";
import { cn } from "@/lib/utils";
import type { GeneratedResult } from "@/types/result";
import type {
  GenerationPlan,
  PlanExecutionStep,
  PlanStepStatus,
} from "@/types/plan";
import {
  getCreativeToolLabel,
  requestCreativePlan,
  requestCreativeResult,
  type CreativeTool,
} from "@/lib/content-generators";
import type { ImageGenerationSettings as ImageSettings } from "@/types/image";

type Phase = "idle" | "planning" | "generating" | "complete";

interface CreativeGeneratorProps {
  tool: CreativeTool;
  description: string;
}

const toExecutionSteps = (plan: GenerationPlan): PlanExecutionStep[] => {
  const steps = plan.sections.flatMap((section) =>
    section.steps.map((step) => ({
      ...step,
      section: section.title,
      status: "pending" as PlanStepStatus,
    })),
  );

  if (!steps.length) {
    return [
      {
        id: "analyse",
        title: "Analyser le brief",
        description: "Décomposer la demande et préparer la réponse.",
        deliverable: "Synthèse du brief",
        section: plan.title,
        status: "pending",
      },
      {
        id: "production",
        title: "Rédiger la proposition",
        description: "Assembler le contenu génératif étape par étape.",
        deliverable: "Proposition complète",
        section: plan.title,
        status: "pending",
      },
    ];
  }

  return steps;
};

const CreativeGenerator = ({ tool, description }: CreativeGeneratorProps) => {
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<GenerationPlan | null>(null);
  const [executionSteps, setExecutionSteps] = useState<PlanExecutionStep[]>([]);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [pendingPrompt, setPendingPrompt] = useState<string>("");
  const [pendingModification, setPendingModification] = useState<
    string | undefined
  >();
  const [imageSettings, setImageSettings] = useState<ImageSettings>(() =>
    defaultImageGenerationSettings(),
  );
  const timersRef = useRef<number[]>([]);

  const isImageTool = tool === "image";

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((identifier) => window.clearTimeout(identifier));
    timersRef.current = [];
  }, []);

  const resetProgress = useCallback(() => {
    clearTimers();
    setExecutionSteps([]);
    setStatusHistory([]);
    setStatusMessage("");
  }, [clearTimers]);

  const label = useMemo(() => getCreativeToolLabel(tool), [tool]);

  const handlePlanRequest = useCallback(
    (basePrompt: string, modification?: string) => {
      setIsLoading(true);
      resetProgress();

      const run = async () => {
        try {
          const generatedPlan = await requestCreativePlan(
            tool,
            basePrompt,
            modification,
            {
              image: isImageTool ? imageSettings : undefined,
              existingPlan: plan,
            },
          );
          setPlan(generatedPlan);
          setPhase("planning");
          setStatusHistory(["Plan proposé à partir du brief"]);
          setStatusMessage("Valide ou ajuste le plan avant la génération.");
          toast.success("Plan d'action généré !");
        } catch (error) {
          console.error("Erreur lors de la génération du plan", error);
          toast.error("Impossible de générer un plan pour cette demande.");
          setPhase("idle");
        } finally {
          setIsLoading(false);
        }
      };

      void run();
    },
    [imageSettings, isImageTool, plan, resetProgress, tool],
  );

  const handleSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) {
        toast.error(
          "Décris ce que tu souhaites générer avant de lancer l'outil.",
        );
        return;
      }

      setPendingPrompt(prompt);
      setPendingModification(undefined);
      handlePlanRequest(prompt);
    },
    [handlePlanRequest],
  );

  const handleRefineSubmit = useCallback(
    (modification: string) => {
      if (!result) {
        toast.error(
          "Génère d'abord un contenu avant de demander une modification.",
        );
        return;
      }

      if (!modification.trim()) {
        toast.error(
          "Décris l'ajustement souhaité avant de lancer une révision.",
        );
        return;
      }

      const basePrompt = lastPrompt || result.prompt;
      setPendingPrompt(basePrompt);
      setPendingModification(modification);
      handlePlanRequest(basePrompt, modification);
    },
    [handlePlanRequest, lastPrompt, result],
  );

  const handleEditPlan = useCallback(() => {
    resetProgress();
    setPlan(null);
    setPhase("idle");
    setPendingModification(undefined);
  }, [resetProgress]);

  const handleConfirmPlan = useCallback(() => {
    if (!plan) return;

    setIsLoading(true);
    setPhase("generating");

    const steps = toExecutionSteps(plan);
    setExecutionSteps(steps);
    setStatusHistory((previous) => [
      ...previous,
      "Plan validé · génération en cours",
    ]);
    setStatusMessage("Initialisation");

    clearTimers();

    steps.forEach((step, index) => {
      const startDelay = index * 900;
      const endDelay = startDelay + 750;

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

        if (index === steps.length - 1) {
          const version = history.length + 1;
          const basePrompt = pendingPrompt || plan.summary;
          const modification = pendingModification;
          setStatusHistory((previous) => [...previous, "🛰️ Synthèse finale"]);
          setStatusMessage("Synthèse finale");

          const runGeneration = async () => {
            let didFail = false;

            try {
              const generated = await requestCreativeResult(tool, {
                prompt: basePrompt,
                version,
                modification,
                previous: result,
                imageSettings: isImageTool ? imageSettings : undefined,
                plan,
              });

              setHistory((previous) => [...previous, generated]);
              setResult(generated);
              setLastPrompt(basePrompt);
              setPhase("complete");
              setPlan(plan);
              setStatusHistory((previous) => [
                ...previous,
                "✨ Contenu final prêt",
              ]);
              setStatusMessage("Génération terminée");
              toast.success(
                modification ? "Révision générée !" : "Création générée !",
              );
            } catch (error) {
              console.error("Erreur lors de la génération", error);
              didFail = true;
              setPhase("planning");
              setStatusHistory((previous) => [
                ...previous,
                "❌ Échec de la génération",
              ]);
              setStatusMessage("Erreur lors de la génération");
              toast.error(
                isImageTool
                  ? "Impossible de générer l'image. Vérifie ta configuration et réessaie."
                  : "Impossible de générer le contenu. Réessaie.",
              );
            } finally {
              setIsLoading(false);
              if (didFail) {
                setPendingPrompt(basePrompt);
                setPendingModification(modification);
              } else {
                setPendingPrompt("");
                setPendingModification(undefined);
              }
              clearTimers();
            }
          };

          void runGeneration();
        }
      }, endDelay);

      timersRef.current.push(startTimer, endTimer);
    });
  }, [
    clearTimers,
    history.length,
    imageSettings,
    isImageTool,
    pendingModification,
    pendingPrompt,
    plan,
    result,
    tool,
  ]);

  const handleImageSettingsChange = useCallback((settings: ImageSettings) => {
    setImageSettings(settings);
  }, []);

  const handleResetImageSettings = useCallback(() => {
    setImageSettings(defaultImageGenerationSettings());
  }, []);

  const generatorContent = (
    <>
      <PromptInput
        onSubmit={handleSubmit}
        onRefineSubmit={handleRefineSubmit}
        isLoading={isLoading}
        selectedCategory={label}
        hasResult={Boolean(result)}
        history={history}
      />

      {plan && phase === "planning" && (
        <GenerationPlanView
          plan={plan}
          onConfirm={handleConfirmPlan}
          onEdit={handleEditPlan}
          confirmLabel="Valider le plan et générer"
          isConfirming={isLoading}
        />
      )}

      {(phase === "generating" ||
        executionSteps.length > 0 ||
        statusHistory.length > 0) && (
        <GenerationProgress
          steps={executionSteps}
          statusMessage={statusMessage}
          history={statusHistory}
          phase={phase}
        />
      )}

      <ResultDisplay result={result} history={history} />
    </>
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-white/5 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
        <p className="mt-1 text-sm text-slate-300/80">{description}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-6",
            isImageTool ? "lg:max-w-6xl" : "max-w-5xl",
          )}
        >
          {isImageTool ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex flex-col gap-6">{generatorContent}</div>
              <div className="lg:sticky lg:top-6">
                <ImageGenerationSettings
                  value={imageSettings}
                  onChange={handleImageSettingsChange}
                  onReset={handleResetImageSettings}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">{generatorContent}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeGenerator;
