import { useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, FileText, Folder } from "lucide-react";
import JSZip from "jszip";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { GeneratedFile } from "@/types/result";

interface ReactProjectViewerProps {
  files: GeneratedFile[];
  instructions?: string;
  projectName?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

const languageFromExtension = (path: string, fallback?: string) => {
  const extension = path.split('.').pop();

  switch (extension) {
    case 'ts':
    case 'cts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
    case 'cjs':
    case 'mjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'html':
      return 'html';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'yml':
    case 'yaml':
      return 'yaml';
    default:
      return fallback || 'tsx';
  }
};

const normalizeFiles = (files: GeneratedFile[]) =>
  files
    .filter((file) => file.path && file.content !== undefined)
    .map((file) => ({
      ...file,
      path: file.path.replace(/^\.\//, ''),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

const buildTree = (files: GeneratedFile[]): FileNode[] => {
  const root: FileNode = {
    name: '',
    path: '',
    type: 'directory',
    children: [],
  };

  normalizeFiles(files).forEach((file) => {
    const segments = file.path.split('/');
    let current = root;

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      if (isFile) {
        current.children?.push({
          name: segment,
          path: file.path,
          type: 'file',
          content: file.content,
        });
        return;
      }

      if (!current.children) {
        current.children = [];
      }

      let child = current.children.find((node) => node.name === segment && node.type === 'directory');

      if (!child) {
        child = {
          name: segment,
          path: `${current.path ? `${current.path}/` : ''}${segment}`,
          type: 'directory',
          children: [],
        };
        current.children.push(child);
      }

      current = child;
    });
  });

  const sortTree = (nodes?: FileNode[]) => {
    if (!nodes) return;

    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

    nodes.forEach((node) => {
      if (node.children) sortTree(node.children);
    });
  };

  sortTree(root.children);

  return root.children ?? [];
};

const ReactProjectViewer = ({ files, instructions, projectName }: ReactProjectViewerProps) => {
  const normalizedFiles = useMemo(() => normalizeFiles(files), [files]);
  const fileTree = useMemo(() => buildTree(files), [files]);
  const [activeFile, setActiveFile] = useState(normalizedFiles[0]?.path ?? '');

  const fileMap = useMemo(() => {
    const map = new Map<string, GeneratedFile>();
    normalizedFiles.forEach((file) => {
      map.set(file.path, file);
    });
    return map;
  }, [normalizedFiles]);

  const activeFileContent = activeFile ? fileMap.get(activeFile)?.content ?? '' : '';
  const activeLanguage = activeFile ? languageFromExtension(activeFile, fileMap.get(activeFile)?.language) : 'tsx';

  const handleDownloadProject = async () => {
    const zip = new JSZip();

    normalizedFiles.forEach((file) => {
      zip.file(file.path, file.content);
    });

    if (!normalizedFiles.some((file) => file.path === 'package.json')) {
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: (projectName || 'generated-react-project').replace(/\s+/g, '-').toLowerCase(),
            private: true,
            version: '1.0.0',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
            },
            devDependencies: {
              vite: '^5.4.0',
            },
          },
          null,
          2,
        ),
      );
    }

    if (!normalizedFiles.some((file) => file.path === 'README.md') && instructions) {
      zip.file('README.md', instructions);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(projectName || 'react-project').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTree = (nodes: FileNode[], depth = 0): JSX.Element[] =>
    nodes.map((node) => {
      if (node.type === 'directory') {
        return (
          <div key={node.path} className="space-y-1">
            <div className={cn('flex items-center gap-2 text-sm font-medium text-muted-foreground', depth > 0 && 'pl-3')}>
              <Folder className="h-4 w-4" />
              {node.name || 'Projet'}
            </div>
            <div className="pl-4 space-y-1 border-l border-border/40">
              {node.children ? renderTree(node.children, depth + 1) : null}
            </div>
          </div>
        );
      }

      return (
        <button
          key={node.path}
          type="button"
          onClick={() => setActiveFile(node.path)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition',
            'hover:bg-muted/60 hover:text-foreground',
            activeFile === node.path && 'bg-muted text-foreground font-medium',
          )}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate" title={node.path}>
            {node.name}
          </span>
        </button>
      );
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-border/50 bg-background/60">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Arborescence du projet</p>
            <p className="text-xs text-muted-foreground">
              {projectName || 'Structure React générée'}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadProject}>
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
        </div>
        <ScrollArea className="h-[320px]">
          <div className="space-y-1 px-2 py-3">
            {fileTree.length ? renderTree(fileTree) : (
              <p className="px-3 text-sm text-muted-foreground">Aucun fichier disponible.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-4">
        {instructions && (
          <div className="rounded-lg border border-border/50 bg-background/60 p-4">
            <p className="text-sm font-semibold text-foreground">Instructions</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {instructions}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2">
            <p className="text-sm font-semibold text-foreground">
              {activeFile || 'Sélectionnez un fichier pour afficher son contenu'}
            </p>
          </div>
          <div className="max-h-[420px] overflow-auto">
            {activeFileContent ? (
              <SyntaxHighlighter
                language={activeLanguage}
                style={vscDarkPlus}
                customStyle={{ margin: 0, fontSize: '14px', background: 'transparent' }}
                showLineNumbers
              >
                {activeFileContent}
              </SyntaxHighlighter>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Sélectionnez un fichier dans la liste pour prévisualiser le code.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactProjectViewer;
