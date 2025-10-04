import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Star, Search, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KENNEY_ASSET_CATALOG, type KenneyAssetPack } from "@/lib/kenneyAssetCatalog";

interface AssetManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetsSelected?: (packs: KenneyAssetPack[]) => void;
}

export function AssetManager({ open, onOpenChange, onAssetsSelected }: AssetManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "2D" | "3D" | "UI" | "Audio" | "Fonts">("all");
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
  const [favoritePacks, setFavoritePacks] = useState<Set<string>>(new Set());
  const [downloadedPacks, setDownloadedPacks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load user's favorites and downloads
  useEffect(() => {
    if (open) {
      loadUserPacks();
    }
  }, [open]);

  const loadUserPacks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_asset_packs')
        .select('pack_id, is_favorite, kenney_asset_packs(slug)')
        .eq('user_id', user.id);

      if (error) throw error;

      const favorites = new Set<string>();
      const downloaded = new Set<string>();

      data?.forEach(item => {
        const slug = (item.kenney_asset_packs as any)?.slug;
        if (slug) {
          downloaded.add(slug);
          if (item.is_favorite) {
            favorites.add(slug);
          }
        }
      });

      setFavoritePacks(favorites);
      setDownloadedPacks(downloaded);
    } catch (error) {
      console.error('Error loading user packs:', error);
    }
  };

  const filteredPacks = KENNEY_ASSET_CATALOG.filter(pack => {
    const matchesCategory = selectedCategory === "all" || pack.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const togglePackSelection = (slug: string) => {
    setSelectedPacks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const toggleFavorite = async (slug: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You need to be logged in to favorite packs");
        return;
      }

      const pack = KENNEY_ASSET_CATALOG.find(p => p.slug === slug);
      if (!pack) return;

      // Get pack ID from database
      let packId: string;
      const { data: existingPack } = await supabase
        .from('kenney_asset_packs')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingPack) {
        packId = existingPack.id;
      } else {
        // Insert pack if it doesn't exist
        const { data: newPack, error: insertError } = await supabase
          .from('kenney_asset_packs')
          .insert({
            name: pack.name,
            slug: pack.slug,
            description: pack.description,
            category: pack.category,
            download_url: pack.downloadUrl,
            thumbnail_url: pack.thumbnailUrl,
            file_size: pack.fileSize,
            tags: pack.tags
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        packId = newPack.id;
      }

      const isFavorite = favoritePacks.has(slug);

      if (isFavorite) {
        await supabase
          .from('user_asset_packs')
          .delete()
          .eq('user_id', user.id)
          .eq('pack_id', packId);
        
        setFavoritePacks(prev => {
          const newSet = new Set(prev);
          newSet.delete(slug);
          return newSet;
        });
      } else {
        await supabase
          .from('user_asset_packs')
          .upsert({
            user_id: user.id,
            pack_id: packId,
            is_favorite: true
          });

        setFavoritePacks(prev => new Set(prev).add(slug));
      }

      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorites");
    }
  };

  const handleApplySelection = () => {
    const selected = KENNEY_ASSET_CATALOG.filter(pack => selectedPacks.has(pack.slug));
    onAssetsSelected?.(selected);
    toast.success(`${selected.length} asset pack(s) selected for your game`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Kenney Asset Library</DialogTitle>
          <DialogDescription>
            Browse and select asset packs for your game. {selectedPacks.size > 0 && `${selectedPacks.size} selected`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {selectedPacks.size > 0 && (
              <Button onClick={handleApplySelection}>
                Apply Selection ({selectedPacks.size})
              </Button>
            )}
          </div>

          <Tabs value={selectedCategory} onValueChange={(v: any) => setSelectedCategory(v)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="2D">2D</TabsTrigger>
              <TabsTrigger value="3D">3D</TabsTrigger>
              <TabsTrigger value="UI">UI</TabsTrigger>
              <TabsTrigger value="Audio">Audio</TabsTrigger>
              <TabsTrigger value="Fonts">Fonts</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {filteredPacks.map((pack) => (
                    <Card 
                      key={pack.slug}
                      className={`cursor-pointer transition-all ${
                        selectedPacks.has(pack.slug) ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => togglePackSelection(pack.slug)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{pack.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {pack.fileSize}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(pack.slug);
                            }}
                          >
                            <Star className={`h-4 w-4 ${favoritePacks.has(pack.slug) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <img 
                          src={pack.thumbnailUrl} 
                          alt={pack.name}
                          className="w-full h-32 object-cover rounded-md mb-2"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {pack.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {pack.category}
                        </Badge>
                        {pack.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
