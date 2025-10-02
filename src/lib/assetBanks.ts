export type AssetBankCategory =
  | "Décor"
  | "Personnage"
  | "Objet interactif"
  | "Texture"
  | "Interface"
  | "Audio"
  | "Généraliste";

type AssetBank = {
  id: string;
  name: string;
  homepage: string;
  description: string;
  license: string;
  categories: AssetBankCategory[];
  searchUrlTemplate: string;
  tags?: string[];
};

export type AssetSource = {
  bankId: string;
  bankName: string;
  url: string;
  license: string;
  description: string;
};

const ASSET_BANKS: AssetBank[] = [
  {
    id: "kenney",
    name: "Kenney Asset Packs",
    homepage: "https://kenney.nl/assets",
    description:
      "Bibliothèque d'assets 2D/3D libres de droits idéale pour prototyper rapidement.",
    license: "CC0 (domaine public)",
    categories: ["Décor", "Personnage", "Objet interactif", "Interface", "Généraliste"],
    searchUrlTemplate: "https://kenney.nl/assets?search={query}",
    tags: ["pixel", "low poly", "platformer", "space", "rpg"],
  },
  {
    id: "opengameart",
    name: "OpenGameArt",
    homepage: "https://opengameart.org/",
    description:
      "Plateforme communautaire regroupant des sprites, tilesets, effets sonores et musiques libres.",
    license: "Multiples licences libres (CC0, CC-BY, GPL)",
    categories: ["Décor", "Personnage", "Objet interactif", "Audio", "Généraliste"],
    searchUrlTemplate: "https://opengameart.org/art-search?keys={query}",
    tags: ["fantasy", "rpg", "roguelike", "retro"],
  },
  {
    id: "poly-pizza",
    name: "Poly Pizza",
    homepage: "https://poly.pizza/",
    description:
      "Collection de modèles 3D low poly compatibles WebGL idéale pour les environnements stylisés.",
    license: "CC-BY 3.0",
    categories: ["Décor", "Objet interactif", "Personnage"],
    searchUrlTemplate: "https://poly.pizza/search?q={query}",
    tags: ["low poly", "3d", "stylized"],
  },
  {
    id: "ambientcg",
    name: "AmbientCG",
    homepage: "https://ambientcg.com/",
    description: "Textures PBR en haute résolution utilisables pour les décors et surfaces.",
    license: "CC0 (domaine public)",
    categories: ["Texture", "Décor"],
    searchUrlTemplate: "https://ambientcg.com/list?search={query}",
    tags: ["texture", "pbr", "material"],
  },
  {
    id: "itch-asset-store",
    name: "Itch.io Asset Store",
    homepage: "https://itch.io/game-assets",
    description:
      "Marketplace riche en assets premium et gratuits couvrant une grande variété de styles artistiques.",
    license: "Variable selon les créateurs",
    categories: ["Décor", "Personnage", "Objet interactif", "Interface", "Audio", "Généraliste"],
    searchUrlTemplate: "https://itch.io/game-assets/tag-{query}",
    tags: ["metroidvania", "cyberpunk", "horror", "ui"],
  },
  {
    id: "game-icons",
    name: "Game-Icons.net",
    homepage: "https://game-icons.net/",
    description: "Plus de 4000 icônes vectorielles libres parfaites pour les objets et interfaces.",
    license: "CC-BY 3.0",
    categories: ["Objet interactif", "Interface"],
    searchUrlTemplate: "https://game-icons.net/tags/{query}.html",
    tags: ["icon", "abilities", "items"],
  },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const encodeQuery = (value: string) =>
  encodeURIComponent(
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s/g, "+")
  );

const CATEGORY_SYNONYMS: Record<string, AssetBankCategory> = {
  decor: "Décor",
  environnement: "Décor",
  environment: "Décor",
  personnage: "Personnage",
  adversaire: "Personnage",
  ennemi: "Personnage",
  allié: "Personnage",
  npc: "Personnage",
  objet: "Objet interactif",
  artefact: "Objet interactif",
  collectible: "Objet interactif",
  item: "Objet interactif",
  texture: "Texture",
  interface: "Interface",
  ui: "Interface",
  hud: "Interface",
};

const normalizeCategory = (category: string): AssetBankCategory => {
  const normalized = normalize(category);
  const direct = CATEGORY_SYNONYMS[normalized];
  if (direct) return direct;

  if (normalized.includes("person")) return "Personnage";
  if (normalized.includes("decor") || normalized.includes("env")) return "Décor";
  if (normalized.includes("obj")) return "Objet interactif";
  if (normalized.includes("texture")) return "Texture";
  if (normalized.includes("ui") || normalized.includes("interface")) return "Interface";

  return "Généraliste";
};

export const getAssetSources = (
  label: string,
  category: string,
  keywords: string[] = [],
  limit = 3
): AssetSource[] => {
  const normalizedCategory = normalizeCategory(category);
  const normalizedKeywords = keywords.map((keyword) => normalize(keyword));

  const queryCandidate = [label, ...keywords]
    .map((value) => value.trim())
    .filter(Boolean)
    .shift() ?? category;

  const query = encodeQuery(queryCandidate);

  const matches = ASSET_BANKS.filter((bank) => {
    if (bank.categories.includes(normalizedCategory)) return true;
    if (normalizedCategory === "Généraliste") return true;
    return bank.tags?.some((tag) => normalizedKeywords.some((keyword) => keyword.includes(tag)));
  });

  const unique = new Map<string, AssetSource>();

  for (const bank of matches) {
    const url = bank.searchUrlTemplate.replace("{query}", query);
    unique.set(bank.id, {
      bankId: bank.id,
      bankName: bank.name,
      url,
      license: bank.license,
      description: bank.description,
    });
    if (unique.size >= limit) break;
  }

  if (unique.size === 0) {
    for (const bank of ASSET_BANKS.filter((candidate) => candidate.categories.includes("Généraliste"))) {
      const url = bank.searchUrlTemplate.replace("{query}", query);
      unique.set(bank.id, {
        bankId: bank.id,
        bankName: bank.name,
        url,
        license: bank.license,
        description: bank.description,
      });
      if (unique.size >= limit) break;
    }
  }

  return Array.from(unique.values());
};

export const summarizeAssetBanks = (assets: { sources?: AssetSource[] }[]): string[] => {
  const map = new Map<string, AssetSource>();

  assets.forEach((asset) => {
    asset.sources?.forEach((source) => {
      if (!map.has(source.bankId)) {
        map.set(source.bankId, source);
      }
    });
  });

  return Array.from(map.values()).map(
    (source) => `${source.bankName} (${source.license})`
  );
};
