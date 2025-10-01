import { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";

import PromptSidebar from "@/components/PromptSidebar";
import ProjectFileTree from "@/components/ProjectFileTree";
import ProjectSandpack from "@/components/ProjectSandpack";
import type { GeneratedProject } from "@/lib/project-generator";
import { generateProjectFromPrompt } from "@/lib/project-generator";

export type SiteAppMode = "website" | "application";

interface SiteAppGeneratorProps {
  mode: SiteAppMode;
}

const DEFAULT_PROMPTS: Record<SiteAppMode, string> = {
  website: [
    "Crée une landing page moderne",
    "Nom: Mon Super Site",
    "Ajoute un bouton vert",
  ].join("\n"),
  application: [
    "Prototype d'application dashboard",
    "Nom: Mon App Produit",
    "Inclut suivi des statistiques",
  ].join("\n"),
};

const HINTS: Record<SiteAppMode, string[]> = {
  website: [
    "Landing page SaaS",
    "Section témoignages",
    "Nom: Startup Nova",
    "Bouton vert",
  ],
  application: [
    "Dashboard analytique",
    "Vue Kanban",
    "Nom: Flow Manager",
    "Mode sombre",
  ],
};

const LABELS: Record<SiteAppMode, { title: string; description: string; generate: string }> = {
  website: {
    title: "Générateur de site web",
    description:
      "Décris la landing page ou le site marketing que tu veux obtenir. Utilise <code>Nom: ...</code> pour définir le nom du projet.",
    generate: "Générer le site",
  },
  application: {
    title: "Générateur d'application",
    description:
      "Décris l'application React que tu souhaites prototyper. Mentionne <code>Nom: ...</code> pour personnaliser le dossier.",
    generate: "Générer l'application",
  },
};

const SiteAppGenerator = ({ mode }: SiteAppGeneratorProps) => {
  const defaultPrompt = useMemo(() => DEFAULT_PROMPTS[mode], [mode]);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setPrompt(defaultPrompt);
    setProject(null);
    setActiveFile(undefined);
  }, [defaultPrompt]);

  const projectFiles = useMemo(() => project?.files ?? [], [project]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error("Ajoute quelques instructions avant de lancer la génération.");
      return;
    }

    try {
      setIsGenerating(true);
      const generated = generateProjectFromPrompt(prompt, mode);
      setProject(generated);

      const preferredFile = generated.files.find(
        (file) => file.path === "src/App.tsx" || file.path === "src/main.tsx",
      );
      setActiveFile(preferredFile?.path ?? generated.files[0]?.path);

      toast.success(
        mode === "website"
          ? "Projet de site React + Vite généré !"
          : "Prototype d'application React généré !",
      );
    } catch (error) {
      console.error("Erreur pendant la génération", error);
      toast.error("Impossible de générer le projet. Réessaie avec un prompt différent.");
    } finally {
      setIsGenerating(false);
    }
  }, [mode, prompt]);

  const handleExport = useCallback(async () => {
    if (!project) return;

    try {
      setIsExporting(true);
      const zip = new JSZip();

      project.files.forEach((file) => {
        zip.file(file.path, file.content);
      });

      if (project.instructions) {
        zip.file("README.md", project.instructions);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = project.projectName.replace(/\s+/g, "-").toLowerCase();
      link.href = url;
      link.download = `${slug || "react-project"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Archive du projet prête à être téléchargée !");
    } catch (error) {
      console.error("Erreur lors de l'export", error);
      toast.error("Impossible de créer l'archive du projet.");
    } finally {
      setIsExporting(false);
    }
  }, [project]);

  return (
    <div className="flex h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="grid h-full w-full grid-cols-[minmax(280px,340px)_minmax(240px,280px)_1fr] bg-background/60">
        <PromptSidebar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onExport={handleExport}
          isGenerating={isGenerating}
          isExporting={isExporting}
          canExport={Boolean(projectFiles.length) && !isExporting}
          projectName={project?.projectName}
          instructions={project?.instructions}
          title={LABELS[mode].title}
          description={LABELS[mode].description}
          promptLabel="Brief"
          promptPlaceholder={defaultPrompt}
          hints={HINTS[mode]}
          generateLabel={LABELS[mode].generate}
          exportLabel="Télécharger le projet"
        />

        <ProjectFileTree files={projectFiles} activeFile={activeFile} onSelect={setActiveFile} />

        <ProjectSandpack files={projectFiles} activeFile={activeFile} />
      </div>
    </div>
  );
};

export default SiteAppGenerator;
