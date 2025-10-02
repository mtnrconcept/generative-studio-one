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
  plan?: GenerationPlan | null;
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

const pick = <T>(items: T[], hash: number, offset: number) =>
  items[(hash + offset) % items.length];

const detectKeyword = (
  prompt: string,
  mapping: Array<[RegExp, string]>,
  fallback: string,
) => {
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

const IMAGE_RATIO_CONFIG: Record<
  Exclude<ImageAspectRatio, "custom">,
  { width: number; height: number; label: string }
> = {
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
    const dimensions = settings?.customDimensions ?? {
      width: 1536,
      height: 1024,
    };
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
    instructions.push(
      "Interprète le prompt tel quel, sans extrapolation inutile.",
    );
  }

  if (advanced.upscale) {
    instructions.push(
      "Prévoyez une passe d'upscale pour maximiser les détails.",
    );
  }
  if (advanced.highResolution) {
    instructions.push("Optimise pour un rendu haute résolution.");
  }

  instructions.push(
    `Paramètres souhaités : guidance ${advanced.guidanceScale} · steps ${advanced.stepCount}.`,
  );

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
      objective:
        "Clarifier sujet, ambiance et contraintes avant de produire l'image.",
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
      title: "Orchestration Leonardo Phoenix",
      objective:
        "Préparer les invites et paramètres pour Leonardo Phoenix et garantir un rendu contrôlé et cohérent.",
      steps: [
        {
          id: "prompting",
          title: "Rédiger l'invite maître",
          description:
            "Structurer un prompt hiérarchisé (sujet · ambiance · composition · détails) accompagné d'un prompt négatif robuste.",
          deliverable: "Prompt Phoenix optimisé",
        },
        {
          id: "passes",
          title: "Configurer les passes",
          description:
            "Définir passes base, détail et cohérence lumière (CFG, steps, seed partagé) et prévoir une passe upscale.",
          deliverable: "Plan de passes calibré",
        },
        {
          id: "quality",
          title: "Sécuriser la qualité",
          description:
            "Lister critères de rehausse : netteté, contrôle du bruit, cohérence anatomique, export HD/4K.",
          deliverable: "Checklist qualité Leonardo",
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
          description:
            "Intégrer textures, accessoires et décor pour soutenir le récit visuel.",
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
          description:
            "Appliquer un color grading léger pour harmoniser l'image.",
          deliverable: "Palette harmonisée",
        },
        {
          id: "export",
          title: "Préparer le rendu",
          description:
            "Exporter en haute définition, format adapté au support (PNG/WEBP).",
          deliverable: "Fichier final",
        },
      ],
    },
  ];

  const summarySuffix = modification ? ` (ajustement : ${modification})` : "";

  return {
    title: "Plan de génération d'image",
    summary: `Créer une illustration ${style} centrée sur ${subject} dans ${mood} (${ratioDetails.label} ${ratioDetails.readable}, ${imageCount} variante(s), amélioration ${promptEnhance}) avec Leonardo Phoenix${summarySuffix}`,
    sections,
    successCriteria: [
      "Sujet et ambiance fidèles au brief",
      "Composition lisible avec profondeur",
      "Palette harmonieuse et cohérente",
      "Paramètres Leonardo documentés pour reproductibilité",
      `Style ciblé : ${styleDescription}`,
    ],
    cautions: [
      "Respecter la perspective et les proportions des éléments",
      "Adapter le niveau de détail selon le support d'utilisation",
      "Contrôler l'usage des assets tiers pour éviter les artefacts IA",
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

  const finalSeed =
    providedSeed && providedSeed.length > 0
      ? providedSeed
      : (hash % 10_000_000).toString().padStart(7, "0");
  const steps = effectiveSettings.advanced.stepCount ?? 40 + (hash % 10);
  const cfgValue = effectiveSettings.advanced.guidanceScale ?? 11 + (hash % 4);
  const sampler = pick(
    ["LEO-FineDetail", "LEO-Contrast", "LEO-DreamWeaver"],
    hash,
    9,
  );
  const palette = pick(palettes, hash, 1);
  const fallbackStyle = pick(renderStyles, hash, 3);
  const angle = pick(cameraAngles, hash, 5);
  const lights = pick(lighting, hash, 7);
  const focusStyle = pick(focus, hash, 11);
  const stylePrompt = effectiveSettings.stylePreset
    ? (STYLE_PRESET_PROMPTS[effectiveSettings.stylePreset] ?? styleDescriptor)
    : fallbackStyle;

  const masterPrompt = [
    effectiveSettings.promptEnhance
      ? `highly descriptive prompt: ${prompt.trim()}`
      : prompt.trim(),
    stylePrompt,
    angle,
    lights,
    focusStyle,
    `palette ${palette}`,
    effectiveSettings.advanced.highResolution
      ? "leonardo high fidelity rendering"
      : "",
    effectiveSettings.advanced.upscale ? "detail-preserving upscaler" : "",
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

  const preview = `https://picsum.photos/seed/leonardo-${encodeURIComponent(`${hash}-${version}`)}/${ratioDetails.width}/${ratioDetails.height}`;

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
    settingsSummary.push(
      `- Prompt négatif personnalisé : ${effectiveSettings.advanced.negativePrompt.trim()}`,
    );
  }

  const content = [
    "🧠 Analyse Phoenix",
    `- Intention principale : ${prompt.trim() || "visuel conceptuel"}.`,
    `- Variation demandée : ${modification ?? "première exploration"}.`,
    `- Style retenu : ${stylePrompt} · ${palette}.`,
    "",
    "🎨 Prompt Leonardo Phoenix 1.1",
    "```",
    masterPrompt,
    "```",
    "",
    "🚫 Prompt négatif",
    "```",
    negativePrompt,
    "```",
    "",
    "🎛️ Paramétrage recommandé",
    `- Modèle : Leonardo Phoenix 1.1 · Sampler : ${sampler}`,
    `- Steps : ${steps} · Guidance : ${cfgValue}`,
    `- Seed : ${finalSeed || "aléatoire"} · Ratio : ${ratioDetails.readable}`,
    `- Upscale : ${effectiveSettings.advanced.upscale ? "activé" : "désactivé"} · Mode HD : ${effectiveSettings.advanced.highResolution ? "activé" : "désactivé"}`,
    "",
    "📋 Paramètres Leonardo",
    ...settingsSummary,
    "",
    "📝 Checklist qualité",
    "- Vérifier cohérence lumière / profondeur",
    "- Inspecter détails critiques (mains, typographie, textures)",
    "- Exporter une version HD + variante Web optimisée",
  ].join("\n");

  return {
    type: "image",
    category: TOOL_LABELS.image,
    prompt,
    version,
    modification,
    preview,
    content,
    imageSettings: effectiveSettings,
  };
};

const generateMusicResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification } = options;
  const hash = simpleHash([prompt, modification ?? ""].join("|"));

  const moods = [
    "chillwave nocturne",
    "cinématique héroïque",
    "house organique",
    "synthwave rétro",
    "ambient méditatif",
  ];
  const structures = [
    "intro aérienne → montée texturée → drop principal → pont respirant → final évolutif",
    "prélude intimiste → premier thème → développement rythmique → climax orchestral → coda douce",
    "hook immédiat → couplet percussif → refrain expansif → break minimal → reprise énergique",
  ];
  const instrumentStacks = [
    "pads analogiques, basse ronde sidechainée, arpèges cristallins",
    "section cordes hybride, cuivres cinématiques, impacts percussifs",
    "guitare électrique delay, batterie acoustique traitée, textures granulaires",
    "piano feutré, drones modulaires, percussions organiques",
    "lead FM rétro, drums électroniques punchy, choeurs texturés",
  ];
  const rhythmIdeas = [
    "groove breakbeat syncopé",
    "pattern 4/4 club progressif",
    "pulse trip-hop downtempo",
    "balancement halftime futuriste",
    "cadence pop uptempo",
  ];
  const mixingNotes = [
    "Sculpte un espace stéréo large avec reverbs plates et delays ping-pong.",
    "Automatise filtres passe-haut pour les transitions et sidechain subtil sur les pads.",
    "Ajoute une saturation bande légère sur le bus master pour coller l'ensemble.",
    "Prévois une automation de largeur stéréo crescendo vers le drop.",
  ];

  const bpm = [84, 96, 104, 118, 122][hash % 5];
  const scale = [
    "La mineur",
    "Ré majeur",
    "Do# mineur",
    "Sol mineur",
    "Mi majeur",
  ][hash % 5];

  const content = [
    `🎼 Concept : ${pick(moods, hash, 0)} · ${bpm} BPM · tonalité ${scale}.`,
    `🎚️ Structure : ${pick(structures, hash, 3)}.`,
    "",
    "🧩 Arrangement conseillé",
    `- Stack instrumental : ${pick(instrumentStacks, hash, 5)}.`,
    `- Rythme principal : ${pick(rhythmIdeas, hash, 7)}.`,
    "- Variations : couche un motif secondaire toutes les 16 mesures pour relancer l'énergie.",
    "- Texture : captures de terrain et foley légers pour renforcer le storytelling.",
    "",
    "🎛️ Direction de production",
    `- Sound design : crée 3 versions du lead pour ${modification ? "intégrer l'ajustement" : "proposer une palette"} contrastée (clean · saturée · granuleuse).`,
    "- Harmonise les transitions avec risers inversés et impacts traités par convolution.",
    `- ${pick(mixingNotes, hash, 11)}`,
    "",
    "📝 Livrables",
    "- Stems séparés (drums / basse / harmo / FX / voix).",
    "- Export master -14 LUFS, headroom 1 dB, format WAV 24 bits.",
    "- Version courte 30 s pour social media.",
  ].join("\n");

  return {
    type: "text",
    category: TOOL_LABELS.music,
    prompt,
    version,
    modification,
    content,
  };
};

const generateAgentResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification } = options;
  const hash = simpleHash([prompt, modification ?? ""].join("|"));

  const nameBase = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+/g, "-");
  const projectSlug = nameBase || `python-agent-${hash % 10_000}`;
  const projectName = projectSlug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const objectives = [
    "analyse stratégique hebdomadaire",
    "synthèse automatisée des insights clients",
    "génération d'idées de contenu ciblées",
    "priorisation de backlog produit",
    "veille concurrentielle structurée",
  ];
  const toolkit = [
    "Notion API",
    "Slack webhooks",
    "Google Sheets",
    "Linear API",
    "HubSpot",
  ];

  const focusObjective = pick(objectives, hash, 1);
  const integration = pick(toolkit, hash, 4);
  const packageName = projectSlug.replace(/-/g, "_");

  const instructions = [
    "## Installation",
    "```bash",
    "python -m venv .venv",
    "source .venv/bin/activate # ou .venv\\Scripts\\activate sous Windows",
    "pip install -e .",
    "cp .env.example .env",
    "```",
    "",
    "## Configuration",
    "1. Renseignez votre clé OpenAI et les identifiants API nécessaires dans `.env`.",
    `2. Ajustez \`AGENT_OBJECTIVE\` et \`PRIMARY_INTEGRATION\` dans \`src/${packageName}/config.py\`.`,
    "3. Lancez les tests rapides :",
    "```bash",
    "pytest",
    "```",
    "",
    "## Exécution",
    "```bash",
    `python -m ${packageName}.cli task "Décrivez la prochaine action"`,
    "```",
    "",
    "Le module FastAPI optionnel peut être lancé via :",
    "```bash",
    "uvicorn server.app:app --reload",
    "```",
  ].join("\n");

  const files: GeneratedResult["files"] = [
    {
      path: "pyproject.toml",
      language: "toml",
      content: [
        "[build-system]",
        'requires = ["setuptools>=65", "wheel"]',
        'build-backend = "setuptools.build_meta"',
        "",
        "[project]",
        `name = "${projectSlug}"`,
        'version = "0.1.0"',
        `description = "Agent Python pour ${focusObjective}"`,
        'authors = [{ name = "Studio One" }]',
        'requires-python = ">=3.10"',
        "dependencies = [",
        '  "openai>=1.13",',
        '  "python-dotenv>=1.0",',
        '  "typer>=0.9",',
        '  "httpx>=0.26",',
        '  "rich>=13.7",',
        '  "fastapi>=0.110",',
        '  "uvicorn[standard]>=0.27",',
        '  "pydantic>=2.6",',
        "]",
        "",
        "[project.scripts]",
        `${projectSlug} = "${packageName}.cli:app"`,
      ].join("\n"),
    },
    {
      path: "README.md",
      language: "markdown",
      content: [
        `# ${projectName}`,
        "",
        `Agent autonome focalisé sur ${focusObjective}. Il orchestre des appels OpenAI et ${integration} à partir d'un pipeline orchestré par Typer + FastAPI.`,
        "",
        "## Flux de travail",
        `1. Collecte les inputs utilisateur et contexte depuis ${integration}.`,
        "2. Raisonne avec une boucle planifier → exécuter → réviser via l'API OpenAI.",
        "3. Produit un rapport structuré et déclenche, si nécessaire, un message sortant.",
        "",
        "## Démarrage rapide",
        "",
        instructions,
      ].join("\n"),
    },
    {
      path: ".env.example",
      content: [
        "OPENAI_API_KEY=sk-...",
        "PRIMARY_INTEGRATION_TOKEN=replace-me",
        "LOG_LEVEL=INFO",
      ].join("\n"),
    },
    {
      path: `src/${packageName}/__init__.py`,
      language: "python",
      content: ['"""Metadata for package."""', '__all__ = ["run_agent"]'].join(
        "\n",
      ),
    },
    {
      path: `src/${packageName}/config.py`,
      language: "python",
      content: [
        "from pydantic import BaseSettings, Field",
        "",
        "",
        "class Settings(BaseSettings):",
        '    """Application configuration loaded from environment."""',
        "",
        '    openai_api_key: str = Field(alias="OPENAI_API_KEY")',
        '    primary_integration_token: str = Field(alias="PRIMARY_INTEGRATION_TOKEN")',
        '    log_level: str = Field(default="INFO")',
        `    agent_objective: str = Field(default="${focusObjective}")`,
        `    primary_integration: str = Field(default="${integration}")`,
        "",
        '    model_config = {"env_file": ".env", "extra": "ignore"}',
        "",
        "",
        "settings = Settings()",
      ].join("\n"),
    },
    {
      path: `src/${packageName}/agent.py`,
      language: "python",
      content: [
        '"""Core reasoning loop for the autonomous agent."""',
        "from __future__ import annotations",
        "",
        "from typing import List",
        "",
        "import httpx",
        "from openai import OpenAI",
        "from rich.console import Console",
        "",
        "from .config import settings",
        "from .integrations import IntegrationClient",
        "",
        "console = Console()",
        "client = OpenAI(api_key=settings.openai_api_key)",
        "",
        `SYSTEM_PROMPT = f"Vous êtes un agent spécialisé dans ${focusObjective}."`,
        "",
        "",
        "def plan_tasks(goal: str) -> List[str]:",
        "    response = client.responses.create(",
        '        model="gpt-4.1-mini",',
        "        input=[",
        '            {"role": "system", "content": SYSTEM_PROMPT},',
        '            {"role": "user", "content": f"Planifie 3 étapes pour : {goal}"},',
        "        ],",
        "    )",
        '    steps = response.output_text.split("\n")',
        '    return [step.strip("- •") for step in steps if step.strip()]',
        "",
        "",
        "def run_agent(goal: str) -> str:",
        '    console.rule("Démarrage de l\'agent")',
        "    steps = plan_tasks(goal)",
        "    integration = IntegrationClient(settings)",
        "",
        "    results: List[str] = []",
        "    for index, step in enumerate(steps, start=1):",
        '        console.print(f"[bold cyan]Étape {index}[/]: {step}")',
        "        context = integration.fetch_context(step)",
        "        response = client.responses.create(",
        '            model="gpt-4.1-mini",',
        "            input=[",
        '                {"role": "system", "content": SYSTEM_PROMPT},',
        '                {"role": "user", "content": f"Objectif: {goal}\\nÉtape: {step}\\nContexte: {context}"},',
        "            ],",
        "        )",
        "        summary = response.output_text.strip()",
        "        integration.push_update(step, summary)",
        '        results.append(f"Étape {index}: {summary}")',
        "",
        '    console.rule("Synthèse")',
        '    return "\n".join(results)',
      ].join("\n"),
    },
    {
      path: `src/${packageName}/integrations.py`,
      language: "python",
      content: [
        `"""Integration shim for ${integration}."""`,
        "from __future__ import annotations",
        "",
        "from .config import Settings",
        "",
        "",
        "class IntegrationClient:",
        '    """Very small abstraction over external integrations."""',
        "",
        "    def __init__(self, settings: Settings) -> None:",
        "        self._settings = settings",
        "",
        "    def fetch_context(self, query: str) -> str:",
        '        """Retrieve context related to the current task."""',
        `        return f"Contexte simulé pour '{query}' via {self._settings.primary_integration}."`,
        "",
        "    def push_update(self, step: str, summary: str) -> None:",
        '        """Send the agent decision to the integration."""',
        "        _ = step, summary  # Ici on branchera l'appel API réel.",
      ].join("\n"),
    },
    {
      path: `src/${packageName}/cli.py`,
      language: "python",
      content: [
        '"""Command line interface to interact with the agent."""',
        "from __future__ import annotations",
        "",
        "import typer",
        "",
        "from .agent import run_agent",
        "",
        'app = typer.Typer(help="Assistant intelligent orchestré par OpenAI")',
        "",
        "@app.command()",
        'def task(description: str = typer.Argument(..., help="Objectif à analyser")) -> None:',
        '    """Exécute le flux principal de l\'agent."""',
        "    result = run_agent(description)",
        '    typer.echo("\n" + result)',
        "",
        'if __name__ == "__main__":',
        "    app()",
      ].join("\n"),
    },
    {
      path: "server/app.py",
      language: "python",
      content: [
        '"""Minimal FastAPI wrapper exposing the agent."""',
        "from __future__ import annotations",
        "",
        "from fastapi import FastAPI",
        "",
        `from ${packageName}.agent import run_agent`,
        "",
        `app = FastAPI(title="${projectName}")`,
        "",
        '@app.post("/run")',
        "async def run(payload: dict[str, str]) -> dict[str, str]:",
        '    goal = payload.get("goal", "Analyse générale")',
        "    report = run_agent(goal)",
        '    return {"goal": goal, "report": report}',
      ].join("\n"),
    },
    {
      path: "tests/test_agent.py",
      language: "python",
      content: [
        '"""Smoke tests for agent entrypoints."""',
        "from __future__ import annotations",
        "",
        `from ${packageName}.agent import plan_tasks`,
        "",
        "",
        "def test_plan_tasks_generates_steps():",
        '    steps = plan_tasks("Analyser un lancement produit")',
        '    assert steps, "Planification vide"',
      ].join("\n"),
    },
  ];

  const content = [
    `🧠 Objectif : ${focusObjective}.`,
    `🔌 Intégration principale : ${integration}.`,
    "⚙️ Stack : OpenAI Responses API · Typer CLI · FastAPI service · Pydantic Settings.",
    `📁 Projet : ${projectName} (${projectSlug}).`,
  ].join("\n");

  return {
    type: "code",
    category: TOOL_LABELS.agent,
    prompt,
    version,
    modification,
    projectName,
    projectType: "python-agent",
    content,
    instructions,
    files,
  };
};

const createMusicPlan = (
  prompt: string,
  modification?: string,
): GenerationPlan => {
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
      [
        /(percussions|tribal|organic)/,
        "percussions organiques et textures granulaires",
      ],
      [/(synth|electro|analog)/, "synthés analogiques pulsés"],
      [/(acoustique|guitare|piano)/, "instrumentation acoustique intimiste"],
    ],
    "basse ronde et pads atmosphériques",
  );

  const sections: PlanSection[] = [
    {
      title: "Analyse musicale",
      objective:
        "Comprendre l'univers sonore souhaité et cadrer les contraintes techniques.",
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
          description:
            "Découper le morceau en intro, sections A/B, pont et outro.",
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
      objective:
        "Construire harmonie, motifs et transitions pour soutenir le récit musical.",
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
          description:
            "Utiliser montées, impacts et textures pour relier les sections.",
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
          description:
            "Composer un rack d'instruments cohérent (pads, percussions, lead).",
          deliverable: "Palette sonore",
        },
        {
          id: "mix",
          title: "Mixer les stems",
          description:
            "Équilibrer dynamiques, panoramiques et effets temporels.",
          deliverable: "Mix stéréo équilibré",
        },
        {
          id: "master",
          title: "Préparer le master",
          description:
            "Appliquer compression glue, EQ douce et limiteur -14 LUFS.",
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

const createAgentPlan = (
  prompt: string,
  modification?: string,
): GenerationPlan => {
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
      objective:
        "Configurer une boucle de réflexion avancée propulsée par Gemini 2.5.",
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
          description:
            "Lister les canaux d'information et signaux déclencheurs.",
          deliverable: "Sources et signaux",
        },
        {
          id: "workflow",
          title: "Structurer le workflow",
          description:
            "Détailler la séquence Observer → Analyser → Agir → Reporter.",
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
          description:
            "Organiser la reprise humaine pour les demandes complexes.",
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

export const requestCreativeResult = async (
  tool: CreativeTool,
  options: GenerationOptions,
): Promise<GeneratedResult> => {
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error("Configuration Supabase manquante");
  }

  const { prompt, version, modification, previous, imageSettings, plan } =
    options;
  const shouldAppendImageSettings = tool === "image" && imageSettings;
  const enrichedPrompt = shouldAppendImageSettings
    ? [prompt.trim(), buildImageSettingsInstructions(imageSettings!)]
        .filter(Boolean)
        .join("\n\n")
    : prompt;

  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      prompt: enrichedPrompt,
      category: tool,
      modification: modification?.trim() ? modification : undefined,
      existingContent: previous?.content?.trim() ? previous.content : undefined,
      plan: plan ?? undefined,
      mode: "content",
      imageSettings: tool === "image" ? imageSettings : undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as Partial<GeneratedResult>;

  return {
    type:
      typeof payload?.type === "string"
        ? payload.type
        : tool === "image"
          ? "image"
          : "text",
    category: typeof payload?.category === "string" ? payload.category : tool,
    content: typeof payload?.content === "string" ? payload.content : undefined,
    preview: typeof payload?.preview === "string" ? payload.preview : undefined,
    code: typeof payload?.code === "string" ? payload.code : undefined,
    files: Array.isArray(payload?.files) ? payload.files : undefined,
    instructions:
      typeof payload?.instructions === "string"
        ? payload.instructions
        : undefined,
    projectName:
      typeof payload?.projectName === "string"
        ? payload.projectName
        : undefined,
    projectType:
      typeof payload?.projectType === "string"
        ? payload.projectType
        : undefined,
    prompt,
    version,
    modification,
    imageSettings: tool === "image" ? imageSettings : undefined,
  };
};

export const getCreativeToolLabel = (tool: CreativeTool) =>
  TOOL_LABELS[tool] ?? tool;

export const requestCreativePlan = async (
  tool: CreativeTool,
  prompt: string,
  modification?: string,
  options?: PlanOptions & { existingPlan?: GenerationPlan | null },
): Promise<GenerationPlan> => {
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error("Configuration Supabase manquante");
  }

  const { image } = options ?? {};

  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      prompt,
      category: tool,
      modification: modification?.trim() ? modification : undefined,
      mode: "plan",
      existingPlan: options?.existingPlan ?? undefined,
      imageSettings: tool === "image" ? image : undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as { plan?: GenerationPlan } | GenerationPlan | null;
  const plan =
    payload && "plan" in (payload as Record<string, unknown>)
      ? (payload as { plan?: GenerationPlan }).plan
      : (payload as GenerationPlan | null);

  if (!plan) {
    throw new Error("Plan introuvable dans la réponse");
  }

  return plan;
};
