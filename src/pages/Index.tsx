import { useCallback, useMemo, useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/CategoryCard";
import SiteAppGenerator, { type SiteAppMode } from "@/components/SiteAppGenerator";
import CreativeGenerator from "@/components/CreativeGenerator";
import type { CreativeTool } from "@/lib/content-generators";

import heroBanner from "@/assets/hero-banner.jpg";
import webIcon from "@/assets/web-icon.png";
import appIcon from "@/assets/app-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import agentIcon from "@/assets/agent-icon.png";
import gameIcon from "@/assets/game-icon.png";

type ToolType = SiteAppMode | CreativeTool;

type ToolDefinition = {
  title: string;
  description: string;
  icon: string;
  kind: "builder" | "creative";
  dialogDescription: string;
};

const TOOL_ORDER: ToolType[] = ["website", "application", "image", "music", "agent", "game"];

const TOOL_DETAILS: Record<ToolType, ToolDefinition> = {
  website: {
    title: "Sites web",
    description: "Landing pages modernes, sections prêtes à personnaliser et styles adaptables.",
    icon: webIcon,
    kind: "builder",
    dialogDescription:
      "Décris ton site web pour générer un projet React + Vite complet avec structure de pages et fichiers essentiels.",
  },
  application: {
    title: "Applications",
    description: "Dashboards réactifs avec navigation, widgets et listes de tâches interactives.",
    icon: appIcon,
    kind: "builder",
    dialogDescription:
      "Génère un prototype d'application React avec navigation, statistiques et sections prêtes à enrichir.",
  },
  image: {
    title: "Images",
    description: "Visuels inspirants générés depuis vos idées et styles préférés.",
    icon: imageIcon,
    kind: "creative",
    dialogDescription:
      "Décris la scène ou l'ambiance recherchée pour obtenir un aperçu d'image illustratif.",
  },
  music: {
    title: "Musique",
    description: "Concepts musicaux complets avec tempo, instrumentation et structure.",
    icon: musicIcon,
    kind: "creative",
    dialogDescription:
      "Explique l'ambiance musicale souhaitée pour obtenir une fiche de composition détaillée.",
  },
  agent: {
    title: "Agents",
    description: "Conçois des assistants intelligents avec objectifs, routine et outils.",
    icon: agentIcon,
    kind: "creative",
    dialogDescription:
      "Précise le rôle de ton agent afin de générer un plan d'action et les outils recommandés.",
  },
  game: {
    title: "Jeux vidéo",
    description: "Pitchs de jeux immersifs avec mécaniques, boucle de gameplay et univers.",
    icon: gameIcon,
    kind: "creative",
    dialogDescription:
      "Décris l'expérience de jeu pour obtenir un concept détaillé avec boucle de gameplay et ambiance visuelle.",
  },
};

const Index = () => {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  const tools = useMemo(
    () => TOOL_ORDER.map((key) => ({ key, ...TOOL_DETAILS[key] })),
    [],
  );

  const handleOpen = useCallback((tool: ToolType) => {
    setActiveTool(tool);
  }, []);

  const handleDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setActiveTool(null);
    }
  }, []);

  const activeDetail = activeTool ? TOOL_DETAILS[activeTool] : null;
  const isBuilder = activeDetail?.kind === "builder";

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <section className="relative overflow-hidden">
        <img
          src={heroBanner}
          alt="Fond créatif"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-violet-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_60%)]" />
        <div className="relative z-10 container mx-auto px-6 py-24 sm:px-10 lg:px-16">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200/80 backdrop-blur">
              Studio génératif
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Créez sites, applications, images et expériences immersives en quelques secondes.
            </h1>
            <p className="text-lg text-slate-200/80">
              Choisissez un générateur, décrivez votre idée et obtenez instantanément du code, des visuels ou des concepts prêts à
              explorer.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => handleOpen("website")}>Commencer un site</Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("tools-grid")?.scrollIntoView({ behavior: "smooth" })}
                className="border-white/30 text-slate-100 hover:border-white/60"
              >
                Voir tous les générateurs
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="tools-grid" className="container mx-auto px-6 py-16 sm:px-10 lg:px-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Les 6 générateurs créatifs</h2>
          <p className="mt-2 text-slate-300/80">
            Sélectionne un outil pour ouvrir l'environnement de création dédié à ton besoin.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <CategoryCard
              key={tool.key}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              onClick={() => handleOpen(tool.key as ToolType)}
            />
          ))}
        </div>
      </section>

      <Dialog open={Boolean(activeTool)} onOpenChange={handleDialogChange}>
        <DialogContent className="flex h-[92vh] w-full max-w-[100vw] flex-col overflow-hidden border border-white/10 bg-slate-950/95 p-0 backdrop-blur-xl sm:h-[90vh] sm:max-w-[1200px]">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="h-full">
                {activeTool && activeDetail && (
                  isBuilder ? (
                    <SiteAppGenerator key={activeTool} mode={activeTool as SiteAppMode} />
                  ) : (
                    <CreativeGenerator
                      key={activeTool}
                      tool={activeTool as CreativeTool}
                      description={activeDetail.dialogDescription}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
