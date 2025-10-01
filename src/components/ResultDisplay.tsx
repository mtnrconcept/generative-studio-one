import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import CodeViewer from "./CodeViewer";
import ReactProjectViewer from "./ReactProjectViewer";
import type { GeneratedResult } from "@/types/result";
import type { ContextualEditPayload } from "@/types/editor";
import type { ImageGenerationSettings } from "@/types/image";

interface ResultDisplayProps {
  result: GeneratedResult | null;
  history: GeneratedResult[];
  onContextEdit?: (payload: ContextualEditPayload) => void;
}

const summarize = (text: string, maxLength = 80) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

interface RenderOptions {
  enableVisualEditing?: boolean;
  onContextEdit?: (payload: ContextualEditPayload) => void;
}

const renderResultContent = (entry: GeneratedResult, options?: RenderOptions) => {
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

  if (entry.files && entry.files.length > 0) {
    return (
      <ReactProjectViewer
        files={entry.files}
        instructions={entry.instructions}
        projectName={entry.projectName}
      />
    );
  }

  if (entry.type === 'code' && entry.code) {
    return (
      <CodeViewer
        code={entry.code}
        category={entry.category}
        onContextEdit={options?.enableVisualEditing ? options?.onContextEdit : undefined}
      />
    );
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
        {entry.content || "Aucun contenu n'a été généré pour cette requête."}
      </p>
    </div>
  );
};

const RATIO_DISPLAY_LABELS: Record<string, string> = {
  "2:3": "Portrait 2:3",
  "1:1": "Carré 1:1",
  "16:9": "Paysage 16:9",
  "3:2": "Paysage 3:2",
  "4:5": "Portrait 4:5",
  "5:4": "Affiche 5:4",
  "21:9": "Ultra large 21:9",
  "9:16": "Vertical 9:16",
  custom: "Personnalisé",
};

const STYLE_DISPLAY_LABELS: Record<string, string> = {
  "3d-render": "3D Render",
  acrylic: "Acrylic",
  cinematic: "Cinematic",
  creative: "Creative",
  dynamic: "Dynamic",
  fashion: "Fashion",
  "game-concept": "Game Concept",
  "graphic-2d": "Graphic Design 2D",
  "graphic-3d": "Graphic Design 3D",
  illustration: "Illustration",
  portrait: "Portrait",
  "portrait-cinematic": "Portrait Cinematic",
  "portrait-fashion": "Portrait Fashion",
  "pro-bw": "Pro B&W photography",
  "pro-color": "Pro color photography",
  "pro-film": "Pro film photography",
  "ray-traced": "Ray Traced",
  "stock-photo": "Stock Photo",
};

const formatDimensions = (settings: ImageGenerationSettings) => {
  if (settings.aspectRatio === "custom" && settings.customDimensions) {
    return `${settings.customDimensions.width} × ${settings.customDimensions.height}`;
  }
  const label = RATIO_DISPLAY_LABELS[settings.aspectRatio];
  return label ? `${label}` : settings.aspectRatio;
};

const formatStyle = (settings: ImageGenerationSettings) => {
  if (!settings.stylePreset) {
    return "Libre";
  }
  return STYLE_DISPLAY_LABELS[settings.stylePreset] ?? settings.stylePreset;
};

const ResultDisplay = ({ result, history, onContextEdit }: ResultDisplayProps) => {
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

        {result.type === 'image' && result.imageSettings && (
          <div className="space-y-3 rounded-lg border border-border/40 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Paramètres Leonardo.ai</p>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {formatDimensions(result.imageSettings)}
              </span>
            </div>
            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Style</p>
                <p>{formatStyle(result.imageSettings)}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Variations</p>
                <p>{result.imageSettings.imageCount}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Prompt enhance</p>
                <p>{result.imageSettings.promptEnhance ? 'Activé' : 'Désactivé'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Confidentialité</p>
                <p>{result.imageSettings.isPrivate ? 'Privée' : 'Publique'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Guidance · Steps</p>
                <p>
                  {result.imageSettings.advanced.guidanceScale} · {result.imageSettings.advanced.stepCount}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Upscale / HD</p>
                <p>
                  {result.imageSettings.advanced.upscale ? 'Oui' : 'Non'} ·{' '}
                  {result.imageSettings.advanced.highResolution ? 'Oui' : 'Non'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Seed</p>
                <p>{result.imageSettings.advanced.seed || 'Aléatoire'}</p>
              </div>
            </div>
            {result.imageSettings.advanced.negativePrompt.trim() && (
              <div className="rounded-md bg-background/60 p-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Prompt négatif :</span>{' '}
                {result.imageSettings.advanced.negativePrompt}
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg bg-background/50 p-4">
          {renderResultContent(result, { enableVisualEditing: true, onContextEdit })}
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
