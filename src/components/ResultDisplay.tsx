import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Download, Share2, Sparkles } from "lucide-react";
import CodeViewer from "./CodeViewer";
import type { GenerationResult } from "@/lib/types";

interface ResultDisplayProps {
  result: GenerationResult | null;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
  if (!result) return null;

  const handleDownloadImage = () => {
    const target = result.previews?.[0] || result.preview;
    if (!target) return;

    const a = document.createElement("a");
    a.href = target;
    a.download = `image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPrompt = async () => {
    if (!result.prompt) return;

    try {
      await navigator.clipboard.writeText(result.prompt);
      toast.success("Invite copiée dans le presse-papiers");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de copier l'invite");
    }
  };

  const images = result.previews?.length
    ? result.previews
    : result.preview
    ? [result.preview]
    : [];

  const formattedDate = result.createdAt
    ? new Date(result.createdAt).toLocaleString()
    : "";

  return (
    <Card className="w-full bg-gradient-to-b from-background/60 via-background/40 to-background/80 border-border/40 backdrop-blur-xl">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Résultat généré</span>
            </div>
            <h3 className="text-2xl font-semibold">{result.category === "image" ? "Galerie" : "Sortie"}</h3>
            {formattedDate && (
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {result.type === "image" && (
              <Button
                variant="secondary"
                size="sm"
                className="border border-border/40 bg-background/60 hover:bg-background"
                onClick={handleDownloadImage}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            )}
            {result.prompt && (
              <Button
                variant="outline"
                size="sm"
                className="border-border/40 hover:border-primary/50"
                onClick={handleCopyPrompt}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copier l'invite
              </Button>
            )}
          </div>
        </div>

        {(result.prompt || result.negativePrompt || result.settings) && (
          <div className="space-y-4 rounded-lg border border-border/40 bg-background/40 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {result.prompt && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Invite principale</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {result.prompt}
                  </p>
                </div>
              )}
              {result.negativePrompt && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Invite négative</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {result.negativePrompt}
                  </p>
                </div>
              )}
            </div>

            {result.settings && Object.keys(result.settings).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(result.settings).map(([key, value]) => (
                  value !== undefined && value !== "" ? (
                    <Badge key={key} variant="secondary" className="bg-background/80 text-xs font-normal">
                      <span className="uppercase text-muted-foreground">{key}</span>
                      <Separator orientation="vertical" className="mx-2 h-4 bg-border/60" />
                      <span className="text-foreground">{String(value)}</span>
                    </Badge>
                  ) : null
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border/40 bg-background/30 p-4">
          {result.type === "image" && images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-border/40 bg-black/40"
                >
                  <img
                    src={image}
                    alt={`Résultat ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs text-white/80">Variante {index + 1}</span>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 border border-white/20 bg-white/10 text-white"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = image;
                        a.download = `image-${index + 1}-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : result.type === "code" && result.code ? (
            <CodeViewer code={result.code} category={result.category} />
          ) : result.type === "description" ? (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {result.content}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-block rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                {result.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResultDisplay;
