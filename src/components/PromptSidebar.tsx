import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Download } from "lucide-react";

interface PromptSidebarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
  isExporting: boolean;
  canExport: boolean;
  projectName?: string;
  instructions?: string;
}

const PromptSidebar = ({
  prompt,
  onPromptChange,
  onGenerate,
  onExport,
  isGenerating,
  isExporting,
  canExport,
  projectName,
  instructions,
}: PromptSidebarProps) => {
  const hints = useMemo(
    () => [
      "Landing page moderne",
      "Nom: Mon Super Site",
      "Ajoute un bouton vert",
      "Page d'accueil minimaliste",
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-background/60 backdrop-blur">
      <div className="border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Générateur
        </div>
        <p className="mt-2 text-sm text-muted-foreground/80">
          Décris le site ou l'application que tu souhaites. Utilise <code>Nom: ...</code> pour nommer le projet.
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-hidden p-5">
        <div className="space-y-3">
          <label htmlFor="prompt" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prompt
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            className="min-h-[220px] resize-none"
            placeholder={"Landing page\nNom: Mon Super Site\nBouton vert"}
          />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {hints.map((hint) => (
              <span
                key={hint}
                className="rounded-full border border-border/60 px-3 py-1"
              >
                {hint}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? "Génération…" : "Générer le projet"}
          </Button>
          <Button
            onClick={onExport}
            variant="outline"
            disabled={!canExport}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Export en cours…" : "Exporter en .zip"}
          </Button>
        </div>

        <Card className="border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Astuce</p>
          <p className="mt-2 leading-relaxed">
            Mentionne des éléments précis comme « bouton vert », « section témoignages » ou « thème sombre » pour adapter la génération.
          </p>
        </Card>

        {instructions && (
          <Card className="border-border/40 bg-muted/10">
            <div className="border-b border-border/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Instructions du projet
            </div>
            <ScrollArea className="max-h-48 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              <pre className="whitespace-pre-wrap font-sans text-[13px] text-muted-foreground">
                {instructions}
              </pre>
            </ScrollArea>
          </Card>
        )}

        {projectName && (
          <Card className="border-border/40 bg-muted/10 p-4 text-sm">
            <p className="text-muted-foreground">Projet actif :</p>
            <p className="font-semibold text-foreground">{projectName}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PromptSidebar;
