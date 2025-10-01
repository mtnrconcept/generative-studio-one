import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-semibold text-foreground">Page introuvable</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            La page que vous recherchez semble avoir disparu dans le cyberespace.
          </p>
        </div>
        
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
        >
          <Home className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
