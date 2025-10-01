import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Sparkles } from "lucide-react";

interface ResultDisplayProps {
  result: {
    type: string;
    content: string;
    preview?: string;
  } | null;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
  if (!result) return null;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Votre création</h3>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-background/50 p-4 min-h-[300px] flex items-center justify-center">
          {result.preview ? (
            <img 
              src={result.preview} 
              alt="Résultat" 
              className="max-w-full max-h-[400px] object-contain rounded-lg"
            />
          ) : (
            <div className="text-center space-y-4">
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
