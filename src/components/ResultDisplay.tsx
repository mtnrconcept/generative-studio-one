import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Sparkles } from "lucide-react";
import CodeViewer from "./CodeViewer";

interface ResultDisplayProps {
  result: {
    type: string;
    category: string;
    content: string;
    preview?: string;
    code?: string;
  } | null;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
  if (!result) return null;

  const handleDownloadImage = () => {
    if (result.preview) {
      const a = document.createElement('a');
      a.href = result.preview;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Votre création</h3>
          </div>
          
          {result.type === 'image' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-border/50 hover:border-primary/50"
                onClick={handleDownloadImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-background/50 p-4">
          {result.type === 'image' && result.preview ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <img 
                src={result.preview} 
                alt="Résultat" 
                className="max-w-full max-h-[500px] object-contain rounded-lg"
              />
            </div>
          ) : result.type === 'code' && result.code ? (
            <CodeViewer code={result.code} category={result.category} />
          ) : result.type === 'description' ? (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {result.content}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 min-h-[300px] flex flex-col items-center justify-center">
              <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground max-w-md">
                {result.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResultDisplay;
