import { supabase } from "@/integrations/supabase/client";

export async function triggerInviteWebhook(candidateData: {
  name: string;
  email: string;
  role: string;
  fitScore: number;
  companyName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Triggering invite webhook for:", candidateData.name);
    
    const { data, error } = await supabase.functions.invoke('invite-candidate', {
      body: {
        candidate: {
          name: candidateData.name,
          email: candidateData.email,
        },
        jobTitle: candidateData.role,
        companyName: candidateData.companyName || "Recruiter AI Inc by LAkshmi Ramachandran",
      },
    });

    if (error) {
      console.error("Invite webhook error:", error);
      return { success: false, error: error.message };
    }

    console.log("Invite webhook response:", data);
    return { success: data?.success ?? true };
  } catch (error) {
    console.error("Invite webhook error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function triggerRejectWebhook(candidateData: {
  name: string;
  email: string;
  role: string;
  fitScore: number;
  companyName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Triggering reject webhook for:", candidateData.name);
    
    const { data, error } = await supabase.functions.invoke('reject-candidate', {
      body: {
        candidate: {
          name: candidateData.name,
          email: candidateData.email,
        },
        jobTitle: candidateData.role,
        companyName: candidateData.companyName || "Recruiter AI Inc by LAkshmi Ramachandran",
      },
    });

    if (error) {
      console.error("Reject webhook error:", error);
      return { success: false, error: error.message };
    }

    console.log("Reject webhook response:", data);
    return { success: data?.success ?? true };
  } catch (error) {
    console.error("Reject webhook error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
