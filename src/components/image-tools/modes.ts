import { ImageModeDefinition, ImageModeId } from "./types";

export const imageModes: ImageModeDefinition[] = [
  {
    id: "image-to-image",
    title: "Image to Image",
    description: "Réinterprétez une image existante pour explorer d'autres ambiances et styles.",
    sampleResultDescription: "Un nouveau rendu inspiré de votre image originale.",
    helperText:
      "Importez une image de référence : la génération conservera sa structure générale tout en proposant un rendu inédit.",
    promptGuidance:
      "Respecte la composition générale de l'image source tout en améliorant la qualité, les textures et l'ambiance demandée.",
  },
  {
    id: "style-reference",
    title: "Style Reference",
    description: "Donnez jusqu'à quatre images pour transférer leurs couleurs et textures.",
    sampleResultDescription: "Un visuel inédit respectant l'univers chromatique sélectionné.",
    helperText: "Importez jusqu'à 4 images pour composer votre palette visuelle.",
    maxImages: 4,
    promptGuidance:
      "Transfère la palette chromatique, la lumière et les textures des images de référence sur la scène décrite dans le prompt.",
  },
  {
    id: "content-reference",
    title: "Content Reference",
    description: "Conservez la composition d'origine tout en réinventant le rendu.",
    premium: true,
    sampleResultDescription: "La mise en page et les objets clés sont repris fidèlement.",
    helperText: "Idéal pour reproduire une scène avec un nouvel éclairage ou décor.",
    promptGuidance:
      "Reproduis fidèlement la disposition des éléments et les proportions de l'image de référence tout en appliquant le style demandé.",
  },
  {
    id: "character-reference",
    title: "Character Reference",
    description: "Retrouvez fidèlement les traits d'un personnage à partir d'un portrait.",
    premium: true,
    sampleResultDescription: "Apparence du personnage conservée dans un nouveau contexte.",
    helperText: "Fonctionne mieux avec des visages nets ou des bustes bien éclairés.",
    promptGuidance:
      "Préserve les traits du visage, la coiffure et les caractéristiques uniques du personnage dans la scène générée.",
  },
  {
    id: "depth-to-image",
    title: "Depth to Image",
    description: "Générez à partir d'une carte de profondeur détectée automatiquement (MiDaS).",
    premium: true,
    sampleResultDescription: "Relief 3D détecté pour guider la génération.",
    helperText: "Une analyse simulée repère les volumes principaux afin de conserver la perspective.",
    analysisType: "depth",
    badgeLabel: "Analyse MiDaS",
    promptGuidance:
      "Respecte les volumes détectés par la carte de profondeur pour conserver les perspectives et l'échelle des objets.",
  },
  {
    id: "edge-to-image",
    title: "Edge to Image",
    description: "Les contours détectés (Canny) servent de squelette pour votre création.",
    premium: true,
    sampleResultDescription: "Contours contrastés prêts à guider la diffusion.",
    helperText: "Le détecteur simule un filtre de contours pour vous laisser ajuster la structure.",
    analysisType: "edge",
    badgeLabel: "Canny",
    promptGuidance:
      "Suis précisément les contours détectés pour conserver la structure et les proportions de la scène.",
  },
  {
    id: "pose-to-image",
    title: "Pose to Image",
    description: "Capturez la pose d'un personnage (OpenPose) pour la réutiliser instantanément.",
    premium: true,
    sampleResultDescription: "Squelette détecté qui servira de guide à la génération.",
    helperText: "Téléversez un portrait ou un corps entier pour détecter la position des membres.",
    analysisType: "pose",
    badgeLabel: "OpenPose",
    promptGuidance:
      "Reproduis exactement la pose détectée (position des membres et orientation du corps) dans la composition finale.",
  },
  {
    id: "text-image-input",
    title: "Text Image Input",
    description: "Analysez une image contenant du texte pour inspirer une scène visuelle.",
    premium: true,
    sampleResultDescription: "Texte extrait pour piloter la génération finale.",
    helperText: "Le texte blanc sur fond sombre est optimisé pour l'analyse OCR.",
    analysisType: "text",
    badgeLabel: "OCR",
    promptGuidance:
      "Intègre les messages extraits du texte analysé dans la scène pour qu'ils soient lisibles et cohérents.",
  },
];

export const getModeDefinition = (id: ImageModeId) => imageModes.find((mode) => mode.id === id);
