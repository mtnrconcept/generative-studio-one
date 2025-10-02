import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Download,
  History,
  ImageIcon,
  Sparkles,
  Wand2,
} from "lucide-react";

interface ImageGeneratorProps {
  onBack: () => void;
}

interface GeneratedImage {
  id: string;
  url: string;
}

interface ImageGenerationSession {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  modelLabel: string;
  aspectRatio: string;
  style: string;
  styleLabel: string;
  guidance: number;
  promptMagic: boolean;
  imageCount: number;
  createdAt: string;
  images: GeneratedImage[];
}

const models = [
  {
    value: "leonardo-diffusion-xl",
    label: "Leonardo Diffusion XL",
    description: "Rendu polyvalent et détaillé",
  },
  {
    value: "photoreal-v4",
    label: "Photoreal v4",
    description: "Idéal pour les visuels réalistes",
  },
  {
    value: "cinematic-v6",
    label: "Cinematic v6",
    description: "Éclairage dramatique et ambiance film",
  },
];

const aspectRatios = [
  { value: "1:1", label: "1:1 Carré" },
  { value: "3:4", label: "3:4 Portrait" },
  { value: "4:3", label: "4:3 Classique" },
  { value: "16:9", label: "16:9 Paysage" },
  { value: "9:16", label: "9:16 Vertical" },
];

const styleOptions = [
  { value: "standard", label: "Standard" },
  { value: "cinematic", label: "Cinématique" },
  { value: "illustration", label: "Illustration" },
  { value: "fantasy", label: "Fantaisie" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "anime", label: "Anime" },
];

const imageCountOptions = [1, 2, 4];

const createSessionId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

const ImageGenerator = ({ onBack }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState(models[0]?.value ?? "");
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]?.value ?? "1:1");
  const [style, setStyle] = useState(styleOptions[0]?.value ?? "standard");
  const [promptMagic, setPromptMagic] = useState(true);
  const [guidance, setGuidance] = useState(8);
  const [imageCount, setImageCount] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ImageGenerationSession | null>(null);
  const [history, setHistory] = useState<ImageGenerationSession[]>([]);

  const selectedModel = useMemo(
    () => models.find((item) => item.value === model) ?? models[0],
    [model],
  );

  const selectedStyle = useMemo(
    () => styleOptions.find((item) => item.value === style) ?? styleOptions[0],
    [style],
  );

  const buildPrompt = () => {
    const basePrompt = prompt.trim();

    const instructions = [
      `Modèle: ${selectedModel?.label ?? model}`,
      `Style visuel: ${selectedStyle?.label ?? style}`,
      `Ratio: ${aspectRatio}`,
      `Guidance créative: ${guidance}`,
    ];

    if (promptMagic) {
      instructions.push(
        "Utilise un style photographique détaillé, une lumière cinématique et des textures réalistes pour un rendu haut de gamme.",
      );
    }

    if (negativePrompt.trim()) {
      instructions.push(`Éviter absolument: ${negativePrompt.trim()}`);
    }

    return `${basePrompt}\n\n${instructions.join("\n")}`;
  };

  const handleImageCountChange = (value: string) => {
    if (!value) return;
    setImageCount(Number(value));
  };

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `gs-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Décrivez votre visuel pour commencer");
      return;
    }

    setIsLoading(true);

    try {
      const finalPrompt = buildPrompt();
      const sessionId = createSessionId();
      const generatedImages: GeneratedImage[] = [];

      for (let i = 0; i < imageCount; i++) {
        const { data, error } = await supabase.functions.invoke("generate-content", {
          body: {
            prompt: finalPrompt,
            category: "image",
          },
        });

        if (error) {
          throw error;
        }

        const imageUrl = data?.preview as string | undefined;
        if (imageUrl) {
          generatedImages.push({
            id: `${sessionId}-${i}`,
            url: imageUrl,
          });
        }
      }

      if (!generatedImages.length) {
        throw new Error("Aucune image générée");
      }

      const newSession: ImageGenerationSession = {
        id: sessionId,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        model,
        modelLabel: selectedModel?.label ?? model,
        aspectRatio,
        style,
        styleLabel: selectedStyle?.label ?? style,
        guidance,
        promptMagic,
        imageCount,
        createdAt: new Date().toISOString(),
        images: generatedImages,
      };

      setCurrentSession(newSession);
      setHistory((prev) => [newSession, ...prev].slice(0, 10));
      toast.success("Images générées avec succès ✨");
    } catch (error) {
      console.error("Image generation error", error);
      toast.error("Impossible de générer les images pour le moment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = (session: ImageGenerationSession) => {
    setCurrentSession(session);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Retour aux catégories
      </button>

      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
              Générateur d'images IA
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold md:text-4xl">Créez des visuels époustouflants</h1>
              <p className="max-w-2xl text-muted-foreground">
                Composez des images professionnelles avec un contrôle fin sur le style, le cadrage et les détails. Ajustez les
                paramètres pour obtenir exactement le rendu souhaité.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Modèle actif</p>
              <p className="font-medium text-foreground">{selectedModel?.label}</p>
            </div>
            <div className="h-10 w-px bg-border/70" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Ratio</p>
              <p className="font-medium text-foreground">{aspectRatios.find((item) => item.value === aspectRatio)?.label}</p>
            </div>
            <div className="h-10 w-px bg-border/70" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Guidance</p>
              <p className="font-medium text-foreground">{guidance}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Contrôles créatifs</CardTitle>
                <CardDescription>
                  Ajustez le modèle, les styles et l'assistance créative pour affiner vos rendus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="bg-background/80">
                      <SelectValue placeholder="Choisissez un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-4 py-3">
                  <div>
                    <p className="font-medium">Prompt Magic</p>
                    <p className="text-xs text-muted-foreground">Améliore automatiquement votre prompt pour plus de détails.</p>
                  </div>
                  <Switch checked={promptMagic} onCheckedChange={setPromptMagic} />
                </div>

                <div className="space-y-2">
                  <Label>Nombre d'images</Label>
                  <ToggleGroup
                    type="single"
                    value={String(imageCount)}
                    onValueChange={handleImageCountChange}
                    className="flex flex-wrap justify-start gap-2"
                  >
                    {imageCountOptions.map((count) => (
                      <ToggleGroupItem
                        key={count}
                        value={String(count)}
                        variant="outline"
                        className="flex-1 min-w-[88px] border-border/60 bg-background/80"
                      >
                        {count}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Guidance</Label>
                    <span className="text-xs text-muted-foreground">{guidance}</span>
                  </div>
                  <Slider
                    value={[guidance]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(value) => setGuidance(value[0] ?? 8)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Créatif</span>
                    <span>Précis</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="bg-background/80">
                      <SelectValue placeholder="Choisissez un ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Style et ambiance</CardTitle>
                <CardDescription>Affinez l'esthétique globale de votre visuel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Style visuel</Label>
                  <ToggleGroup
                    type="single"
                    value={style}
                    onValueChange={(value) => value && setStyle(value)}
                    className="flex flex-wrap justify-start gap-2"
                  >
                    {styleOptions.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        variant="outline"
                        className="min-w-[120px] flex-1 border-border/60 bg-background/80"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/60 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Wand2 className="h-4 w-4 text-primary" />
                    Astuce créative
                  </div>
                  <p className="mt-2 leading-relaxed">
                    Combinez un prompt descriptif avec une ambiance précise (éclairage, objectif photo, décor) pour obtenir des
                    résultats cohérents et cinématiques.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl">Description de votre visuel</CardTitle>
                  <CardDescription>
                    Décrivez précisément ce que vous souhaitez voir apparaître sur l'image générée.
                  </CardDescription>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_30px_rgba(147,112,255,0.35)]"
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {isLoading ? "Génération en cours..." : `Générer ${imageCount} image${imageCount > 1 ? "s" : ""}`}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Prompt principal</Label>
                  <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Un métavers cyberpunk vibrant, éclairage néon, bâtiments futuristes, roses et bleus, avec une cinématographie épique"
                    className="min-h-[160px] resize-none bg-background/80"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Invite négative</Label>
                    <span className="text-xs text-muted-foreground">Ce que vous ne voulez pas voir apparaître</span>
                  </div>
                  <Textarea
                    value={negativePrompt}
                    onChange={(event) => setNegativePrompt(event.target.value)}
                    placeholder="Flou, visages déformés, texte illisible, logos"
                    className="min-h-[100px] resize-none bg-background/80"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Résultats</CardTitle>
                    <CardDescription>
                      Prévisualisez vos créations et téléchargez vos images favorites.
                    </CardDescription>
                  </div>
                  {currentSession && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {currentSession.modelLabel}
                      </Badge>
                      <Badge variant="outline">{currentSession.styleLabel}</Badge>
                      <Badge variant="outline">Ratio {currentSession.aspectRatio}</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: imageCount }).map((_, index) => (
                      <Skeleton key={index} className="aspect-[3/4] w-full rounded-xl bg-muted/60" />
                    ))}
                  </div>
                ) : currentSession ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {currentSession.images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/80"
                      >
                        <img
                          src={image.url}
                          alt="Image générée par IA"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="pointer-events-auto bg-background/80 text-foreground"
                            onClick={() => handleDownload(image.url)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center text-muted-foreground">
                    <div className="rounded-full bg-primary/10 p-4">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-foreground">Prêt à créer votre premier visuel ?</p>
                      <p className="text-sm text-muted-foreground">
                        Décrivez votre idée puis cliquez sur « Générer » pour transformer votre imagination en image.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Sessions récentes</CardTitle>
                  <CardDescription>Retrouvez vos dernières générations et réutilisez leurs paramètres.</CardDescription>
                </div>
                <History className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                {history.length ? (
                  <ScrollArea className="h-[520px] pr-4">
                    <div className="space-y-3">
                      {history.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => handleSelectSession(session)}
                          className={cn(
                            "w-full rounded-xl border border-transparent bg-background/40 p-4 text-left transition-colors hover:border-border/70",
                            currentSession?.id === session.id && "border-primary/60 bg-primary/5",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid w-20 grid-cols-2 gap-1">
                              {session.images.slice(0, 4).map((image) => (
                                <div key={image.id} className="overflow-hidden rounded-sm">
                                  <img
                                    src={image.url}
                                    alt="Miniature de génération"
                                    className="h-10 w-10 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="line-clamp-2 text-sm font-medium text-foreground">{session.prompt}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                <span>{formatDate(session.createdAt)}</span>
                                <span>•</span>
                                <span>{session.modelLabel}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center text-muted-foreground">
                    <History className="h-8 w-8 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Aucune génération encore</p>
                      <p className="text-xs text-muted-foreground">
                        Vos sessions apparaîtront ici pour que vous puissiez les rouvrir à tout moment.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Conseils de Leonardo</CardTitle>
                <CardDescription>Optimisez vos prompts pour des résultats professionnels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                  <p className="font-medium text-foreground">Structure idéale</p>
                  <p className="mt-1 leading-relaxed">
                    Sujet principal + ambiance + éclairage + détails + références artistiques. Plus votre description est riche, plus
                    l'IA comprend votre intention.
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                  <p className="font-medium text-foreground">Invite négative</p>
                  <p className="mt-1 leading-relaxed">
                    Listez les éléments à exclure (déformations, artefacts, textes, arrière-plans indésirables) pour un rendu propre.
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                  <p className="font-medium text-foreground">Expérimentez</p>
                  <p className="mt-1 leading-relaxed">
                    Changez de style ou de ratio pour explorer différentes compositions d'un même concept.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
