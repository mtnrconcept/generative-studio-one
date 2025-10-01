import { useCallback, useMemo, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import PromptSidebar from "@/components/PromptSidebar";
import ProjectFileTree from "@/components/ProjectFileTree";
import ProjectSandpack from "@/components/ProjectSandpack";
import type { GeneratedProject } from "@/lib/project-generator";
import { generateProjectFromPrompt } from "@/lib/project-generator";

const defaultPrompt = [
  "Crée une landing page moderne",
  "Nom: Mon Super Site",
  "Ajoute un bouton vert",
].join("\n");

const Index = () => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error("Veuillez décrire votre projet avant de lancer la génération.");
      return;
    }

    try {
      setIsGenerating(true);
      const generated = generateProjectFromPrompt(prompt);
      setProject(generated);

      const preferredFile = generated.files.find((file) => file.path === "src/App.tsx" || file.path === "src/main.tsx");
      setActiveFile(preferredFile?.path ?? generated.files[0]?.path);

      toast.success("Projet React + Vite généré !");
    } catch (error) {
      console.error("Erreur pendant la génération", error);
      toast.error("Impossible de générer le projet. Réessayez avec un prompt différent.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

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

  const projectFiles = useMemo(() => project?.files ?? [], [project]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
      <div className="flex h-screen w-full overflow-hidden">
        <div className="grid h-full w-full grid-cols-[minmax(280px,340px)_minmax(240px,280px)_1fr] bg-background/80">
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
          />

          <ProjectFileTree
            files={projectFiles}
            activeFile={activeFile}
            onSelect={setActiveFile}
          />

          <ProjectSandpack files={projectFiles} activeFile={activeFile} />
        </div>
      </div>
    </div>
  );
};

export default Index;
