import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = "https://mancy-new.app.n8n.cloud/webhook/b41ad258-86d3-42e3-9319-88271b95e5ab";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { jobDescription, resumeText } = body;

    // Server-side validation
    if (!jobDescription || typeof jobDescription !== 'string' || 
        jobDescription.length < 100 || jobDescription.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Invalid job description. Must be 100-50000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resumeText || typeof resumeText !== 'string' || 
        resumeText.length < 50 || resumeText.length > 100000) {
      return new Response(
        JSON.stringify({ error: 'Invalid resume text. Must be 50-100000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated screening request from user:", user.id, {
      jobDescriptionLength: jobDescription.length,
      resumeTextLength: resumeText.length
    });

    // Forward request to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd: jobDescription, resume: resumeText }),
    });

    console.log("n8n response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      console.error("n8n webhook error:", response.status, response.statusText, errorText);
      throw new Error(`n8n webhook returned ${response.status}: ${errorText}`);
    }

    // Safely parse the response - handle empty or invalid JSON
    const responseText = await response.text();
    console.log("n8n raw response length:", responseText.length);
    console.log("n8n raw response preview:", responseText.substring(0, 1000));
    
    if (!responseText || responseText.trim() === '') {
      console.error("n8n returned empty response");
      throw new Error("n8n webhook returned empty response. Please check if the n8n workflow is active.");
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse n8n response:", responseText.substring(0, 500));
      throw new Error("n8n webhook returned invalid JSON. Please check the n8n workflow configuration.");
    }

    console.log("n8n parsed response keys:", Object.keys(data));
    console.log("n8n parsed response:", JSON.stringify(data).substring(0, 500));
    console.log("n8n response parsed successfully for user:", user.id);

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
