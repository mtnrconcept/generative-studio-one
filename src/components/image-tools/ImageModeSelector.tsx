import { useMemo } from "react";
import ImageModeCard from "./ImageModeCard";
import { ImageModeId, ModeState } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { imageModes, getModeDefinition } from "./modes";

interface ImageModeSelectorProps {
  selectedMode: ImageModeId;
  confirmedMode: ImageModeId | null;
  onModeSelect: (mode: ImageModeId) => void;
  onConfirm: () => void;
  onUpload: (mode: ImageModeId, files: FileList | null) => void;
  onRemoveImage: (mode: ImageModeId, imageId: string) => void;
  states: Record<ImageModeId, ModeState>;
  processingModes: Partial<Record<ImageModeId, boolean>>;
}

const ImageModeSelector = ({
  selectedMode,
  confirmedMode,
  onModeSelect,
  onConfirm,
  onUpload,
  onRemoveImage,
  states,
  processingModes,
}: ImageModeSelectorProps) => {
  const confirmationLabel = useMemo(() => {
    if (!confirmedMode) {
      return "Confirmer le mode";
    }
    const active = confirmedMode ? getModeDefinition(confirmedMode) : null;
    return active ? `Mode sélectionné : ${active.title}` : "Mode confirmé";
  }, [confirmedMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Comment utiliser votre image ?</h2>
          <p className="text-sm text-muted-foreground">
            Choisissez un module pour piloter la génération : chaque mode exploite vos visuels différemment.
          </p>
        </div>
        {confirmedMode && (
          <Badge className="bg-primary/10 text-primary">{confirmationLabel}</Badge>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {imageModes.map((mode) => (
          <ImageModeCard
            key={mode.id}
            mode={mode}
            isSelected={selectedMode === mode.id}
            onSelect={() => onModeSelect(mode.id)}
            onUpload={(files) => onUpload(mode.id, files)}
            onRemoveImage={(imageId) => onRemoveImage(mode.id, imageId)}
            state={states[mode.id] ?? { sources: [], analysis: null }}
            isProcessing={processingModes[mode.id]}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/80 bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Après confirmation, le mode choisi sera utilisé pour vos prochaines générations d'images.
          </p>
          <Button type="button" onClick={onConfirm} className="min-w-[180px]">
            Confirmer
          </Button>
        </div>
        {confirmedMode !== selectedMode && confirmedMode && (
          <p className="text-xs text-muted-foreground">
            Vous avez confirmé <span className="font-semibold">{confirmationLabel}</span>. Sélectionnez un autre module puis confirmez
 pour le changer.
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageModeSelector;
