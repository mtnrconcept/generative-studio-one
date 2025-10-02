import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Code2, Eye, Download } from "lucide-react";
import JSZip from "jszip";

interface CodeViewerProps {
  code: string;
  category: string;
}

const CodeViewer = ({ code, category }: CodeViewerProps) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

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
      case 'app':
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
          <SyntaxHighlighter
            language={getLanguage()}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              maxHeight: '500px',
              fontSize: '14px'
            }}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-border/50 bg-white">
          <iframe
            srcDoc={code}
            className="w-full h-[500px]"
            title="Preview"
            sandbox="allow-scripts allow-pointer-lock"
          />
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
