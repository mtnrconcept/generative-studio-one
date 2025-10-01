import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlanExecutionStep, PlanStepStatus } from "@/types/plan";
import { CheckCircle2, Loader2, Pause, Timer } from "lucide-react";

const statusStyles: Record<PlanStepStatus, string> = {
  pending: "border-border/40 bg-background/40 text-muted-foreground",
  active: "border-primary/40 bg-primary/5 text-primary",
  done: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

interface GenerationProgressProps {
  steps: PlanExecutionStep[];
  statusMessage?: string;
  history?: string[];
  phase: "idle" | "planning" | "generating" | "complete";
}

const iconForStatus = (status: PlanStepStatus) => {
  if (status === "active") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  return <Timer className="h-4 w-4" />;
};

const GenerationProgress = ({ steps, statusMessage, history = [], phase }: GenerationProgressProps) => {
  const currentLabel =
    phase === "generating"
      ? statusMessage || "Génération en cours…"
      : phase === "complete"
        ? "Génération terminée"
        : phase === "planning"
          ? "Plan en attente de validation"
          : "Prêt pour une nouvelle génération";

  return (
    <div className="space-y-3 p-4">
      <Card className="border-border/30 bg-background/70">
        <div className="flex items-center justify-between gap-3 border-b border-border/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Progression</p>
            <p className="text-xs text-muted-foreground">{currentLabel}</p>
          </div>
          {phase === "planning" && <Pause className="h-4 w-4 text-muted-foreground" />}
        </div>
        <ScrollArea className="max-h-64 px-4 py-3">
          <ul className="space-y-3">
            {steps.map((step) => (
              <li
                key={`${step.section}-${step.id}`}
                className={`rounded-lg border p-3 transition ${statusStyles[step.status]}`}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  {iconForStatus(step.status)}
                  <span>{step.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{step.section}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">{step.description}</p>
                {step.deliverable && (
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                    Livrable : {step.deliverable}
                  </p>
                )}
              </li>
            ))}
            {!steps.length && (
              <li className="rounded-lg border border-dashed border-border/40 bg-muted/10 p-4 text-center text-sm text-muted-foreground">
                Aucun travail lancé pour le moment.
              </li>
            )}
          </ul>
        </ScrollArea>
      </Card>

      {history.length > 0 && (
        <Card className="border-border/30 bg-background/60">
          <div className="border-b border-border/30 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Journal</p>
          </div>
          <div className="px-4 py-3 text-xs text-muted-foreground">
            <ul className="space-y-2">
              {history.map((entry, index) => (
                <li key={`${entry}-${index}`} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary/50" />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GenerationProgress;
