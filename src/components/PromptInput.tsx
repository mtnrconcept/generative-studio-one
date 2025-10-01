import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  selectedCategory: string;
}

const PromptInput = ({ onSubmit, isLoading, selectedCategory }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Décrivez votre ${selectedCategory.toLowerCase()} en détail...`}
          className="min-h-[120px] bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 resize-none text-base"
          disabled={isLoading}
        />
        
        {selectedCategory && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-xs text-white">
            {selectedCategory}
          </div>
        )}
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white transition-all duration-300 shadow-[var(--shadow-glow)] hover:shadow-[0_0_50px_hsl(263_70%_60%/0.5)] h-12 text-lg font-semibold"
      >
        <Sparkles className="mr-2 h-5 w-5" />
        {isLoading ? "Création en cours..." : "Créer avec l'IA"}
      </Button>
    </div>
  );
};

export default PromptInput;
