import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, resumeText } = await req.json();

    console.log("Received screening request:", { 
      jobDescriptionLength: jobDescription?.length,
      resumeTextLength: resumeText?.length 
    });

    // Forward request to n8n webhook
    const response = await fetch("https://mancyram.app.n8n.cloud/webhook/recruitai/screen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobDescription, resumeText }),
    });

    if (!response.ok) {
      console.error("n8n webhook error:", response.status, response.statusText);
      throw new Error(`n8n webhook returned ${response.status}`);
    }

    const data = await response.json();
    console.log("n8n response received:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in screen-candidate function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
