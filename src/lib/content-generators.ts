import type { GeneratedResult } from "@/types/result";
import type { GenerationPlan, PlanSection } from "@/types/plan";
import type { ImageAspectRatio, ImageGenerationSettings } from "@/types/image";
import { supabase } from "@/integrations/supabase/client";

export type CreativeTool = "image" | "music" | "agent" | "game";

interface GenerationOptions {
  prompt: string;
  version: number;
  modification?: string;
  previous?: GeneratedResult | null;
  imageSettings?: ImageGenerationSettings;
}

interface PlanOptions {
  image?: ImageGenerationSettings;
}

const TOOL_LABELS: Record<CreativeTool, string> = {
  image: "Générateur d'image",
  music: "Générateur de musique",
  agent: "Générateur d'agents",
  game: "Générateur de jeux vidéo",
};

const simpleHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pick = <T,>(items: T[], hash: number, offset: number) =>
  items[(hash + offset) % items.length];

const detectKeyword = (prompt: string, mapping: Array<[RegExp, string]>, fallback: string) => {
  const lowered = prompt.toLowerCase();
  for (const [regex, value] of mapping) {
    if (regex.test(lowered)) {
      return value;
    }
  }
  return fallback;
};

const extractColors = (prompt: string) => {
  const lowered = prompt.toLowerCase();
  const entries: Array<[RegExp, string]> = [
    [/(bleu|azur|cobalt)/, "bleue"],
    [/(violet|mauve|pourpre)/, "violette"],
    [/(vert|émeraude|menthe)/, "verte"],
    [/(rouge|cramoisi|bordeaux)/, "rouge"],
    [/(rose|fuchsia|magenta)/, "rose"],
    [/(orange|ambre|cuivre)/, "orangée"],
    [/(dor[ée]|or|gold)/, "dorée"],
    [/(argent|métal|chrome)/, "argentée"],
    [/(noir|sombre|charbon)/, "sombre"],
    [/(blanc|clair|ivoire)/, "lumineuse"],
  ];

  const detected = entries
    .filter(([regex]) => regex.test(lowered))
    .map(([, value]) => value);

  if (!detected.length) return "harmonie contrastée";
  if (detected.length === 1) return `palette ${detected[0]}`;
  return `palette ${detected[0]} et ${detected[1]}`;
};

const IMAGE_RATIO_CONFIG: Record<Exclude<ImageAspectRatio, "custom">, { width: number; height: number; label: string }> = {
  "2:3": { width: 832, height: 1248, label: "portrait" },
  "1:1": { width: 1024, height: 1024, label: "carré" },
  "16:9": { width: 1280, height: 720, label: "paysage" },
  "3:2": { width: 1200, height: 800, label: "photo paysage" },
  "4:5": { width: 1024, height: 1280, label: "portrait social" },
  "5:4": { width: 1280, height: 1024, label: "affiche" },
  "21:9": { width: 1792, height: 768, label: "ultra large" },
  "9:16": { width: 832, height: 1472, label: "vertical" },
};

const STYLE_PRESET_LABELS: Record<string, string> = {
  "3d-render": "rendu 3D photoréaliste",
  acrylic: "texture acrylique vibrante",
  cinematic: "style cinématique haut contraste",
  creative: "composition créative expérimentale",
  dynamic: "style dynamique et énergique",
  fashion: "mode éditoriale lumineuse",
  "game-concept": "concept art de jeu vidéo",
  "graphic-2d": "graphisme 2D moderne",
  "graphic-3d": "graphisme 3D premium",
  illustration: "illustration détaillée",
  portrait: "portrait studio",
  "portrait-cinematic": "portrait cinématique dramatique",
  "portrait-fashion": "portrait fashion magazine",
  "pro-bw": "photographie noir et blanc professionnelle",
  "pro-color": "photographie couleur professionnelle",
  "pro-film": "grain pellicule cinématographique",
  "ray-traced": "rendu ray tracing hyper réaliste",
  "stock-photo": "photo stock commerciale",
};

const STYLE_PRESET_PROMPTS: Record<string, string> = {
  "3d-render": "hyper detailed 3d render with global illumination",
  acrylic: "acrylic painting strokes and vivid pigments",
  cinematic: "cinematic lighting, anamorphic lens, film still",
  creative: "experimental creative composition, surreal details",
  dynamic: "dynamic action lighting, motion design energy",
  fashion: "high fashion editorial photography, studio lighting",
  "game-concept": "AAA game concept art, dramatic lighting",
  "graphic-2d": "premium 2d graphic design, clean vector shapes",
  "graphic-3d": "3d graphic render, chrome reflections",
  illustration: "highly detailed illustration, painterly",
  portrait: "studio portrait photography, crisp focus",
  "portrait-cinematic": "cinematic portrait lighting, shallow depth of field",
  "portrait-fashion": "fashion portrait, editorial styling",
  "pro-bw": "professional black and white photography, rich contrast",
  "pro-color": "professional color grading, vibrant yet natural tones",
  "pro-film": "analog film photography, fine grain, warm tones",
  "ray-traced": "ray traced lighting, physically accurate reflections",
  "stock-photo": "commercial stock photo, high clarity",
};

const DEFAULT_IMAGE_SETTINGS: ImageGenerationSettings = {
  promptEnhance: true,
  aspectRatio: "3:2",
  customDimensions: {
    width: IMAGE_RATIO_CONFIG["3:2"].width,
    height: IMAGE_RATIO_CONFIG["3:2"].height,
  },
  imageCount: 1,
  isPrivate: false,
  stylePreset: undefined,
  advanced: {
    guidanceScale: 12,
    stepCount: 40,
    seed: "",
    upscale: true,
    highResolution: false,
    negativePrompt: "",
  },
};

const resolveAspectRatioDetails = (settings?: ImageGenerationSettings) => {
  const ratio = settings?.aspectRatio ?? "3:2";
  if (ratio === "custom") {
    const dimensions = settings?.customDimensions ?? { width: 1536, height: 1024 };
    return {
      ratio,
      label: "personnalisé",
      width: dimensions.width,
      height: dimensions.height,
      readable: `${dimensions.width} × ${dimensions.height}`,
    };
  }

  const config = IMAGE_RATIO_CONFIG[ratio] ?? IMAGE_RATIO_CONFIG["3:2"];
  return {
    ratio,
    label: config.label,
    width: config.width,
    height: config.height,
    readable: `${config.width} × ${config.height}`,
  };
};

const describeStylePreset = (settings?: ImageGenerationSettings) => {
  if (!settings?.stylePreset) {
    return "style libre équilibré";
  }
  return STYLE_PRESET_LABELS[settings.stylePreset] ?? settings.stylePreset;
};

const buildImageSettingsInstructions = (settings: ImageGenerationSettings) => {
  const ratioDetails = resolveAspectRatioDetails(settings);
  const styleDescription = describeStylePreset(settings);
  const advanced = settings.advanced;
  const instructions: string[] = [
    `Format demandé : ${ratioDetails.label} ${ratioDetails.readable}.`,
    `Nombre de variations : ${settings.imageCount}.`,
    `Style artistique : ${styleDescription}.`,
  ];

  if (settings.promptEnhance) {
    instructions.push("Utilise un prompt descriptif riche et détaillé.");
  } else {
    instructions.push("Interprète le prompt tel quel, sans extrapolation inutile.");
  }

  if (advanced.upscale) {
    instructions.push("Prévoyez une passe d'upscale pour maximiser les détails.");
  }
  if (advanced.highResolution) {
    instructions.push("Optimise pour un rendu haute résolution.");
  }

  instructions.push(`Paramètres souhaités : guidance ${advanced.guidanceScale} · steps ${advanced.stepCount}.`);

  if (advanced.seed.trim()) {
    instructions.push(`Conserve le seed ${advanced.seed.trim()} si possible.`);
  }

  if (advanced.negativePrompt.trim()) {
    instructions.push(`Évite absolument : ${advanced.negativePrompt.trim()}.`);
  }

  return [
    "Contraintes techniques :",
    ...instructions.map((line) => `- ${line}`),
  ].join("\n");
};

const createImagePlan = (
  prompt: string,
  modification?: string,
  settings?: ImageGenerationSettings,
): GenerationPlan => {
  const subject = detectKeyword(
    prompt,
    [
      [/(produit|packshot|marchand)/, "mise en scène produit"],
      [/(portrait|visage|personnage|personne)/, "portrait expressif"],
      [/(paysage|nature|montagne|mer|forêt)/, "paysage immersif"],
      [/(architecture|ville|urbain)/, "architecture stylisée"],
    ],
    "composition conceptuelle",
  );
  const mood = detectKeyword(
    prompt,
    [
      [/(sombre|dramatique|noir)/, "ambiance sombre cinématique"],
      [/(lumineux|clair|aérien|soleil)/, "ambiance lumineuse et positive"],
      [/(futuriste|néon|cyber|synthwave)/, "ambiance futuriste aux néons"],
      [/(mystérieux|onirique|fantastique)/, "ambiance onirique et mystérieuse"],
    ],
    "ambiance équilibrée",
  );
  const style = detectKeyword(
    prompt,
    [
      [/(aquarelle|gouache)/, "style aquarelle"],
      [/(huile|peinture)/, "style peinture digitale"],
      [/(vectoriel|flat|minimal)/, "style vectoriel minimaliste"],
      [/(3d|isométrique|low poly)/, "style 3D isométrique"],
      [/(photo|photographique|réaliste)/, "style photo-réaliste"],
    ],
    "style illustratif moderne",
  );
  const perspective = detectKeyword(
    prompt,
    [
      [/(plongée|vue du dessus)/, "vue en plongée"],
      [/(contre[- ]plongée|imposant)/, "contre-plongée dramatique"],
      [/(panoramique|large|cinémascope)/, "cadre large panoramique"],
    ],
    "cadre frontal équilibré",
  );
  const palette = extractColors(prompt);
  const ratioDetails = resolveAspectRatioDetails(settings);
  const styleDescription = describeStylePreset(settings);
  const imageCount = settings?.imageCount ?? 1;
  const promptEnhance = settings?.promptEnhance ? "activée" : "désactivée";

  const sections: PlanSection[] = [
    {
      title: "Analyse du brief",
      objective: "Clarifier sujet, ambiance et contraintes avant de produire l'image.",
      steps: [
        {
          id: "subject",
          title: "Identifier le sujet clé",
          description: `Mettre l'accent sur ${subject} avec ${perspective}.`,
          deliverable: "Sujet cadré",
        },
        {
          id: "style",
          title: "Valider le style",
          description: `Confirmer un ${style} cohérent dans ${mood}.`,
          deliverable: "Références visuelles",
        },
        {
          id: "palette",
          title: "Lister la palette",
          description: `Déployer une ${palette} adaptée au brief.`,
          deliverable: "Palette finale",
        },
      ],
    },
    {
      title: "Orchestration Nano Banana",
      objective:
        "Préparer les invites et passes de rendu pour le modèle Google Nano Banana et garantir un résultat photoréaliste.",
      steps: [
        {
          id: "prompting",
          title: "Rédiger l'invite maître",
          description:
            "Structurer un prompt descriptif (sujet · ambiance · composition · détails) + prompt négatif précis.",
          deliverable: "Prompt Nano Banana optimisé",
        },
        {
          id: "passes",
          title: "Configurer les passes",
          description:
            "Planifier les passes base, détail et cohérence lumière (CFG, steps, seed partagé pour itérations).",
          deliverable: "Plan de passes calibré",
        },
        {
          id: "quality",
          title: "Sécuriser la qualité",
          description:
            "Définir critères de rehausse : netteté, gestion du bruit, cohérence anatomique, rendu export 4K.",
          deliverable: "Checklist qualité Nano Banana",
        },
      ],
    },
    {
      title: "Composition et détails",
      objective: "Structurer la scène puis affiner lumière et textures.",
      steps: [
        {
          id: "composition",
          title: "Esquisser la composition",
          description: `Définir masses principales et profondeur selon ${perspective}.`,
          deliverable: "Croquis composition",
        },
        {
          id: "lighting",
          title: "Placer la lumière",
          description: `Installer une lumière ${mood.replace("ambiance ", "")}.`,
          deliverable: "Schéma lumineux",
        },
        {
          id: "details",
          title: "Ajouter les détails",
          description: "Intégrer textures, accessoires et décor pour soutenir le récit visuel.",
          deliverable: "Détails finalisés",
        },
      ],
    },
    {
      title: "Finitions",
      objective: "Vérifier cohérence et préparer l'export final.",
      steps: [
        {
          id: "grading",
          title: "Uniformiser les couleurs",
          description: "Appliquer un color grading léger pour harmoniser l'image.",
          deliverable: "Palette harmonisée",
        },
        {
          id: "export",
          title: "Préparer le rendu",
          description: "Exporter en haute définition, format adapté au support (PNG/WEBP).",
          deliverable: "Fichier final",
        },
      ],
    },
  ];

  const summarySuffix = modification ? ` (ajustement : ${modification})` : "";

  return {
    title: "Plan de génération d'image",
    summary: `Créer une illustration ${style} centrée sur ${subject} dans ${mood} (${ratioDetails.label} ${ratioDetails.readable}, ${imageCount} variante(s), amélioration ${promptEnhance}) avec Google Nano Banana${summarySuffix}`,
    sections,
    successCriteria: [
      "Sujet et ambiance fidèles au brief",
      "Composition lisible avec profondeur",
      "Palette harmonieuse et cohérente",
      "Paramètres Nano Banana documentés pour reproductibilité",
      `Style ciblé : ${styleDescription}`,
    ],
    cautions: [
      "Respecter la perspective et les proportions des éléments",
      "Adapter le niveau de détail selon le support d'utilisation",
      "Contrôler l'usage des assets tiers pour éviter les artefacts IA",
    ],
  };
};

const createMusicPlan = (prompt: string, modification?: string): GenerationPlan => {
  const atmosphere = detectKeyword(
    prompt,
    [
      [/(calme|relax|ambient|lo[- ]?fi)/, "ambiance chill immersive"],
      [/(énergique|dance|club|punchy)/, "ambiance énergique et entraînante"],
      [/(cinématique|épique|orchestrale)/, "ambiance cinématique grandiose"],
      [/(nostalgique|rétro|vintage)/, "ambiance rétro nostalgique"],
    ],
    "ambiance contemporaine équilibrée",
  );
  const tempo = detectKeyword(
    prompt,
    [
      [/(lent|slow|downtempo)/, "72-88 BPM"],
      [/(modéré|mid|groove)/, "92-108 BPM"],
      [/(rapide|upbeat|dance)/, "118-128 BPM"],
    ],
    "100 BPM",
  );
  const instrumentation = detectKeyword(
    prompt,
    [
      [/(percussions|tribal|organic)/, "percussions organiques et textures granulaires"],
      [/(synth|electro|analog)/, "synthés analogiques pulsés"],
      [/(acoustique|guitare|piano)/, "instrumentation acoustique intimiste"],
    ],
    "basse ronde et pads atmosphériques",
  );

  const sections: PlanSection[] = [
    {
      title: "Analyse musicale",
      objective: "Comprendre l'univers sonore souhaité et cadrer les contraintes techniques.",
      steps: [
        {
          id: "ambiance",
          title: "Qualifier l'ambiance",
          description: `Traduire ${atmosphere} avec un tempo ${tempo}.`,
          deliverable: "Moodboard sonore",
        },
        {
          id: "structure",
          title: "Tracer la structure",
          description: "Découper le morceau en intro, sections A/B, pont et outro.",
          deliverable: "Plan de structure",
        },
      ],
    },
    {
      title: "Pilotage Gemini 2.5",
      objective:
        "Exploiter Gemini 2.5 pour proposer des variations harmoniques et un storytelling sonore raffiné.",
      steps: [
        {
          id: "ideation",
          title: "Itérer sur les idées",
          description:
            "Générer trois scénarios émotionnels avec Gemini 2.5 (intro, montée, climax) et sélectionner le meilleur.",
          deliverable: "Storyboard sonore validé",
        },
        {
          id: "arrangement-ai",
          title: "Affiner les arrangements",
          description:
            "Demander à Gemini 2.5 des suggestions de layering (pads, arpèges, textures) selon l'ambiance.",
          deliverable: "Pistes d'arrangement IA",
        },
        {
          id: "lyrics",
          title: "Option paroles",
          description:
            "Si nécessaire, générer un texte court ou des noms de piste cohérents avec l'émotion ciblée.",
          deliverable: "Paroles / titres générés",
        },
      ],
    },
    {
      title: "Composition",
      objective: "Construire harmonie, motifs et transitions pour soutenir le récit musical.",
      steps: [
        {
          id: "harmonie",
          title: "Choisir l'harmonie",
          description: "Déterminer tonalité et progression principale.",
          deliverable: "Grille d'accords",
        },
        {
          id: "motifs",
          title: "Écrire les motifs",
          description: `Créer un hook mémorable et un motif de basse ${instrumentation}.`,
          deliverable: "Motifs principaux",
        },
        {
          id: "transitions",
          title: "Préparer les transitions",
          description: "Utiliser montées, impacts et textures pour relier les sections.",
          deliverable: "Automation des transitions",
        },
      ],
    },
    {
      title: "Production & mix",
      objective: "Arranger, mixer puis préparer l'export final.",
      steps: [
        {
          id: "sound-design",
          title: "Sélectionner le sound design",
          description: "Composer un rack d'instruments cohérent (pads, percussions, lead).",
          deliverable: "Palette sonore",
        },
        {
          id: "mix",
          title: "Mixer les stems",
          description: "Équilibrer dynamiques, panoramiques et effets temporels.",
          deliverable: "Mix stéréo équilibré",
        },
        {
          id: "master",
          title: "Préparer le master",
          description: "Appliquer compression glue, EQ douce et limiteur -14 LUFS.",
          deliverable: "Master prêt à diffuser",
        },
      ],
    },
  ];

  const summarySuffix = modification ? ` (modification : ${modification})` : "";

  return {
    title: "Plan de composition musicale",
    summary: `Composer une pièce à ${tempo} inspirée par ${atmosphere} avec l'appui de Gemini 2.5${summarySuffix}`,
    sections,
    successCriteria: [
      "Structure narrative cohérente",
      "Motif mémorable aligné sur l'ambiance",
      "Mix équilibré prêt pour diffusion",
      "Variations Gemini 2.5 documentées",
    ],
    cautions: [
      "Adapter la durée au format de diffusion visé",
      "Vérifier les droits si des références sont explicitement citées",
      "Toujours valider artistiquement les propositions IA avant diffusion",
    ],
  };
};

const createAgentPlan = (prompt: string, modification?: string): GenerationPlan => {
  const role = detectKeyword(
    prompt,
    [
      [/(marketing|growth|acquisition)/, "planificateur marketing"],
      [/(produit|product|roadmap)/, "assistant produit stratégique"],
      [/(support|client|service)/, "agent support client proactif"],
      [/(data|analyse|analyst)/, "analyste de données décisionnel"],
    ],
    "assistant polyvalent",
  );
  const tone = detectKeyword(
    prompt,
    [
      [/(amical|chaleureux|humain)/, "ton empathique"],
      [/(formel|professionnel)/, "ton professionnel cadré"],
      [/(direct|percutant)/, "ton direct orienté action"],
    ],
    "ton consultatif",
  );
  const tooling = detectKeyword(
    prompt,
    [
      [/(notion|documentation)/, "Notion pour la base de connaissance"],
      [/(figma|design)/, "Figma pour la collaboration visuelle"],
      [/(slack|communication)/, "Slack pour l'orchestration des échanges"],
      [/(linear|jira|projet)/, "Linear pour le pilotage des tâches"],
    ],
    "Stack modulaire (Notion + Slack + Google Suite)",
  );

  const sections: PlanSection[] = [
    {
      title: "Cadrage du rôle",
      objective: "Transformer le brief en missions concrètes pour l'agent.",
      steps: [
        {
          id: "mission",
          title: "Formuler la mission",
          description: `Positionner ${role} et définir ses objectifs prioritaires.`,
          deliverable: "Charte de mission",
        },
        {
          id: "ton",
          title: "Aligner le ton",
          description: `Paramétrer un ${tone} adapté à la cible.`,
          deliverable: "Guide de tonalité",
        },
      ],
    },
    {
      title: "Intelligence Gemini 2.5",
      objective: "Configurer une boucle de réflexion avancée propulsée par Gemini 2.5.",
      steps: [
        {
          id: "reasoning",
          title: "Définir la réflexion",
          description:
            "Scénariser la séquence Pense → Vérifie → Répond pour sécuriser des réponses argumentées.",
          deliverable: "Cadre de raisonnement",
        },
        {
          id: "knowledge",
          title: "Indexer les connaissances",
          description:
            "Lister les bases (FAQ, guidelines, historiques) et prévoir une mise à jour automatisée.",
          deliverable: "Sources Gemini 2.5",
        },
        {
          id: "handoff-ai",
          title: "Préparer l'escalade",
          description:
            "Configurer les critères de handoff humain avec résumé généré par Gemini 2.5.",
          deliverable: "Process d'escalade",
        },
      ],
    },
    {
      title: "Boucle opérationnelle",
      objective: "Définir les routines et outils utilisés par l'agent.",
      steps: [
        {
          id: "inputs",
          title: "Cartographier les entrées",
          description: "Lister les canaux d'information et signaux déclencheurs.",
          deliverable: "Sources et signaux",
        },
        {
          id: "workflow",
          title: "Structurer le workflow",
          description: "Détailler la séquence Observer → Analyser → Agir → Reporter.",
          deliverable: "Workflow détaillé",
        },
        {
          id: "outils",
          title: "Choisir les outils",
          description: `Sélectionner ${tooling} et définir les permissions.`,
          deliverable: "Stack outils configurée",
        },
      ],
    },
    {
      title: "Suivi & amélioration",
      objective: "Prévoir les métriques et le handoff humain.",
      steps: [
        {
          id: "kpi",
          title: "Définir les KPIs",
          description: "Identifier 3 indicateurs pour mesurer l'impact.",
          deliverable: "Tableau de bord KPI",
        },
        {
          id: "handoff",
          title: "Planifier le handoff",
          description: "Organiser la reprise humaine pour les demandes complexes.",
          deliverable: "Process de reprise",
        },
      ],
    },
  ];

  const summarySuffix = modification ? ` (ajustement : ${modification})` : "";

  return {
    title: "Plan de conception d'agent",
    summary: `Structurer ${role} avec ${tone}, orchestré par Gemini 2.5${summarySuffix}`,
    sections,
    successCriteria: [
      "Objectifs mesurables définis",
      "Workflow clair avec outils associés",
      "Routine de reporting pour amélioration continue",
      "Prompts et garde-fous Gemini 2.5 documentés",
    ],
    cautions: [
      "Prévoir une supervision humaine avant mise en production",
      "Documenter les limites de l'agent pour cadrer les attentes",
      "Auditer régulièrement les réponses générées par Gemini 2.5",
    ],
  };
};

const createGamePlan = (prompt: string, modification?: string): GenerationPlan => {
  const genre = detectKeyword(
    prompt,
    [
      [/(rogue|survie|procédural)/, "rogue-lite stratégique"],
      [/(puzzle|énigme|logic)/, "puzzle narratif"],
      [/(gestion|city|tycoon)/, "jeu de gestion systémique"],
      [/(action|combat|fps|tps)/, "action aventure immersive"],
    ],
    "jeu d'exploration narratif",
  );
  const camera = detectKeyword(
    prompt,
    [
      [/(vue du dessus|top-down)/, "vue top-down"],
      [/(isométrique)/, "caméra isométrique"],
      [/(à la première personne|fps)/, "vue subjective"],
      [/(troisième personne|tps)/, "caméra troisième personne"],
    ],
    "caméra dynamique",
  );
  const progression = detectKeyword(
    prompt,
    [
      [/(campagne|histoire|narratif)/, "progression narrative chapitre par chapitre"],
      [/(coop|multijoueur)/, "progression coopérative synchronisée"],
      [/(compétitif|pvp)/, "progression compétitive basée sur le classement"],
    ],
    "progression par boucles de missions",
  );

  const sections: PlanSection[] = [
    {
      title: "Fondations du concept",
      objective: "Définir l'expérience de jeu et la proposition de valeur.",
      steps: [
        {
          id: "pitch",
          title: "Synthétiser le pitch",
          description: `Formuler ${genre} avec ${camera}.`,
          deliverable: "Pitch en une phrase",
        },
        {
          id: "audience",
          title: "Identifier l'audience",
          description: "Déterminer le joueur cible et ses motivations.",
          deliverable: "Persona joueur",
        },
      ],
    },
    {
      title: "Co-création Gemini 2.5",
      objective: "Explorer variantes narratifs et mécaniques avec Gemini 2.5.",
      steps: [
        {
          id: "scenarios",
          title: "Scénarios IA",
          description:
            "Générer trois pitchs de campagnes dynamiques via Gemini 2.5 et retenir celui qui différencie le jeu.",
          deliverable: "Arc narratif validé",
        },
        {
          id: "systems",
          title: "Systèmes augmentés",
          description:
            "Demander à Gemini 2.5 des variantes de boucles secondaires (craft, alliances, scoring).",
          deliverable: "Boucles secondaires IA",
        },
        {
          id: "dialogues",
          title: "Voix des personnages",
          description:
            "Définir le ton des PNJ et générer un lexique signature pour l'univers avec Gemini 2.5.",
          deliverable: "Guide de dialogues",
        },
      ],
    },
    {
      title: "Boucle de gameplay",
      objective: "Designer la boucle minute → session → métagame.",
      steps: [
        {
          id: "minute",
          title: "Boucle courte",
          description: "Décrire les actions répétées (explorer, résoudre, combattre).",
          deliverable: "Loop minute documentée",
        },
        {
          id: "session",
          title: "Boucle de session",
          description: `Planifier la progression ${progression}.`,
          deliverable: "Loop session",
        },
        {
          id: "meta",
          title: "Métagame",
          description: "Imaginer les récompenses persistantes et améliorations.",
          deliverable: "Système de progression",
        },
      ],
    },
    {
      title: "Univers & production",
      objective: "Décrire direction artistique et besoins techniques.",
      steps: [
        {
          id: "worldbuilding",
          title: "Esquisser l'univers",
          description: "Définir ton, factions et arcs narratifs.",
          deliverable: "Bible d'univers",
        },
        {
          id: "tech",
          title: "Lister les piliers techniques",
          description: "Identifier moteurs, modules réseau et besoins IA.",
          deliverable: "Backlog technique",
        },
        {
          id: "roadmap",
          title: "Étager la roadmap",
          description: "Planifier préproduction, vertical slice, alpha et bêta.",
          deliverable: "Roadmap haut niveau",
        },
      ],
    },
  ];

  const summarySuffix = modification ? ` (évolution : ${modification})` : "";

  return {
    title: "Plan de concept jeu vidéo",
    summary: `Imaginer ${genre} en ${camera} avec ${progression}, co-conçu avec Gemini 2.5${summarySuffix}`,
    sections,
    successCriteria: [
      "Boucle de gameplay compréhensible",
      "Progression et récompenses motivantes",
      "Vision artistique cohérente",
      "Propositions Gemini 2.5 consolidées",
    ],
    cautions: [
      "Prioriser une vertical slice pour valider les sensations",
      "Anticiper la charge de production selon la complexité technique",
      "Filtrer les suggestions IA pour préserver la vision créative",
    ],
  };
};


const generateImageResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification, imageSettings } = options;
  const effectiveSettings = imageSettings ?? DEFAULT_IMAGE_SETTINGS;
  const ratioDetails = resolveAspectRatioDetails(effectiveSettings);
  const styleDescriptor = describeStylePreset(effectiveSettings);
  const providedSeed = effectiveSettings.advanced.seed.trim();
  const hashInput = [
    prompt,
    modification ?? "",
    ratioDetails.readable,
    effectiveSettings.stylePreset ?? "libre",
    effectiveSettings.promptEnhance ? "enhance" : "raw",
    providedSeed,
  ].join("|");
  const hash = simpleHash(hashInput);

  const palettes = [
    "dégradé cobalt · indigo · lueur lavande",
    "sable chaud · orange sanguine · violet électrique",
    "menthe givrée · turquoise néon · argent chromé",
    "graphite profond · cuivre fumé · bleu polaire",
    "ivoire nacré · doré champagne · rose quartz",
  ];
  const renderStyles = [
    "cinématique ultra-réaliste",
    "peinture digitale texturée",
    "illustration vectorielle premium",
    "3D hybride photoréaliste",
    "aquarelle pigmentée haut contraste",
  ];
  const cameraAngles = [
    "optique 35mm à hauteur d'œil",
    "optique tilt-shift panoramique",
    "plongée architecturale dramatique",
    "contre-plongée épique",
    "plan large cinémascope",
  ];
  const lighting = [
    "éclairage volumétrique à double rim light",
    "setup studio trois points + rebond doré",
    "lumière naturelle diffuse avec rayons godrays",
    "ambiance nocturne néon et reflets humides",
    "clair-obscur maîtrisé avec fill doux",
  ];
  const focus = [
    "profondeur de champ f/1.8",
    "focus stacking macro",
    "mise au point douce sur le sujet principal",
    "netteté uniforme f/8",
    "bokeh cinétique",
  ];

  const finalSeed = providedSeed && providedSeed.length > 0
    ? providedSeed
    : (hash % 10_000_000).toString().padStart(7, "0");
  const steps = effectiveSettings.advanced.stepCount ?? 38 + (hash % 12);
  const cfgValue = effectiveSettings.advanced.guidanceScale ?? 12 + (hash % 4);
  const cfg = Number.isInteger(cfgValue) ? cfgValue.toFixed(0) : cfgValue.toFixed(1);
  const sampler = pick(
    ["Banana-Path v3", "Banana-Euler SDE", "Banana-Flow++"],
    hash,
    9,
  );
  const palette = pick(palettes, hash, 1);
  const fallbackStyle = pick(renderStyles, hash, 3);
  const angle = pick(cameraAngles, hash, 5);
  const lights = pick(lighting, hash, 7);
  const focusStyle = pick(focus, hash, 11);
  const stylePrompt = effectiveSettings.stylePreset
    ? STYLE_PRESET_PROMPTS[effectiveSettings.stylePreset] ?? styleDescriptor
    : fallbackStyle;
  const styleLabel = effectiveSettings.stylePreset ? styleDescriptor : stylePrompt;

  const masterPrompt = [
    effectiveSettings.promptEnhance
      ? `highly detailed description: ${prompt.trim()}`
      : prompt.trim(),
    stylePrompt,
    angle,
    lights,
    focusStyle,
    `palette ${palette}`,
    effectiveSettings.advanced.highResolution ? "leonardo diffusion high resolution" : "",
    effectiveSettings.advanced.upscale ? "super resolution detail enhancement" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const negativePromptParts = [
    "artefacts numériques",
    "distorsion anatomique",
    "texte",
    "filigrane",
    "sur-exposition",
  ];
  if (effectiveSettings.advanced.negativePrompt.trim()) {
    negativePromptParts.push(effectiveSettings.advanced.negativePrompt.trim());
  }
  const negativePrompt = negativePromptParts.join(", ");

  const preview = `https://picsum.photos/seed/nano-banana-${encodeURIComponent(`${hash}-${version}`)}/${ratioDetails.width}/${ratioDetails.height}`;

  const settingsSummary = [
    `- Prompt enhance : ${effectiveSettings.promptEnhance ? "activé" : "désactivé"}`,
    `- Format : ${ratioDetails.readable} (${ratioDetails.label})`,
    `- Variations : ${effectiveSettings.imageCount}`,
    `- Style : ${styleDescriptor}`,
    `- Confidentialité : ${effectiveSettings.isPrivate ? "privée" : "publique"}`,
    `- Upscale : ${effectiveSettings.advanced.upscale ? "oui" : "non"} · Haute résolution : ${effectiveSettings.advanced.highResolution ? "oui" : "non"}`,
    `- Guidance : ${cfgValue} · Steps : ${steps}`,
    `- Seed : ${finalSeed || "aléatoire"}`,
  ];
  if (effectiveSettings.advanced.negativePrompt.trim()) {
    settingsSummary.push(`- Prompt négatif personnalisé : ${effectiveSettings.advanced.negativePrompt.trim()}`);
  }

  const content = [
    "🧠 Analyse Nano Banana",
    `- Intention principale : ${prompt.trim() || "visuel conceptuel"}.`,
    `- Variation demandée : ${modification ?? "première exploration"}.`,
    `- Style retenu : ${styleLabel} (${palette}).`,
    "",
    "🎨 Prompt Google Nano Banana",
    "```",
    masterPrompt,
    "```",
    "",
    "🚫 Prompt négatif",
    "```",
    negativePrompt,
    "```",
    "",
    "⚙️ Paramètres de rendu recommandés",
    `- Modèle : Google Nano Banana diffusion XL`,
    `- Seed : ${finalSeed || "aléatoire"} · Steps : ${steps} · CFG : ${cfg}`,
    `- Sampler : ${sampler} · Résolution : ${ratioDetails.readable}`,
    `- Upscale : ${effectiveSettings.advanced.upscale ? "actif" : "désactivé"} · Mode HD : ${effectiveSettings.advanced.highResolution ? "actif" : "désactivé"}`,
    "",
    "📋 Paramètres Leonardo simulés",
    ...settingsSummary,
    "",
    "📋 Checklist qualité",
    "- Vérifier cohérence lumière/ombres",
    "- Inspecter les détails critiques (mains, visages, typographie)",
    "- Exporter en PNG 16 bits + version WebP optimisée",
  ].join("\n");

  return {
    type: "image",
    category: TOOL_LABELS.image,
    prompt,
    version,
    modification,
    preview,
    content,
    imageSettings:
      imageSettings
        ? imageSettings
        : {
            ...DEFAULT_IMAGE_SETTINGS,
            customDimensions: DEFAULT_IMAGE_SETTINGS.customDimensions
              ? { ...DEFAULT_IMAGE_SETTINGS.customDimensions }
              : undefined,
            advanced: { ...DEFAULT_IMAGE_SETTINGS.advanced },
          },
  };
};

const generateMusicResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification } = options;
  const hash = simpleHash(`${prompt}|${modification ?? ""}`);

  const genres = ["Synthwave", "Lo-fi chill", "Ambient organique", "Electro-pop", "Cinematic"];
  const moods = ["énergique", "reposante", "immersive", "nostalgique", "motivée"];
  const tempos = ["82 BPM", "96 BPM", "108 BPM", "122 BPM", "132 BPM"];
  const instruments = [
    "Synthés analogiques, basse ronde, batterie électronique",
    "Piano feutré, textures granuleuses, percussions douces",
    "Cordes éthérées, nappes atmosphériques, sub bass",
    "Guitares modulées, arps, beat hybride",
    "Pads cinématiques, percussions organiques, chœurs traités",
  ];
  const structures = [
    "Intro · Couplets évolutifs · Pont texturé · Finale expansif",
    "Intro ambient · Groove principal · Breakdown · Reprise",
    "Intro granulaire · Build progressif · Drop contrasté · Outro immersif",
    "Ambient opening · Hook principal · Variation rythmique · Outro en fondu",
    "Intro percussive · Section A/B · Climax harmonique · Outro suspendu",
  ];
  const mixTips = [
    "Sidechain subtil 2dB sur la basse pour respirations du kick",
    "Automations de filtre passe-haut sur transitions",
    "Reverb shimmer parallèle sur le hook",
    "Compression glue 2:1 sur le bus master",
    "Saturation bande magnétique douce sur bus drums",
  ];
  const mastering = [
    "Limiter Ozone à -14 LUFS, true peak -1 dB",
    "EQ large +1dB à 12 kHz pour brillance",
    "Stereo widener modéré (+15%) sur les pads",
    "Exciter multibande léger sur médiums",
    "Dynamic EQ pour contrôler 200 Hz",
  ];
  const deliverables = [
    "Stems groupés (Drums / Bass / Harmonie / Lead / FX)",
    "Version loopable 60s",
    "Version instrumental",
    "Preset synthé principal (.vitalpreset / .analoglab)",
    "Fichier projet DAW (Ableton Live 11)",
  ];

  const genre = pick(genres, hash, 0);
  const mood = pick(moods, hash, 2);
  const tempo = pick(tempos, hash, 4);
  const instrumentation = pick(instruments, hash, 6);
  const structure = pick(structures, hash, 8);
  const mix = pick(mixTips, hash, 10);
  const master = pick(mastering, hash, 12);
  const delivery = pick(deliverables, hash, 14);

  const content = [
    "🧠 Synthèse Gemini 2.5",
    `- Analyse du brief : ${prompt.trim() || "composition atmosphérique"}.`,
    `- Variation demandée : ${modification ?? "première version"}.`,
    `- Direction : ${genre} ${mood} à ${tempo}.`,
    "",
    "🎼 Plan de composition",
    `- Structure : ${structure}.`,
    `- Instrumentation : ${instrumentation}.`,
    "- Progression harmonique proposée : i – VI – III – VII (mode aeolien).",
    "- Hook vocal/lead : motif pentatonique en doubles croches, delay ping-pong 3/16.",
    "",
    "🎚️ Production & mix",
    `- Conseil mixage : ${mix}.`,
    `- Traitement master : ${master}.`,
    "- Export principal : 48 kHz · 24 bits WAV + version streaming -14 LUFS.",
    "",
    "📦 Livrables",
    `- ${delivery}.`,
    "- Fichier MIDI mélodie et progression d'accords.",
    "- Rapport Gemini 2.5 : variantes harmonique et suggestions d'arrangement.",
  ].join("\n");

  return {
    type: "description",
    category: TOOL_LABELS.music,
    prompt,
    version,
    modification,
    content,
  };
};

const generateAgentResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification, previous } = options;
  const hash = simpleHash(`${prompt}|${modification ?? ""}`);

  const personas = [
    "Analyste stratégique",
    "Assistant produit",
    "Coach de productivité",
    "Planificateur marketing",
    "Architecte d'expériences",
  ];
  const tools = [
    "Notion",
    "Slack",
    "Figma",
    "Airtable",
    "Linear",
  ];

  const steps = [
    "Analyse la demande et extrait les objectifs clés.",
    "Génère un plan d'action structuré étape par étape.",
    "Identifie les dépendances et ressources nécessaires.",
    "Synthétise les livrables attendus et les jalons.",
  ];
  const cadences = [
    "Stand-up quotidien 9h · revue hebdo OKR",
    "Synthèse asynchrone lundi / jeudi",
    "Rapport instantané post-tâche + revue mensuelle",
    "Daily Slack + comité stratégique bi-hebdo",
    "Check-in 48h + rapport de tendances hebdo",
  ];
  const guardrails = [
    "Ne jamais valider un devis sans approbation humaine",
    "Toujours citer ses sources dans les rapports",
    "Limiter l'accès aux données sensibles (lecture seule)",
    "Respecter RGPD et anonymiser les exports",
    "Escalader toute décision financière > 2k€",
  ];
  const kpis = [
    "Temps de réponse moyen < 5 min",
    "Satisfaction post-interaction > 4.7/5",
    "Tâches clôturées / semaine",
    "Taux de conversion campagne",
    "Nombre d'insights actionnables",
  ];

  const persona = pick(personas, hash, 1);
  const stack = [pick(tools, hash, 2), pick(tools, hash, 4), pick(tools, hash, 6)]
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");
  const cadence = pick(cadences, hash, 8);
  const guardrail = pick(guardrails, hash, 10);
  const kpi = pick(kpis, hash, 12);

  const refinement = modification
    ? `\n\nAdaptation demandée : ${modification}.`
    : "";
  const followUp = previous
    ? "\n\nL'agent conserve la mémoire de la version précédente pour ajuster ses tâches."
    : "";

  const content = [
    "🧠 Profil Gemini 2.5",
    `- Persona : ${persona}.`,
    `- Stack activée : ${stack}.`,
    `- Cadence de synchronisation : ${cadence}.`,
    `- KPI prioritaire : ${kpi}.`,
    "",
    "🔁 Workflow raisonné",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "🛡️ Garde-fous",
    `- ${guardrail}.`,
    "- Gemini 2.5 opère en mode « raisonnement vérifié » avec journal détaillé des décisions.",
  ].join("\n");

  return {
    type: "description",
    category: TOOL_LABELS.agent,
    prompt,
    version,
    modification,
    content: content + refinement + followUp,
  };
};

const generateGameResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification } = options;
  const hash = simpleHash(`${prompt}|${modification ?? ""}`);

  const genres = [
    "Rogue-lite narratif",
    "Puzzle aventure",
    "Gestion stratégique",
    "Exploration coopérative",
    "Action tactique",
  ];
  const settings = [
    "mégalopole néon",
    "archipel suspendu",
    "station orbitale",
    "forêt numérique",
    "cité souterraine",
  ];
  const mechanics = [
    "boucle temporelle adaptative",
    "craft collaboratif",
    "systèmes procéduraux influencés par les choix",
    "narration ramifiée",
    "gestion d'équipes autonomes",
  ];
  const biomes = [
    "biomes modulaires générés (quartiers néon, zones industrielles, sanctuaires)",
    "îlots à verticalité variable reliés par rails lumineux",
    "anneaux orbitaux multi-gravité",
    "clairières holographiques évolutives",
    "galeries souterraines luminescentes",
  ];
  const progressionBeats = [
    "Objectifs de missions dynamiques + arcs personnels des compagnons",
    "Cartes événementielles générées · réputation de faction",
    "Arbre de compétences fractal + fabrication de modules uniques",
    "Décisions morales impactant climat & économie",
    "Cycle jour/nuit avec menace croissante",
  ];
  const techStacks = [
    "Unreal Engine 5 + Verse scripting + Gemini 2.5 pour narration",
    "Unity HDRP + ECS + Gemini 2.5 pour génération de quêtes",
    "Godot 4 + GDExtension + Gemini 2.5 pour dialogues adaptatifs",
    "Unreal + Lyra sample + Gemini 2.5 pour comportement IA",
    "Unity URP + Netcode + Gemini 2.5 pour événements live",
  ];

  const genre = pick(genres, hash, 0);
  const setting = pick(settings, hash, 3);
  const mechanic = pick(mechanics, hash, 5);
  const biome = pick(biomes, hash, 7);
  const progressionBeat = pick(progressionBeats, hash, 9);
  const techStack = pick(techStacks, hash, 11);

  const content = [
    "🧠 Vision Gemini 2.5",
    `- Genre : ${genre}.`,
    `- Cadre : ${setting} avec ${biome}.`,
    `- Mécanique signature : ${mechanic}.`,
    "",
    "🎮 Boucle de jeu",
    "1. Préparation : briefing dynamique, loadout généré par Gemini 2.5 selon mission.",
    "2. Exploration : niveaux modulaires + événements systémiques IA.",
    "3. Résolution : choix narratifs branchés, puzzles contextuels, combats tactiques.",
    "4. Retombées : récompenses persistantes, relations PNJ, évolution du monde.",
    "",
    "📈 Progression",
    `- ${progressionBeat}.`,
    "- Table de loot adaptative IA + contrats hebdomadaires évolutifs.",
    "",
    "🎨 Direction artistique",
    "- Palette : néons prismatiques + contrastes profonds.",
    "- Effets : volumétrie particulaire, motion blur cinématique, UI diegétique.",
    "",
    "🛠️ Stack de production",
    `- ${techStack}.`,
    "- Pipeline audio : Wwise + Gemini 2.5 pour barks adaptatifs.",
    "- LiveOps : génération d'événements limités via workflows Gemini.",
  ].join("\n");

  return {
    type: "description",
    category: TOOL_LABELS.game,
    prompt,
    version,
    modification,
    content,
  };
};

export const requestCreativeResult = async (
  tool: CreativeTool,
  options: GenerationOptions,
): Promise<GeneratedResult> => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Configuration Supabase manquante");
  }

  const { prompt, version, modification, previous, imageSettings } = options;
  const shouldAppendImageSettings = tool === "image" && imageSettings;
  const enrichedPrompt = shouldAppendImageSettings
    ? [prompt.trim(), buildImageSettingsInstructions(imageSettings!)].filter(Boolean).join("\n\n")
    : prompt;

  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      prompt: enrichedPrompt,
      category: tool,
      modification: modification?.trim() ? modification : undefined,
      existingContent: previous?.content?.trim() ? previous.content : undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as Partial<GeneratedResult>;

  return {
    type: typeof payload?.type === "string" ? payload.type : tool === "image" ? "image" : "text",
    category: typeof payload?.category === "string" ? payload.category : tool,
    content: typeof payload?.content === "string" ? payload.content : undefined,
    preview: typeof payload?.preview === "string" ? payload.preview : undefined,
    code: typeof payload?.code === "string" ? payload.code : undefined,
    files: Array.isArray(payload?.files) ? payload.files : undefined,
    instructions: typeof payload?.instructions === "string" ? payload.instructions : undefined,
    projectName: typeof payload?.projectName === "string" ? payload.projectName : undefined,
    projectType: typeof payload?.projectType === "string" ? payload.projectType : undefined,
    prompt,
    version,
    modification,
    imageSettings: tool === "image" ? imageSettings : undefined,
  };
};

export const generateCreativeResult = (
  tool: CreativeTool,
  options: GenerationOptions,
): GeneratedResult => {
  switch (tool) {
    case "image":
      return generateImageResult(options);
    case "music":
      return generateMusicResult(options);
    case "agent":
      return generateAgentResult(options);
    case "game":
      return generateGameResult(options);
    default:
      return generateImageResult(options);
  }
};

export const getCreativeToolLabel = (tool: CreativeTool) => TOOL_LABELS[tool];

export const createCreativePlan = (
  tool: CreativeTool,
  prompt: string,
  modification?: string,
  options?: PlanOptions,
): GenerationPlan => {
  switch (tool) {
    case "image":
      return createImagePlan(prompt, modification, options?.image);
    case "music":
      return createMusicPlan(prompt, modification);
    case "agent":
      return createAgentPlan(prompt, modification);
    case "game":
      return createGamePlan(prompt, modification);
    default:
      return createImagePlan(prompt, modification);
  }
};
