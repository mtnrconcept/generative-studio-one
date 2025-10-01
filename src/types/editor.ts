export interface ContextualEditPayload {
  targetSelector: string;
  textContent?: string;
  outerHTML: string;
  instruction: string;
}
