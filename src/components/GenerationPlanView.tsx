import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GenerationPlan } from "@/types/plan";
import { BadgeCheck, CheckCircle2, Edit3, TriangleAlert } from "lucide-react";

interface GenerationPlanViewProps {
  plan: GenerationPlan;
  onConfirm: () => void;
  onEdit: () => void;
  confirmLabel?: string;
  isConfirming?: boolean;
}

const GenerationPlanView = ({
  plan,
  onConfirm,
  onEdit,
  confirmLabel = "Valider le plan et lancer la génération",
  isConfirming = false,
}: GenerationPlanViewProps) => (
  <div className="flex h-full flex-col bg-background/70">
    <div className="border-b border-border/40 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan d'action proposé</p>
      <h3 className="mt-1 text-lg font-semibold text-foreground">{plan.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
    </div>

    <ScrollArea className="flex-1 px-5 py-4">
      <div className="space-y-4">
        {plan.sections.map((section) => (
          <Card key={section.title} className="border-border/40 bg-background/80">
            <div className="border-b border-border/30 px-4 py-3">
              <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{section.objective}</p>
            </div>
            <div className="space-y-3 px-4 py-3">
              {section.steps.map((step) => (
                <div key={step.id} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                  {step.deliverable && (
                    <p className="mt-2 text-xs font-medium text-foreground/80">
                      Livrable : <span className="text-muted-foreground">{step.deliverable}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card className="border-border/30 bg-muted/10">
          <div className="border-b border-border/30 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Critères de réussite
            </p>
          </div>
          <ul className="space-y-2 px-5 py-4 text-sm text-muted-foreground">
            {plan.successCriteria.map((criterion) => (
              <li key={criterion} className="flex items-start gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary/60" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </Card>

        {plan.cautions && plan.cautions.length > 0 && (
          <Card className="border-border/30 bg-amber-500/5">
            <div className="border-b border-border/30 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <TriangleAlert className="h-4 w-4 text-amber-400" />
                Points de vigilance
              </p>
            </div>
            <ul className="space-y-2 px-5 py-4 text-sm text-muted-foreground">
              {plan.cautions.map((caution) => (
                <li key={caution} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                  <span>{caution}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </ScrollArea>

    <div className="flex items-center justify-between gap-3 border-t border-border/40 bg-background/80 px-5 py-4">
      <Button variant="ghost" size="sm" onClick={onEdit} className="gap-2 text-muted-foreground">
        <Edit3 className="h-4 w-4" />
        Modifier le brief
      </Button>
      <Button onClick={onConfirm} disabled={isConfirming} className="gap-2">
        {isConfirming ? "Validation en cours…" : confirmLabel}
      </Button>
    </div>
  </div>
);

export default GenerationPlanView;
