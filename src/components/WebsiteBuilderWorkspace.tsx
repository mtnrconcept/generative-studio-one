import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, FileCode2, FolderTree } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
}

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
}

interface WebsiteBuilderWorkspaceProps {
  onBack: () => void;
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  result: {
    type: string;
    category: string;
    content: string;
    preview?: string;
    code?: string;
  } | null;
  chatHistory: ChatMessage[];
}

const parseWebsiteFiles = (code?: string): WorkspaceFile[] => {
  if (!code) return [];

  const files: WorkspaceFile[] = [];
  let htmlContent = code;

  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  if (styleMatch && styleMatch[0]) {
    htmlContent = htmlContent.replace(styleMatch[0], "<link rel=\"stylesheet\" href=\"styles.css\">");
    files.push({
      id: "styles.css",
      name: "styles.css",
      content: styleMatch[1].trim(),
    });
  }

  if (scriptMatch && scriptMatch[0]) {
    htmlContent = htmlContent.replace(scriptMatch[0], "<script src=\"script.js\"></script>");
    files.push({
      id: "script.js",
      name: "script.js",
      content: scriptMatch[1].trim(),
    });
  }

  files.unshift({
    id: "index.html",
    name: "index.html",
    content: htmlContent.trim(),
  });

  return files;
};

const WorkspacePrompt = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}) => {
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    const value = prompt.trim();
    if (!value || isLoading) return;
    onSubmit(value);
    setPrompt("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-background/80 p-4 shadow-lg shadow-primary/5 backdrop-blur">
      <Textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Décrivez la prochaine section ou modification de votre site..."
        className="min-h-[120px] resize-none border-none bg-transparent text-base focus-visible:ring-0"
        disabled={isLoading}
      />
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Appuyez sur <span className="font-semibold">Entrée</span> pour envoyer, <span className="font-semibold">Shift + Entrée</span> pour une nouvelle ligne
        </div>
        <Button
          onClick={handleSend}
          disabled={isLoading || !prompt.trim()}
          className="gap-2 bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-[0_0_35px_rgba(99,102,241,0.35)] hover:opacity-90"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? "Génération en cours" : "Générer"}
        </Button>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex w-full", 
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm", 
          isAssistant
            ? "border-primary/20 bg-primary/5 text-foreground"
            : "border-border bg-background"
        )}
      >
        {message.content}
      </div>
    </div>
  );
};

const WebsiteBuilderWorkspace = ({
  onBack,
  onSubmit,
  isLoading,
  result,
  chatHistory,
}: WebsiteBuilderWorkspaceProps) => {
  const files = useMemo(() => parseWebsiteFiles(result?.code), [result?.code]);
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id ?? "index.html");
  const [tabValue, setTabValue] = useState("preview");

  useEffect(() => {
    if (files.length > 0) {
      setActiveFileId(files[0].id);
    }
  }, [files]);

  const activeFile = files.find((file) => file.id === activeFileId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderTree className="h-4 w-4" />
              Générateur de site web
            </div>
            <h1 className="text-2xl font-semibold">Workspace créatif</h1>
            <p className="text-sm text-muted-foreground">
              Dialogue avec l'IA, explorez l'arborescence et visualisez votre site en direct.
            </p>
          </div>
          <Button variant="ghost" onClick={onBack} className="text-sm">
            ← Retour
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-col border-r border-border/40 bg-muted/10 lg:flex">
          <div className="border-b border-border/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fichiers
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-3">
              {files.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/40 bg-background/60 p-4 text-xs text-muted-foreground">
                  Générez un site pour voir l'arborescence des fichiers.
                </div>
              ) : (
                files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      activeFileId === file.id
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <FileCode2 className="h-4 w-4" />
                    {file.name}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex flex-1 flex-col">
          <ScrollArea className="flex-1 px-6 py-6">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              {chatHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 bg-background/80 p-6 text-center text-sm text-muted-foreground">
                  Commencez la conversation en décrivant le site que vous souhaitez créer.
                </div>
              ) : (
                chatHistory.map((message) => <MessageBubble key={message.id} message={message} />)
              )}
            </div>
          </ScrollArea>
          <div className="border-t border-border/40 bg-background/80 px-6 py-4">
            <div className="mx-auto w-full max-w-2xl">
              <WorkspacePrompt onSubmit={onSubmit} isLoading={isLoading} />
            </div>
          </div>
        </section>

        <aside className="hidden w-[420px] flex-col border-l border-border/40 bg-muted/10 xl:flex">
          <Tabs value={tabValue} onValueChange={setTabValue} className="flex h-full flex-col">
            <div className="border-b border-border/40 px-4 py-3">
              <TabsList className="h-9 bg-background/80">
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview" className="flex-1 px-4 pb-4">
              <div className="h-full overflow-hidden rounded-xl border border-border/40 bg-white shadow-inner">
                {result?.code ? (
                  <iframe
                    key={result.code}
                    srcDoc={result.code}
                    title="Preview du site généré"
                    className="h-full w-full"
                    sandbox="allow-scripts allow-pointer-lock allow-same-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
                    La preview du site apparaîtra ici après génération.
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="code" className="flex-1 px-4 pb-4">
              <div className="flex h-full flex-col gap-3">
                <div className="rounded-lg border border-border/40 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {activeFile?.name ?? "Sélectionnez un fichier"}
                </div>
                <div className="flex-1 overflow-hidden rounded-xl border border-border/40">
                  {activeFile ? (
                    <SyntaxHighlighter
                      language={activeFile.name.endsWith(".css") ? "css" : activeFile.name.endsWith(".js") ? "javascript" : "html"}
                      style={vscDarkPlus}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        height: "100%",
                        fontSize: "13px",
                        background: "transparent",
                      }}
                    >
                      {activeFile.content}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
                      Générez un site pour consulter son code.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
};

export default WebsiteBuilderWorkspace;
