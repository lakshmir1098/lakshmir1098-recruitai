import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REJECT_WEBHOOK_URL = "https://mancyram.app.n8n.cloud/webhook/2cb93916-2c97-44ae-a87c-99fdcb24c1dc";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidate, jobTitle, companyName } = await req.json();

    console.log("Received reject request:", { 
      candidateName: candidate?.name,
      candidateEmail: candidate?.email,
      jobTitle,
      companyName
    });

    // Forward request to n8n webhook 
    const response = await fetch(REJECT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ candidate, jobTitle, companyName }),
    });

    if (!response.ok) {
      console.error("n8n reject webhook error:", response.status, response.statusText);
      throw new Error(`n8n webhook returned ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = { success: true };
    }
    
    console.log("n8n reject response received:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in reject-candidate function:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
