import { useMemo, useState, type FormEvent } from "react";
import { Bot, Check, Boxes, MessageSquare, Plus, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CodeViewer from "./CodeViewer";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type GameAsset = {
  id: string;
  name: string;
  category: string;
  description: string;
  gradient: string;
};

type GameBuilderProps = {
  onBack: () => void;
};

type GameSummary = {
  title: string;
  theme: string;
  elevatorPitch: string;
  objectives: string[];
  environment: string;
};

const gradientPalette = [
  "from-amber-400 to-orange-600",
  "from-rose-400 to-purple-500",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-fuchsia-400 to-indigo-500",
  "from-lime-400 to-green-500",
];

const initialSummary: GameSummary = {
  title: "Jeu de cowboy en forêt",
  theme: "Action-aventure low-poly dans un canyon forestier",
  elevatorPitch:
    "Incarnez un ranger-cowboy chargé de défendre un avant-poste isolé dans une forêt d'automne. Combinez exploration, craft léger et duels contre des bandits robotisés.",
  objectives: [
    "Explorer les ruines de l'avant-poste pour collecter des ressources",
    "Reprogrammer les tourelles défensives à l'aide d'artefacts trouvés",
    "Protéger les colons lors d'assauts nocturnes",
  ],
  environment: "Plateaux rocheux avec végétation rougeoyante, rivière brumeuse et lumière rasante du coucher de soleil",
};

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "Bonjour ! Décris-moi ton jeu idéal et je générerai une première version jouable. Tu pourras ensuite me demander n'importe quelle modification.",
  },
  {
    id: "assistant-2",
    role: "assistant",
    content:
      "J'ai commencé avec un décor de canyon forestier et un personnage principal cowboy stylisé. Que souhaites-tu ajuster ensuite ?",
  },
];

const initialAssets: GameAsset[] = [
  {
    id: "asset-1",
    name: "Cabane Ranger",
    category: "Décor",
    description: "Cabane principale avec enseigne lumineuse",
    gradient: gradientPalette[0],
  },
  {
    id: "asset-2",
    name: "Chicken Bot",
    category: "Personnage",
    description: "Robot patrouilleur humoristique",
    gradient: gradientPalette[2],
  },
  {
    id: "asset-3",
    name: "Totem Lumineux",
    category: "Interactivité",
    description: "Active des bonus de perception",
    gradient: gradientPalette[1],
  },
  {
    id: "asset-4",
    name: "Wagon Blindé",
    category: "Décor",
    description: "Wagon abandonné servant de couverture",
    gradient: gradientPalette[3],
  },
  {
    id: "asset-5",
    name: "Chien Robot",
    category: "Compagnon",
    description: "Allié qui piste les intrus",
    gradient: gradientPalette[5],
  },
  {
    id: "asset-6",
    name: "Golem de Pierre",
    category: "Boss",
    description: "Gardien animé par énergie solaire",
    gradient: gradientPalette[4],
  },
];

const sampleCode = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Frontier Canyon</title>
    <style>
      body { margin: 0; font-family: 'Inter', sans-serif; background: #0b0f1a; color: white; }
      canvas { display: block; }
      #hud {
        position: absolute;
        top: 32px;
        left: 32px;
        padding: 16px 20px;
        background: rgba(9, 12, 20, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        backdrop-filter: blur(14px);
      }
      .hud-title { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
      .hud-sub { opacity: 0.7; font-size: 14px; }
    </style>
  </head>
  <body>
    <div id="hud">
      <div class="hud-title">Ranger Ezra</div>
      <div class="hud-sub">Mission : sécuriser l'avant-poste brumeux</div>
    </div>
    <canvas id="scene"></canvas>
    <script type="module">
      import * as THREE from 'https://cdn.skypack.dev/three@0.160.0';
      import { OrbitControls } from 'https://cdn.skypack.dev/three@0.160.0/examples/jsm/controls/OrbitControls.js';

      const canvas = document.getElementById('scene');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#2a3348');

      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
      camera.position.set(6, 5, 9);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      const ambient = new THREE.HemisphereLight('#fcd18b', '#20202a', 1.1);
      scene.add(ambient);

      const sun = new THREE.DirectionalLight('#ffb16a', 1.2);
      sun.position.set(12, 15, 6);
      sun.castShadow = true;
      scene.add(sun);

      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(20, 1, 20),
        new THREE.MeshStandardMaterial({ color: '#9b5f39' })
      );
      ground.position.y = -0.6;
      ground.receiveShadow = true;
      scene.add(ground);

      const canyon = new THREE.Group();
      for (let i = 0; i < 24; i++) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1 + Math.random() * 2.5, 1.2),
          new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? '#d1854d' : '#c0663c' })
        );
        block.position.set((Math.random() - 0.5) * 12, block.geometry.parameters.height / 2 - 0.5, (Math.random() - 0.5) * 12);
        block.castShadow = true;
        canyon.add(block);
      }
      scene.add(canyon);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.4, 1.8),
        new THREE.MeshStandardMaterial({ color: '#5a4334' })
      );
      cabin.position.set(-1.2, 0.3, 0);
      cabin.castShadow = true;
      scene.add(cabin);

      const ranger = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.25, 0.9, 6, 12),
        new THREE.MeshStandardMaterial({ color: '#f5d7a1' })
      );
      ranger.position.set(0, 1, 0);
      ranger.castShadow = true;
      scene.add(ranger);

      const drone = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#f36f6f', emissive: '#ffb347', emissiveIntensity: 0.6 })
      );
      drone.position.set(1.6, 1.6, -0.8);
      drone.castShadow = true;
      scene.add(drone);

      const clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        drone.position.y = 1.6 + Math.sin(t * 2) * 0.2;
        drone.rotation.y += 0.01;
        controls.update();
        renderer.render(scene, camera);
      }

      animate();

      window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      });
    </script>
  </body>
</html>`;

const GameBuilder = ({ onBack }: GameBuilderProps) => {
  const [summary, setSummary] = useState<GameSummary>(initialSummary);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [assets, setAssets] = useState<GameAsset[]>(initialAssets);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set(["asset-1", "asset-2"]));
  const [assetPrompt, setAssetPrompt] = useState("");
  const [updates, setUpdates] = useState<string[]>([
    "Terrain généré avec variations de hauteur et occlusion atmosphérique",
    "Cycle jour/nuit configuré avec intensité rougeoyante",
  ]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageInput.trim(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: generateAssistantReply(messageInput.trim()),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setUpdates((prev) => [
      `Modification : ${messageInput.trim()}`,
      ...prev,
    ]);
    setSummary((prev) => ({
      ...prev,
      elevatorPitch: updatePitch(prev.elevatorPitch, messageInput.trim()),
    }));
    setMessageInput("");
  };

  const generateAssistantReply = (message: string) => {
    return `Compris ! J'ai mis à jour la scène pour refléter : « ${message} ». Tu peux prévisualiser la mise à jour et me demander d'autres ajustements.`;
  };

  const updatePitch = (current: string, message: string) => {
    if (!message) return current;
    const sentence = `\n\nMise à jour récente : ${message}.`;
    if (current.includes("Mise à jour récente")) {
      return current.replace(/Mise à jour récente :[\s\S]*$/, `Mise à jour récente : ${message}.`);
    }
    return `${current}${sentence}`;
  };

  const handleToggleAsset = (assetId: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const handleGenerateAsset = () => {
    if (!assetPrompt.trim()) return;
    const gradient = gradientPalette[assets.length % gradientPalette.length];
    const newAsset: GameAsset = {
      id: `generated-${Date.now()}`,
      name: assetPrompt.trim(),
      category: "Généré IA",
      description: "Asset généré à partir de votre prompt",
      gradient,
    };
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssets((prev) => new Set(prev).add(newAsset.id));
    setAssetPrompt("");
    setUpdates((prev) => [`Nouvel asset généré : ${newAsset.name}`, ...prev]);
  };

  const selectedAssetDetails = useMemo(
    () => assets.filter((asset) => selectedAssets.has(asset.id)),
    [assets, selectedAssets]
  );

  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="ghost" className="px-2" onClick={onBack}>
          ← Retour
        </Button>
        <span>/</span>
        <span>Studio Jeux Vidéo</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/50 bg-card/70 backdrop-blur">
            <div className="relative h-40 w-full bg-gradient-to-br from-orange-400/70 via-amber-500/70 to-slate-900">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80')] opacity-40 bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
              <div className="absolute bottom-4 left-4 space-y-1">
                <Badge className="bg-white/15 text-white backdrop-blur">Prototype</Badge>
                <h2 className="text-2xl font-semibold text-white drop-shadow-md">{summary.title}</h2>
                <p className="text-sm text-white/80 max-w-xs">{summary.theme}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pitch
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {summary.elevatorPitch}
                </p>
              </div>
              <Separator className="bg-border/40" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Objectifs clés
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                  {summary.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-primary" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator className="bg-border/40" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Environnement
                </h3>
                <p className="text-sm text-foreground/90">{summary.environment}</p>
              </div>
            </div>
          </Card>

          <Card className="border-border/50 bg-card/70 backdrop-blur">
            <div className="p-5 pb-3 flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Assistant de conception</p>
                <p className="text-xs text-muted-foreground">
                  Discute avec l'IA pour ajuster ton prototype
                </p>
              </div>
            </div>
            <Separator className="bg-border/40" />
            <ScrollArea className="h-[320px] px-5 py-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                      message.role === "assistant"
                        ? "bg-primary/10 border-primary/20"
                        : "bg-background/80 border-border/60"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                      {message.role === "assistant" ? (
                        <>
                          <Bot className="h-3.5 w-3.5" />
                          <span>Assistant</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Toi</span>
                        </>
                      )}
                    </div>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator className="bg-border/40" />
            <form onSubmit={handleSendMessage} className="p-4 space-y-3">
              <Input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder="Décris une modification ou une nouvelle idée"
              />
              <Button type="submit" className="w-full gap-2">
                <Send className="h-4 w-4" />
                Envoyer et mettre à jour
              </Button>
            </form>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/70 backdrop-blur">
          <Tabs defaultValue="preview" className="w-full">
            <div className="border-b border-border/50 px-6 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Espace de production</h2>
                  <p className="text-sm text-muted-foreground">
                    Prévisualise, ajoute des assets et consulte le code complet
                  </p>
                </div>
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="preview" className="p-6 pt-4">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="absolute inset-0 opacity-70 bg-[url('https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay" />
                  <div className="relative p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border border-primary/40">Mode Gameplay</Badge>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
                        <span>Keys</span>
                        <div className="flex gap-1 text-white">
                          <span>W</span>
                          <span>A</span>
                          <span>S</span>
                          <span>D</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white drop-shadow-md">{summary.title}</h3>
                      <p className="mt-2 text-sm text-white/80 max-w-xl">
                        {summary.elevatorPitch}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/60">Sélection actuelle</p>
                        <ul className="mt-3 space-y-2 text-sm text-white/90">
                          {selectedAssetDetails.map((asset) => (
                            <li key={asset.id} className="flex items-center gap-2">
                              <Boxes className="h-4 w-4 text-white/70" />
                              <span>{asset.name}</span>
                            </li>
                          ))}
                          {selectedAssetDetails.length === 0 && (
                            <li className="text-white/60">Aucun asset actif pour le moment</li>
                          )}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/60">Mises à jour récentes</p>
                        <ul className="mt-3 space-y-2 text-sm text-white/90">
                          {updates.slice(0, 4).map((update, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-white/70 mt-0.5" />
                              <span>{update}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="border-border/40 bg-background/80">
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Résumé du build
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/80">
                        Prototype jouable généré avec IA. Comprend un cycle dynamique, un système de compagnons et des vagues d'ennemis scénarisées.
                        Utilise un rendu low-poly optimisé pour navigateur.
                      </p>
                    </div>
                  </Card>
                  <Card className="border-border/40 bg-background/80">
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions rapides
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button variant="outline" className="justify-start gap-2">
                          <Sparkles className="h-4 w-4" />
                          Régénérer la scène
                        </Button>
                        <Button variant="outline" className="justify-start gap-2">
                          <Boxes className="h-4 w-4" />
                          Importer un asset
                        </Button>
                        <Button variant="outline" className="justify-start gap-2">
                          <Plus className="h-4 w-4" />
                          Ajouter un événement
                        </Button>
                        <Button variant="outline" className="justify-start gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Ouvrir le changelog
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Bibliothèque d'assets</h3>
                    <p className="text-sm text-muted-foreground">
                      Active ou crée des ressources 3D et visuelles pour ton monde
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className={cn(
                          "rounded-2xl border bg-background/70 p-4 shadow-sm transition-all",
                          selectedAssets.has(asset.id)
                            ? "border-primary/60 ring-2 ring-primary/20"
                            : "border-border/50"
                        )}
                      >
                        <div className={cn("h-28 w-full rounded-xl bg-gradient-to-br flex items-center justify-center text-base font-semibold text-white", asset.gradient)}>
                          {asset.name}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground/90">
                              {asset.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{asset.description}</p>
                          <Button
                            type="button"
                            variant={selectedAssets.has(asset.id) ? "default" : "outline"}
                            className="w-full gap-2"
                            onClick={() => handleToggleAsset(asset.id)}
                          >
                          <Boxes className="h-4 w-4" />
                            {selectedAssets.has(asset.id) ? "Déployer dans la scène" : "Activer l'asset"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="border-border/50 bg-background/80 h-fit">
                  <div className="p-5 space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Générer un nouvel asset
                    </h4>
                    <Textarea
                      placeholder="Ex: Statue totemique en pierre avec lumières turquoise"
                      value={assetPrompt}
                      onChange={(event) => setAssetPrompt(event.target.value)}
                      className="min-h-[140px]"
                    />
                    <Button type="button" className="w-full gap-2" onClick={handleGenerateAsset}>
                      <Sparkles className="h-4 w-4" />
                      Générer depuis le prompt
                    </Button>
                    <Separator className="bg-border/40" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Suggestions rapides :</p>
                      <div className="flex flex-wrap gap-2">
                        {["Portail ancestral", "Drone messager", "Falaise lumineuse"].map((suggestion) => (
                          <Button
                            key={suggestion}
                            type="button"
                            variant="secondary"
                            className="bg-secondary/20 text-secondary-foreground/80"
                            onClick={() => setAssetPrompt(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="code" className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Code du prototype généré</h3>
                  <p className="text-sm text-muted-foreground">
                    Inspecte l'intégralité du code exportable pour le jeu WebGL.
                  </p>
                </div>
                <CodeViewer code={sampleCode} category="game" />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default GameBuilder;
