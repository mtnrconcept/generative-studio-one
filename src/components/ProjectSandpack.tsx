import { useMemo } from "react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackCodeEditor,
  SandpackThemeProvider,
} from "@codesandbox/sandpack-react";
import type { GeneratedFile } from "@/types/result";
import { Card } from "@/components/ui/card";

interface ProjectSandpackProps {
  files: GeneratedFile[];
  activeFile?: string;
}

const normalizeSandpackPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const ProjectSandpack = ({ files, activeFile }: ProjectSandpackProps) => {
  const sandpackFiles = useMemo(() => {
    if (!files.length) return undefined;

    return files.reduce<Record<string, { code: string }>>((accumulator, file) => {
      const key = normalizeSandpackPath(file.path);
      accumulator[key] = { code: file.content };
      return accumulator;
    }, {});
  }, [files]);

  const sandpackKey = useMemo(() => {
    if (!files.length) return "empty";

    return files
      .map((file) => normalizeSandpackPath(file.path))
      .sort()
      .join("|");
  }, [files]);

  if (!files.length || !sandpackFiles) {
    return (
      <Card className="flex h-full flex-col items-center justify-center border-border/40 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
        Aucune génération pour le moment. Lance une création pour afficher ici le code et la prévisualisation live.
      </Card>
    );
  }

  const defaultActiveFile = activeFile ? normalizeSandpackPath(activeFile) : Object.keys(sandpackFiles)[0];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/40 px-6 py-4">
        <p className="text-sm font-semibold text-muted-foreground">Code & Preview live</p>
      </div>
      <div className="flex-1 min-h-0 bg-background/40">
        <SandpackProvider
          key={`${sandpackKey}-${defaultActiveFile}`}
          template="react-ts"
          files={sandpackFiles}
          options={{ activeFile: defaultActiveFile }}
        >
          <SandpackThemeProvider>
            <SandpackLayout style={{ height: "100%" }}>
              <SandpackCodeEditor style={{ height: "100%" }} showTabs showLineNumbers />
              <SandpackPreview style={{ height: "100%" }} />
            </SandpackLayout>
          </SandpackThemeProvider>
        </SandpackProvider>
      </div>
    </div>
  );
};

export default ProjectSandpack;
