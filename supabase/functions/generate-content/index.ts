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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    console.log(`Génération pour catégorie: ${category}, prompt: ${prompt}`);

    // Adapter le prompt selon la catégorie
    let systemPrompt = "";
    let useImageGeneration = false;

    switch (category) {
      case "game":
        systemPrompt = "Tu es un expert en conception de jeux vidéo. Fournis une description détaillée du concept de jeu, incluant le gameplay, les mécaniques, le style visuel et l'expérience utilisateur.";
        break;
      case "image":
        systemPrompt = "Tu es un artiste IA. Génère une image basée sur la description de l'utilisateur.";
        useImageGeneration = true;
        break;
      case "music":
        systemPrompt = "Tu es un compositeur de musique. Décris en détail la composition musicale, incluant le genre, l'ambiance, les instruments et la structure.";
        break;
      case "app":
        systemPrompt = "Tu es un architecte logiciel. Fournis une architecture détaillée de l'application, incluant les fonctionnalités principales, l'interface utilisateur et les technologies recommandées.";
        break;
      case "website":
        systemPrompt = "Tu es un web designer. Décris en détail le concept du site web, incluant la structure, le design, les sections principales et l'expérience utilisateur.";
        break;
      case "agent":
        systemPrompt = "Tu es un expert en automatisation. Fournis un plan détaillé de l'agent d'automatisation, incluant ses capacités, ses actions, les déclencheurs et les intégrations.";
        break;
      default:
        systemPrompt = "Tu es un assistant créatif. Aide l'utilisateur à réaliser sa vision.";
    }

    if (useImageGeneration) {
      // Génération d'image avec google/gemini-2.5-flash-image-preview
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'user', content: prompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      return new Response(
        JSON.stringify({
          content: "Image générée avec succès",
          preview: imageUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Génération de texte avec google/gemini-2.5-flash
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({
          content: content,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
