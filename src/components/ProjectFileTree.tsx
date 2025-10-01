import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { GeneratedFile } from "@/types/result";
import { Folder, FileText } from "lucide-react";

interface ProjectFileTreeProps {
  files: GeneratedFile[];
  activeFile?: string;
  onSelect: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

const buildTree = (files: GeneratedFile[]): TreeNode[] => {
  const root: TreeNode = { name: "", path: "", type: "directory", children: [] };

  files.forEach((file) => {
    const segments = file.path.split("/");
    let current = root;

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      if (isFile) {
        current.children?.push({ name: segment, path: file.path, type: "file" });
        return;
      }

      if (!current.children) {
        current.children = [];
      }

      let child = current.children.find((node) => node.name === segment && node.type === "directory");

      if (!child) {
        child = {
          name: segment,
          path: current.path ? `${current.path}/${segment}` : segment,
          type: "directory",
          children: [],
        };
        current.children.push(child);
      }

      current = child;
    });
  });

  const sortNodes = (nodes?: TreeNode[]) => {
    if (!nodes) return;

    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "directory" ? -1 : 1;
    });

    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(root.children);

  return root.children ?? [];
};

const ProjectFileTree = ({ files, activeFile, onSelect }: ProjectFileTreeProps) => {
  const tree = useMemo(() => buildTree(files), [files]);

  const renderNode = (node: TreeNode, depth = 0): JSX.Element => {
    if (node.type === "directory") {
      return (
        <div key={node.path} className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              depth > 0 && "pl-3",
            )}
          >
            <Folder className="h-4 w-4" />
            <span>{node.name || "Projet"}</span>
          </div>
          <div className="pl-4">
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </div>
        </div>
      );
    }

    const isActive = activeFile === node.path || activeFile === `/${node.path}`;

    return (
      <button
        key={node.path}
        type="button"
        onClick={() => onSelect(node.path)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition",
          "hover:bg-muted/60 hover:text-foreground",
          isActive && "bg-muted text-foreground font-medium",
        )}
      >
        <FileText className="h-4 w-4" />
        <span className="truncate" title={node.path}>
          {node.name}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-background/60">
      <div className="border-b border-border/40 px-4 py-3">
        <p className="text-sm font-semibold text-muted-foreground">Arborescence du projet</p>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        {tree.length ? (
          <div className="space-y-2">{tree.map((node) => renderNode(node))}</div>
        ) : (
          <p className="px-3 text-sm text-muted-foreground">Aucun fichier généré pour l'instant.</p>
        )}
      </ScrollArea>
    </div>
  );
};

export default ProjectFileTree;
