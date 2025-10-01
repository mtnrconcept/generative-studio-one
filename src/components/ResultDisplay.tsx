import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import CodeViewer from "./CodeViewer";
import type { GeneratedResult } from "@/types/result";

interface ResultDisplayProps {
  result: GeneratedResult | null;
  history: GeneratedResult[];
}

const summarize = (text: string, maxLength = 80) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

const renderResultContent = (entry: GeneratedResult) => {
  if (entry.type === 'image' && entry.preview) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <img
          src={entry.preview}
          alt="Résultat"
          className="max-w-full max-h-[500px] object-contain rounded-lg"
        />
      </div>
    );
  }

  if (entry.type === 'code' && entry.code) {
    return <CodeViewer code={entry.code} category={entry.category} />;
  }

  if (entry.type === 'description') {
    return (
      <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
          {entry.content}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 min-h-[300px] flex flex-col items-center justify-center">
      <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <p className="text-muted-foreground max-w-md">
        {entry.content}
      </p>
    </div>
  );
};

const ResultDisplay = ({ result, history }: ResultDisplayProps) => {
  if (!result) return null;

  const handleDownloadImage = () => {
    if (result.preview) {
      const a = document.createElement('a');
      a.href = result.preview;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">
                Votre création{result.version > 1 ? ` · Révision ${result.version}` : ''}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Prompt initial : {result.prompt}
            </p>
            {result.modification && (
              <p className="text-xs text-muted-foreground">
                Dernière demande : {result.modification}
              </p>
            )}
          </div>

          {result.type === 'image' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm" 
                className="border-border/50 hover:border-primary/50"
                onClick={handleDownloadImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-background/50 p-4">
          {renderResultContent(result)}
        </div>

        {history.length > 1 && (
          <div className="space-y-3 pt-4 border-t border-border/40">
            <p className="text-sm font-semibold text-foreground">Historique des versions</p>
            <div className="space-y-2">
              {history
                .filter((entry) => entry.version !== result.version)
                .map((entry) => (
                  <details
                    key={entry.version}
                    className="rounded-lg border border-border/40 bg-background/40"
                  >
                    <summary
                      className="cursor-pointer select-none px-4 py-2 text-sm font-medium text-foreground"
                      title={entry.modification || undefined}
                    >
                      Version {entry.version} {entry.version === 1 ? '(initiale)' : ''}
                      {entry.modification ? ` · ${summarize(entry.modification)}` : ''}
                    </summary>
                    <div className="space-y-3 px-4 pb-4 pt-2 text-sm text-muted-foreground">
                      <p className="whitespace-pre-wrap">
                        <span className="font-semibold text-foreground">Prompt :</span> {entry.prompt}
                      </p>
                      {entry.modification && (
                        <p>
                          <span className="font-semibold text-foreground">Demande :</span> {entry.modification}
                        </p>
                      )}
                      <div className="rounded-lg bg-background/60 p-3">
                        {renderResultContent(entry)}
                      </div>
                    </div>
                  </details>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResultDisplay;
