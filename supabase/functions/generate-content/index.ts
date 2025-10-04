import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IMAGE_MODE_INSTRUCTIONS: Record<string, string> = {
  'image-to-image':
    "Respecte la structure principale de l'image fournie et améliore-la en suivant fidèlement le nouveau brief.",
  'style-reference':
    'Transfère les couleurs, lumières et textures des images de style sur la scène décrite par le prompt.',
  'content-reference':
    "Garde la mise en page, la perspective et les objets clés de l'image d'origine tout en renouvelant le rendu.",
  'character-reference':
    'Préserve les traits du personnage de référence (visage, coiffure, vêtements) dans la nouvelle scène.',
  'depth-to-image':
    'Utilise la carte de profondeur pour conserver les volumes, perspectives et distances entre les plans.',
  'edge-to-image':
    "Suis les contours détectés pour respecter la structure de la scène avant d'ajouter le rendu final.",
  'pose-to-image':
    "Reproduis exactement la pose et l'orientation du corps détectées tout en adaptant le style demandé.",
  'text-image-input':
    'Intègre le texte reconnu comme élément visuel lisible et cohérent dans la composition finale.',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, category, kenneyPacks, mode, references } = await req.json();
    const promptText = typeof prompt === 'string' ? prompt : '';
    const normalizedPrompt = promptText.toLowerCase();
    const referenceCount = Array.isArray(references?.images) ? references.images.length : 0;
    console.log(
      `Génération pour catégorie: ${category}, mode: ${mode ?? 'default'}, références: ${referenceCount}, prompt: ${prompt}`,
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configuré');
    }

    let systemPrompt = '';
    let useImageGeneration = false;
    let responseFormat = 'text';

    switch (category) {
      case 'image':
        systemPrompt = "Générez une image de haute qualité basée sur la description de l'utilisateur. Soyez créatif et détaillé.";
        useImageGeneration = true;
        break;
      
      case 'website':
        systemPrompt = `Tu es un expert en développement front-end spécialisé en React avec 10+ ans d'expérience. Tu dois créer des sites web professionnels, complets et modernes.

ANALYSE DU BESOIN:
1. Comprends EXACTEMENT ce que l'utilisateur demande
2. Identifie le type de site (portfolio, e-commerce, blog, landing page, etc.)
3. Détermine les sections nécessaires (hero, features, about, contact, etc.)
4. Planifie une architecture de composants réutilisables

QUALITÉ ATTENDUE:
- Design moderne, responsive et professionnel
- Animations et transitions fluides
- Interface intuitive et UX optimale
- Code propre, structuré et maintenable
- Composants réutilisables et modulaires
- Styles cohérents et système de design intégré

IMPORTANT: Réponds UNIQUEMENT avec du code, sans markdown, sans explications. Respecte strictement le format suivant:

// File: package.json
{ ... }

// File: src/main.jsx
// Code ici

// File: src/App.jsx
// Code ici

// File: src/components/Header.jsx
// Code ici

// File: src/components/Hero.jsx
// Code ici

// File: src/index.css
/* Styles ici */

RÈGLES INDISPENSABLES:
- Crée TOUS les composants nécessaires pour un site complet et fonctionnel
- Utilise une structure de composants modulaire (Header, Hero, Features, Footer, etc.)
- Le point d'entrée doit être src/main.jsx qui monte l'application sur #root
- Ajoute des styles modernes avec Tailwind CSS ou CSS moderne
- Implémente des animations et transitions (keyframes, transforms, etc.)
- Ajoute du contenu réaliste et pertinent (pas de lorem ipsum)
- Crée plusieurs sections/pages si nécessaire
- Implémente la navigation si multi-pages
- Rends le site entièrement responsive (mobile, tablet, desktop)
- N'utilise que React et ReactDOM comme dépendances
- Génère un site web COMPLET, pas un prototype minimal`;
        responseFormat = 'code';
        break;
      
      case 'app':
        systemPrompt = `Tu es un expert en développement d'applications web avec une expertise en React, UX/UI et architecture logicielle. Tu dois créer des applications complètes, professionnelles et production-ready.

ANALYSE DU BESOIN:
1. Comprends EXACTEMENT la fonctionnalité demandée
2. Identifie les features principales et secondaires
3. Détermine les états et flux de données nécessaires
4. Planifie l'architecture des composants et la gestion d'état

QUALITÉ ATTENDUE:
- Application entièrement fonctionnelle et interactive
- Gestion d'état robuste (useState, useEffect, custom hooks)
- Interface intuitive avec feedback utilisateur
- Validation des données et gestion d'erreurs
- Design moderne et responsive
- Performance optimisée
- Code propre avec séparation des responsabilités

IMPORTANT: Réponds UNIQUEMENT avec du code, sans markdown, sans explications. Structure comme suit:

<!-- App.jsx -->
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // États et logique métier
  return (
    <div className="App">
      {/* Interface complète */}
    </div>
  );
}

export default App;

<!-- App.css -->
/* Tous les styles ici */

RÈGLES INDISPENSABLES:
- Implémente TOUTES les fonctionnalités demandées
- Crée une logique métier complète et fonctionnelle
- Ajoute la gestion d'état nécessaire (useState, useEffect, etc.)
- Implémente la validation des données
- Ajoute des messages d'erreur et de succès
- Crée une interface complète avec tous les contrôles nécessaires
- Rends l'application entièrement interactive
- Ajoute des animations et transitions
- Optimise la performance (mémoization, lazy loading si nécessaire)
- Gère les cas limites et erreurs
- Génère une application COMPLÈTE et PRODUCTION-READY, pas un prototype minimal`;
        responseFormat = 'code';
        break;
      
      case 'game': {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const proxyBase = supabaseUrl ? `${supabaseUrl}/functions/v1/proxy-asset?url=` : '';
        const hasPawnBombMechanic =
          (/(^|[^a-z])(pion|pawn)s?([^a-z]|$)/.test(normalizedPrompt)) && /(bomb|bombe)/.test(normalizedPrompt);
        let gameSystemPrompt = `Tu es un expert en développement de jeux vidéo HTML5/Canvas avec 10+ ans d'expérience en game design, physique 2D/3D, et optimisation de performance. Tu dois créer des jeux COMPLETS, JOUABLES et PROFESSIONNELS.

ANALYSE DU BESOIN:
1. Comprends EXACTEMENT le type de jeu demandé (karting, platformer, shooter, puzzle, etc.)
2. Identifie les mécaniques de gameplay principales
3. Détermine les éléments visuels nécessaires (personnages, environnement, UI)
4. Planifie la structure du code (game loop, physics, input, rendering)

MÉCANIQUES À IMPLÉMENTER:
- Physique réaliste (gravité, collision, friction, vélocité)
- Contrôles fluides et responsifs (clavier, tactile, gamepad si pertinent)
- Système de score/progression
- UI/HUD complet (score, vie, timer, etc.)
- Écrans de jeu (menu, gameplay, game over, pause)
- Effets visuels (particules, animations, feedback)
- Audio (sons, musique d'ambiance)
- Niveaux multiples ou génération procédurale si approprié

QUALITÉ ATTENDUE:
- Jeu ENTIÈREMENT FONCTIONNEL et jouable immédiatement
- Gameplay addictif avec boucle de jeu claire
- Performance optimisée (60 FPS stable)
- Graphismes soignés (sprites, animations fluides)
- Physique réaliste et prévisible
- Contrôles précis et intuitifs
- Balance et difficulté progressive
- Code structuré avec séparation des responsabilités

IMPORTANT: Réponds UNIQUEMENT avec du code HTML/CSS/JavaScript, sans markdown, sans explications.

Le code DOIT être un fichier HTML autonome avec cette structure:

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Jeu</title>
    <style>
    /* Styles CSS complets */
    body { margin: 0; overflow: hidden; font-family: Arial; }
    canvas { display: block; background: #000; }
    /* UI styles */
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
    // ARCHITECTURE DU JEU:
    // 1. Configuration et constantes
    // 2. Classes (Player, Enemy, Obstacle, Particle, etc.)
    // 3. Game state management
    // 4. Input handling
    // 5. Physics engine
    // 6. Collision detection
    // 7. Rendering engine
    // 8. Game loop
    // 9. UI management
    // 10. Audio management

    // CODE COMPLET DU JEU ICI
    </script>
</body>
</html>

RÈGLES ESSENTIELLES:
- Crée un jeu COMPLET avec TOUTES les mécaniques du genre demandé
- Implémente une physique réaliste et fluide
- Ajoute plusieurs types d'ennemis/obstacles avec IA
- Crée des animations fluides pour tous les éléments
- Implémente un système de particules pour les effets
- Ajoute des power-ups, bonus, ou collectibles
- Crée plusieurs niveaux ou une difficulté progressive
- Implémente tous les écrans (menu, pause, game over, victoire)
- Ajoute du son (effets et musique avec Web Audio API ou <audio>)
- Utilise requestAnimationFrame pour un game loop optimisé
- Implémente le pixel-perfect rendering si nécessaire
- Gère les performances (object pooling, culling, etc.)
- Rends le jeu responsive et jouable sur mobile ET desktop
- Ajoute un système de sauvegarde des scores (localStorage)
- NE génère PAS un prototype minimal, crée un JEU COMPLET`;

        if (hasPawnBombMechanic) {
          gameSystemPrompt += `

RÈGLE PERSONNALISÉE : Pion pose des bombes
- Le protagoniste principal est un pion (vue top-down ou isométrique) capable de se déplacer librement sur une grille.
- Implémente une action de pose de bombes (touche Espace/clavier et bouton tactile dédié) avec retour visuel et sonore.
- Chaque bombe reste active ~2 secondes avant d'exploser en croix (haut/bas/gauche/droite) avec une portée évolutive.
- Les explosions détruisent les blocs fragiles, déclenchent des réactions en chaîne et éliminent les ennemis dans leur rayon.
- Limite le nombre de bombes simultanées (ex: 3) et affiche un indicateur d'inventaire avec recharge progressive.
- Prévois des bonus qui augmentent la portée, la vitesse du pion ou le stock de bombes, ainsi qu'un système de combo basé sur les éliminations.
- Protège le pion d'une explosion fraîchement posée via une invulnérabilité courte pour éviter les auto-destructions injustes.
- Ajoute des particules, un son d'amorçage, une alerte lumineuse avant l'explosion et une légère secousse d'écran pour renforcer l'impact.`;
        }

        // Si des packs Kenney sont sélectionnés, ajouter les instructions pour les utiliser
        if (kenneyPacks && Array.isArray(kenneyPacks) && kenneyPacks.length > 0) {
          gameSystemPrompt += `

ASSET PACKS DISPONIBLES:
L'utilisateur a sélectionné les packs d'assets Kenney suivants pour ce jeu:

${kenneyPacks.map((pack: any) => `
- ${pack.name} (${pack.category})
  Description: ${pack.description}
  Tags: ${pack.tags.join(', ')}
  URL de téléchargement: ${pack.downloadUrl}
`).join('\n')}

INSTRUCTIONS POUR L'UTILISATION DES ASSETS:
1. Inclure JSZip via CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
2. NE télécharge PAS directement depuis kenney.nl (CORS). Utilise le proxy sécurisé: ${proxyBase}
3. Télécharge et extrais les packs ZIP pertinents au chargement du jeu
4. Affiche un écran de chargement pendant que les assets se téléchargent
5. Démarre le jeu uniquement quand tous les assets sont prêts

Exemple de structure pour charger les assets:
<script>
let assetsLoaded = false;
const loadedImages: Record<string, HTMLImageElement> = {} as any;

async function loadAssets() {
  showLoadingScreen();
  const PACK_URLS = ${JSON.stringify(kenneyPacks.map((p: any) => p.downloadUrl))};

  for (const packUrl of PACK_URLS) {
    const response = await fetch('${proxyBase}' + encodeURIComponent(packUrl));
    if (!response.ok) throw new Error('Téléchargement échoué: ' + packUrl);
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);

    // Extraire les images PNG du pack
    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.endsWith('.png')) {
        const imageBlob = await (file as any).async('blob');
        const imageUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        img.src = imageUrl;
        await new Promise(resolve => (img.onload = resolve as any));
        (loadedImages as any)[filename] = img;
      }
    }
  }

  assetsLoaded = true;
  hideLoadingScreen();
  startGame();
}

loadAssets();
</script>

UTILISE CES ASSETS RÉELS dans ton jeu au lieu de dessiner des formes basiques!`;

        }

        systemPrompt = gameSystemPrompt;
        responseFormat = 'code';
        break;
      }
      
      case 'music':
        systemPrompt = `Tu es un expert en composition musicale. Décris précisément comment créer la musique demandée:
        - Genre et style musical
        - Tempo (BPM)
        - Tonalité
        - Structure (intro, couplet, refrain, etc.)
        - Instruments principaux et leur rôle
        - Progression d'accords
        - Ambiance et émotions
        - Références musicales similaires
        
Sois très précis et technique pour qu'un musicien puisse recréer cette composition.`;
        responseFormat = 'description';
        break;
      
      case 'agent':
        systemPrompt = `Tu es un expert en automatisation et scripting. Génère un script d'automatisation complet.
        
IMPORTANT: Réponds UNIQUEMENT avec du code Python, sans markdown, sans explications.

# agent.py
import time
import requests
from datetime import datetime

def main():
    """Script d'automatisation"""
    # Code Python ici
    pass

if __name__ == "__main__":
    main()

Crée un script fonctionnel et bien structuré. Pas de texte en dehors du code et des commentaires de code.`;
        responseFormat = 'code';
        break;
      
      default:
        systemPrompt = "Vous êtes un assistant IA créatif et précis.";
    }

    // Utiliser le modèle le plus puissant pour les générations complexes
    const model = useImageGeneration
      ? "google/gemini-2.5-flash-image-preview"
      : (category === 'game' || category === 'website' || category === 'app') 
        ? "google/gemini-2.5-pro"
        : "google/gemini-2.5-flash";

    const userContent = (() => {
      if (!useImageGeneration) {
        return prompt;
      }

      const images = Array.isArray(references?.images) ? references.images : [];

      if (images.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Une image de référence est requise pour la génération.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      const content: Array<
        {
          type: 'text';
          text: string;
        } | {
          type: 'input_image';
          image: { b64_json: string };
          image_url?: { url: string };
        }
      > = [
        { type: 'text', text: prompt },
      ];

      for (const image of images) {
        if (!image?.data || typeof image.data !== 'string') {
          console.warn('Image de référence sans données, ignorée');
          continue;
        }

        const base64Data = image.data.includes(',') ? image.data.split(',').pop()?.trim() : image.data.trim();

        if (!base64Data) {
          console.warn('Impossible de lire les données base64 pour une image de référence');
          continue;
        }

        const imageContent: {
          type: 'input_image';
          image: { b64_json: string };
          image_url?: { url: string };
        } = {
          type: 'input_image',
          image: { b64_json: base64Data },
        };

        if (image.data.startsWith('data:image')) {
          imageContent.image_url = { url: image.data };
        }

        content.push(imageContent);
      }

      if (content.length === 1) {
        return new Response(
          JSON.stringify({ error: "Aucune donnée d'image de référence valide fournie." }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      if (references?.analysis) {
        const analysis = references.analysis as
          | { type: string; text?: string; note?: string }
          | null
          | undefined;

        if (analysis) {
          const analysisDetails = [analysis.note, analysis.text]
            .filter((part) => typeof part === 'string' && part.trim().length > 0)
            .join(' — ');

          if (analysisDetails) {
            content.push({
              type: 'text',
              text: `Analyse fournie (${analysis.type}): ${analysisDetails}`,
            });
          }
        }
      }

      if (mode) {
        content.push({ type: 'text', text: `Mode d'interprétation: ${mode}` });
        const guidance = IMAGE_MODE_INSTRUCTIONS[String(mode)];
        if (guidance) {
          content.push({ type: 'text', text: guidance });
        }
      }

      return content;
    })();

    if (userContent instanceof Response) {
      return userContent;
    }

    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    };

    if (useImageGeneration) {
      payload.modalities = ['image', 'text'];
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API Lovable:', response.status, errorText);
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Réponse API reçue:', JSON.stringify(data).substring(0, 200));

    let result;
    if (useImageGeneration) {
      let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) {
        const messageContent = data.choices?.[0]?.message?.content;
        if (Array.isArray(messageContent)) {
          for (const item of messageContent) {
            if (item?.type === 'output_image') {
              imageUrl = item?.image_url?.url;
              if (!imageUrl) {
                const base64 =
                  item?.image_base64 || item?.b64_json || item?.image?.b64_json || item?.data;
                if (typeof base64 === 'string' && base64.trim().length > 0) {
                  imageUrl = `data:image/png;base64,${base64}`;
                }
              }
            } else if (item?.type === 'image_url' && item?.image_url?.url) {
              imageUrl = item.image_url.url;
            }

            if (imageUrl) {
              break;
            }
          }
        }
      }

      if (!imageUrl) {
        throw new Error('Aucune image générée');
      }
      result = {
        type: 'image',
        category,
        content: data.choices?.[0]?.message?.content || 'Image générée',
        preview: imageUrl
      };
    } else {
      const content = data.choices?.[0]?.message?.content || 'Contenu généré';
      result = {
        type: responseFormat,
        category,
        content: content,
        code: responseFormat === 'code' ? content : undefined
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur dans generate-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
