// Webhook URL store for invite and reject webhooks

let inviteWebhookUrl = "";
let rejectWebhookUrl = "";

export function getInviteWebhookUrl(): string {
  return inviteWebhookUrl;
}

export function setInviteWebhookUrl(url: string): void {
  inviteWebhookUrl = url;
}

export function getRejectWebhookUrl(): string {
  return rejectWebhookUrl;
}

export function setRejectWebhookUrl(url: string): void {
  rejectWebhookUrl = url;
}

export async function triggerInviteWebhook(candidateData: {
  name: string;
  email: string;
  role: string;
  fitScore: number;
}): Promise<{ success: boolean; error?: string }> {
  const url = getInviteWebhookUrl();
  if (!url) {
    console.warn("Invite webhook URL not configured");
    return { success: false, error: "Webhook URL not configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite",
        timestamp: new Date().toISOString(),
        candidate: candidateData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

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
  const url = getRejectWebhookUrl();
  if (!url) {
    console.warn("Reject webhook URL not configured");
    return { success: false, error: "Webhook URL not configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        timestamp: new Date().toISOString(),
        candidate: candidateData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Reject webhook error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
