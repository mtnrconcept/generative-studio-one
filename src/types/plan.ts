export type PlanStepStatus = "pending" | "active" | "done";

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  deliverable?: string;
}

export interface PlanSection {
  title: string;
  objective: string;
  steps: PlanStep[];
}

export interface GenerationPlan {
  title: string;
  summary: string;
  sections: PlanSection[];
  successCriteria: string[];
  cautions?: string[];
}

export interface PlanExecutionStep extends PlanStep {
  section: string;
  status: PlanStepStatus;
}
