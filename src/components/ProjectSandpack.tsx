import { useMemo, useState } from "react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackCodeEditor,
  SandpackThemeProvider,
} from "@codesandbox/sandpack-react";
import type { GeneratedFile } from "@/types/result";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Columns, Loader2, Maximize2, Monitor, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import FullscreenPreviewDialog from "@/components/FullscreenPreviewDialog";

interface ProjectSandpackProps {
  files: GeneratedFile[];
  activeFile?: string;
  isGenerating?: boolean;
  className?: string;
  isFileTreeCollapsed?: boolean;
  onExpandFileTree?: () => void;
}

const normalizeSandpackPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const LoaderOverlay = () => (
  <div className="pointer-events-none flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
    <p className="font-medium text-foreground">Génération du projet…</p>
    <p className="text-xs text-muted-foreground">Le code est en cours d'écriture et la prévisualisation se mettra à jour automatiquement.</p>
  </div>
);

const ProjectSandpack = ({
  files,
  activeFile,
  isGenerating = false,
  className,
  isFileTreeCollapsed = false,
  onExpandFileTree,
}: ProjectSandpackProps) => {
  const sandpackFiles = useMemo(() => {
    if (!files.length) return undefined;

    return files.reduce<Record<string, { code: string }>>((accumulator, file) => {
      const key = normalizeSandpackPath(file.path);
      accumulator[key] = { code: file.content };
      return accumulator;
    }, {});
  }, [files]);

  const [viewMode, setViewMode] = useState<"split" | "code" | "preview">("split");
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const showCode = viewMode !== "preview";
  const showPreview = viewMode !== "code";

  if (!files.length || !sandpackFiles) {
    return (
      <Card className="flex h-full flex-col items-center justify-center border-border/40 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
        Aucune génération pour le moment. Lance une création pour afficher ici le code et la prévisualisation live.
      </Card>
    );
  }

  const defaultActiveFile = activeFile ? normalizeSandpackPath(activeFile) : Object.keys(sandpackFiles)[0];

  return (
    <div className={cn("relative flex h-full flex-col border-t border-border/50 bg-background/60 lg:border-t-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-4 sm:px-6">
        <p className="text-sm font-semibold text-muted-foreground">Espace de génération live</p>
        <div className="flex items-center gap-2">
          {isFileTreeCollapsed && onExpandFileTree && (
            <Button size="sm" variant="outline" className="gap-2" onClick={onExpandFileTree}>
              <PanelRightOpen className="h-4 w-4" />
              Afficher l'arborescence
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setIsFullscreenOpen(true)}
            disabled={!sandpackFiles}
          >
            <Maximize2 className="h-4 w-4" />
            Plein écran
          </Button>
          <Button
            size="sm"
            variant={viewMode === "split" ? "default" : "outline"}
            onClick={() => setViewMode("split")}
            className="gap-2"
          >
            <Columns className="h-4 w-4" />
            Split
          </Button>
          <Button
            size="sm"
            variant={viewMode === "code" ? "default" : "outline"}
            onClick={() => setViewMode("code")}
            className="gap-2"
          >
            <Code2 className="h-4 w-4" />
            Code
          </Button>
          <Button
            size="sm"
            variant={viewMode === "preview" ? "default" : "outline"}
            onClick={() => setViewMode("preview")}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0 bg-background/40">
        <SandpackProvider template="react-ts" files={sandpackFiles} options={{ activeFile: defaultActiveFile }}>
          <SandpackThemeProvider>
            <SandpackLayout style={{ height: "100%" }}>
              {showCode && (
                <SandpackCodeEditor
                  style={{ height: "100%", display: showPreview ? "block" : "flex" }}
                  showTabs
                  showLineNumbers
                />
              )}
              {showPreview && <SandpackPreview style={{ height: "100%" }} />}
            </SandpackLayout>
          </SandpackThemeProvider>
        </SandpackProvider>
        {isGenerating && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur">
            <LoaderOverlay />
          </div>
        )}
      </div>
      <FullscreenPreviewDialog
        open={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        files={files}
        activeFile={activeFile}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default ProjectSandpack;
