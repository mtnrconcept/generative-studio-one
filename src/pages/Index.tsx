import { useState } from "react";
import { toast } from "sonner";
import CategoryCard from "@/components/CategoryCard";
import PromptInput from "@/components/PromptInput";
import ResultDisplay from "@/components/ResultDisplay";
import heroBanner from "@/assets/hero-banner.jpg";
import gameIcon from "@/assets/game-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import appIcon from "@/assets/app-icon.png";
import webIcon from "@/assets/web-icon.png";
import agentIcon from "@/assets/agent-icon.png";
import { supabase } from "@/integrations/supabase/client";

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

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: string;
    category: string;
    content: string;
    preview?: string;
    code?: string;
  } | null>(null);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setResult(null);
  };

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt,
          category: selectedCategory,
        },
      });

      if (error) throw error;

      setResult({
        type: data.type || selectedCategory,
        category: data.category || selectedCategory,
        content: data.content,
        preview: data.preview,
        code: data.code,
      });

      toast.success("Création réussie !");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de la génération");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Prompt Input Section */}
      {selectedCategory && !result && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <button
              onClick={() => setSelectedCategory("")}
              className="text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              ← Retour aux catégories
            </button>
            <h2 className="text-3xl font-bold mb-2">
              Créer {categories.find(c => c.id === selectedCategory)?.title}
            </h2>
            <p className="text-muted-foreground">
              Décrivez votre vision, l'IA s'occupe du reste
            </p>
          </div>
          
          <PromptInput
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
            selectedCategory={categories.find(c => c.id === selectedCategory)?.title || ""}
          />
        </section>
      )}

      {/* Result Section */}
      {result && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <button
              onClick={() => setResult(null)}
              className="text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              ← Nouvelle création
            </button>
          </div>
          
          <ResultDisplay result={result} />
        </section>
      )}
    </div>
  );
};

export default Index;
