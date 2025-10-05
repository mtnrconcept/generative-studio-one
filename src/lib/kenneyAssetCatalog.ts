// Catalogue complet des asset packs Kenney disponibles
export interface KenneyAssetPack {
  name: string;
  slug: string;
  description: string;
  category: "2D" | "3D" | "UI" | "Audio" | "Fonts";
  downloadUrl: string;
  thumbnailUrl: string;
  fileSize: string;
  tags: string[];
}

export const KENNEY_ASSET_CATALOG: KenneyAssetPack[] = [
  // === 2D PLATFORMER ASSETS ===
  {
    name: "Pixel Platformer",
    slug: "pixel-platformer",
    description: "Complete platformer asset pack with tiles, characters, and objects",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/9-platformer-pack-redux/platformer_pack_redux.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/9-platformer-pack-redux/preview.png",
    fileSize: "2.1 MB",
    tags: ["platformer", "pixel", "retro", "character", "tiles"]
  },
  {
    name: "Platformer Art Deluxe",
    slug: "platformer-art-deluxe",
    description: "Deluxe platformer art collection",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/5-platformer-art-deluxe/platformer_art_deluxe.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/5-platformer-art-deluxe/preview.png",
    fileSize: "4.5 MB",
    tags: ["platformer", "deluxe", "complete", "tiles", "characters"]
  },
  {
    name: "Abstract Platformer",
    slug: "abstract-platformer",
    description: "Abstract geometric platformer pack",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/32-abstract-platformer/abstract_platformer.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/32-abstract-platformer/preview.png",
    fileSize: "0.9 MB",
    tags: ["abstract", "platformer", "geometric", "modern"]
  },
  {
    name: "Jumper Pack",
    slug: "jumper-pack",
    description: "Complete jumping game asset pack",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/7-jumper-pack/jumper_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/7-jumper-pack/preview.png",
    fileSize: "2.8 MB",
    tags: ["jumper", "platformer", "vertical", "endless"]
  },
  {
    name: "Simplified Platformer Pack",
    slug: "simplified-platformer",
    description: "Simple and clean platformer assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/10-simplified-platformer-pack/simplified_platformer_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/10-simplified-platformer-pack/preview.png",
    fileSize: "1.3 MB",
    tags: ["platformer", "simple", "clean", "minimal"]
  },
  {
    name: "Pixel Platformer Blocks",
    slug: "pixel-platformer-blocks",
    description: "Block-based platformer tiles",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/503-pixel-platformer-blocks/pixel_platformer_blocks.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/503-pixel-platformer-blocks/preview.png",
    fileSize: "0.5 MB",
    tags: ["platformer", "blocks", "tiles", "pixel"]
  },

  // === 2D CHARACTERS ===
  {
    name: "Shape Characters",
    slug: "shape-characters",
    description: "Geometric character sprites for games",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/445-shape-characters/shapecharacters.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/445-shape-characters/preview.png",
    fileSize: "1.8 MB",
    tags: ["character", "shapes", "simple", "colorful"]
  },
  {
    name: "Blocky Characters",
    slug: "blocky-characters",
    description: "3D-style blocky character sprites",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/449-blocky-characters/blocky_characters.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/449-blocky-characters/preview.png",
    fileSize: "2.3 MB",
    tags: ["character", "blocky", "3d-style", "modern"]
  },
  {
    name: "Toon Characters",
    slug: "toon-characters",
    description: "Cartoon style character pack",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/8-toon-characters-1/toon_characters.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/8-toon-characters-1/preview.png",
    fileSize: "5.1 MB",
    tags: ["toon", "cartoon", "characters", "animated"]
  },
  {
    name: "Animal Pack Redux",
    slug: "animal-pack-redux",
    description: "Collection of animal sprites",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/35-animal-pack-redux/animalpack_redux.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/35-animal-pack-redux/preview.png",
    fileSize: "3.2 MB",
    tags: ["animals", "creatures", "wildlife", "nature"]
  },

  // === 2D SPACE & SCI-FI ===
  {
    name: "Space Shooter Redux",
    slug: "space-shooter-redux",
    description: "Complete space shooter asset pack",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/13-space-shooter-redux/spaceshooterredux_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/13-space-shooter-redux/preview.png",
    fileSize: "3.2 MB",
    tags: ["space", "shooter", "sci-fi", "ships", "bullets"]
  },
  {
    name: "Planets",
    slug: "planets",
    description: "Planet sprites for space games",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/28-planets/planets.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/28-planets/preview.png",
    fileSize: "0.8 MB",
    tags: ["space", "planets", "sci-fi", "astronomy"]
  },
  {
    name: "Pixel Shmup",
    slug: "pixel-shmup",
    description: "Shoot 'em up pixel art pack",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/146-pixel-shmup/pixelshmup_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/146-pixel-shmup/preview.png",
    fileSize: "1.2 MB",
    tags: ["shmup", "shooter", "pixel", "arcade"]
  },
  {
    name: "Alien UFO Pack",
    slug: "alien-ufo-pack",
    description: "UFO and alien themed assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/34-alien-ufo-pack/alien_ufo_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/34-alien-ufo-pack/preview.png",
    fileSize: "1.1 MB",
    tags: ["alien", "ufo", "space", "sci-fi"]
  },

  // === 2D RACING & VEHICLES ===
  {
    name: "Racing Pack",
    slug: "racing-pack",
    description: "Top-down racing game assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/30-racing-pack/racing_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/30-racing-pack/preview.png",
    fileSize: "2.8 MB",
    tags: ["racing", "cars", "vehicles", "track"]
  },
  {
    name: "Car Kit",
    slug: "car-kit",
    description: "Various car sprites and parts",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/31-car-kit/car_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/31-car-kit/preview.png",
    fileSize: "1.9 MB",
    tags: ["cars", "vehicles", "racing", "driving"]
  },

  // === 2D MEDIEVAL & FANTASY ===
  {
    name: "Retro Medieval Kit",
    slug: "retro-medieval-kit",
    description: "Medieval themed pixel art assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/495-retro-medieval-kit/retro_medieval.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/495-retro-medieval-kit/preview.png",
    fileSize: "1.5 MB",
    tags: ["medieval", "retro", "pixel", "fantasy", "rpg"]
  },
  {
    name: "Tiny Dungeon",
    slug: "tiny-dungeon",
    description: "Tiny pixel dungeon crawler assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/383-tiny-dungeon/tiny_dungeon.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/383-tiny-dungeon/preview.png",
    fileSize: "0.3 MB",
    tags: ["dungeon", "rpg", "tiny", "pixel", "fantasy"]
  },
  {
    name: "Mini Dungeon",
    slug: "mini-dungeon",
    description: "Mini dungeon tileset and sprites",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/387-mini-dungeon/mini_dungeon.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/387-mini-dungeon/preview.png",
    fileSize: "0.4 MB",
    tags: ["dungeon", "rpg", "mini", "pixel", "fantasy"]
  },
  {
    name: "Micro Roguelike",
    slug: "micro-roguelike",
    description: "Tiny roguelike game assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/388-micro-roguelike/micro_roguelike.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/388-micro-roguelike/preview.png",
    fileSize: "0.2 MB",
    tags: ["roguelike", "rpg", "micro", "pixel", "dungeon"]
  },

  // === 2D WESTERN & DESERT ===
  {
    name: "Desert Shooter Pack",
    slug: "desert-shooter-pack",
    description: "Western/desert themed shooter assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/496-desert-shooter-pack/desert_shooter.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/496-desert-shooter-pack/preview.png",
    fileSize: "1.9 MB",
    tags: ["desert", "western", "shooter", "cowboy"]
  },

  // === 2D TOWN & CITY ===
  {
    name: "Tiny Town",
    slug: "tiny-town",
    description: "Tiny pixel town building assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/384-tiny-town/tiny_town.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/384-tiny-town/preview.png",
    fileSize: "0.4 MB",
    tags: ["town", "city", "tiny", "pixel", "buildings"]
  },
  {
    name: "Mini Town",
    slug: "mini-town",
    description: "Mini town tileset and buildings",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/385-mini-town/mini_town.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/385-mini-town/preview.png",
    fileSize: "0.5 MB",
    tags: ["town", "city", "mini", "pixel", "buildings"]
  },

  // === 2D TOP-DOWN ===
  {
    name: "Top-Down Tanks Redux",
    slug: "topdown-tanks-redux",
    description: "Top-down tank shooter assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/33-topdown-tanks-redux/topdown_tanks_redux.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/33-topdown-tanks-redux/preview.png",
    fileSize: "2.4 MB",
    tags: ["tanks", "topdown", "shooter", "military"]
  },
  {
    name: "Top-Down Shooter",
    slug: "topdown-shooter",
    description: "Top-down shooter game pack",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/4-topdown-shooter/topdown_shooter.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/4-topdown-shooter/preview.png",
    fileSize: "3.7 MB",
    tags: ["shooter", "topdown", "action", "weapons"]
  },

  // === 2D PUZZLE & CASUAL ===
  {
    name: "Puzzle Pack",
    slug: "puzzle-pack",
    description: "Puzzle game assets and pieces",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/2-puzzle-pack/puzzle_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/2-puzzle-pack/preview.png",
    fileSize: "1.6 MB",
    tags: ["puzzle", "casual", "match", "blocks"]
  },
  {
    name: "Board Game Icons",
    slug: "board-game-icons",
    description: "Icons for board games",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/3-board-game-icons/board_game_icons.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/3-board-game-icons/preview.png",
    fileSize: "1.1 MB",
    tags: ["board", "game", "icons", "pieces"]
  },

  // === 2D SPORTS ===
  {
    name: "Sports Pack",
    slug: "sports-pack",
    description: "Sports themed game assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/497-sports-pack/sports_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/497-sports-pack/preview.png",
    fileSize: "2.1 MB",
    tags: ["sports", "games", "athletic", "competition"]
  },

  // === 2D FOOD & ITEMS ===
  {
    name: "Food Kit",
    slug: "food-kit",
    description: "Food and cooking game assets",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/36-food-kit/food_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/36-food-kit/preview.png",
    fileSize: "1.4 MB",
    tags: ["food", "cooking", "restaurant", "items"]
  },

  // === 2D BACKGROUNDS ===
  {
    name: "Background Elements Redux",
    slug: "background-elements-redux",
    description: "Layered background elements",
    category: "2D",
    downloadUrl: "https://kenney.nl/content/3-assets/26-background-elements-redux/background_elements_redux.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/26-background-elements-redux/preview.png",
    fileSize: "2.7 MB",
    tags: ["background", "parallax", "scenery", "environment"]
  },

  // === UI PACKS ===
  {
    name: "UI Pack",
    slug: "ui-pack",
    description: "Complete UI elements pack",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/1-ui-pack/uipack_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/1-ui-pack/preview.png",
    fileSize: "1.7 MB",
    tags: ["ui", "interface", "buttons", "panels"]
  },
  {
    name: "UI Pack - Space Expansion",
    slug: "ui-pack-space",
    description: "Sci-fi themed UI elements",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/12-ui-pack-space-expansion/uipack_space_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/12-ui-pack-space-expansion/preview.png",
    fileSize: "1.4 MB",
    tags: ["ui", "space", "sci-fi", "futuristic"]
  },
  {
    name: "UI Pack - RPG Expansion",
    slug: "ui-pack-rpg",
    description: "Fantasy RPG UI elements",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/11-ui-pack-rpg-expansion/uipack_rpg_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/11-ui-pack-rpg-expansion/preview.png",
    fileSize: "1.5 MB",
    tags: ["ui", "rpg", "fantasy", "medieval"]
  },
  {
    name: "Game Icons",
    slug: "game-icons",
    description: "Collection of game UI icons",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/6-game-icons/game_icons.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/6-game-icons/preview.png",
    fileSize: "3.6 MB",
    tags: ["icons", "ui", "symbols", "interface"]
  },
  {
    name: "Input Prompts",
    slug: "input-prompts",
    description: "Controller and keyboard input icons",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/22-input-prompts/input_prompts.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/22-input-prompts/preview.png",
    fileSize: "2.1 MB",
    tags: ["input", "controller", "keyboard", "prompts"]
  },
  {
    name: "Game Icons Expansion",
    slug: "game-icons-expansion",
    description: "More game UI icons",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/27-game-icons-expansion/game_icons_expansion.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/27-game-icons-expansion/preview.png",
    fileSize: "2.9 MB",
    tags: ["icons", "ui", "symbols", "interface"]
  },
  {
    name: "Pixel UI Pack",
    slug: "pixel-ui-pack",
    description: "Pixel art UI elements",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/440-pixel-ui-pack/pixeluipack_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/440-pixel-ui-pack/preview.png",
    fileSize: "0.8 MB",
    tags: ["ui", "pixel", "retro", "interface"]
  },

  // === AUDIO PACKS ===
  {
    name: "Digital Audio",
    slug: "digital-audio",
    description: "Digital sound effects collection",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/16-digital-audio/digitalaudio_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/16-digital-audio/preview.png",
    fileSize: "8.5 MB",
    tags: ["audio", "sfx", "digital", "electronic"]
  },
  {
    name: "Impact Sounds",
    slug: "impact-sounds",
    description: "Impact and collision sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/17-impact-sounds/impactsounds_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/17-impact-sounds/preview.png",
    fileSize: "3.2 MB",
    tags: ["audio", "sfx", "impact", "collision"]
  },
  {
    name: "RPG Audio",
    slug: "rpg-audio",
    description: "RPG themed sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/25-rpg-audio/rpgaudio_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/25-rpg-audio/preview.png",
    fileSize: "12.1 MB",
    tags: ["audio", "sfx", "rpg", "fantasy"]
  },
  {
    name: "Interface Sounds",
    slug: "interface-sounds",
    description: "UI and menu sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/23-interface-sounds/interface_sounds.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/23-interface-sounds/preview.png",
    fileSize: "4.7 MB",
    tags: ["audio", "ui", "menu", "interface"]
  },
  {
    name: "Casino Audio",
    slug: "casino-audio",
    description: "Casino themed sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/24-casino-audio/casinoaudio_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/24-casino-audio/preview.png",
    fileSize: "6.3 MB",
    tags: ["audio", "casino", "gambling", "slots"]
  },
  {
    name: "Sci-Fi Sounds",
    slug: "scifi-sounds",
    description: "Science fiction sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/29-sci-fi-sounds/scifi_sounds.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/29-sci-fi-sounds/preview.png",
    fileSize: "9.8 MB",
    tags: ["audio", "sci-fi", "space", "futuristic"]
  },

  // === FONTS ===
  {
    name: "Kenney Fonts",
    slug: "kenney-fonts",
    description: "Collection of pixel and game fonts",
    category: "Fonts",
    downloadUrl: "https://kenney.nl/content/3-assets/140-kenney-fonts/kenney_fonts.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/140-kenney-fonts/preview.png",
    fileSize: "1.2 MB",
    tags: ["fonts", "text", "pixel", "display"]
  },

  // === 3D ASSETS ===
  {
    name: "Platformer Kit",
    slug: "platformer-kit-3d",
    description: "3D platformer asset kit",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/15-platformer-kit/platformer_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/15-platformer-kit/preview.png",
    fileSize: "18.3 MB",
    tags: ["3d", "platformer", "low-poly", "models"]
  },
  {
    name: "Nature Kit",
    slug: "nature-kit",
    description: "3D nature environment assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/14-nature-kit/nature_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/14-nature-kit/preview.png",
    fileSize: "21.7 MB",
    tags: ["3d", "nature", "environment", "trees", "rocks"]
  },
  {
    name: "Castle Kit",
    slug: "castle-kit",
    description: "3D medieval castle assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/18-castle-kit/castle_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/18-castle-kit/preview.png",
    fileSize: "15.4 MB",
    tags: ["3d", "castle", "medieval", "fantasy", "buildings"]
  },
  {
    name: "City Kit",
    slug: "city-kit",
    description: "3D modern city building assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/19-city-kit-commercial/city_kit_commercial.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/19-city-kit-commercial/preview.png",
    fileSize: "19.2 MB",
    tags: ["3d", "city", "urban", "buildings", "modern"]
  },
  {
    name: "Furniture Kit",
    slug: "furniture-kit",
    description: "3D furniture and interior assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/20-furniture-kit/furniture_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/20-furniture-kit/preview.png",
    fileSize: "14.8 MB",
    tags: ["3d", "furniture", "interior", "home"]
  },
  {
    name: "Voxel Pack",
    slug: "voxel-pack",
    description: "3D voxel style assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/21-voxel-pack/voxel_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/21-voxel-pack/preview.png",
    fileSize: "16.5 MB",
    tags: ["3d", "voxel", "minecraft", "blocky"]
  },
  {
    name: "Space Kit",
    slug: "space-kit-3d",
    description: "3D space themed assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/37-space-kit/space_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/37-space-kit/preview.png",
    fileSize: "22.1 MB",
    tags: ["3d", "space", "sci-fi", "spaceships"]
  },
  {
    name: "Racing Kit",
    slug: "racing-kit-3d",
    description: "3D racing game assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/38-racing-kit/racing_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/38-racing-kit/preview.png",
    fileSize: "17.9 MB",
    tags: ["3d", "racing", "cars", "track"]
  },
  {
    name: "Weapon Pack",
    slug: "weapon-pack-3d",
    description: "3D weapon models collection",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/39-weapon-pack/weapon_pack.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/39-weapon-pack/preview.png",
    fileSize: "13.2 MB",
    tags: ["3d", "weapons", "guns", "military"]
  },
  {
    name: "Modular Buildings",
    slug: "modular-buildings",
    description: "3D modular building pieces",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/40-modular-buildings/modular_buildings.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/40-modular-buildings/preview.png",
    fileSize: "25.3 MB",
    tags: ["3d", "buildings", "modular", "city"]
  },

  // UI Assets
  {
    name: "UI Pack",
    slug: "ui-pack",
    description: "Complete UI elements pack",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/1-ui-pack/uipack_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/1-ui-pack/preview.png",
    fileSize: "1.7 MB",
    tags: ["ui", "interface", "buttons", "panels"]
  },
  {
    name: "UI Pack - Space Expansion",
    slug: "ui-pack-space",
    description: "Sci-fi themed UI elements",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/12-ui-pack-space-expansion/uipack_space_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/12-ui-pack-space-expansion/preview.png",
    fileSize: "1.4 MB",
    tags: ["ui", "space", "sci-fi", "futuristic"]
  },
  {
    name: "UI Pack - RPG Expansion",
    slug: "ui-pack-rpg",
    description: "Fantasy RPG UI elements",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/11-ui-pack-rpg-expansion/uipack_rpg_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/11-ui-pack-rpg-expansion/preview.png",
    fileSize: "1.5 MB",
    tags: ["ui", "rpg", "fantasy", "medieval"]
  },
  {
    name: "Game Icons",
    slug: "game-icons",
    description: "Collection of game UI icons",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/6-game-icons/game_icons.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/6-game-icons/preview.png",
    fileSize: "3.6 MB",
    tags: ["icons", "ui", "symbols", "interface"]
  },
  {
    name: "Input Prompts",
    slug: "input-prompts",
    description: "Controller and keyboard input icons",
    category: "UI",
    downloadUrl: "https://kenney.nl/content/3-assets/22-input-prompts/input_prompts.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/22-input-prompts/preview.png",
    fileSize: "2.1 MB",
    tags: ["input", "controller", "keyboard", "prompts"]
  },

  // Audio
  {
    name: "Digital Audio",
    slug: "digital-audio",
    description: "Digital sound effects collection",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/16-digital-audio/digitalaudio_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/16-digital-audio/preview.png",
    fileSize: "8.5 MB",
    tags: ["audio", "sfx", "digital", "electronic"]
  },
  {
    name: "Impact Sounds",
    slug: "impact-sounds",
    description: "Impact and collision sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/17-impact-sounds/impactsounds_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/17-impact-sounds/preview.png",
    fileSize: "3.2 MB",
    tags: ["audio", "sfx", "impact", "collision"]
  },
  {
    name: "RPG Audio",
    slug: "rpg-audio",
    description: "RPG themed sound effects",
    category: "Audio",
    downloadUrl: "https://kenney.nl/content/3-assets/25-rpg-audio/rpgaudio_sample.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/25-rpg-audio/preview.png",
    fileSize: "12.1 MB",
    tags: ["audio", "sfx", "rpg", "fantasy"]
  },

  // Fonts
  {
    name: "Kenney Fonts",
    slug: "kenney-fonts",
    description: "Collection of pixel and game fonts",
    category: "Fonts",
    downloadUrl: "https://kenney.nl/content/3-assets/140-kenney-fonts/kenney_fonts.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/140-kenney-fonts/preview.png",
    fileSize: "1.2 MB",
    tags: ["fonts", "text", "pixel", "display"]
  },

  // 3D Assets
  {
    name: "Platformer Kit",
    slug: "platformer-kit-3d",
    description: "3D platformer asset kit",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/15-platformer-kit/platformer_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/15-platformer-kit/preview.png",
    fileSize: "18.3 MB",
    tags: ["3d", "platformer", "low-poly", "models"]
  },
  {
    name: "Nature Kit",
    slug: "nature-kit",
    description: "3D nature environment assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/14-nature-kit/nature_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/14-nature-kit/preview.png",
    fileSize: "21.7 MB",
    tags: ["3d", "nature", "environment", "trees", "rocks"]
  },
  {
    name: "Castle Kit",
    slug: "castle-kit",
    description: "3D medieval castle assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/18-castle-kit/castle_kit.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/18-castle-kit/preview.png",
    fileSize: "15.4 MB",
    tags: ["3d", "castle", "medieval", "fantasy", "buildings"]
  },
  {
    name: "City Kit",
    slug: "city-kit",
    description: "3D modern city building assets",
    category: "3D",
    downloadUrl: "https://kenney.nl/content/3-assets/19-city-kit-commercial/city_kit_commercial.zip",
    thumbnailUrl: "https://kenney.nl/content/3-assets/19-city-kit-commercial/preview.png",
    fileSize: "19.2 MB",
    tags: ["3d", "city", "urban", "buildings", "modern"]
  }
];

// Helper function to get packs by category
export function getPacksByCategory(category: KenneyAssetPack["category"]): KenneyAssetPack[] {
  return KENNEY_ASSET_CATALOG.filter(pack => pack.category === category);
}

// Helper function to search packs
export function searchPacks(query: string): KenneyAssetPack[] {
  const lowerQuery = query.toLowerCase();
  return KENNEY_ASSET_CATALOG.filter(pack => 
    pack.name.toLowerCase().includes(lowerQuery) ||
    pack.description.toLowerCase().includes(lowerQuery) ||
    pack.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Helper function to get recommended packs based on game type
export function getRecommendedPacks(gameDescription: string): KenneyAssetPack[] {
  const lowerDesc = gameDescription.toLowerCase();
  const keywords = {
    platformer: ["platformer", "jump", "mario", "side-scroll"],
    space: ["space", "asteroid", "galaxy", "alien", "rocket"],
    rpg: ["rpg", "dungeon", "fantasy", "medieval", "quest"],
    shooter: ["shooter", "shoot", "gun", "bullet"],
    puzzle: ["puzzle", "match", "block"],
    racing: ["racing", "car", "drive"],
  };

  const recommendations: KenneyAssetPack[] = [];
  
  if (keywords.platformer.some(k => lowerDesc.includes(k))) {
    recommendations.push(
      ...KENNEY_ASSET_CATALOG.filter(p => 
        ["pixel-platformer", "platformer-art-deluxe", "jumper-pack", "abstract-platformer"].includes(p.slug)
      )
    );
  }
  
  if (keywords.space.some(k => lowerDesc.includes(k))) {
    recommendations.push(
      ...KENNEY_ASSET_CATALOG.filter(p => 
        ["planets", "space-shooter-redux", "pixel-shmup"].includes(p.slug)
      )
    );
  }
  
  if (keywords.rpg.some(k => lowerDesc.includes(k))) {
    recommendations.push(
      ...KENNEY_ASSET_CATALOG.filter(p => 
        ["retro-medieval-kit", "tiny-dungeon", "ui-pack-rpg"].includes(p.slug)
      )
    );
  }
  
  if (keywords.shooter.some(k => lowerDesc.includes(k))) {
    recommendations.push(
      ...KENNEY_ASSET_CATALOG.filter(p => 
        ["desert-shooter-pack", "space-shooter-redux", "pixel-shmup"].includes(p.slug)
      )
    );
  }

  // Always add UI pack and input prompts for any game
  recommendations.push(
    ...KENNEY_ASSET_CATALOG.filter(p => 
      ["ui-pack", "input-prompts", "game-icons"].includes(p.slug)
    )
  );

  // Remove duplicates
  return Array.from(new Map(recommendations.map(p => [p.slug, p])).values());
}
