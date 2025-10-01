import { useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import heroBanner from "@/assets/hero-banner.jpg";
import gameIcon from "@/assets/game-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import appIcon from "@/assets/app-icon.png";
import webIcon from "@/assets/web-icon.png";
import agentIcon from "@/assets/agent-icon.png";
import CategoryGeneratorOverlay, { type CategoryId } from "@/components/CategoryGeneratorOverlay";

const categories: { id: CategoryId; title: string; description: string; icon: string }[] = [
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative flex h-[60vh] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />

        <div className="relative z-10 space-y-6 px-4 text-center">
          <h1 className="animate-fade-in bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
            Créez Sans Limites
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground md:text-2xl">
            Transformez vos idées en réalité avec l'IA
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Que souhaitez-vous créer ?</h2>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </section>

      {selectedCategory && (
        <CategoryGeneratorOverlay
          categoryId={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
};

export default Index;
