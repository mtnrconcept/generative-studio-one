import { nanoid } from "nanoid";
import { getAssetSources, summarizeAssetBanks, type AssetSource } from "./assetBanks";

export type GameBrief = {
  title: string;
  theme: string;
  description: string;
  references: string[];
};

export type GameSummary = {
  title: string;
  theme: string;
  elevatorPitch: string;
  objectives: string[];
  environment: string;
};

export type GeneratedAsset = {
  id: string;
  name: string;
  category: string;
  description: string;
  sources?: AssetSource[];
};

export type GameBlueprint = {
  summary: GameSummary;
  updates: string[];
  code: string;
  assets: GeneratedAsset[];
  selectedAssetIds: string[];
  assistantMessage: string;
};

type GenerationOptions = {
  userInstruction?: string;
};

const STOP_WORDS = new Set([
  "dans",
  "avec",
  "des",
  "les",
  "une",
  "aux",
  "sur",
  "pour",
  "entre",
  "plus",
  "mais",
  "tout",
  "tous",
  "sous",
  "sans",
  "leur",
  "leurs",
  "lors",
  "cette",
  "comme",
  "afin",
  "être",
  "vous",
  "nous",
  "elles",
  "ils",
  "elles",
  "alors",
  "quand",
  "dont",
  "ainsi",
  "dans",
  "afin",
  "plus",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "quelque",
  "leurs",
  "leurs",
  "chaque",
  "sera",
  "sont",
  "également",
  "ainsi",
  "pendant",
  "après",
  "avant",
  "contre",
  "avoir",
  "fait",
  "faire",
  "sera",
  "sera",
  "dont",
  "cette",
  "cet",
  "ces",
  "est",
  "une",
  "un",
  "au",
  "aux",
  "la",
  "le",
  "de",
  "du",
  "et",
  "en",
  "se",
  "sa",
  "son",
  "ses",
  "qui",
  "que",
  "au",
  "par",
  "ne",
  "pas",
  "plus",
  "très",
  "bien",
]);

const ENVIRONMENT_DESCRIPTORS: Array<{ keywords: string[]; label: string }> = [
  {
    keywords: ["forêt", "forest", "bois", "boisé", "arbres", "jungle"],
    label: "Forêt dense ponctuée de clairières lumineuses",
  },
  {
    keywords: ["désert", "sable", "dune", "canyon"],
    label: "Désert sculpté par le vent et les canyons vertigineux",
  },
  {
    keywords: ["neige", "glace", "glacial", "arctique", "hiver"],
    label: "Toundra glacée avec cristaux lumineux et tempêtes de neige",
  },
  {
    keywords: ["cyber", "néon", "futuriste", "holographique", "synthwave"],
    label: "Mégalopole néon avec brume holographique",
  },
  {
    keywords: ["espace", "stellaire", "galaxie", "orbite"],
    label: "Station orbitale flottant dans une nébuleuse animée",
  },
  {
    keywords: ["océan", "sous-marin", "abyssal", "aquatique"],
    label: "Cité sous-marine bioluminescente",
  },
  {
    keywords: ["mystique", "fantôme", "sorcier", "magie", "enchante"],
    label: "Sanctuaire mystique baigné de lueurs arcaniques",
  },
];

const PALETTES: Array<{ keywords: string[]; colors: [string, string, string] }> = [
  {
    keywords: ["forêt", "nature", "bois"],
    colors: ["#0f2b1d", "#1f6f43", "#a3ffcf"],
  },
  {
    keywords: ["désert", "sable", "soleil"],
    colors: ["#3c1f03", "#c7721e", "#fbd88d"],
  },
  {
    keywords: ["neige", "glace", "arctique", "polaire"],
    colors: ["#0a1533", "#1d5fbf", "#94e5ff"],
  },
  {
    keywords: ["cyber", "néon", "futur", "synthwave"],
    colors: ["#050027", "#9c1aff", "#12d7ff"],
  },
  {
    keywords: ["volcan", "lave", "feu"],
    colors: ["#1a0505", "#872424", "#ff7847"],
  },
];

const DEFAULT_PALETTE: [string, string, string] = ["#0b1f3a", "#3b5bdb", "#9ad0ff"];

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const sanitizeSentence = (sentence: string) =>
  sentence
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const extractKeywords = (text: string): string[] => {
  const matches = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-zA-Zàâäéèêëîïôöùûüç]{4,}/g);

  if (!matches) return [];

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const match of matches) {
    if (!STOP_WORDS.has(match) && !seen.has(match)) {
      seen.add(match);
      keywords.push(match);
    }
    if (keywords.length >= 12) break;
  }

  return keywords;
};

const guessEnvironment = (description: string, theme: string): string => {
  const haystack = `${theme.toLowerCase()} ${description.toLowerCase()}`;

  for (const descriptor of ENVIRONMENT_DESCRIPTORS) {
    if (descriptor.keywords.some((keyword) => haystack.includes(keyword))) {
      return descriptor.label;
    }
  }

  const cleanTheme = theme ? `inspiré par ${theme.toLowerCase()}` : "généré dynamiquement";
  return `Monde ${cleanTheme}, enrichi d'effets atmosphériques procéduraux`;
};

const choosePalette = (description: string, theme: string): [string, string, string] => {
  const haystack = `${theme.toLowerCase()} ${description.toLowerCase()}`;

  for (const palette of PALETTES) {
    if (palette.keywords.some((keyword) => haystack.includes(keyword))) {
      return palette.colors;
    }
  }

  return DEFAULT_PALETTE;
};

const extractFeatureLabels = (description: string, pattern: RegExp, fallback: string[]): string[] => {
  const segments = description
    .split(/[\n.!?]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment && pattern.test(segment));

  if (segments.length === 0) {
    return fallback;
  }

  return segments.map((segment) => {
    const words = segment
      .toLowerCase()
      .replace(/[^a-zA-Zàâäéèêëîïôöùûüç0-9\s-]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
      .slice(0, 3);

    if (words.length === 0) {
      return sanitizeSentence(segment).slice(0, 60);
    }

    return toTitleCase(words.join(" "));
  });
};

const buildObjectives = (description: string, fallback: string[]): string[] => {
  const sentences = description
    .split(/[\n.!?]/)
    .map((sentence) => sanitizeSentence(sentence))
    .filter(Boolean);

  if (sentences.length === 0) {
    return fallback;
  }

  return sentences.slice(0, 3).map((sentence, index) => {
    if (index === 0) return `Boucle principale : ${sentence}`;
    if (index === 1) return `Progression : ${sentence}`;
    return `Ambiance : ${sentence}`;
  });
};

const buildCollectibles = (objectives: string[], keywords: string[]): string[] => {
  const cleanObjectives = objectives.map((objective) =>
    objective.replace(/^[^:]+:\s*/, "").replace(/\.$/, "").trim()
  );

  const extras = keywords.filter((keyword) => !cleanObjectives.some((objective) => objective.includes(keyword)));

  return [...cleanObjectives, ...extras].slice(0, 6);
};

const buildAssets = (
  keywords: string[],
  enemies: string[],
  companions: string[],
  objectives: string[]
): GeneratedAsset[] => {
  const assetSources = [
    ...objectives.map((objective) => ({
      label: objective.replace(/^[^:]+:\s*/, "").replace(/\.$/, "").trim(),
      category: "Objet interactif",
    })),
    ...enemies.map((enemy) => ({ label: enemy, category: "Personnage" })),
    ...companions.map((companion) => ({ label: companion, category: "Personnage" })),
    ...keywords.map((keyword) => ({ label: toTitleCase(keyword), category: "Décor" })),
  ];

  return assetSources.slice(0, 8).map((source) => {
    const sources = getAssetSources(source.label, source.category, keywords);
    const descriptionParts = [
      `Asset généré automatiquement pour représenter ${source.label.toLowerCase()}`,
    ];

    if (sources.length > 0) {
      descriptionParts.push(
        `Suggestions de banques : ${sources
          .map((assetSource) => `${assetSource.bankName} (${assetSource.license})`)
          .join(" / ")}`
      );
    }

    return {
      id: nanoid(),
      name: source.label,
      category: source.category,
      description: descriptionParts.join(". "),
      sources,
    };
  });
};

const buildUpdates = (
  theme: string,
  environment: string,
  enemies: string[],
  companions: string[],
  objectives: string[],
  palette: string[],
  assetBankHighlights: string[]
): string[] => {
  const updates = [
    `Ambiance : ${environment}`,
    enemies.length > 0
      ? `Systèmes d'opposition : ${enemies.join(", ")}`
      : "Focalisation exploration sans ennemis",
    `Boucles de jeu : ${objectives.map((objective) => objective.replace(/^[^:]+:\s*/, "")).join(" / ")}`,
    `Palette dynamique : ${palette.join(" → ")}`,
    `Identité : ${theme}`,
  ];

  if (companions.length > 0) {
    updates.splice(2, 0, `Alliés / Soutiens : ${companions.join(", ")}`);
  }

  if (assetBankHighlights.length > 0) {
    const highlighted = assetBankHighlights.slice(0, 3).join(" • ");
    updates.unshift(`Sources d'assets connectées : ${highlighted}`);
  }

  return updates;
};

const escapeForScript = (value: string) => value.replace(/<\//g, "<\\/");

const buildGameCode = (config: {
  title: string;
  theme: string;
  environment: string;
  objectives: string[];
  enemies: string[];
  collectibles: string[];
  palette: [string, string, string];
  description: string;
  keywords: string[];
}) => {
  const configString = escapeForScript(JSON.stringify(config));

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${config.title}</title>
    <style>
      :root {
        color-scheme: dark;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: radial-gradient(circle at top, ${config.palette[2]}22, #05070f 70%);
        color: #e9f1ff;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
      }
      #wrapper {
        position: relative;
        max-width: 960px;
        width: 100%;
      }
      #hud {
        position: absolute;
        top: 16px;
        left: 16px;
        right: 16px;
        padding: 16px 20px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(5, 10, 22, 0.92), rgba(8, 16, 34, 0.78));
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(16px);
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.8);
      }
      #hud h1 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      #hud p {
        margin: 0;
        font-size: 14px;
        opacity: 0.8;
      }
      #objective-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px;
        font-size: 12px;
        margin-top: 4px;
      }
      #objective-list span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      #legend {
        position: absolute;
        bottom: 16px;
        left: 16px;
        padding: 12px 16px;
        border-radius: 14px;
        background: rgba(5, 10, 22, 0.75);
        font-size: 12px;
        line-height: 1.5;
        border: 1px solid rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(14px);
      }
      canvas {
        width: 100%;
        border-radius: 26px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.85));
        box-shadow: 0 32px 70px -40px rgba(0, 0, 0, 0.9);
      }
      #status {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        font-size: 28px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: white;
        text-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
      }
      #status span {
        padding: 16px 28px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(10, 20, 44, 0.92), rgba(12, 34, 66, 0.82));
        border: 1px solid rgba(255, 255, 255, 0.16);
        backdrop-filter: blur(20px);
      }
      @media (max-width: 720px) {
        body {
          padding: 16px;
        }
        #hud {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div id="wrapper">
      <div id="hud">
        <h1>${config.title}</h1>
        <p>${config.theme}</p>
        <p>Environnement : ${config.environment}</p>
        <div id="objective-list"></div>
      </div>
      <canvas id="game" width="960" height="540"></canvas>
      <div id="legend">
        <div><strong>Déplacements :</strong> ZQSD / Flèches</div>
        <div><strong>Objectif :</strong> Collecter les artefacts lumineux en évitant les menaces</div>
      </div>
      <div id="status"></div>
    </div>
    <script>
      const CONFIG = ${configString};
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const objectiveList = document.getElementById('objective-list');
      const status = document.getElementById('status');

      objectiveList.innerHTML = CONFIG.objectives
        .map((objective, index) => \`<span>#\${index + 1} \${objective}</span>\`)
        .join('');

      const pressed = new Map();
      window.addEventListener('keydown', (event) => {
        pressed.set(event.key.toLowerCase(), true);
      });
      window.addEventListener('keyup', (event) => {
        pressed.set(event.key.toLowerCase(), false);
      });

      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      const player = {
        x: WIDTH / 2,
        y: HEIGHT / 2,
        size: 24,
        color: CONFIG.palette[1],
        speed: 210,
      };

      const collectibleRadius = 18;
      const collectibles = CONFIG.collectibles.map((label, index) => ({
        id: index,
        label,
        x: 120 + (index % 4) * 180 + Math.random() * 40,
        y: 140 + Math.floor(index / 4) * 160 + Math.random() * 40,
        radius: collectibleRadius,
        collected: false,
      }));

      const enemies = CONFIG.enemies.map((label, index) => ({
        label,
        x: 160 + (index % 3) * 280,
        y: 360 + (index % 2) * 60,
        angle: Math.random() * Math.PI * 2,
        speed: 80 + index * 35,
        size: 28,
        color: CONFIG.palette[(index + 2) % CONFIG.palette.length] || '#ff5f56',
        sway: 0,
      }));

      const nebulae = CONFIG.keywords.map((keyword, index) => ({
        text: keyword.toUpperCase(),
        angle: (index / CONFIG.keywords.length) * Math.PI * 2,
        radius: 180 + index * 22,
      }));

      let collectedCount = 0;
      let gameOver = false;
      let victory = false;
      let lastTime = performance.now();

      const backgroundGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
      backgroundGradient.addColorStop(0, CONFIG.palette[0]);
      backgroundGradient.addColorStop(0.5, CONFIG.palette[1]);
      backgroundGradient.addColorStop(1, CONFIG.palette[2]);

      const renderCollectible = (collectible) => {
        ctx.save();
        ctx.translate(collectible.x, collectible.y);
        ctx.rotate(((performance.now() / 600) + collectible.id) % (Math.PI * 2));
        ctx.beginPath();
        ctx.fillStyle = collectible.collected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)';
        ctx.shadowColor = collectible.collected ? 'rgba(255,255,255,0.1)' : CONFIG.palette[2];
        ctx.shadowBlur = 18;
        ctx.arc(0, 0, collectible.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = collectible.collected ? 'rgba(255,255,255,0.3)' : '#05070f';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(collectible.label.slice(0, 14), 0, 4);
        ctx.restore();
      };

      const renderEnemy = (enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(0, -enemy.size);
        ctx.lineTo(enemy.size * 0.6, enemy.size);
        ctx.lineTo(-enemy.size * 0.6, enemy.size);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#05070f';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.label.slice(0, 16), 0, enemy.size + 16);
        ctx.restore();
      };

      const renderPlayer = () => {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.fillStyle = player.color;
        ctx.shadowColor = CONFIG.palette[2];
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, player.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#05070f';
        ctx.font = '700 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', 0, 6);
        ctx.restore();
      };

      const updatePlayer = (dt) => {
        if (gameOver) return;
        let dx = 0;
        let dy = 0;

        if (pressed.get('w') || pressed.get('arrowup') || pressed.get('z')) dy -= 1;
        if (pressed.get('s') || pressed.get('arrowdown')) dy += 1;
        if (pressed.get('a') || pressed.get('arrowleft') || pressed.get('q')) dx -= 1;
        if (pressed.get('d') || pressed.get('arrowright')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const length = Math.hypot(dx, dy);
          dx /= length;
          dy /= length;
          player.x = clamp(player.x + dx * player.speed * dt, 40, WIDTH - 40);
          player.y = clamp(player.y + dy * player.speed * dt, 80, HEIGHT - 60);
        }
      };

      const updateCollectibles = () => {
        if (gameOver) return;
        collectibles.forEach((collectible) => {
          if (collectible.collected) return;
          const distance = Math.hypot(player.x - collectible.x, player.y - collectible.y);
          if (distance < player.size + collectible.radius) {
            collectible.collected = true;
            collectedCount += 1;
          }
        });
        if (collectibles.length > 0 && collectedCount === collectibles.length) {
          victory = true;
          gameOver = true;
          status.innerHTML = '<span>Mission accomplie</span>';
        }
      };

      const updateEnemies = (dt) => {
        enemies.forEach((enemy) => {
          enemy.sway += dt * 0.9;
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const distance = Math.hypot(dx, dy) || 1;
          enemy.angle = Math.atan2(dy, dx);

          const chaseSpeed = enemy.speed * (victory ? -0.5 : 1);
          enemy.x += (dx / distance) * chaseSpeed * dt;
          enemy.y += (dy / distance) * chaseSpeed * dt;
          enemy.x += Math.sin(enemy.sway) * 18 * dt;
          enemy.y += Math.cos(enemy.sway * 0.8) * 14 * dt;
          enemy.x = clamp(enemy.x, 40, WIDTH - 40);
          enemy.y = clamp(enemy.y, 120, HEIGHT - 60);

          if (!victory && Math.hypot(player.x - enemy.x, player.y - enemy.y) < (player.size + enemy.size) * 0.4) {
            gameOver = true;
            status.innerHTML = '<span>Relance nécessaire</span>';
          }
        });
      };

      const renderNebulae = (time) => {
        ctx.save();
        ctx.translate(WIDTH / 2, HEIGHT / 2);
        ctx.font = '600 18px Inter';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.16;
        CONFIG.keywords.forEach((nebula, index) => {
          const angle = time * 0.00008 + nebula.angle;
          const radius = nebula.radius + Math.sin(time * 0.0002 + index) * 20;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + Math.sin(time * 0.0003 + index) * 0.4);
          ctx.fillStyle = index % 2 === 0 ? CONFIG.palette[2] : CONFIG.palette[1];
          ctx.fillText(nebula.text, 0, 0);
          ctx.restore();
        });
        ctx.restore();
      };

      const render = (time) => {
        ctx.fillStyle = backgroundGradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        renderNebulae(time);

        collectibles.forEach(renderCollectible);
        enemies.forEach(renderEnemy);
        renderPlayer();

        ctx.save();
        ctx.translate(WIDTH - 200, 40);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(-12, -12, 200, CONFIG.enemies.length ? 120 : 80);
        ctx.fillStyle = '#fff';
        ctx.font = '600 13px Inter';
        ctx.fillText('Progression', 0, 0);
        ctx.font = '400 12px Inter';
        ctx.fillStyle = '#9ec5ff';
        ctx.fillText('Artefacts : ' + collectedCount + ' / ' + collectibles.length, 0, 22);
        ctx.fillText('Menaces actives : ' + CONFIG.enemies.length, 0, 44);
        ctx.fillText('Ambiance : ' + CONFIG.environment.slice(0, 32) + '...', 0, 66);
        ctx.restore();
      };

      const step = (now) => {
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        updatePlayer(dt);
        updateCollectibles();
        updateEnemies(dt);
        render(now);

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    </script>
  </body>
</html>`;
};

export const generateGameBlueprint = (
  brief: GameBrief,
  options: GenerationOptions = {}
): GameBlueprint => {
  const trimmedTitle = sanitizeSentence(brief.title);
  const trimmedTheme = sanitizeSentence(brief.theme);
  const trimmedDescription = sanitizeSentence(brief.description);

  const keywords = extractKeywords(trimmedDescription || trimmedTheme || trimmedTitle);

  const defaultTitle = keywords.length > 0 ? toTitleCase(keywords.slice(0, 2).join(" ")) : "Prototype IA";
  const title = trimmedTitle || defaultTitle;

  const theme = trimmedTheme || (keywords.length > 0 ? `Univers ${keywords[0]}` : "Univers généré");

  const environment = guessEnvironment(trimmedDescription, theme);
  const palette = choosePalette(trimmedDescription, theme);

  const enemyPattern = /(boss|ennemi|enemie|monstre|créature|assassin|robot|démon|pirate|soldat|drone|mecha)/i;
  const friendPattern = /(allié|compagnon|ami|guide|esprit|gardien)/i;

  const enemyLabels = extractFeatureLabels(trimmedDescription, enemyPattern, keywords.slice(0, 3).map(toTitleCase));
  const companionLabels = extractFeatureLabels(trimmedDescription, friendPattern, keywords.slice(3, 6).map(toTitleCase));

  const objectives = buildObjectives(trimmedDescription, [
    "Boucle principale : Explorer l'espace de jeu généré",
    "Progression : Intégrer vos directives pour enrichir le gameplay",
    "Ambiance : Expérience immersive rendue en WebGL",
  ]);

  const collectibles = buildCollectibles(objectives, keywords.length > 0 ? keywords : ["artefacts", "fragments", "souvenirs"]);

  const assets = buildAssets(keywords, enemyLabels, companionLabels, objectives);
  const assetBankHighlights = summarizeAssetBanks(assets);
  const selectedAssetIds = assets.slice(0, 3).map((asset) => asset.id);
  const updates = buildUpdates(
    theme,
    environment,
    enemyLabels,
    companionLabels,
    objectives,
    palette,
    assetBankHighlights
  );

  const descriptionFallback = trimmedDescription ||
    "Prototype généré automatiquement à partir de votre brief pour démonstration immédiate.";

  const code = buildGameCode({
    title,
    theme,
    environment,
    objectives,
    enemies: enemyLabels,
    collectibles,
    palette,
    description: descriptionFallback,
    keywords: keywords.length > 0 ? keywords : ["création", "monde", "action"],
  });

  const directive = options.userInstruction
    ? `Instruction appliquée : ${options.userInstruction}`
    : "Prototype initial généré";

  const assetSourceSummary = assetBankHighlights.slice(0, 2).join(" & ");

  const assistantMessage = `${directive}. ${title} vous plonge dans ${environment.toLowerCase()}. Objectifs clés : ${objectives
    .map((objective) => objective.replace(/^[^:]+:\s*/, ""))
    .join(" / ")}. Palette utilisée : ${palette.join(
    " → "
  )}. ${
    assetSourceSummary
      ? `Banques d'assets recommandées : ${assetSourceSummary}.`
      : "Banques d'assets recommandées : Kenney Asset Packs & OpenGameArt."
  } Testez le gameplay interactif directement dans le previewer.`;

  return {
    summary: {
      title,
      theme,
      elevatorPitch: descriptionFallback,
      objectives,
      environment,
    },
    updates,
    code,
    assets,
    selectedAssetIds,
    assistantMessage,
  };
};
