import type { GeneratedResult } from "@/types/result";
import type { GenerationPlan, PlanSection, PlanStep } from "@/types/plan";

export type CreativeTool = "image" | "music" | "agent" | "game";

interface GenerationOptions {
  prompt: string;
  version: number;
  modification?: string;
  previous?: GeneratedResult | null;
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

const createImagePlan = (prompt: string, modification?: string): GenerationPlan => {
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
    summary: `Créer une illustration ${style} centrée sur ${subject} dans ${mood}${summarySuffix}`,
    sections,
    successCriteria: [
      "Sujet et ambiance fidèles au brief",
      "Composition lisible avec profondeur",
      "Palette harmonieuse et cohérente",
    ],
    cautions: [
      "Respecter la perspective et les proportions des éléments",
      "Adapter le niveau de détail selon le support d'utilisation",
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
    summary: `Composer une pièce à ${tempo} inspirée par ${atmosphere}${summarySuffix}`,
    sections,
    successCriteria: [
      "Structure narrative cohérente",
      "Motif mémorable aligné sur l'ambiance",
      "Mix équilibré prêt pour diffusion",
    ],
    cautions: [
      "Adapter la durée au format de diffusion visé",
      "Vérifier les droits si des références sont explicitement citées",
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
    summary: `Structurer ${role} avec ${tone}${summarySuffix}`,
    sections,
    successCriteria: [
      "Objectifs mesurables définis",
      "Workflow clair avec outils associés",
      "Routine de reporting pour amélioration continue",
    ],
    cautions: [
      "Prévoir une supervision humaine avant mise en production",
      "Documenter les limites de l'agent pour cadrer les attentes",
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
    summary: `Imaginer ${genre} en ${camera} avec ${progression}${summarySuffix}`,
    sections,
    successCriteria: [
      "Boucle de gameplay compréhensible",
      "Progression et récompenses motivantes",
      "Vision artistique cohérente",
    ],
    cautions: [
      "Prioriser une vertical slice pour valider les sensations",
      "Anticiper la charge de production selon la complexité technique",
    ],
  };
};


const generateImageResult = (options: GenerationOptions): GeneratedResult => {
  const { prompt, version, modification } = options;
  const hash = simpleHash(`${prompt}|${modification ?? ""}`);
  const palette = ["saphir", "ambre", "magenta", "menthe", "ardoise"];
  const styles = ["cinématique", "illustration vectorielle", "peinture digitale", "3D réaliste", "aquarelle"];
  const mood = ["mystérieuse", "lumineuse", "futuriste", "organique", "minimaliste"];

  const preview = `https://picsum.photos/seed/${encodeURIComponent(`${hash}-${version}`)}/1200/800`;
  const caption = `Style ${pick(styles, hash, 1)} · palette ${pick(palette, hash, 3)} · ambiance ${pick(mood, hash, 5)}`;

  return {
    type: "image",
    category: TOOL_LABELS.image,
    prompt,
    version,
    modification,
    preview,
    content: caption,
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

  const genre = pick(genres, hash, 0);
  const mood = pick(moods, hash, 2);
  const tempo = pick(tempos, hash, 4);
  const instrumentation = pick(instruments, hash, 6);
  const structure = pick(structures, hash, 8);

  const content = [
    `Titre proposé : « ${genre} ${mood} »`,
    `Tempo : ${tempo}`,
    `Ambiance : ${mood}`,
    `Instrumentation clé : ${instrumentation}`,
    `Structure recommandée : ${structure}`,
    "Export suggéré : 48 kHz · 24 bits",
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

  const persona = pick(personas, hash, 1);
  const stack = [pick(tools, hash, 2), pick(tools, hash, 4), pick(tools, hash, 6)]
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");

  const refinement = modification
    ? `\n\nAdaptation demandée : ${modification}.`
    : "";
  const followUp = previous
    ? "\n\nL'agent conserve la mémoire de la version précédente pour ajuster ses tâches."
    : "";

  const content = [
    `Agent proposé : ${persona}`,
    `Outils suggérés : ${stack}`,
    "Routine de travail :",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
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

  const genre = pick(genres, hash, 0);
  const setting = pick(settings, hash, 3);
  const mechanic = pick(mechanics, hash, 5);

  const content = [
    `Concept : ${genre} dans une ${setting}.`,
    `Mécanique signature : ${mechanic}.`,
    "Boucle de jeu :",
    "1. Préparation des missions et sélection des compétences.",
    "2. Exploration générative avec événements dynamiques.",
    "3. Phase de résolution influencée par les choix narratifs.",
    "4. Déblocage d'améliorations persistantes.",
    "\nPilier artistique : mélange de low-poly stylisé et d'effets lumineux volumétriques.",
    "Progression : met en avant la rejouabilité par cartes modulaires et scénarios évolutifs.",
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
): GenerationPlan => {
  switch (tool) {
    case "image":
      return createImagePlan(prompt, modification);
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
