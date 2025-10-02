import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, category } = await req.json();
    console.log(`Génération pour catégorie: ${category}, prompt: ${prompt}`);

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
        systemPrompt = `Tu es un expert en développement de jeux HTML5. Génère un jeu complet et jouable.
        
IMPORTANT: Réponds UNIQUEMENT avec du code HTML/CSS/JavaScript, sans markdown, sans explications.

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Jeu</title>
    <style>
    /* CSS du jeu */
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
    // Logique du jeu ici
    </script>
</body>
</html>

Crée un jeu fonctionnel et amusant. Pas d'explications, seulement du code.`;
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useImageGeneration ? "google/gemini-2.5-flash-image-preview" : "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        modalities: useImageGeneration ? ["image", "text"] : undefined
      }),
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
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
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
