import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import PromptInput from "@/components/PromptInput";
import ResultDisplay from "@/components/ResultDisplay";
import GenerationPlanView from "@/components/GenerationPlanView";
import GenerationProgress from "@/components/GenerationProgress";
import type { GeneratedResult } from "@/types/result";
import type { GenerationPlan, PlanExecutionStep, PlanStepStatus } from "@/types/plan";
import {
  createCreativePlan,
  generateCreativeResult,
  getCreativeToolLabel,
  type CreativeTool,
} from "@/lib/content-generators";

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
  const [pendingModification, setPendingModification] = useState<string | undefined>();
  const timersRef = useRef<number[]>([]);

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
      try {
        setIsLoading(true);
        resetProgress();
        const generatedPlan = createCreativePlan(tool, basePrompt, modification);
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
    },
    [resetProgress, tool],
  );

  const handleSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) {
        toast.error("Décris ce que tu souhaites générer avant de lancer l'outil.");
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
        toast.error("Génère d'abord un contenu avant de demander une modification.");
        return;
      }

      if (!modification.trim()) {
        toast.error("Décris l'ajustement souhaité avant de lancer une révision.");
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
    setStatusHistory((previous) => [...previous, "Plan validé · génération en cours"]);
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
          const generated = generateCreativeResult(tool, {
            prompt: basePrompt,
            version,
            modification: pendingModification,
            previous: result,
          });

          setHistory((previous) => [...previous, generated]);
          setResult(generated);
          setLastPrompt(basePrompt);
          setPhase("complete");
          setPlan(plan);
          setIsLoading(false);
          setStatusMessage("Génération terminée");
          toast.success(pendingModification ? "Révision générée !" : "Création générée !");
          setPendingPrompt("");
          setPendingModification(undefined);
          clearTimers();
        }
      }, endDelay);

      timersRef.current.push(startTimer, endTimer);
    });
  }, [clearTimers, history.length, pendingModification, pendingPrompt, plan, result, tool]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-white/5 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
        <p className="mt-1 text-sm text-slate-300/80">{description}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
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

          {(phase === "generating" || executionSteps.length > 0 || statusHistory.length > 0) && (
            <GenerationProgress
              steps={executionSteps}
              statusMessage={statusMessage}
              history={statusHistory}
              phase={phase}
            />
          )}

          <ResultDisplay result={result} history={history} />
        </div>
      </div>
    </div>
  );
};

export default CreativeGenerator;
