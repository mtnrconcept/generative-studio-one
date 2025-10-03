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
        systemPrompt = `Tu es un expert en développement front-end spécialisé en React. Génère un projet React moderne (React 18) basé sur la demande de l'utilisateur.

IMPORTANT: Réponds UNIQUEMENT avec du code, sans markdown, sans explications. Respecte strictement le format suivant en séparant chaque fichier par un en-tête:

// File: package.json
{ ... }

// File: src/main.jsx
// Code ici

// File: src/App.jsx
// Code ici

// File: src/index.css
/* Styles ici */

RÈGLES INDISPENSABLES:
- Fournis uniquement des fichiers utiles au projet React (package.json, index.html si nécessaire, fichiers dans src/, etc.).
- Le point d'entrée doit être src/main.jsx (ou src/main.tsx) qui monte l'application sur un élément #root en utilisant ReactDOM.createRoot.
- Utilise React avec le runtime classique ou automatique, mais assure-toi d'importer React et ReactDOM quand c'est requis.
- Ajoute un fichier de styles globaux (src/index.css) et importe-le dans le point d'entrée.
- N'utilise aucune dépendance externe autre que React et ReactDOM.
- N'ajoute aucun texte ou explication en dehors du code et des séparateurs de fichiers.`;
        responseFormat = 'code';
        break;
      
      case 'app':
        systemPrompt = `Tu es un expert en développement d'applications web. Génère une application React complète et fonctionnelle.
        
IMPORTANT: Réponds UNIQUEMENT avec du code, sans markdown, sans explications. Structure comme suit:

<!-- App.jsx -->
import React, { useState } from 'react';
import './App.css';

function App() {
  // Code React ici
  return (
    <div className="App">
      {/* JSX */}
    </div>
  );
}

export default App;

<!-- App.css -->
/* Tous les styles ici */

Crée une application moderne et interactive. Pas de texte en dehors du code.`;
        responseFormat = 'code';
        break;
      
      case 'game':
        let gameSystemPrompt = `Tu es un expert en développement de jeux HTML5. Génère un jeu complet et jouable.
        
IMPORTANT: Réponds UNIQUEMENT avec du code HTML/CSS/JavaScript, sans markdown, sans explications.

Le code DOIT être un fichier HTML autonome avec cette structure:

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Jeu</title>
    <style>
    /* Tous les styles CSS du jeu ici */
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
    // Toute la logique du jeu ici
    </script>
</body>
</html>

RÈGLES ESSENTIELLES:
- Crée un jeu fonctionnel, jouable et amusant
- Utilise un canvas HTML5 pour le rendu
- Implémente des contrôles tactiles ET clavier
- Le jeu doit être responsive et jouable sur mobile
- Pas d'explications, seulement du code complet`;

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
2. Télécharger et extraire les packs ZIP pertinents au chargement du jeu
3. Utiliser les vrais sprites/images de ces packs dans le jeu (pas de formes géométriques simples)
4. Afficher un écran de chargement pendant que les assets se téléchargent
5. S'assurer que le jeu ne démarre que lorsque tous les assets sont prêts

Exemple de structure pour charger les assets:
<script>
let assetsLoaded = false;
const loadedImages = {};

async function loadAssets() {
  showLoadingScreen();
  
  // Télécharger et extraire chaque pack
  for (const packUrl of ['${kenneyPacks[0]?.downloadUrl}']) {
    const response = await fetch(packUrl);
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);
    
    // Extraire les images PNG du pack
    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.endsWith('.png')) {
        const imageBlob = await file.async('blob');
        const imageUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        img.src = imageUrl;
        await new Promise(resolve => img.onload = resolve);
        loadedImages[filename] = img;
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

    const model = useImageGeneration
      ? "google/gemini-2.5-flash-image-preview"
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
