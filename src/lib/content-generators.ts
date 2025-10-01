import type { GeneratedResult } from "@/types/result";

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
