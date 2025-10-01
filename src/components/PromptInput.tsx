import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import type { GeneratedResult } from "@/types/result";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onRefineSubmit?: (modification: string) => void;
  isLoading: boolean;
  selectedCategory: string;
  hasResult?: boolean;
  history?: GeneratedResult[];
}

const PromptInput = ({
  onSubmit,
  onRefineSubmit,
  isLoading,
  selectedCategory,
  hasResult,
  history = [],
}: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [modification, setModification] = useState("");

  useEffect(() => {
    setModification("");
  }, [history]);

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  const handleRefine = () => {
    if (modification.trim() && onRefineSubmit) {
      onRefineSubmit(modification.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleModificationKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRefine();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Décrivez votre ${selectedCategory.toLowerCase()} en détail...`}
          className="min-h-[120px] bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 resize-none text-base"
          disabled={isLoading}
        />
        
        {selectedCategory && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-xs text-white">
            {selectedCategory}
          </div>
        )}
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white transition-all duration-300 shadow-[var(--shadow-glow)] hover:shadow-[0_0_50px_hsl(263_70%_60%/0.5)] h-12 text-lg font-semibold"
      >
        <Sparkles className="mr-2 h-5 w-5" />
        {isLoading ? "Création en cours..." : "Créer avec l'IA"}
      </Button>

      {hasResult && onRefineSubmit && (
        <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
          <div>
            <p className="text-sm font-medium">Demander une modification</p>
            <p className="text-xs text-muted-foreground">
              Décrivez les ajustements à appliquer sur le contenu généré sans repartir de zéro.
            </p>
          </div>
          <Textarea
            value={modification}
            onChange={(e) => setModification(e.target.value)}
            onKeyDown={handleModificationKeyDown}
            placeholder="Précisez les améliorations ou corrections souhaitées..."
            className="min-h-[100px] bg-background/60 border-border/50 focus:border-secondary/60 text-sm"
            disabled={isLoading}
          />
          <Button
            variant="outline"
            onClick={handleRefine}
            disabled={isLoading || !modification.trim()}
            className="w-full border-secondary/40 text-secondary hover:bg-secondary/10"
          >
            Soumettre la modification
          </Button>

          {history.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Historique des versions
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div
                    key={entry.version}
                    className="rounded-lg border border-border/40 bg-background/60 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Version {entry.version}</span>
                      <span>{entry.version === 1 ? "Initiale" : "Révision"}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Prompt :</span>{" "}
                        {entry.prompt}
                      </p>
                      {entry.modification && (
                        <p>
                          <span className="font-medium text-foreground">Modification :</span>{" "}
                          {entry.modification}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrompt(entry.prompt)}
                        className="text-xs"
                      >
                        Réutiliser le prompt
                      </Button>
                      {entry.modification && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setModification(entry.modification ?? "")}
                          className="text-xs"
                        >
                          Réutiliser la modification
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptInput;
