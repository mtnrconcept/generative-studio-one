import { ReactNode, useId } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageModeDefinition, ModeAnalysis, UploadedImage } from "./types";
import { Loader2, Upload, X } from "lucide-react";

interface ImageModeCardProps {
  mode: ImageModeDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onUpload: (files: FileList | null) => void;
  onRemoveImage: (imageId: string) => void;
  state: { sources: UploadedImage[]; analysis?: ModeAnalysis | null };
  isProcessing?: boolean;
  extraActions?: ReactNode;
}

const placeholderGradientByMode: Record<string, string> = {
  "image-to-image": "from-slate-800 via-slate-700 to-slate-900",
  "style-reference": "from-purple-700 via-fuchsia-500 to-amber-400",
  "content-reference": "from-blue-700 via-cyan-500 to-sky-400",
  "character-reference": "from-rose-600 via-orange-500 to-yellow-400",
  "depth-to-image": "from-indigo-800 via-blue-600 to-cyan-500",
  "edge-to-image": "from-slate-900 via-gray-700 to-gray-900",
  "pose-to-image": "from-emerald-700 via-teal-500 to-sky-400",
  "text-image-input": "from-violet-700 via-purple-500 to-pink-500",
};

const formatModeLabel = (modeId: string) => modeId.replace(/-/g, " ");

const ImageModeCard = ({
  mode,
  isSelected,
  onSelect,
  onUpload,
  onRemoveImage,
  state,
  isProcessing,
  extraActions,
}: ImageModeCardProps) => {
  const inputId = useId();
  const gradient = placeholderGradientByMode[mode.id] ?? "from-slate-800 via-slate-700 to-slate-900";
  const maxImages = mode.maxImages ?? 1;
  const isMultiple = maxImages > 1;
  const primaryImage = state.sources[0];

  const handleCardClick = () => {
    onSelect();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpload(event.target.files);
    event.target.value = "";
  };

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-border/60 transition-all hover:border-primary/60 hover:shadow-lg",
        isSelected && "border-primary/80 shadow-[0_0_24px_rgba(147,112,255,0.25)]",
      )}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold capitalize">{mode.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {mode.description}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          {mode.premium && (
            <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-sm">Premium</Badge>
          )}
          {mode.badgeLabel && <Badge variant="secondary">{mode.badgeLabel}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-foreground">
              Source
            </div>
            {mode.id === "style-reference" ? (
              <div className="grid h-40 grid-cols-2 gap-2 p-3">
                {Array.from({ length: maxImages }).map((_, index) => {
                  const image = state.sources[index];
                  return image ? (
                    <div key={image.id} className="group relative overflow-hidden rounded-lg">
                      <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-opacity hover:bg-black/80"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveImage(image.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={`placeholder-${index}`}
                      className="flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/10 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      Slot {index + 1}
                    </div>
                  );
                })}
              </div>
            ) : primaryImage ? (
              <div className="h-40 w-full">
                <img src={primaryImage.url} alt={primaryImage.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-3 top-3 rounded-full bg-black/60 p-1 text-white transition-opacity hover:bg-black/80"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveImage(primaryImage.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className={cn(
                  "flex h-40 w-full items-center justify-center bg-gradient-to-br text-sm font-medium uppercase tracking-[0.3em] text-white/80",
                  `bg-gradient-to-br ${gradient}`,
                )}
              >
                {formatModeLabel(mode.id)}
              </div>
            )}
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-foreground">
              Result
            </div>
            <div className="flex h-40 flex-col items-center justify-center gap-2 p-4 text-center">
              {state.analysis ? (
                state.analysis.type === "text" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Texte analysé</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{state.analysis.text}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{state.analysis.note}</p>
                  </div>
                ) : (
                  <div className="relative h-full w-full overflow-hidden rounded-lg">
                    <img
                      src={state.analysis.url}
                      alt={`${mode.title} preview`}
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-500",
                        state.analysis.type === "edge" && "filter contrast-[1.2] grayscale",
                        state.analysis.type === "depth" && "saturate-[1.3]",
                        state.analysis.type === "pose" && "opacity-90 mix-blend-screen",
                      )}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-[10px] uppercase tracking-[0.2em] text-white/80">
                      {state.analysis.note}
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">{mode.sampleResultDescription}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Importez une image pour visualiser l'aperçu en direct.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {mode.helperText && (
            <p className="text-xs text-muted-foreground/80">{mode.helperText}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`${inputId}-${mode.id}`}
              type="file"
              accept="image/*"
              multiple={isMultiple}
              className="hidden"
              onChange={handleInputChange}
              onClick={(event) => event.stopPropagation()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                document.getElementById(`${inputId}-${mode.id}`)?.click();
              }}
              className="border-border/70"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isMultiple ? "Importer des images" : state.sources.length ? "Remplacer l'image" : "Importer une image"}
            </Button>
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Analyse en cours...
              </div>
            )}
            {extraActions}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageModeCard;
