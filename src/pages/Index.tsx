import { useEffect, useState } from "react";
import { toast } from "sonner";
import CategoryCard from "@/components/CategoryCard";
import PromptInput from "@/components/PromptInput";
import ResultDisplay from "@/components/ResultDisplay";
import LoadingIndicator from "@/components/LoadingIndicator";
import heroBanner from "@/assets/hero-banner.jpg";
import gameIcon from "@/assets/game-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import appIcon from "@/assets/app-icon.png";
import webIcon from "@/assets/web-icon.png";
import agentIcon from "@/assets/agent-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { GeneratedFile, GeneratedResult } from "@/types/result";

const loadingSteps = [
  "Analyse du prompt et compréhension du contexte",
  "Sélection du meilleur modèle IA pour la demande",
  "Génération du contenu en cours",
  "Préparation du rendu final",
];

const categories = [
  {
    id: "game",
    title: "Jeux Vidéo",
    description: "Créez des jeux interactifs",
    icon: gameIcon,
  },
  {
    id: "image",
    title: "Images",
    description: "Générez des visuels uniques",
    icon: imageIcon,
  },
  {
    id: "music",
    title: "Musique",
    description: "Composez des mélodies",
    icon: musicIcon,
  },
  {
    id: "app",
    title: "Applications",
    description: "Développez des apps",
    icon: appIcon,
  },
  {
    id: "website",
    title: "Sites Web",
    description: "Créez des sites modernes",
    icon: webIcon,
  },
  {
    id: "agent",
    title: "Agents",
    description: "Automatisez vos tâches",
    icon: agentIcon,
  },
];

const stripCodeFence = (code: string) => {
  const trimmed = code.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9-]*\n([\s\S]*?)```$/);

  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
};

const parseFilesFromResponse = (data: unknown): GeneratedFile[] | undefined => {
  if (!data) return undefined;

  if (Array.isArray((data as { files?: unknown }).files)) {
    const files = (data as { files: GeneratedFile[] }).files;
    return files.filter((file) => file?.path && typeof file.path === 'string');
  }

  if (typeof (data as { files?: unknown }).files === 'string') {
    try {
      const parsed = JSON.parse(stripCodeFence((data as { files: string }).files));
      if (Array.isArray(parsed)) {
        return parsed.filter((file) => file?.path && typeof file.path === 'string');
      }
      if (Array.isArray(parsed?.files)) {
        return parsed.files.filter((file: GeneratedFile) => file?.path && typeof file.path === 'string');
      }
    } catch (error) {
      console.error('Impossible de parser le manifeste de fichiers fourni', error);
    }
  }

  if (typeof (data as { code?: unknown }).code === 'string') {
    const candidate = stripCodeFence((data as { code: string }).code);
    const firstChar = candidate.trim()[0];

    if (firstChar === '{' || firstChar === '[') {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed?.files)) {
          return parsed.files.filter((file: GeneratedFile) => file?.path && typeof file.path === 'string');
        }
        if (Array.isArray(parsed)) {
          return parsed.filter((file: GeneratedFile) => file?.path && typeof file.path === 'string');
        }
      } catch (error) {
        console.error('Impossible de parser le code comme un projet multi-fichiers', error);
      }
    }
  }

  return undefined;
};

const extractInstructions = (data: unknown) => {
  if (!data) return undefined;

  if (typeof (data as { instructions?: string }).instructions === 'string') {
    return (data as { instructions: string }).instructions;
  }

  if (typeof (data as { readme?: string }).readme === 'string') {
    return (data as { readme: string }).readme;
  }

  if (typeof (data as { documentation?: string }).documentation === 'string') {
    return (data as { documentation: string }).documentation;
  }

  return undefined;
};

const buildGeneratedResult = (
  data: Record<string, unknown>,
  base: Pick<GeneratedResult, 'prompt' | 'version' | 'category' | 'type'> & {
    modification?: string;
  }
): GeneratedResult => {
  const files = parseFilesFromResponse(data);

  return {
    type: (data['type'] as string) || base.type,
    category: (data['category'] as string) || base.category,
    content:
      typeof data['content'] === 'string'
        ? (data['content'] as string)
        : base.category === 'website' && !files
          ? (data['code'] as string)
          : '',
    preview: typeof data['preview'] === 'string' ? (data['preview'] as string) : undefined,
    code: typeof data['code'] === 'string' ? (data['code'] as string) : undefined,
    prompt: base.prompt,
    version: base.version,
    modification: base.modification,
    files,
    instructions: extractInstructions(data),
    projectName: typeof data['projectName'] === 'string' ? (data['projectName'] as string) : undefined,
    projectType: typeof data['projectType'] === 'string'
      ? (data['projectType'] as string)
      : files
        ? 'react'
        : undefined,
  };
};

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [wasLoading, setWasLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [resultHistory, setResultHistory] = useState<GeneratedResult[]>([]);
  const [lastPrompt, setLastPrompt] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState<string[]>([]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setResult(null);
    setResultHistory([]);
    setLastPrompt("");
  };

  const handlePromptSubmit = async (prompt: string) => {
    setWasLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("");
    setLoadingHistory([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt,
          category: selectedCategory,
        },
      });

      if (error) throw error;

      const normalizedData =
        data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

      const generatedResult = buildGeneratedResult(normalizedData, {
        type: selectedCategory,
        category: selectedCategory,
        prompt,
        version: 1,
      });

      setLastPrompt(prompt);
      setResult(generatedResult);
      setResultHistory([generatedResult]);

      toast.success("Création réussie !");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de la génération");
      setLoadingMessage("Une erreur est survenue lors de la génération");
      setLoadingHistory((prev) => {
        if (prev[prev.length - 1] === "Une erreur est survenue lors de la génération") {
          return prev;
        }

        return [...prev, "Une erreur est survenue lors de la génération"];
      });
      setLoadingProgress(100);
      setWasLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineSubmit = async (modification: string) => {
    if (!result || !modification.trim()) {
      return;
    }

    setWasLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("");
    setLoadingHistory([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt: lastPrompt,
          category: selectedCategory,
          modification,
          existingContent: result.code || result.content,
        },
      });

      if (error) throw error;

      const version = resultHistory.length + 1;
      const normalizedData =
        data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

      const refinedResult = buildGeneratedResult(normalizedData, {
        type: selectedCategory,
        category: selectedCategory,
        prompt: lastPrompt,
        version,
        modification,
      });

      setResult(refinedResult);
      setResultHistory((prev) => [...prev, refinedResult]);

      toast.success("Révision générée !");
    } catch (error) {
      console.error("Erreur lors de la révision:", error);
      toast.error("Impossible d'appliquer la modification");
      setLoadingMessage("Une erreur est survenue lors de la révision");
      setLoadingHistory((prev) => {
        if (prev[prev.length - 1] === "Une erreur est survenue lors de la révision") {
          return prev;
        }

        return [...prev, "Une erreur est survenue lors de la révision"];
      });
      setLoadingProgress(100);
      setWasLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let stepIndex = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isLoading) {
      setLoadingHistory([loadingSteps[0]]);
      setLoadingMessage(loadingSteps[0]);
      setLoadingProgress(Math.round((1 / loadingSteps.length) * 100));

      interval = setInterval(() => {
        stepIndex += 1;

        if (stepIndex < loadingSteps.length) {
          const nextMessage = loadingSteps[stepIndex];
          setLoadingMessage(nextMessage);
          setLoadingHistory((prev) => {
            if (prev[prev.length - 1] === nextMessage) {
              return prev;
            }

            return [...prev, nextMessage];
          });
          setLoadingProgress(Math.min(95, Math.round(((stepIndex + 1) / loadingSteps.length) * 100)));
        } else if (interval) {
          clearInterval(interval);
        }
      }, 1500);
    } else if (!isLoading && wasLoading) {
      setLoadingProgress(100);
      setLoadingMessage("Finalisation terminée");
      setLoadingHistory((prev) => {
        if (!prev.length || prev[prev.length - 1] === "Finalisation terminée") {
          return prev.length ? prev : ["Finalisation terminée"];
        }

        return [...prev, "Finalisation terminée"];
      });
      setWasLoading(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, wasLoading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
        
        <div className="relative z-10 text-center space-y-6 px-4">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in">
            Créez Sans Limites
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Transformez vos idées en réalité avec l'IA
          </p>
        </div>
      </section>

      {/* Categories Section */}
      {!selectedCategory && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Que souhaitez-vous créer ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                description={category.description}
                icon={category.icon}
                onClick={() => handleCategorySelect(category.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Prompt & Result Section */}
      {selectedCategory && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <button
              onClick={() => {
                setSelectedCategory("");
                setResult(null);
                setResultHistory([]);
                setLastPrompt("");
                setLoadingHistory([]);
                setLoadingMessage("");
                setLoadingProgress(0);
                setWasLoading(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              ← Retour aux catégories
            </button>
            <h2 className="text-3xl font-bold mb-2">
              Créer {categories.find((c) => c.id === selectedCategory)?.title}
            </h2>
            <p className="text-muted-foreground">
              Décrivez votre vision, l'IA s'occupe du reste
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] items-start">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
                <PromptInput
                  onSubmit={handlePromptSubmit}
                  onRefineSubmit={handleRefineSubmit}
                  isLoading={isLoading}
                  selectedCategory={categories.find((c) => c.id === selectedCategory)?.title || ""}
                  hasResult={!!result}
                  history={resultHistory}
                />
              </div>

              {(loadingHistory.length > 0 || isLoading) && (
                <LoadingIndicator
                  progress={loadingProgress}
                  message={loadingMessage}
                  history={loadingHistory}
                  isActive={isLoading}
                />
              )}
            </div>

            <div className="w-full">
              {result ? (
                <ResultDisplay result={result} history={resultHistory} />
              ) : (
                <Card className="h-full min-h-[420px] w-full border-dashed border-border/60 bg-card/30">
                  <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
                    <div className="rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Prévisualisation en attente</h3>
                      <p className="text-muted-foreground">
                        Lancez une génération pour afficher ici l'aperçu ou le code correspondant à votre création.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
