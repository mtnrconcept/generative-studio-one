import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import ResultDisplay from "@/components/ResultDisplay";
import { supabase } from "@/integrations/supabase/client";
import type { GenerationResult, GenerationSettings } from "@/lib/types";
import {
  Bell,
  ChevronRight,
  History,
  Loader2,
  MinusCircle,
  Palette,
  Settings2,
  Sparkles,
  Square,
  Star,
  Upload,
} from "lucide-react";

const models = [
  { value: "lucid", label: "Leonardo Diffusion XL" },
  { value: "alchemy", label: "Alchemy Turbo" },
  { value: "photon", label: "Photon Vision" },
];

const stylePresets = [
  { value: "cinematic", label: "Cinematic" },
  { value: "illustration", label: "Illustration" },
  { value: "photographic", label: "Photographique" },
  { value: "anime", label: "Anime" },
  { value: "3d", label: "3D Render" },
];

const aspectRatios = [
  { value: "square", label: "1:1" },
  { value: "portrait", label: "2:3" },
  { value: "landscape", label: "16:9" },
];

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState(models[0]?.value ?? "lucid");
  const [stylePreset, setStylePreset] = useState(stylePresets[0]?.value ?? "cinematic");
  const [promptMagic, setPromptMagic] = useState(true);
  const [qualityBoost, setQualityBoost] = useState(false);
  const [guidanceScale, setGuidanceScale] = useState<number[]>([7]);
  const [imageCount, setImageCount] = useState(4);
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]?.value ?? "square");
  const [seed, setSeed] = useState("");
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [activeResult, setActiveResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const settings: GenerationSettings = useMemo(
    () => ({
      model,
      stylePreset,
      aspectRatio,
      guidanceScale: guidanceScale[0],
      imageCount,
      promptMagic,
      qualityBoost,
      seed: seed || undefined,
    }),
    [model, stylePreset, aspectRatio, guidanceScale, imageCount, promptMagic, qualityBoost, seed],
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.warning("Veuillez fournir une invite avant de générer");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt,
          negativePrompt,
          category: "image",
          settings,
        },
      });

      if (error) throw error;

      const generation: GenerationResult = {
        id: `${Date.now()}`,
        type: data?.type || "image",
        category: data?.category || "image",
        content: data?.content || "",
        preview: data?.preview,
        previews: data?.previews,
        code: data?.code,
        prompt,
        negativePrompt: negativePrompt || undefined,
        createdAt: new Date().toISOString(),
        settings,
      };

      setHistory((prev) => [generation, ...prev].slice(0, 20));
      setActiveResult(generation);
      toast.success("Images générées avec succès !");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de la génération");
    } finally {
      setIsLoading(false);
    }
  };

  const creditsUsed = useMemo(
    () => history.reduce((total, entry) => total + (entry.settings?.imageCount ?? 1), 0),
    [history],
  );

  const creditsLeft = Math.max(0, 75 - creditsUsed);

  return (
    <div className="min-h-screen bg-[#05070D] text-white">
      <header className="border-b border-white/5 bg-[#090B13]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-secondary/70 text-lg font-bold">
              GS
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-white/60">Generative Studio</p>
              <p className="text-base font-semibold">Générateur d'Images IA</p>
            </div>
            <Badge variant="secondary" className="ml-2 bg-white/10 text-xs uppercase tracking-wide text-white/80">
              Bêta
            </Badge>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-white/70">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{creditsLeft} crédits</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-white/10 bg-white/5">
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <Button className="rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-sm font-semibold">
              Passer en Pro
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 lg:grid lg:grid-cols-[280px_1fr_320px] lg:px-6">
        <aside className="hidden rounded-2xl border border-white/5 bg-white/[0.04] shadow-[0_0_35px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:flex">
          <ScrollArea className="h-full w-full">
            <div className="space-y-6 p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Paramètres du modèle</p>
                <h2 className="mt-2 text-lg font-semibold text-white">Contrôles créatifs</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Modèle</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="h-11 border-white/10 bg-white/5">
                      <SelectValue placeholder="Choisir un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Style</label>
                  <Select value={stylePreset} onValueChange={setStylePreset}>
                    <SelectTrigger className="h-11 border-white/10 bg-white/5">
                      <SelectValue placeholder="Choisir un style" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylePresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Magie de l'invite</label>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Prompt Magic</p>
                      <p className="text-xs text-white/60">Optimise automatiquement votre invite.</p>
                    </div>
                    <Switch checked={promptMagic} onCheckedChange={setPromptMagic} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Invite négative</label>
                  <Textarea
                    value={negativePrompt}
                    onChange={(event) => setNegativePrompt(event.target.value)}
                    placeholder="Ce que vous souhaitez éviter..."
                    className="min-h-[100px] resize-none border-white/10 bg-white/5 text-sm"
                  />
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <MinusCircle className="h-3.5 w-3.5" />
                    <span>Améliore le contrôle des détails indésirables.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wide text-white/60">Guidance</label>
                    <span className="text-xs text-white/60">{guidanceScale[0]}</span>
                  </div>
                  <Slider
                    value={guidanceScale}
                    onValueChange={setGuidanceScale}
                    min={1}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Nombre d'images</label>
                  <Tabs value={String(imageCount)} onValueChange={(value) => setImageCount(Number(value))}>
                    <TabsList className="grid grid-cols-2 bg-white/5">
                      {[1, 2, 4, 6].map((count) => (
                        <TabsTrigger key={count} value={String(count)}>{count}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={cn(
                          "group flex flex-col items-center gap-2 rounded-xl border p-3 text-xs transition-all",
                          aspectRatio === ratio.value
                            ? "border-primary/80 bg-primary/10"
                            : "border-white/10 bg-white/5 hover:border-primary/40",
                        )}
                        type="button"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-white/20 bg-black/30">
                          <Square className="h-4 w-4" />
                        </div>
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Graine (optionnel)</label>
                  <Input
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                    placeholder="Valeur aléatoire pour reproduire un résultat"
                    className="border-white/10 bg-white/5 text-sm"
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Star className="h-4 w-4 text-primary" />
                    Conseils de Leonardo
                  </div>
                  <ul className="space-y-2 text-xs text-white/70">
                    <li>Utilisez des adjectifs sensoriels pour enrichir votre invite.</li>
                    <li>Combinez plusieurs styles pour des rendus uniques.</li>
                    <li>Activez Prompt Magic pour améliorer la cohérence.</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        <section className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.04] p-6 shadow-[0_0_45px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">Créez des visuels époustouflants</h1>
                <p className="text-sm text-white/60">
                  Décrivez votre vision. Ajustez les paramètres. Générer jusqu'à {imageCount} images en un clic.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Palette className="h-4 w-4 text-secondary" />
                  Style {stylePresets.find((style) => style.value === stylePreset)?.label}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Settings2 className="h-4 w-4 text-secondary" />
                  {model}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Une métropole cyberpunk vibrante, éclairée par des néons roses et bleus, vue cinématographique..."
                className="min-h-[140px] resize-none border-white/10 bg-black/40 text-base text-white"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <Upload className="h-4 w-4" />
                  Glissez des images de référence pour améliorer le rendu (bientôt disponible)
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>Qualité boost</span>
                  <Switch checked={qualityBoost} onCheckedChange={setQualityBoost} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <History className="h-4 w-4" />
                {history.length} générations sauvegardées
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="group flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-base font-semibold text-white shadow-[0_10px_35px_rgba(76,29,149,0.35)] transition-all hover:translate-y-[-1px] hover:shadow-[0_20px_45px_rgba(76,29,149,0.45)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Générer {imageCount} images
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <ResultDisplay result={activeResult} />
        </section>

        <aside className="hidden rounded-2xl border border-white/5 bg-white/[0.04] shadow-[0_0_35px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:flex">
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40">Historique</p>
                  <h2 className="text-lg font-semibold text-white">Sessions récentes</h2>
                </div>
                <Badge variant="outline" className="border-white/10 text-xs text-white/70">
                  {history.length}
                </Badge>
              </div>

              <Separator className="bg-white/10" />

              {history.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center text-white/50">
                  <Sparkles className="h-8 w-8" />
                  <p className="text-sm">Vos générations apparaîtront ici.</p>
                </div>
              ) : (
                history.map((entry) => {
                  const thumbnail = entry.previews?.[0] || entry.preview;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setActiveResult(entry)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/10",
                        activeResult?.id === entry.id && "border-primary/60 bg-primary/15",
                      )}
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/50">
                        {thumbnail ? (
                          <img src={thumbnail} alt="Prévisualisation" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/40">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="line-clamp-2 text-sm font-medium text-white/90">{entry.prompt}</p>
                        <p className="text-xs text-white/50">
                          {new Date(entry.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>
      </main>
    </div>
  );
};

export default Index;
