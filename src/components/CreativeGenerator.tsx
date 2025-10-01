import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import PromptInput from "@/components/PromptInput";
import ResultDisplay from "@/components/ResultDisplay";
import type { GeneratedResult } from "@/types/result";
import {
  generateCreativeResult,
  getCreativeToolLabel,
  type CreativeTool,
} from "@/lib/content-generators";

interface CreativeGeneratorProps {
  tool: CreativeTool;
  description: string;
}

const CreativeGenerator = ({ tool, description }: CreativeGeneratorProps) => {
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");

  const label = useMemo(() => getCreativeToolLabel(tool), [tool]);

  const handleSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) {
        toast.error("Décris ce que tu souhaites générer avant de lancer l'outil.");
        return;
      }

      try {
        setIsLoading(true);
        const version = history.length + 1;
        const generated = generateCreativeResult(tool, {
          prompt,
          version,
          previous: result,
        });
        setHistory((previous) => [...previous, generated]);
        setResult(generated);
        setLastPrompt(prompt);
        toast.success("Création générée !");
      } catch (error) {
        console.error("Erreur pendant la génération", error);
        toast.error("Impossible de créer ce contenu pour le moment.");
      } finally {
        setIsLoading(false);
      }
    },
    [history.length, result, tool],
  );

  const handleRefineSubmit = useCallback(
    (modification: string) => {
      if (!result) return;
      if (!modification.trim()) {
        toast.error("Décris l'ajustement souhaité avant de lancer une révision.");
        return;
      }

      try {
        setIsLoading(true);
        const version = history.length + 1;
        const generated = generateCreativeResult(tool, {
          prompt: lastPrompt || result.prompt,
          version,
          modification,
          previous: result,
        });
        setHistory((previous) => [...previous, generated]);
        setResult(generated);
        toast.success("Révision générée !");
      } catch (error) {
        console.error("Erreur pendant la révision", error);
        toast.error("Impossible d'appliquer cette modification.");
      } finally {
        setIsLoading(false);
      }
    },
    [history.length, lastPrompt, result, tool],
  );

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

          <ResultDisplay result={result} history={history} />
        </div>
      </div>
    </div>
  );
};

export default CreativeGenerator;
