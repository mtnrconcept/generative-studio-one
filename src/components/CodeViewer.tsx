import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Eye, Download } from "lucide-react";
import JSZip from "jszip";
import type { ContextualEditPayload } from "@/types/editor";

interface CodeViewerProps {
  code: string;
  category: string;
  onContextEdit?: (payload: ContextualEditPayload) => void;
}

interface SelectedElementState {
  targetSelector: string;
  textContent: string;
  outerHTML: string;
  highlightBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  editorPosition: {
    top: number;
    left: number;
  };
}

const overlayWidth = 280;
const estimatedOverlayHeight = 220;

const CodeViewer = ({ code, category, onContextEdit }: CodeViewerProps) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [selectedElement, setSelectedElement] = useState<SelectedElementState | null>(null);
  const [contextInstruction, setContextInstruction] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const instructionRef = useRef<HTMLTextAreaElement | null>(null);

  const getLanguage = () => {
    switch (category) {
      case 'website':
      case 'game':
        return 'html';
      case 'app':
        return 'jsx';
      case 'agent':
        return 'python';
      default:
        return 'javascript';
    }
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    
    switch (category) {
      case 'website':
      case 'game':
        zip.file("index.html", code);
        break;
      case 'app': {
        // Extraire le JSX et le CSS si possible
        const jsxMatch = code.match(/<!-- App\.jsx -->([\s\S]*?)<!-- App\.css -->/);
        const cssMatch = code.match(/<!-- App\.css -->([\s\S]*?)$/);

        if (jsxMatch) {
          zip.file("App.jsx", jsxMatch[1].trim());
        }
        if (cssMatch) {
          zip.file("App.css", cssMatch[1].trim());
        }
        if (!jsxMatch && !cssMatch) {
          zip.file("App.jsx", code);
        }

        // Ajouter le package.json
        zip.file("package.json", JSON.stringify({
          name: "generated-app",
          version: "1.0.0",
          dependencies: {
            "react": "^18.3.1",
            "react-dom": "^18.3.1"
          }
        }, null, 2));
        break;
      }
      case 'agent':
        zip.file("agent.py", code);
        zip.file("requirements.txt", "requests\npython-dotenv");
        break;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canPreview = category === 'website' || category === 'game';

  const buildSelector = (element: HTMLElement) => {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classSelector = element.classList.length
      ? `.${Array.from(element.classList).join('.')}`
      : '';

    return `${tag}${id}${classSelector}`;
  };

  const resetSelection = () => {
    setSelectedElement(null);
    setContextInstruction("");
  };

  useEffect(() => {
    if (viewMode !== 'preview' || !onContextEdit) {
      resetSelection();
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    let cleanupDoc: (() => void) | undefined;

    const attachListeners = () => {
      const doc = iframe.contentDocument;
      const container = previewContainerRef.current;

      if (!doc || !container) {
        return;
      }

      const originalCursor = doc.body?.style.cursor;

      const handleClick = (event: MouseEvent) => {
        if (!onContextEdit) return;

        event.preventDefault();
        event.stopPropagation();

        const target = event.target as HTMLElement | null;
        if (!target) return;

        const containerRect = container.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const baseTop = targetRect.top + iframeRect.top - containerRect.top + container.scrollTop;
        const baseLeft = targetRect.left + iframeRect.left - containerRect.left + container.scrollLeft;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const belowTop = baseTop + targetRect.height + 8;
        const fitsBelow = belowTop + estimatedOverlayHeight <= containerHeight;
        const editorTop = fitsBelow ? belowTop : Math.max(8, baseTop - estimatedOverlayHeight - 8);

        const maxLeft = Math.max(8, containerWidth - overlayWidth - 8);
        const editorLeft = Math.min(Math.max(8, baseLeft), maxLeft);

        setSelectedElement({
          targetSelector: buildSelector(target),
          textContent: target.textContent?.trim().slice(0, 160) ?? '',
          outerHTML: target.outerHTML,
          highlightBox: {
            top: Math.max(0, baseTop - 2),
            left: Math.max(0, baseLeft - 2),
            width: targetRect.width + 4,
            height: targetRect.height + 4,
          },
          editorPosition: {
            top: editorTop,
            left: editorLeft,
          },
        });
        setContextInstruction("");
      };

      doc.addEventListener('click', handleClick, true);
      if (doc.body) {
        doc.body.style.cursor = 'pointer';
      }

      cleanupDoc = () => {
        doc.removeEventListener('click', handleClick, true);
        if (doc.body) {
          doc.body.style.cursor = originalCursor || '';
        }
      };
    };

    if (iframe.contentDocument?.readyState === 'complete' || iframe.contentDocument?.readyState === 'interactive') {
      attachListeners();
    }

    iframe.addEventListener('load', attachListeners);

    return () => {
      iframe.removeEventListener('load', attachListeners);
      cleanupDoc?.();
    };
  }, [viewMode, code, onContextEdit]);

  useEffect(() => {
    if (selectedElement && instructionRef.current) {
      instructionRef.current.focus();
    }
  }, [selectedElement]);

  const handleContextSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedElement || !onContextEdit || !contextInstruction.trim()) {
      return;
    }

    const payload: ContextualEditPayload = {
      targetSelector: selectedElement.targetSelector,
      textContent: selectedElement.textContent,
      outerHTML: selectedElement.outerHTML,
      instruction: contextInstruction.trim(),
    };

    onContextEdit(payload);
    resetSelection();
  };

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        resetSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('code')}
            className="gap-2"
          >
            <Code2 className="h-4 w-4" />
            Code
          </Button>
          {canPreview && (
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Télécharger ZIP
        </Button>
      </div>

      {viewMode === 'code' ? (
        <div className="rounded-lg overflow-hidden border border-border/50">
          <div className="resize-y overflow-auto" style={{ minHeight: '280px', maxHeight: '80vh' }}>
            <SyntaxHighlighter
              language={getLanguage()}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                background: 'transparent',
                fontSize: '14px'
              }}
              showLineNumbers
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 bg-white">
          <div
            ref={previewContainerRef}
            className="relative resize-y overflow-auto"
            style={{ minHeight: '280px', maxHeight: '80vh' }}
          >
            {onContextEdit && (
              <div className="absolute left-3 top-3 z-10 rounded-md bg-black/70 px-3 py-1 text-xs font-medium text-white">
                Cliquez sur un élément pour le modifier
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={code}
              className="h-full min-h-[280px] w-full"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
            {selectedElement && (
              <>
                <div
                  className="pointer-events-none absolute z-20 rounded-md border-2 border-primary/80 shadow-[0_0_0_2px_rgba(12,10,9,0.4)]"
                  style={{
                    top: `${selectedElement.highlightBox.top}px`,
                    left: `${selectedElement.highlightBox.left}px`,
                    width: `${selectedElement.highlightBox.width}px`,
                    height: `${selectedElement.highlightBox.height}px`,
                  }}
                />
                <form
                  onSubmit={handleContextSubmit}
                  className="absolute z-30 w-[280px] rounded-md border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur"
                  style={{
                    top: `${selectedElement.editorPosition.top}px`,
                    left: `${selectedElement.editorPosition.left}px`,
                  }}
                >
                  <p className="text-xs font-semibold text-foreground">
                    Élément sélectionné : {selectedElement.targetSelector}
                  </p>
                  {selectedElement.textContent && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Contenu actuel : {selectedElement.textContent}
                    </p>
                  )}
                  <Textarea
                    ref={instructionRef}
                    value={contextInstruction}
                    onChange={(event) => setContextInstruction(event.target.value)}
                    placeholder="Décrivez la modification souhaitée"
                    className="mt-3 h-24 text-sm"
                  />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={resetSelection}>
                      Annuler
                    </Button>
                    <Button type="submit" size="sm" disabled={!contextInstruction.trim()}>
                      Appliquer
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
