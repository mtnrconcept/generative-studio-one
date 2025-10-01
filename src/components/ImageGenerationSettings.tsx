import { useMemo, useState } from "react";
import { ChevronDown, Palette, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type {
  ImageAspectRatio,
  ImageGenerationSettings,
  ImageStylePreset,
} from "@/types/image";

interface ImageGenerationSettingsProps {
  value: ImageGenerationSettings;
  onChange: (value: ImageGenerationSettings) => void;
  onReset: () => void;
}

const MAIN_RATIOS: Array<{ value: ImageAspectRatio; label: string; description: string }> = [
  { value: "2:3", label: "Portrait", description: "Idéal pour les affiches et personnages" },
  { value: "1:1", label: "Carré", description: "Format polyvalent pour les réseaux" },
  { value: "16:9", label: "Paysage", description: "Présentation large pour scènes ciné" },
];

const EXTRA_RATIOS: Array<{ value: ImageAspectRatio; label: string; size: string }> = [
  { value: "3:2", label: "3:2", size: "Landscape photo" },
  { value: "4:5", label: "4:5", size: "Portrait social" },
  { value: "5:4", label: "5:4", size: "Poster art" },
  { value: "21:9", label: "21:9", size: "Ultra wide" },
  { value: "9:16", label: "9:16", size: "Story vertical" },
];

const STYLE_PRESETS: ImageStylePreset[] = [
  { id: "3d-render", label: "3D Render" },
  { id: "acrylic", label: "Acrylic" },
  { id: "cinematic", label: "Cinematic" },
  { id: "creative", label: "Creative" },
  { id: "dynamic", label: "Dynamic" },
  { id: "fashion", label: "Fashion" },
  { id: "game-concept", label: "Game Concept" },
  { id: "graphic-2d", label: "Graphic Design 2D" },
  { id: "graphic-3d", label: "Graphic Design 3D" },
  { id: "illustration", label: "Illustration" },
  { id: "none", label: "None" },
  { id: "portrait", label: "Portrait" },
  { id: "portrait-cinematic", label: "Portrait Cinematic" },
  { id: "portrait-fashion", label: "Portrait Fashion" },
  { id: "pro-bw", label: "Pro B&W photography" },
  { id: "pro-color", label: "Pro color photography" },
  { id: "pro-film", label: "Pro film photography" },
  { id: "ray-traced", label: "Ray Traced" },
  { id: "stock-photo", label: "Stock Photo" },
];

const getRatioLabel = (value: ImageAspectRatio) => {
  const match = [...MAIN_RATIOS, ...EXTRA_RATIOS].find((entry) => entry.value === value);
  if (match) return match.label;
  if (value === "custom") return "Personnalisé";
  return value;
};

const getDefaultDimensions = (value: ImageAspectRatio) => {
  switch (value) {
    case "2:3":
      return { width: 832, height: 1248 };
    case "1:1":
      return { width: 1024, height: 1024 };
    case "16:9":
      return { width: 1280, height: 720 };
    case "3:2":
      return { width: 1200, height: 800 };
    case "4:5":
      return { width: 1024, height: 1280 };
    case "5:4":
      return { width: 1280, height: 1024 };
    case "21:9":
      return { width: 1792, height: 768 };
    case "9:16":
      return { width: 832, height: 1472 };
    default:
      return { width: 1536, height: 1024 };
  }
};

const MIN_STEP = 20;
const MAX_STEP = 60;
const MIN_GUIDANCE = 1;
const MAX_GUIDANCE = 20;

const ImageGenerationSettings = ({ value, onChange, onReset }: ImageGenerationSettingsProps) => {
  const [isRatioPopoverOpen, setIsRatioPopoverOpen] = useState(false);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState(
    value.customDimensions?.width ?? getDefaultDimensions("2:3").width,
  );
  const [customHeight, setCustomHeight] = useState(
    value.customDimensions?.height ?? getDefaultDimensions("2:3").height,
  );

  const ratioLabel = useMemo(() => getRatioLabel(value.aspectRatio), [value.aspectRatio]);
  const selectedStyleLabel = useMemo(() => {
    if (!value.stylePreset) return "Désactivé";
    const preset = STYLE_PRESETS.find((entry) => entry.id === value.stylePreset);
    return preset?.label ?? value.stylePreset;
  }, [value.stylePreset]);

  const handleRatioChange = (ratio: ImageAspectRatio) => {
    const dimensions = ratio === "custom" ? value.customDimensions : getDefaultDimensions(ratio);
    onChange({
      ...value,
      aspectRatio: ratio,
      customDimensions: ratio === "custom" ? value.customDimensions : dimensions,
    });
    if (ratio !== "custom" && dimensions) {
      setCustomWidth(dimensions.width);
      setCustomHeight(dimensions.height);
    }
  };

  const applyCustomDimensions = () => {
    const width = Number.parseInt(String(customWidth), 10);
    const height = Number.parseInt(String(customHeight), 10);
    if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
      return;
    }
    onChange({
      ...value,
      aspectRatio: "custom",
      customDimensions: { width, height },
    });
    setIsRatioPopoverOpen(false);
  };

  const handleAdvancedChange = <Key extends keyof ImageGenerationSettings["advanced"]>(
    key: Key,
    inputValue: ImageGenerationSettings["advanced"][Key],
  ) => {
    onChange({
      ...value,
      advanced: {
        ...value.advanced,
        [key]: inputValue,
      },
    });
  };

  const handleToggle = (key: keyof ImageGenerationSettings, state: boolean) => {
    onChange({
      ...value,
      [key]: state,
    });
  };

  const handleImageCountChange = (count: string) => {
    const parsed = Number.parseInt(count, 10);
    if (!Number.isNaN(parsed)) {
      onChange({
        ...value,
        imageCount: parsed,
      });
    }
  };

  const handleSeedChange = (seed: string) => {
    handleAdvancedChange("seed", seed.replace(/[^0-9]/g, "").slice(0, 9));
  };

  const randomizeSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(6, "0");
    handleAdvancedChange("seed", randomSeed);
  };

  return (
    <Card className="bg-slate-900/70 border-white/10 shadow-lg shadow-violet-900/10">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Paramètres de génération</h4>
          <p className="text-xs text-slate-300/80">
            Ajustez les réglages pour rapprocher le rendu de Leonardo.ai.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-slate-300">
          Réinitialiser
        </Button>
      </div>

      <div className="space-y-6 px-5 py-6 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Prompt Enhance</p>
            <p className="text-xs text-slate-400">Optimise automatiquement votre description.</p>
          </div>
          <Switch
            checked={value.promptEnhance}
            onCheckedChange={(state) => handleToggle("promptEnhance", state)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Dimensions de l'image</p>
              <p className="text-xs text-slate-400">Sélectionnez un format ou définissez le vôtre.</p>
            </div>
            <Popover open={isRatioPopoverOpen} onOpenChange={setIsRatioPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Plus
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-400">Formats supplémentaires</p>
                  <div className="grid grid-cols-2 gap-2">
                    {EXTRA_RATIOS.map((ratio) => (
                      <Button
                        key={ratio.value}
                        variant={value.aspectRatio === ratio.value ? "default" : "outline"}
                        className="h-9 justify-start"
                        onClick={() => handleRatioChange(ratio.value)}
                      >
                        <span className="font-semibold">{ratio.label}</span>
                        <span className="ml-auto text-[10px] text-slate-500">{ratio.size}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-400">Dimensions perso</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={256}
                      step={16}
                      value={customWidth}
                      onChange={(event) => setCustomWidth(Number(event.target.value))}
                      className="h-9"
                      placeholder="Largeur"
                    />
                    <span className="text-xs text-slate-400">×</span>
                    <Input
                      type="number"
                      min={256}
                      step={16}
                      value={customHeight}
                      onChange={(event) => setCustomHeight(Number(event.target.value))}
                      className="h-9"
                      placeholder="Hauteur"
                    />
                  </div>
                  <Button onClick={applyCustomDimensions} className="w-full">
                    Appliquer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <ToggleGroup
            type="single"
            value={value.aspectRatio}
            onValueChange={(ratio) => ratio && handleRatioChange(ratio as ImageAspectRatio)}
            className="w-full"
          >
            {MAIN_RATIOS.map((ratio) => (
              <ToggleGroupItem
                key={ratio.value}
                value={ratio.value}
                className={cn(
                  "flex-1 flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/40 py-3 text-xs text-white transition",
                  value.aspectRatio === ratio.value && "border-violet-400/60 bg-violet-500/10 text-violet-100",
                )}
              >
                <span className="text-sm font-semibold">{ratio.label}</span>
                <span className="text-[11px] text-slate-400">{ratio.description}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-xs text-slate-400">Sélection actuelle : {ratioLabel}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Nombre d'images</p>
              <p className="text-xs text-slate-400">Créez jusqu'à quatre variantes en un clic.</p>
            </div>
          </div>
          <ToggleGroup
            type="single"
            value={String(value.imageCount)}
            onValueChange={handleImageCountChange}
            className="w-full"
          >
            {[1, 2, 3, 4].map((count) => (
              <ToggleGroupItem
                key={count}
                value={String(count)}
                className={cn(
                  "flex-1 rounded-xl border border-white/10 bg-slate-950/40 py-2 text-sm text-white",
                  value.imageCount === count && "border-violet-400/60 bg-violet-500/10 text-violet-100",
                )}
              >
                {count}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Confidentialité</p>
            <p className="text-xs text-slate-400">Gardez vos rendus privés dans la galerie.</p>
          </div>
          <Switch checked={value.isPrivate} onCheckedChange={(state) => handleToggle("isPrivate", state)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Style</p>
              <p className="text-xs text-slate-400">Choisissez une esthétique Leonardo prête à l'emploi.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsStyleDialogOpen(true)}>
              <Palette className="mr-2 h-4 w-4" />
              {selectedStyleLabel}
            </Button>
          </div>
        </div>

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Réglages avancés
              </span>
              <ChevronDown className={cn("h-4 w-4 transition", isAdvancedOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Guidance scale</Label>
                <Input
                  type="number"
                  min={MIN_GUIDANCE}
                  max={MAX_GUIDANCE}
                  step={0.5}
                  value={value.advanced.guidanceScale}
                  onChange={(event) =>
                    handleAdvancedChange("guidanceScale", Number.parseFloat(event.target.value) || MIN_GUIDANCE)
                  }
                  className="bg-slate-950/60"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Inference steps</Label>
                <Input
                  type="number"
                  min={MIN_STEP}
                  max={MAX_STEP}
                  step={1}
                  value={value.advanced.stepCount}
                  onChange={(event) =>
                    handleAdvancedChange(
                      "stepCount",
                      Math.min(Math.max(Number.parseInt(event.target.value, 10) || MIN_STEP, MIN_STEP), MAX_STEP),
                    )
                  }
                  className="bg-slate-950/60"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Seed</Label>
                <Input
                  value={value.advanced.seed}
                  onChange={(event) => handleSeedChange(event.target.value)}
                  placeholder="Aléatoire"
                  className="bg-slate-950/60"
                />
              </div>
              <Button variant="outline" onClick={randomizeSeed} className="sm:h-10">
                Générer
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Upscale</p>
                  <p className="text-xs text-slate-400">Double la résolution finale.</p>
                </div>
                <Switch
                  checked={value.advanced.upscale}
                  onCheckedChange={(state) => handleAdvancedChange("upscale", state)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Haute résolution</p>
                  <p className="text-xs text-slate-400">Active l'algorithme HD Leonardo.</p>
                </div>
                <Switch
                  checked={value.advanced.highResolution}
                  onCheckedChange={(state) => handleAdvancedChange("highResolution", state)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Prompt négatif</Label>
              <Textarea
                value={value.advanced.negativePrompt}
                onChange={(event) => handleAdvancedChange("negativePrompt", event.target.value)}
                placeholder="Ex : flou, artefacts, texte, membres supplémentaires"
                className="min-h-[90px] bg-slate-950/60"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent className="max-w-md bg-slate-950/95 border-white/10">
          <DialogHeader>
            <DialogTitle>Sélectionnez un style Leonardo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[360px] pr-2">
            <div className="space-y-2 py-2">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = value.stylePreset === preset.id || (!value.stylePreset && preset.id === "none");
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...value,
                        stylePreset: preset.id === "none" ? undefined : preset.id,
                      });
                      setIsStyleDialogOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-left text-sm transition",
                      isSelected && "border-violet-400/60 bg-violet-500/10 text-violet-50",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export const defaultImageGenerationSettings = (): ImageGenerationSettings => ({
  promptEnhance: true,
  aspectRatio: "2:3",
  customDimensions: getDefaultDimensions("2:3"),
  imageCount: 1,
  isPrivate: true,
  stylePreset: "dynamic",
  advanced: {
    guidanceScale: 9,
    stepCount: 35,
    seed: "",
    upscale: true,
    highResolution: false,
    negativePrompt: "",
  },
});

export default ImageGenerationSettings;
