// n8n webhook URLs for invite and reject workflows
const INVITE_WEBHOOK_URL = "https://mancyram.app.n8n.cloud/webhook/api/recruitai/action/invite";
const REJECT_WEBHOOK_URL = "https://mancyram.app.n8n.cloud/webhook/2cb93916-2c97-44ae-a87c-99fdcb24c1dc";

export async function triggerInviteWebhook(candidateData: {
  name: string;
  email: string;
  role: string;
  fitScore: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Triggering invite webhook for:", candidateData.name);
    
    const response = await fetch(INVITE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "no-cors",
      body: JSON.stringify({
        action: "invite",
        timestamp: new Date().toISOString(),
        candidate: candidateData,
      }),
    });

    console.log("Invite webhook triggered successfully");
    return { success: true };
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
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Triggering reject webhook for:", candidateData.name);
    
    const response = await fetch(REJECT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "no-cors",
      body: JSON.stringify({
        action: "reject",
        timestamp: new Date().toISOString(),
        candidate: candidateData,
      }),
    });

    console.log("Reject webhook triggered successfully");
    return { success: true };
  } catch (error) {
    console.error("Reject webhook error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
