import { useMemo } from "react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackThemeProvider,
} from "@codesandbox/sandpack-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GeneratedFile } from "@/types/result";

interface FullscreenPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: GeneratedFile[];
  activeFile?: string;
  isGenerating?: boolean;
}

const normalizeSandpackPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const FullscreenPreviewDialog = ({
  open,
  onOpenChange,
  files,
  activeFile,
  isGenerating = false,
}: FullscreenPreviewDialogProps) => {
  const sandpackFiles = useMemo(() => {
    if (!files.length) return undefined;

    return files.reduce<Record<string, { code: string }>>((accumulator, file) => {
      const key = normalizeSandpackPath(file.path);
      accumulator[key] = { code: file.content };
      return accumulator;
    }, {});
  }, [files]);

  const defaultActiveFile = useMemo(() => {
    if (!sandpackFiles) return undefined;
    if (activeFile) return normalizeSandpackPath(activeFile);
    const [firstEntry] = Object.keys(sandpackFiles);
    return firstEntry;
  }, [activeFile, sandpackFiles]);

  if (!sandpackFiles || !defaultActiveFile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prévisualisation indisponible</DialogTitle>
            <DialogDescription>
              Lance une génération pour activer la prévisualisation plein écran.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col gap-0 overflow-hidden border-border/40 bg-background/95 p-0">
        <DialogHeader className="border-b border-border/40 px-6 py-4">
          <DialogTitle className="text-base font-semibold">Prévisualisation plein écran</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Explore la version live générée sans les panneaux latéraux.
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 min-h-0 bg-background/60">
          <SandpackProvider template="react-ts" files={sandpackFiles} options={{ activeFile: defaultActiveFile }}>
            <SandpackThemeProvider>
              <SandpackLayout style={{ height: "100%" }}>
                <SandpackPreview style={{ height: "100%" }} />
              </SandpackLayout>
            </SandpackThemeProvider>
          </SandpackProvider>
          {isGenerating && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur">
              <svg
                className="h-6 w-6 animate-spin text-primary"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <p className="text-sm font-medium text-foreground">Génération en cours…</p>
              <p className="text-xs text-muted-foreground">
                La prévisualisation se mettra à jour automatiquement.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenPreviewDialog;
