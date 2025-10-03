import { useMemo, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  Boxes,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CodeViewer from "./CodeViewer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  generateGameBlueprint,
  type GameBrief,
  type GameSummary,
  type GeneratedAsset,
} from "@/lib/gameGenerator";
import { AssetManager } from "./AssetManager";
import { type KenneyAssetPack, getRecommendedPacks } from "@/lib/kenneyAssetCatalog";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type GameAsset = GeneratedAsset & {
  gradient: string;
};

type GameBuilderProps = {
  onBack: () => void;
};

const gradientPalette = [
  "from-amber-400 to-orange-600",
  "from-rose-400 to-purple-500",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-fuchsia-400 to-indigo-500",
  "from-lime-400 to-green-500",
];

const initialSummary: GameSummary = {
  title: "Prototype d'exploration IA",
  theme: "Univers génératif à configurer",
  elevatorPitch:
    "Définissez un brief détaillé et l'IA construira un prototype jouable directement dans le previewer.",
  objectives: [
    "Boucle principale : Formuler précisément votre vision de jeu",
    "Progression : Générer une scène interactive à partir du brief",
    "Ambiance : Ajuster le rendu en dialoguant avec l'assistant IA",
  ],
  environment: "Scène démo stylisée combinant terrains procéduraux et effets atmosphériques dynamiques",
};

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "Bienvenue dans le studio. Décris ton concept : univers, mécaniques, ennemis, ambiance... Je générerai un jeu jouable conforme à ton brief.",
  },
  {
    id: "assistant-2",
    role: "assistant",
    content:
      "Ajoute autant de détails que nécessaire : objectifs, style visuel, types d'adversaires ou d'alliés. Le moteur IA réinterprétera tout en temps réel.",
  },
];

const initialUpdates = [
  "Système de prototype prêt à recevoir un brief détaillé",
  "Pipeline IA calibré pour interpréter vos directives",
];

const initialAssets: GameAsset[] = [
  {
    id: "asset-brief",
    name: "Brief Narratif",
    category: "Design",
    description: "Structure le contexte et la fantasy du jeu à générer",
    gradient: gradientPalette[0],
  },
  {
    id: "asset-engine",
    name: "Moteur Prototype",
    category: "Gameplay",
    description: "Assemble les mécaniques interactives à partir du prompt",
    gradient: gradientPalette[2],
  },
  {
    id: "asset-visual",
    name: "Palette Atmosphérique",
    category: "Direction Artistique",
    description: "Configure éclairages, effets et ambiance générale",
    gradient: gradientPalette[4],
  },
];

const enrichAssetsWithGradients = (assets: GeneratedAsset[]): GameAsset[] =>
  assets.map((asset, index) => ({
    ...asset,
    gradient: gradientPalette[index % gradientPalette.length],
  }));

const mergeUpdates = (instruction: string | null, blueprintUpdates: string[], previous: string[]): string[] => {
  const combined = [
    ...(instruction ? [`Instruction joueur : ${instruction}`] : []),
    ...blueprintUpdates,
    ...previous,
  ];

  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const entry of combined) {
    if (!seen.has(entry)) {
      seen.add(entry);
      deduped.push(entry);
    }
    if (deduped.length >= 10) break;
  }

  return deduped;
};

const buildFallbackAssistantReply = (message: string) =>
  `Compris ! J'ai noté ta demande : « ${message} ». Génère ou régénère le prototype pour voir la mise à jour.`;

const GameBuilder = ({ onBack }: GameBuilderProps) => {
  const [summary, setSummary] = useState<GameSummary>(initialSummary);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [assets, setAssets] = useState<GameAsset[]>(initialAssets);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(
    () => new Set(initialAssets.slice(0, 2).map((asset) => asset.id))
  );
  const [assetPrompt, setAssetPrompt] = useState("");
  const [updates, setUpdates] = useState<string[]>(initialUpdates);
  const [hasGeneratedPrototype, setHasGeneratedPrototype] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptTheme, setPromptTheme] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [gameCode, setGameCode] = useState("");
  const [gamePreviewKey, setGamePreviewKey] = useState(0);
  const [currentBrief, setCurrentBrief] = useState<GameBrief | null>(null);
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [isProcessingInstruction, setIsProcessingInstruction] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [assetManagerOpen, setAssetManagerOpen] = useState(false);
  const [selectedKenneyPacks, setSelectedKenneyPacks] = useState<KenneyAssetPack[]>([]);

  const selectedAssetDetails = useMemo(
    () => assets.filter((asset) => selectedAssets.has(asset.id)),
    [assets, selectedAssets]
  );

  const applyBlueprint = (
    brief: GameBrief,
    options?: { userInstruction?: string; codeOverride?: string }
  ) => {
    const { userInstruction, codeOverride } = options ?? {};
    const blueprint = generateGameBlueprint(brief, { userInstruction });
    const generatedAssets = enrichAssetsWithGradients(blueprint.assets);

    setSummary(blueprint.summary);
    setAssets(generatedAssets);
    setSelectedAssets(new Set(blueprint.selectedAssetIds));
    setGameCode(codeOverride ?? blueprint.code);
    setGamePreviewKey((prev) => prev + 1);
    setCurrentBrief(brief);

    return blueprint;
  };

  const buildGamePrompt = (brief: GameBrief, extraInstruction?: string) => {
    const sections: string[] = [];

    if (brief.title) sections.push(`Titre du jeu : ${brief.title}`);
    if (brief.theme) sections.push(`Thématique : ${brief.theme}`);
    if (brief.description) sections.push(`Description détaillée : ${brief.description}`);
    if (brief.references.length > 0) {
      sections.push(`Références visuelles : ${brief.references.join(", ")}`);
    }
    if (extraInstruction) {
      sections.push(`Instruction supplémentaire : ${extraInstruction}`);
    }

    sections.push(
      "Livrable attendu : Fournis un fichier HTML complet contenant tout le CSS et JavaScript nécessaire pour un jeu jouable directement dans un navigateur." +
        " Tu peux inclure des bibliothèques externes via des CDN publics si nécessaire, mais intègre toute la logique dans ce fichier afin qu'il soit exécutable tel quel."
    );
    sections.push(
      "Contraintes mobiles : Le prototype doit être responsive et parfaitement jouable sur smartphone." +
        " Ajoute une interface tactile (joystick ou zones directionnelles + boutons d'action) en overlay qui fonctionne par événements pointer/touch." +
        " Conserve la compatibilité clavier (ZQSD / flèches) en plus des contrôles tactiles." +
        " Assure-toi que la zone de jeu utilise toute la largeur disponible et que les boutons sont suffisamment espacés pour les doigts."
    );
    sections.push(
      "Optimisation mobile : limite les assets lourds, évite les dépendances inutiles et active requestAnimationFrame pour les boucles de jeu." +
        " Empêche le défilement de la page lors des interactions tactiles avec le canvas ou la scène du jeu."
    );

    return sections.join("\n\n");
  };

  const requestAIGameCode = async (brief: GameBrief, extraInstruction?: string) => {
    const prompt = buildGamePrompt(brief, extraInstruction);

    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: {
        prompt,
        category: "game",
        kenneyPacks: selectedKenneyPacks.length > 0 ? selectedKenneyPacks : undefined,
      },
    });

    if (error) {
      throw error;
    }

    const aiCode = typeof data?.code === "string" ? data.code : data?.content;

    if (!aiCode || typeof aiCode !== "string") {
      throw new Error("Aucun code généré par le modèle IA");
    }

    return aiCode;
  };

  const handleToggleAsset = (assetId: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const handleGenerateAsset = () => {
    if (!assetPrompt.trim()) return;
    const gradient = gradientPalette[assets.length % gradientPalette.length];
    const newAsset: GameAsset = {
      id: `generated-${Date.now()}`,
      name: assetPrompt.trim(),
      category: "Généré IA",
      description: "Asset généré à partir de votre prompt",
      gradient,
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssets((prev) => new Set(prev).add(newAsset.id));
    setAssetPrompt("");
    setUpdates((prev) => mergeUpdates(null, [`Nouvel asset généré : ${newAsset.name}`], prev));
  };

  const handleAddReferenceImage = () => {
    if (!referenceInput.trim()) return;
    setReferenceImages((prev) => [referenceInput.trim(), ...prev]);
    setReferenceInput("");
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePromptGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isGeneratingGame) return;

    const brief: GameBrief = {
      title: promptTitle.trim(),
      theme: promptTheme.trim(),
      description: promptDescription.trim(),
      references: referenceImages,
    };

    // Suggérer automatiquement des packs pertinents si aucun n'est sélectionné
    if (selectedKenneyPacks.length === 0 && promptDescription.trim()) {
      const recommended = getRecommendedPacks(promptDescription);
      if (recommended.length > 0) {
        setSelectedKenneyPacks(recommended.slice(0, 3)); // Limiter à 3 packs recommandés
        toast.info(`${recommended.slice(0, 3).length} asset pack(s) recommandé(s) pour votre jeu`);
      }
    }

    setIsGeneratingGame(true);

    try {
      const aiCode = await requestAIGameCode(brief);
      const blueprint = applyBlueprint(brief, { codeOverride: aiCode });
      const timestamp = Date.now();

      setMessages([
        {
          id: `assistant-${timestamp}`,
          role: "assistant",
          content: blueprint.assistantMessage,
        },
        {
          id: `assistant-${timestamp + 1}`,
          role: "assistant",
          content: "N'hésite pas à me donner d'autres instructions, je régénérerai instantanément la scène jouable.",
        },
      ]);
      setUpdates(blueprint.updates);
      setHasGeneratedPrototype(true);
      toast.success("Prototype généré avec succès par l'IA ✨");
    } catch (error) {
      console.error("Erreur de génération de jeu", error);
      toast.error("Impossible de générer le jeu pour le moment");
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageInput.trim() || isProcessingInstruction) return;

    const trimmedMessage = messageInput.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessageInput("");

    if (!currentBrief) {
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Commence par générer un prototype en remplissant le brief principal.",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      return;
    }

    setIsProcessingInstruction(true);

    try {
      const updatedBrief: GameBrief = {
        ...currentBrief,
        title: summary.title,
        theme: summary.theme,
        description: `${currentBrief.description}\n${trimmedMessage}`.trim(),
        references: currentBrief.references,
      };

      const aiCode = await requestAIGameCode(updatedBrief, trimmedMessage);
      const blueprint = applyBlueprint(updatedBrief, {
        userInstruction: trimmedMessage,
        codeOverride: aiCode,
      });

      setUpdates((prev) => mergeUpdates(trimmedMessage, blueprint.updates, prev));

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: blueprint.assistantMessage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      toast.success("Prototype mis à jour avec l'IA");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prototype", error);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: buildFallbackAssistantReply(trimmedMessage),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      toast.error("Impossible d'appliquer cette instruction");
    } finally {
      setIsProcessingInstruction(false);
    }
  };

  const handleResetPrompt = () => {
    setHasGeneratedPrototype(false);
    setSummary(initialSummary);
    setMessages(initialMessages);
    setUpdates(initialUpdates);
    setAssets(initialAssets);
    setSelectedAssets(new Set(initialAssets.slice(0, 2).map((asset) => asset.id)));
    setMessageInput("");
    setPromptTitle("");
    setPromptTheme("");
    setPromptDescription("");
    setReferenceImages([]);
    setReferenceInput("");
    setAssetPrompt("");
    setGameCode("");
    setGamePreviewKey((prev) => prev + 1);
    setCurrentBrief(null);
  };

  const handleQuickRegenerate = async () => {
    if (!currentBrief || isRegenerating) return;

    setIsRegenerating(true);

    try {
      const aiCode = await requestAIGameCode(currentBrief);
      const blueprint = applyBlueprint(currentBrief, { codeOverride: aiCode });
      setUpdates((prev) => mergeUpdates(null, blueprint.updates, prev));
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Prototype régénéré selon le brief actuel. Continue à m'indiquer les ajustements souhaités.",
        },
      ]);
      toast.success("Prototype régénéré avec le modèle IA");
    } catch (error) {
      console.error("Erreur lors de la régénération du prototype", error);
      toast.error("Impossible de régénérer le prototype maintenant");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="ghost" className="px-2" onClick={onBack}>
          ← Retour
        </Button>
        <span>/</span>
        <span>Studio Jeux Vidéo</span>
      </div>

      {!hasGeneratedPrototype ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="border-border/50 bg-card/70 backdrop-blur">
            <form onSubmit={handlePromptGenerate} className="space-y-6 p-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Définis ton brief de jeu</h2>
                <p className="text-sm text-muted-foreground">
                  Décris l'expérience, les mécaniques et l'ambiance souhaitée. L'IA construira un prototype jouable fidèle à ton prompt.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="game-title">
                    Titre du jeu
                  </label>
                  <Input
                    id="game-title"
                    placeholder="Ex: Echoes of Aurora"
                    value={promptTitle}
                    onChange={(event) => setPromptTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="game-theme">
                    Genre / ambiance
                  </label>
                  <Input
                    id="game-theme"
                    placeholder="Ex: Aventure narrative futuriste"
                    value={promptTheme}
                    onChange={(event) => setPromptTheme(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="game-description">
                  Description détaillée
                </label>
                <Textarea
                  id="game-description"
                  value={promptDescription}
                  onChange={(event) => setPromptDescription(event.target.value)}
                  placeholder="Décris le gameplay, l'histoire, les ennemis, les alliés, la DA et les objectifs. Chaque détail sera intégré."
                  className="min-h-[180px]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Références visuelles</label>
                  <span className="text-xs text-muted-foreground">Ajoute des URLs d'images (JPEG/PNG/GIF)</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="https://..."
                    value={referenceInput}
                    onChange={(event) => setReferenceInput(event.target.value)}
                  />
                  <Button type="button" onClick={handleAddReferenceImage} className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                {referenceImages.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {referenceImages.map((reference, index) => (
                      <div
                        key={reference + index}
                        className="group relative overflow-hidden rounded-xl border border-border/60"
                      >
                        <img
                          src={reference}
                          alt={`Référence ${index + 1}`}
                          className="h-36 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveReferenceImage(index)}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Supprimer la référence"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune image ajoutée pour l'instant. Colle des liens d'artworks, captures ou moodboards pour guider la génération.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Asset Packs Kenney</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAssetManagerOpen(true)}
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Parcourir les assets
                  </Button>
                </div>
                {selectedKenneyPacks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedKenneyPacks.map((pack) => (
                      <Badge key={pack.slug} variant="secondary" className="gap-1">
                        {pack.name}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKenneyPacks(prev => prev.filter(p => p.slug !== pack.slug));
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun asset pack sélectionné. Les assets locaux seront utilisés par défaut.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Conseil : détaille les boucles de gameplay principales, les ennemis, les alliés et les sensations recherchées pour un résultat précis.
                </div>
                <Button type="submit" className="gap-2" disabled={isGeneratingGame}>
                  <Sparkles className="h-4 w-4" />
                  Générer le prototype
                </Button>
              </div>
            </form>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur">
            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Brief efficace</h3>
                <p className="text-sm text-muted-foreground">
                  Un bon prompt décrit le contexte narratif, les mécaniques clés, l'identité visuelle et les inspirations. Inspire-toi de l'exemple ci-dessous.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-5 space-y-3 text-sm text-foreground/90">
                <p className="font-medium">Exemple :</p>
                <p>
                  « Jeu d'exploration coopératif dans des ruines sous-marines bioluminescentes. Les joueurs contrôlent des plongeurs augmentés qui réparent des artefacts anciens tout en échappant à une créature abyssale. Style visuel : low-poly lumineux, couleurs turquoise et corail. »
                </p>
                <p className="text-muted-foreground">
                  Références : concept art de villes sous-marines, interface holographique minimaliste, créatures abyssales translucides.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Card className="overflow-hidden border-border/50 bg-card/70 backdrop-blur">
              <div className="relative h-40 w-full bg-gradient-to-br from-orange-400/70 via-amber-500/70 to-slate-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80')] opacity-40 bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                <div className="absolute bottom-4 left-4 space-y-1">
                  <Badge className="bg-white/15 text-white backdrop-blur">Prototype</Badge>
                  <h2 className="text-2xl font-semibold text-white drop-shadow-md">{summary.title}</h2>
                  <p className="text-sm text-white/80 max-w-xs">{summary.theme}</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Pitch
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {summary.elevatorPitch}
                  </p>
                </div>
                <Separator className="bg-border/40" />
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Objectifs clés
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                    {summary.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-primary" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="bg-border/40" />
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Environnement
                  </h3>
                  <p className="text-sm text-foreground/90">{summary.environment}</p>
                </div>
              </div>
            </Card>

            <Card className="border-border/50 bg-card/70 backdrop-blur">
              <div className="p-5 pb-3 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Assistant de conception</p>
                  <p className="text-xs text-muted-foreground">
                    Discute avec l'IA pour ajuster ton prototype
                  </p>
                </div>
              </div>
              <Separator className="bg-border/40" />
              <ScrollArea className="h-[320px] px-5 py-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                        message.role === "assistant"
                          ? "bg-primary/10 border-primary/20"
                          : "bg-background/80 border-border/60"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                        {message.role === "assistant" ? (
                          <>
                            <Bot className="h-3.5 w-3.5" />
                            <span>Assistant</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Toi</span>
                          </>
                        )}
                      </div>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator className="bg-border/40" />
              <form onSubmit={handleSendMessage} className="p-4 space-y-3">
                <Input
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Décris une modification ou une nouvelle idée"
                />
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isProcessingInstruction || !messageInput.trim()}
                >
                  <Send className="h-4 w-4" />
                  Envoyer et mettre à jour
                </Button>
              </form>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/70 backdrop-blur">
            <Tabs defaultValue="preview" className="w-full">
              <div className="border-b border-border/50 px-6 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Espace de production</h2>
                    <p className="text-sm text-muted-foreground">
                      Prévisualise, ajoute des assets et consulte le code complet
                    </p>
                  </div>
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="preview" className="p-6 pt-4">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    {gameCode ? (
                      <iframe
                        key={gamePreviewKey}
                        srcDoc={gameCode}
                        className="h-[360px] w-full border-0 sm:h-[440px] lg:h-[520px]"
                        title="Prototype jouable généré"
                        sandbox="allow-scripts allow-pointer-lock"
                        allow="fullscreen"
                      />
                    ) : (
                      <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground sm:h-[440px] lg:h-[520px]">
                        En attente d'un prototype généré.
                      </div>
                    )}
                    <div className="pointer-events-none absolute left-6 right-6 top-6 space-y-3 text-white drop-shadow-lg">
                      <Badge className="bg-primary/20 text-white border border-white/40">Prototype jouable</Badge>
                      <div>
                        <h3 className="text-2xl font-semibold">{summary.title}</h3>
                        <p className="mt-2 text-sm text-white/85 max-w-xl">
                          {summary.elevatorPitch}
                        </p>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute bottom-6 left-6 rounded-xl bg-black/60 px-4 py-3 text-xs uppercase tracking-wide text-white/80">
                      ZQSD / Flèches ou joystick tactile • Touchez pour interagir
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-border/40 bg-background/80">
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Résumé du build
                        </h4>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          Expérience calibrée sur <span className="font-medium">{summary.theme.toLowerCase()}</span>. Environnement actuel : {summary.environment}. Les objectifs structurent la boucle de jeu suivante : {summary.objectives.map((objective) => objective.replace(/^[^:]+:\s*/, "")).join(" / ")}. Utilise la palette dynamique mise en avant dans le previewer interactif.
                        </p>
                      </div>
                    </Card>
                    {referenceImages.length > 0 && (
                      <Card className="border-border/40 bg-background/80">
                        <div className="p-4 space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Références importées
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {referenceImages.map((reference, index) => (
                              <div
                                key={reference + index}
                                className="overflow-hidden rounded-lg border border-border/60"
                              >
                                <img
                                  src={reference}
                                  alt={`Référence ${index + 1}`}
                                  className="h-28 w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}
                    <Card className="border-border/40 bg-background/80">
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Actions rapides
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={handleQuickRegenerate}
                            disabled={!currentBrief || isRegenerating}
                          >
                            <Sparkles className="h-4 w-4" />
                            Régénérer la scène
                          </Button>
                          <Button variant="outline" className="justify-start gap-2">
                            <Boxes className="h-4 w-4" />
                            Importer un asset
                          </Button>
                          <Button variant="outline" className="justify-start gap-2">
                            <Plus className="h-4 w-4" />
                            Ajouter un événement
                          </Button>
                          <Button variant="outline" className="justify-start gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Ouvrir le changelog
                          </Button>
                        </div>
                      </div>
                    </Card>
                    <Button variant="ghost" className="w-full justify-center" onClick={handleResetPrompt}>
                      Modifier le brief initial
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Bibliothèque d'assets</h3>
                      <p className="text-sm text-muted-foreground">
                        Active ou crée des ressources 3D et visuelles pour ton monde
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className={cn(
                            "rounded-2xl border bg-background/70 p-4 shadow-sm transition-all",
                            selectedAssets.has(asset.id)
                              ? "border-primary/60 ring-2 ring-primary/20"
                              : "border-border/50"
                          )}
                        >
                          <div
                            className={cn(
                              "h-28 w-full rounded-xl bg-gradient-to-br flex items-center justify-center text-base font-semibold text-white",
                              asset.gradient
                            )}
                          >
                            {asset.name}
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground/90">
                                {asset.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{asset.description}</p>
                            {asset.sources && asset.sources.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-primary/80">
                                {asset.sources.map((source) => (
                                  <a
                                    key={`${asset.id}-${source.bankId}`}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-1 font-medium hover:bg-primary/10 hover:text-primary"
                                    title={`${source.description} • ${source.license}`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {source.bankName}
                                  </a>
                                ))}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant={selectedAssets.has(asset.id) ? "default" : "outline"}
                              className="w-full gap-2"
                              onClick={() => handleToggleAsset(asset.id)}
                            >
                              <Boxes className="h-4 w-4" />
                              {selectedAssets.has(asset.id) ? "Déployer dans la scène" : "Activer l'asset"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card className="border-border/50 bg-background/80 h-fit">
                    <div className="p-5 space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Générer un nouvel asset
                      </h4>
                      <Textarea
                        placeholder="Ex: Statue totémique en pierre avec lumières turquoise"
                        value={assetPrompt}
                        onChange={(event) => setAssetPrompt(event.target.value)}
                        className="min-h-[140px]"
                      />
                      <Button type="button" className="w-full gap-2" onClick={handleGenerateAsset}>
                        <Sparkles className="h-4 w-4" />
                        Générer depuis le prompt
                      </Button>
                      <Separator className="bg-border/40" />
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Suggestions rapides :</p>
                        <div className="flex flex-wrap gap-2">
                          {["Portail ancestral", "Drone messager", "Falaise lumineuse"].map((suggestion) => (
                            <Button
                              key={suggestion}
                              type="button"
                              variant="secondary"
                              className="bg-secondary/20 text-secondary-foreground/80"
                              onClick={() => setAssetPrompt(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="code" className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Code du prototype généré</h3>
                    <p className="text-sm text-muted-foreground">
                      Inspecte l'intégralité du code exportable pour le jeu WebGL.
                    </p>
                  </div>
                  <CodeViewer code={gameCode} category="game" />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}

      <AssetManager 
        open={assetManagerOpen}
        onOpenChange={setAssetManagerOpen}
        onAssetsSelected={(packs) => {
          setSelectedKenneyPacks(packs);
          toast.success(`${packs.length} pack(s) sélectionné(s)`);
        }}
      />
    </div>
  );
};

export default GameBuilder;
