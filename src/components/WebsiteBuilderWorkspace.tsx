import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, FileCode2, FolderTree } from "lucide-react";
import { transform } from "@babel/standalone";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

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

const fileMarkerRegex = /^\/\/\s*File:\s*(.+)$/gm;
const jsExtensions = [".js", ".jsx", ".ts", ".tsx"];
const cssExtensions = [".css"];
const jsonExtensions = [".json"];
type BabelConfigEntry = string | [string, Record<string, unknown>];

const parseWebsiteFiles = (code?: string): WorkspaceFile[] => {
  if (!code) return [];

  const markers = [...code.matchAll(fileMarkerRegex)];
  if (markers.length > 0) {
    const files: WorkspaceFile[] = [];
    markers.forEach((match, index) => {
      const rawPath = match[1]?.trim();
      if (!rawPath) return;
      const start = (match.index ?? 0) + match[0].length;
      const end =
        index + 1 < markers.length
          ? markers[index + 1].index ?? code.length
          : code.length;
      const rawContent = code.slice(start, end);
      const normalizedContent = rawContent
        .replace(/^\s*\r?\n/, "")
        .replace(/\s*$/, "");

      files.push({
        id: rawPath,
        name: rawPath,
        content: normalizedContent,
      });
    });
    return files;
  }

  // Fallback pour l'ancien format HTML unique
  const files: WorkspaceFile[] = [];
  let htmlContent = code;

  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  if (styleMatch && styleMatch[0]) {
    htmlContent = htmlContent.replace(
      styleMatch[0],
      "<link rel=\"stylesheet\" href=\"styles.css\">",
    );
    files.push({
      id: "styles.css",
      name: "styles.css",
      content: styleMatch[1].trim(),
    });
  }

  if (scriptMatch && scriptMatch[0]) {
    htmlContent = htmlContent.replace(
      scriptMatch[0],
      "<script src=\"script.js\"></script>",
    );
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const createErrorDocument = (message: string) => `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Erreur de preview</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0f172a;
        color: #f8fafc;
      }
      pre {
        max-width: 960px;
        width: 100%;
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 16px;
        padding: 24px;
        white-space: pre-wrap;
        word-break: break-word;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.5);
      }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(message)}</pre>
  </body>
</html>`;

const createReactPreviewDocument = (
  files: WorkspaceFile[],
): { doc: string | null; error: string | null } => {
  if (files.length === 0) {
    return { doc: null, error: null };
  }

  const jsFiles = files.filter((file) =>
    jsExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
  );
  const cssFiles = files.filter((file) =>
    cssExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
  );
  const jsonFiles = files.filter((file) =>
    jsonExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
  );

  const entryFile =
    jsFiles.find((file) => /src\/main\.(t|j)sx?$/.test(file.id)) ??
    jsFiles.find((file) => /App\.(t|j)sx?$/.test(file.id)) ??
    jsFiles[0];

  if (!entryFile) {
    return {
      doc: null,
      error:
        "Impossible de déterminer le point d'entrée React (ex: src/main.jsx).",
    };
  }

  try {
    const moduleDefinitions: string[] = [];

    for (const file of jsFiles) {
      const isTypeScript = file.name.endsWith(".ts") || file.name.endsWith(".tsx");
      const isTSX = file.name.endsWith(".tsx");
      const presets: BabelConfigEntry[] = [];
      if (isTypeScript) {
        const tsPresetOptions: Record<string, unknown> = {
          isTSX,
          allExtensions: true,
          allowDeclareFields: true,
        };
        presets.push(["typescript", tsPresetOptions]);
      }
      const reactPresetOptions: Record<string, unknown> = {
        runtime: "automatic",
        development: false,
      };
      presets.push(["react", reactPresetOptions]);

      const plugins: BabelConfigEntry[] = [[
        "transform-modules-commonjs",
        { strictMode: false },
      ]];

      let compiled = "";
      try {
        const result = transform(file.content, {
          filename: file.id,
          presets,
          plugins,
          sourceType: "module",
          compact: false,
          retainLines: true,
          babelrc: false,
          configFile: false,
        });
        compiled = result.code ?? "";
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Erreur Babel dans ${file.name}: ${message}`);
      }

      moduleDefinitions.push(
        `define(${JSON.stringify(file.id)}, new Function("module", "exports", "require", ${JSON.stringify(compiled)}));`,
      );
    }

    for (const file of cssFiles) {
      const runtime = `const css = ${JSON.stringify(file.content)};\nif (typeof document !== "undefined") {\n  const style = document.createElement("style");\n  style.setAttribute("data-filename", ${JSON.stringify(file.name)});\n  style.textContent = css;\n  document.head.appendChild(style);\n}\nmodule.exports = css;`;
      moduleDefinitions.push(
        `define(${JSON.stringify(file.id)}, new Function("module", "exports", "require", ${JSON.stringify(runtime)}));`,
      );
    }

    for (const file of jsonFiles) {
      const jsonContent = file.content.trim();
      if (!jsonContent) continue;
      const runtime = `module.exports = ${jsonContent};`;
      moduleDefinitions.push(
        `define(${JSON.stringify(file.id)}, new Function("module", "exports", "require", ${JSON.stringify(runtime)}));`,
      );
    }

    const runtimeLines = [
      "(function() {",
      "  const modules = Object.create(null);",
      "  const factories = Object.create(null);",
      "  const builtinFactories = {",
      "    react: function() {",
      "      if (!window.React) { throw new Error(\"React n'est pas chargé.\"); }",
      "      if (!('default' in window.React)) { window.React.default = window.React; }",
      "      return window.React;",
      "    },",
      "    \"react-dom\": function() {",
      "      if (!window.ReactDOM) { throw new Error(\"ReactDOM n'est pas chargé.\"); }",
      "      if (!('default' in window.ReactDOM)) { window.ReactDOM.default = window.ReactDOM; }",
      "      return window.ReactDOM;",
      "    },",
      "    \"react-dom/client\": function() {",
      "      if (!window.ReactDOM) { throw new Error(\"ReactDOM n'est pas chargé.\"); }",
      "      if (!('default' in window.ReactDOM)) { window.ReactDOM.default = window.ReactDOM; }",
      "      return window.ReactDOM;",
      "    },",
      "    \"react/jsx-runtime\": function() {",
      "      if (!window.React) { throw new Error(\"React n'est pas chargé.\"); }",
      "      function prepareProps(props, key) {",
      "        if (key === undefined || key === null) {",
      "          return props;",
      "        }",
      "        var target = props ? Object.assign({}, props) : {};",
      "        target.key = key;",
      "        return target;",
      "      }",
      "      function jsxFactory(type, props, key) {",
      "        return window.React.createElement(type, prepareProps(props, key));",
      "      }",
      "      var runtime = {",
      "        Fragment: window.React.Fragment,",
      "        jsx: jsxFactory,",
      "        jsxs: jsxFactory,",
      "        jsxDEV: jsxFactory",
      "      };",
      "      runtime.default = runtime;",
      "      return runtime;",
      "    },",
      "    \"react/jsx-dev-runtime\": function() {",
      "      if (!window.React) { throw new Error(\"React n'est pas chargé.\"); }",
      "      function prepareProps(props, key) {",
      "        if (key === undefined || key === null) {",
      "          return props;",
      "        }",
      "        var target = props ? Object.assign({}, props) : {};",
      "        target.key = key;",
      "        return target;",
      "      }",
      "      function jsxFactory(type, props, key) {",
      "        return window.React.createElement(type, prepareProps(props, key));",
      "      }",
      "      var runtime = {",
      "        Fragment: window.React.Fragment,",
      "        jsx: jsxFactory,",
      "        jsxs: jsxFactory,",
      "        jsxDEV: jsxFactory",
      "      };",
      "      runtime.default = runtime;",
      "      return runtime;",
      "    }",
      "  };",
      "  function define(id, factory) {",
      "    factories[id] = factory;",
      "  }",
      "  function hasFactory(id) {",
      "    return Object.prototype.hasOwnProperty.call(factories, id);",
      "  }",
      "  function dirname(path) {",
      "    var parts = path.split('/');",
      "    parts.pop();",
      "    return parts.join('/');",
      "  }",
      "  function normalize(path) {",
      "    var segments = [];",
      "    path.split('/').forEach(function(segment) {",
      "      if (!segment || segment === '.') return;",
      "      if (segment === '..') {",
      "        segments.pop();",
      "      } else {",
      "        segments.push(segment);",
      "      }",
      "    });",
      "    return segments.join('/');",
      "  }",
      "  function resolve(from, request) {",
      "    if (builtinFactories[request]) {",
      "      return request;",
      "    }",
      "    if (hasFactory(request)) {",
      "      return request;",
      "    }",
      "    if (request.indexOf('.') !== 0) {",
      "      return request;",
      "    }",
      "    var baseDir = dirname(from);",
      "    var base = baseDir ? baseDir + '/' : '';",
      "    var combined = normalize(base + request);",
      "    var attempts = [",
      "      combined,",
      "      combined + '.js',",
      "      combined + '.jsx',",
      "      combined + '.ts',",
      "      combined + '.tsx',",
      "      combined + '.json',",
      "      combined + '.css'",
      "    ];",
      "    for (var i = 0; i < attempts.length; i += 1) {",
      "      var attempt = attempts[i];",
      "      if (hasFactory(attempt) || builtinFactories[attempt]) {",
      "        return attempt;",
      "      }",
      "    }",
      "    var indexAttempts = [",
      "      combined + '/index.js',",
      "      combined + '/index.jsx',",
      "      combined + '/index.ts',",
      "      combined + '/index.tsx'",
      "    ];",
      "    for (var j = 0; j < indexAttempts.length; j += 1) {",
      "      var indexAttempt = indexAttempts[j];",
      "      if (hasFactory(indexAttempt)) {",
      "        return indexAttempt;",
      "      }",
      "    }",
      "    return null;",
      "  }",
      "  function createRequire(from) {",
      "    return function(request) {",
      "      var resolved = resolve(from, request);",
      "      if (!resolved) {",
      "        throw new Error('Module non trouvé: ' + request + ' (depuis ' + from + ')');",
      "      }",
      "      return load(resolved);",
      "    };",
      "  }",
      "  function load(id) {",
      "    if (builtinFactories[id]) {",
      "      if (!modules[id]) {",
      "        var value = builtinFactories[id]();",
      "        modules[id] = { exports: value, initialized: true };",
      "      }",
      "      return modules[id].exports;",
      "    }",
      "    var cached = modules[id];",
      "    if (cached && cached.initialized) {",
      "      return cached.exports;",
      "    }",
      "    var factory = factories[id];",
      "    if (!factory) {",
      "      throw new Error('Module non trouvé: ' + id);",
      "    }",
      "    var module = { exports: {} };",
      "    modules[id] = { exports: module.exports, initialized: true };",
      "    factory(module, module.exports, createRequire(id));",
      "    modules[id].exports = module.exports;",
      "    return modules[id].exports;",
      "  }",
    ];

    moduleDefinitions.forEach((definition) => {
      runtimeLines.push(`  ${definition}`);
    });

    runtimeLines.push("", `  load(${JSON.stringify(entryFile.id)});`, "})();");


    const runtimeScript = runtimeLines.join("\n");
    const sanitizedRuntime = runtimeScript.replace(/<\/script>/g, "<\\/script>");

    const doc = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview React</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
      #root { min-height: 100vh; }
      #error-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.92);
        color: #f1f5f9;
        padding: 32px;
        font-size: 14px;
        overflow: auto;
        z-index: 9999;
      }
      #error-overlay pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        font-family: 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div id="error-overlay"><pre></pre></div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
      (function() {
        var overlay = document.getElementById('error-overlay');
        var pre = overlay ? overlay.querySelector('pre') : null;
        function showError(message) {
          if (!overlay || !pre) return;
          overlay.style.display = 'block';
          pre.textContent = message;
        }
        window.addEventListener('error', function(event) {
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          if (event?.error) {
            showError(event.error.stack || event.error.message || String(event.error));
          } else if (event?.message) {
            showError(event.message);
          }
        });
        window.addEventListener('unhandledrejection', function(event) {
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          if (event?.reason) {
            showError(event.reason.stack || event.reason.message || String(event.reason));
          }
        });
      })();
    </script>
    <script>${sanitizedRuntime}</script>
  </body>
</html>`;

    return { doc, error: null };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue lors de la génération de la preview.";
    return { doc: createErrorDocument(message), error: message };
  }
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
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState("preview");

  useEffect(() => {
    const parsedFiles = parseWebsiteFiles(result?.code);
    setFiles(parsedFiles);
  }, [result?.code]);

  useEffect(() => {
    if (files.length === 0) {
      setActiveFileId(null);
      return;
    }

    setActiveFileId((previous) => {
      if (previous && files.some((file) => file.id === previous)) {
        return previous;
      }
      return files[0]?.id ?? null;
    });
  }, [files]);

  useEffect(() => {
    if (result?.code) {
      setTabValue("preview");
    }
  }, [result?.code]);

  const activeFile = activeFileId
    ? files.find((file) => file.id === activeFileId)
    : undefined;

  const previewState = useMemo(() => createReactPreviewDocument(files), [files]);
  const previewDoc = previewState.doc;
  const previewError = previewState.error;

  const handleFileContentChange = useCallback((fileId: string, newContent: string) => {
    setFiles((current) =>
      current.map((file) =>
        file.id === fileId
          ? {
              ...file,
              content: newContent,
            }
          : file,
      ),
    );
  }, []);

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
                        : "hover:bg-muted/60 text-muted-foreground",
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

        <PanelGroup direction="horizontal" className="flex flex-1 overflow-hidden">
          <Panel defaultSize={60} minSize={40} className="flex flex-col">
            <div className="flex flex-1 flex-col">
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
            </div>
          </Panel>
          <PanelResizeHandle className="group hidden xl:flex w-4 cursor-col-resize items-center justify-center bg-transparent">
            <div className="h-12 w-[2px] rounded-full bg-border transition-colors duration-200 group-data-[resize-handle-active=true]:bg-primary" />
          </PanelResizeHandle>
          <Panel
            defaultSize={40}
            minSize={25}
            className="hidden xl:flex flex-col border-l border-border/40 bg-muted/10"
          >
            <Tabs value={tabValue} onValueChange={setTabValue} className="flex h-full flex-col">
              <div className="border-b border-border/40 px-4 py-3">
                <TabsList className="h-9 bg-background/80">
                  <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                  <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="preview" className="flex h-full flex-col gap-3 px-4 pb-4">
                <div className="flex-1 overflow-hidden rounded-xl border border-border/40 bg-white shadow-inner">
                  {previewDoc ? (
                    <iframe
                      srcDoc={previewDoc}
                      title="Preview du site généré"
                      className="h-full w-full"
                      sandbox="allow-scripts allow-pointer-lock allow-same-origin"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
                      Générez un projet React pour visualiser la preview interactive.
                    </div>
                  )}
                </div>
                {previewError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {previewError}
                  </div>
                ) : null}
              </TabsContent>
              <TabsContent value="code" className="flex h-full flex-col gap-3 px-4 pb-4">
                <div className="rounded-lg border border-border/40 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {activeFile?.name ?? "Sélectionnez un fichier"}
                </div>
                <div className="rounded-lg border border-dashed border-border/40 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
                  Modifiez le code ci-dessous pour personnaliser votre site. La preview se met à jour automatiquement.
                </div>
                <div className="flex-1 overflow-hidden rounded-xl border border-border/40 bg-background">
                  {activeFile ? (
                    <textarea
                      value={activeFile.content}
                      onChange={(event) => handleFileContentChange(activeFile.id, event.target.value)}
                      className="h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-xs text-foreground outline-none focus-visible:outline-none focus-visible:ring-0"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
                      Générez un site pour consulter et modifier son code.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default WebsiteBuilderWorkspace;
