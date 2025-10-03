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
        font-family: 'Inter', 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: radial-gradient(circle at 10% -20%, ${config.palette[2]}33, transparent 45%),
          radial-gradient(circle at 90% 0%, ${config.palette[1]}22, #02030a 68%);
        color: #eaf1ff;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: clamp(16px, 4vw, 48px);
        overflow: hidden;
      }
      #wrapper {
        position: relative;
        width: min(1100px, 100%);
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      #hud {
        position: relative;
        z-index: 2;
        padding: 20px clamp(20px, 4vw, 32px);
        border-radius: 26px;
        background: linear-gradient(135deg, rgba(6, 14, 32, 0.85), rgba(9, 22, 48, 0.72));
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 28px 60px -40px rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(22px);
        display: grid;
        gap: 16px;
      }
      #hud::after {
        content: '';
        position: absolute;
        inset: 10px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        pointer-events: none;
        mask: linear-gradient(180deg, rgba(255, 255, 255, 0.15), transparent 60%);
      }
      #hud h1 {
        margin: 0;
        font-size: clamp(20px, 4vw, 32px);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-weight: 700;
      }
      #hud p {
        margin: 0;
        font-size: clamp(12px, 2.6vw, 15px);
        opacity: 0.82;
        line-height: 1.6;
      }
      #objective-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }
      #objective-list span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        font-size: 12px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      #objective-list span strong {
        font-size: 11px;
        letter-spacing: 0.2em;
        color: ${config.palette[2]};
      }
      #webgl {
        position: relative;
        width: 100%;
        height: min(70vh, 640px);
        border-radius: 30px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
        background: radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.9));
        box-shadow: 0 40px 120px -60px rgba(0, 0, 0, 1);
      }
      #webgl canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
      }
      #legend {
        position: absolute;
        bottom: 18px;
        left: 18px;
        padding: 16px 18px;
        border-radius: 18px;
        background: rgba(6, 12, 26, 0.78);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        display: grid;
        gap: 8px;
        backdrop-filter: blur(18px);
      }
      #legend .legend-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      #legend span {
        opacity: 0.7;
      }
      #legend strong {
        font-size: 13px;
        color: ${config.palette[2]};
        letter-spacing: 0.08em;
      }
      #status {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        font-size: clamp(18px, 3.8vw, 32px);
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: white;
        text-shadow: 0 14px 40px rgba(0, 0, 0, 0.65);
        transition: opacity 0.4s ease;
      }
      #status span {
        padding: 16px 32px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(12, 24, 58, 0.9), rgba(18, 40, 86, 0.82));
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 18px 60px -20px rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(24px);
      }
      #status[data-state='victory'] span {
        background: linear-gradient(135deg, rgba(28, 98, 128, 0.95), rgba(92, 208, 255, 0.9));
        color: #031423;
        text-shadow: none;
      }
      #status[data-state='failure'] span {
        background: linear-gradient(135deg, rgba(86, 22, 22, 0.92), rgba(156, 32, 32, 0.9));
      }
      @media (max-width: 720px) {
        #wrapper {
          gap: 14px;
        }
        #webgl {
          border-radius: 24px;
          height: min(60vh, 480px);
        }
        #legend {
          font-size: 11px;
          bottom: 12px;
          left: 12px;
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
      <div id="webgl"></div>
      <div id="legend">
        <div class="legend-row"><span>Artefacts synchronisés</span><strong id="progress-artifacts">0</strong></div>
        <div class="legend-row"><span>Menaces actives</span><strong id="progress-threats">0</strong></div>
        <div class="legend-row"><span>Stabilité environnementale</span><strong id="progress-environment">100%</strong></div>
      </div>
      <div id="status"></div>
    </div>
    <script type="module">
      import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
      import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';

      const CONFIG = ${configString};
      const palette = CONFIG.palette;
      const objectiveList = document.getElementById('objective-list');
      const status = document.getElementById('status');
      const progressArtifacts = document.getElementById('progress-artifacts');
      const progressThreats = document.getElementById('progress-threats');
      const progressEnvironment = document.getElementById('progress-environment');
      const container = document.getElementById('webgl');

      objectiveList.innerHTML = CONFIG.objectives
        .map((objective, index) => {
          const label = objective.replace(/^[^:]+:\s*/, '').trim();
          return '<span><strong>' + String(index + 1).padStart(2, '0') + '</strong>' + label + '</span>';
        })
        .join('');

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#05070f');
      scene.fog = new THREE.FogExp2('#05070f', 0.018);

      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
      camera.position.set(0, 32, 58);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI / 2.1;
      controls.target.set(0, 14, 0);

      const resize = () => {
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 450;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      const hemisphere = new THREE.HemisphereLight(new THREE.Color(palette[2]).multiplyScalar(0.6), new THREE.Color(palette[0]).multiplyScalar(0.4), 1.2);
      scene.add(hemisphere);

      const dirLight = new THREE.DirectionalLight(palette[2], 1.1);
      dirLight.position.set(22, 38, 12);
      dirLight.castShadow = false;
      scene.add(dirLight);

      const ambient = new THREE.AmbientLight(palette[1], 0.18);
      scene.add(ambient);

      const groundGeometry = new THREE.CircleGeometry(90, 64);
      groundGeometry.rotateX(-Math.PI / 2);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: palette[0],
        emissive: new THREE.Color(palette[2]).multiplyScalar(0.08),
        metalness: 0.38,
        roughness: 0.64,
        transparent: true,
        opacity: 0.94,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.receiveShadow = true;
      scene.add(ground);

      const energyFieldGeometry = new THREE.RingGeometry(24, 26, 84);
      energyFieldGeometry.rotateX(-Math.PI / 2);
      const energyFieldMaterial = new THREE.MeshBasicMaterial({
        color: palette[2],
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const energyField = new THREE.Mesh(energyFieldGeometry, energyFieldMaterial);
      energyField.position.y = 0.15;
      scene.add(energyField);

      const ring2 = energyField.clone();
      ring2.scale.setScalar(1.6);
      ring2.material = energyFieldMaterial.clone();
      ring2.material.opacity = 0.18;
      ring2.position.y = 0.2;
      scene.add(ring2);

      const columnGeometry = new THREE.CylinderGeometry(0.6, 1.8, 22, 6, 1, true);
      columnGeometry.translate(0, 11, 0);
      const columnMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[1]).multiplyScalar(0.7),
        emissive: new THREE.Color(palette[2]).multiplyScalar(0.12),
        roughness: 0.4,
        metalness: 0.65,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });

      const monolithCount = Math.max(6, CONFIG.keywords.length);
      for (let i = 0; i < monolithCount; i++) {
        const monolith = new THREE.Mesh(columnGeometry, columnMaterial);
        const radius = 42 + (i % 3) * 6;
        const angle = (i / monolithCount) * Math.PI * 2;
        monolith.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        monolith.rotation.y = angle;
        scene.add(monolith);
      }

      const createKeywordSprite = (keyword, index) => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(15, 26, 48, 0.52)';
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = palette[2];
        context.lineWidth = 4;
        context.stroke();
        context.fillStyle = '#e9f1ff';
        context.font = '700 42px Inter';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const text = keyword.toUpperCase().slice(0, 12);
        context.fillText(text, size / 2, size / 2);
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.72, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(24, 24, 24);
        const angle = index * ((Math.PI * 2) / Math.max(1, CONFIG.keywords.length));
        sprite.position.set(Math.cos(angle) * 54, 20 + Math.sin(index * 1.2) * 6, Math.sin(angle) * 54);
        scene.add(sprite);
        return sprite;
      };

      CONFIG.keywords.slice(0, 12).forEach((keyword, index) => createKeywordSprite(keyword, index));

      const starCount = 600;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const radius = 120 + Math.random() * 220;
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * 140;
        starPositions[i * 3] = Math.cos(angle) * radius;
        starPositions[i * 3 + 1] = height;
        starPositions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMaterial = new THREE.PointsMaterial({
        color: new THREE.Color(palette[2]).multiplyScalar(1.4),
        size: 0.9,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      const playerMaterial = new THREE.MeshStandardMaterial({
        color: palette[2],
        emissive: new THREE.Color(palette[2]).multiplyScalar(1.4),
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.7,
      });
      const player = new THREE.Mesh(new THREE.SphereGeometry(2.2, 42, 42), playerMaterial);
      player.position.set(0, 2.4, 0);
      scene.add(player);

      const playerAuraGeometry = new THREE.RingGeometry(2.6, 3.2, 64);
      playerAuraGeometry.rotateX(-Math.PI / 2);
      const playerAuraMaterial = new THREE.MeshBasicMaterial({
        color: palette[2],
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const playerAura = new THREE.Mesh(playerAuraGeometry, playerAuraMaterial);
      player.add(playerAura);

      const enemyMeshes = CONFIG.enemies.map((label, index) => {
        const geometry = new THREE.TetrahedronGeometry(2.6 + index * 0.3, 0);
        const material = new THREE.MeshStandardMaterial({
          color: palette[1],
          emissive: new THREE.Color(palette[1]).multiplyScalar(0.8),
          emissiveIntensity: 0.9,
          metalness: 0.85,
          roughness: 0.28,
          flatShading: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const angle = (index / Math.max(1, CONFIG.enemies.length)) * Math.PI * 2;
        const radius = 26 + index * 6;
        mesh.position.set(Math.cos(angle) * radius, 6 + Math.sin(index * 1.5) * 3, Math.sin(angle) * radius);
        mesh.userData = {
          label,
          baseRadius: radius,
          angle,
          verticalOffset: Math.random() * Math.PI * 2,
          speed: 0.6 + index * 0.18,
        };
        scene.add(mesh);
        const glow = new THREE.PointLight(palette[1], 5, 40, 2);
        glow.position.set(0, 0, 0);
        mesh.add(glow);
        return mesh;
      });

      progressThreats.textContent = enemyMeshes.length.toString();

      const collectibleMeshes = CONFIG.collectibles.map((label, index) => {
        const geometry = new THREE.IcosahedronGeometry(1.8, 1);
        const material = new THREE.MeshStandardMaterial({
          color: palette[2],
          emissive: new THREE.Color(palette[2]).multiplyScalar(1.6),
          emissiveIntensity: 1.4,
          metalness: 0.72,
          roughness: 0.18,
          transparent: true,
          opacity: 0.9,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const angle = (index / Math.max(1, CONFIG.collectibles.length)) * Math.PI * 2;
        const radius = 18 + (index % 4) * 6;
        mesh.position.set(Math.cos(angle) * radius, 3.4 + Math.sin(index * 1.7) * 1.6, Math.sin(angle) * radius);
        mesh.userData = {
          label,
          collected: false,
          pulse: Math.random() * Math.PI * 2,
          basePosition: mesh.position.clone(),
        };
        const haloGeometry = new THREE.SphereGeometry(2.6, 24, 24);
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: palette[1],
          transparent: true,
          opacity: 0.18,
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        mesh.add(halo);
        const light = new THREE.PointLight(palette[2], 8, 30, 2);
        mesh.add(light);
        scene.add(mesh);
        return mesh;
      });

      progressArtifacts.textContent = '0 / ' + collectibleMeshes.length;

      const hologramGeometry = new THREE.CylinderGeometry(0.2, 0.2, 20, 32, 1, true);
      const hologramMaterial = new THREE.MeshBasicMaterial({
        color: palette[2],
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const hologram = new THREE.Mesh(hologramGeometry, hologramMaterial);
      hologram.position.y = 10;
      scene.add(hologram);

      const neonTrailGeometry = new THREE.BufferGeometry();
      const trailSegments = 120;
      const trailPositions = new Float32Array(trailSegments * 3);
      neonTrailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const neonTrailMaterial = new THREE.LineBasicMaterial({
        color: palette[2],
        transparent: true,
        opacity: 0.35,
      });
      const neonTrail = new THREE.Line(neonTrailGeometry, neonTrailMaterial);
      scene.add(neonTrail);

      const keyState = new Set();
      window.addEventListener('keydown', (event) => {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyQ'].includes(event.code)) {
          keyState.add(event.code);
        }
      });
      window.addEventListener('keyup', (event) => {
        keyState.delete(event.code);
      });

      let collected = 0;
      let victory = false;
      let failure = false;
      const clock = new THREE.Clock();
      const playerVelocity = new THREE.Vector3();
      const targetPosition = new THREE.Vector3();

      const worldBounds = 36;

      const updatePlayer = (dt) => {
        const forward = (keyState.has('KeyW') || keyState.has('ArrowUp') || keyState.has('KeyZ')) ? 1 : 0;
        const backward = (keyState.has('KeyS') || keyState.has('ArrowDown')) ? 1 : 0;
        const left = (keyState.has('KeyA') || keyState.has('ArrowLeft') || keyState.has('KeyQ')) ? 1 : 0;
        const right = (keyState.has('KeyD') || keyState.has('ArrowRight')) ? 1 : 0;

        targetPosition.set(right - left, 0, backward - forward);
        if (targetPosition.lengthSq() > 0) {
          targetPosition.normalize();
          playerVelocity.lerp(targetPosition.multiplyScalar(24 * (victory ? 0.6 : 1)), 0.12);
        } else {
          playerVelocity.multiplyScalar(0.82);
        }

        if (!failure) {
          player.position.addScaledVector(playerVelocity, dt);
        }

        player.position.x = THREE.MathUtils.clamp(player.position.x, -worldBounds, worldBounds);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -worldBounds, worldBounds);

        const speed = playerVelocity.length();
        playerMaterial.emissiveIntensity = THREE.MathUtils.lerp(playerMaterial.emissiveIntensity, victory ? 2.6 : 1.3 + speed * 0.04, 0.1);
        playerAura.scale.setScalar(1.2 + Math.sin(clock.elapsedTime * 3.6) * 0.08 + speed * 0.01);
      };

      const updateTrail = () => {
        for (let i = trailSegments - 1; i > 0; i--) {
          trailPositions[i * 3] = trailPositions[(i - 1) * 3];
          trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
          trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
        }
        trailPositions[0] = player.position.x;
        trailPositions[1] = player.position.y;
        trailPositions[2] = player.position.z;
        neonTrailGeometry.attributes.position.needsUpdate = true;
        neonTrailMaterial.opacity = victory ? 0.6 : 0.35;
      };

      const updateCollectibles = (dt) => {
        collectibleMeshes.forEach((collectible, index) => {
          if (collectible.userData.collected) {
            collectible.scale.lerp(new THREE.Vector3(0.4, 0.4, 0.4), 0.1);
            collectible.material.opacity = THREE.MathUtils.lerp(collectible.material.opacity, 0.05, 0.1);
            return;
          }

          collectible.rotation.x += dt * 0.8;
          collectible.rotation.y += dt * 1.2;
          collectible.position.y = collectible.userData.basePosition.y + Math.sin(clock.elapsedTime * 2 + index) * 0.6;
          collectible.material.emissiveIntensity = 1.4 + Math.sin(clock.elapsedTime * 3 + index) * 0.4;

          if (!failure && collectible.position.distanceTo(player.position) < 3.4) {
            collectible.userData.collected = true;
            collected += 1;
            progressArtifacts.textContent = collected + ' / ' + collectibleMeshes.length;
            status.dataset.state = '';
            status.innerHTML = '<span>' + collectible.userData.label + ' synchronisé</span>';
            playerMaterial.emissiveIntensity = 2.2;

            if (collected >= collectibleMeshes.length) {
              victory = true;
              status.dataset.state = 'victory';
              status.innerHTML = '<span>Simulation stabilisée</span>';
              progressThreats.textContent = '0';
              controls.autoRotate = true;
              controls.autoRotateSpeed = 1.4;
            }
          }
        });
      };

      const updateEnemies = (dt) => {
        enemyMeshes.forEach((enemy, index) => {
          const data = enemy.userData;
          data.angle += dt * (victory ? -0.45 : data.speed);
          const radius = data.baseRadius + Math.sin(clock.elapsedTime * 1.6 + index) * 3.2;
          enemy.position.x = Math.cos(data.angle) * radius;
          enemy.position.z = Math.sin(data.angle) * radius;
          enemy.position.y = 5.6 + Math.sin(clock.elapsedTime * 2 + data.verticalOffset) * 2;
          enemy.rotation.y += dt * 2.6;

          if (!victory && !failure && enemy.position.distanceTo(player.position) < 4.2) {
            failure = true;
            status.dataset.state = 'failure';
            status.innerHTML = '<span>Instabilité critique</span>';
            controls.autoRotate = false;
          }
        });
      };

      const updateEnvironment = () => {
        stars.rotation.y += 0.0006;
        energyField.rotation.z += 0.0008;
        ring2.rotation.z -= 0.0006;
        hologram.rotation.y += 0.0018;

        const stability = failure ? 18 : victory ? 100 : Math.max(28, 100 - player.position.length() * 1.4);
        progressEnvironment.textContent = Math.round(stability) + '%';
      };

      const animate = () => {
        const dt = clock.getDelta();
        updatePlayer(dt);
        updateTrail();
        updateCollectibles(dt);
        updateEnemies(dt);
        updateEnvironment();
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };

      animate();
    </script>
  </body>
</html>
`;
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
