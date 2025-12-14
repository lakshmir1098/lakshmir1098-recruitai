export type ScreeningResult = {
  fitScore: number;
  fitCategory: "Strong" | "Medium" | "Low";
  screeningSummary: string;
  strengths: string[];
  gaps: string[];
  recommendedAction: "Interview" | "Review" | "Reject";
};

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  fitScore: number;
  fitCategory: "Strong" | "Medium" | "Low";
  status: "Pending" | "Invited" | "Rejected" | "Review";
  screenedAt: Date;
  lastRole: string;
  resumeText?: string; // Store resume text for duplicate detection
  jobDescription?: string; // Store job description for role tracking
}

export interface ActionItem {
  id: string;
  type: "review" | "response" | "duplicate" | "invite_failed";
  candidateName: string;
  candidateId: string;
  role: string;
  message: string;
  priority: "high" | "medium" | "low";
  createdAt: Date;
}

// Simulated screening AI response
export async function screenCandidate(
  jobDescription: string,
  resumeText: string
): Promise<ScreeningResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Extract some keywords to make the response feel dynamic
  const jdLower = jobDescription.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const skills = ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "AWS", "Docker", "Kubernetes", "SQL", "MongoDB", "GraphQL"];
  const matchedSkills = skills.filter(
    (skill) => resumeLower.includes(skill.toLowerCase()) && jdLower.includes(skill.toLowerCase())
  );

  const missingSkills = skills.filter(
    (skill) => jdLower.includes(skill.toLowerCase()) && !resumeLower.includes(skill.toLowerCase())
  );

  // Calculate a score based on matches
  const baseScore = Math.min(95, 40 + matchedSkills.length * 10 + Math.random() * 15);
  const fitScore = Math.round(baseScore);

  let fitCategory: ScreeningResult["fitCategory"];
  let recommendedAction: ScreeningResult["recommendedAction"];

  if (fitScore >= 75) {
    fitCategory = "Strong";
    recommendedAction = "Interview";
  } else if (fitScore >= 50) {
    fitCategory = "Medium";
    recommendedAction = "Review";
  } else {
    fitCategory = "Low";
    recommendedAction = "Reject";
  }

  return {
    fitScore,
    fitCategory,
    screeningSummary: `The candidate demonstrates ${fitCategory.toLowerCase()} alignment with the role requirements. ${
      matchedSkills.length > 0
        ? `Key matching skills include ${matchedSkills.slice(0, 3).join(", ")}.`
        : "Limited direct skill overlap detected."
    } ${
      fitCategory === "Strong"
        ? "The experience level and technical background suggest strong potential for success in this role."
        : fitCategory === "Medium"
        ? "Some additional evaluation may be needed to confirm fit."
        : "The profile shows significant gaps relative to core requirements."
    }`,
    recommendedAction,
    strengths: matchedSkills.length > 0 ? matchedSkills.slice(0, 4) : ["Communication", "Problem-solving"],
    gaps: missingSkills.length > 0 ? missingSkills.slice(0, 3) : ["No major gaps identified"],
  };
}

// Webhook URLs - to be configured later
const INVITE_WEBHOOK_URL = "https://mancyram.app.n8n.cloud/webhook/invite";
const REJECT_WEBHOOK_URL = "https://mancyram.app.n8n.cloud/webhook/reject";

export async function sendInterviewInvite(candidateId: string, candidateEmail?: string, candidateName?: string, role?: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(INVITE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateId,
        candidateEmail,
        candidateName,
        role,
      }),
    });

    if (!response.ok) {
      throw new Error(`Invite webhook returned ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Invite webhook error:", error);
    // Still return success to update UI, but log error
    return { success: false };
  }
}

export async function sendRejectionEmail(candidateId: string, candidateEmail?: string, candidateName?: string, role?: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(REJECT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateId,
        candidateEmail,
        candidateName,
        role,
      }),
    });

    if (!response.ok) {
      throw new Error(`Reject webhook returned ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Reject webhook error:", error);
    // Still return success to update UI, but log error
    return { success: false };
  }
}

// Mock data stores
let candidates: Candidate[] = [
  {
    id: "1",
    name: "Alex Thompson",
    email: "alex.t@email.com",
    role: "Senior Backend Engineer",
    fitScore: 88,
    fitCategory: "Strong",
    status: "Invited",
    screenedAt: new Date(Date.now() - 86400000),
    lastRole: "Backend Engineer",
  },
  {
    id: "2",
    name: "Jordan Rivera",
    email: "j.rivera@email.com",
    role: "Full Stack Developer",
    fitScore: 62,
    fitCategory: "Medium",
    status: "Review",
    screenedAt: new Date(Date.now() - 172800000),
    lastRole: "Software Developer",
  },
  {
    id: "3",
    name: "Sam Chen",
    email: "sam.chen@email.com",
    role: "Senior Backend Engineer",
    fitScore: 45,
    fitCategory: "Low",
    status: "Rejected",
    screenedAt: new Date(Date.now() - 259200000),
    lastRole: "Junior Developer",
  },
];

let actionItems: ActionItem[] = [
  {
    id: "1",
    type: "review",
    candidateName: "Jordan Rivera",
    candidateId: "2",
    role: "Full Stack Developer",
    message: "Medium-fit candidate requires manual review",
    priority: "medium",
    createdAt: new Date(Date.now() - 172800000),
  },
];

export function getCandidates(): Candidate[] {
  return candidates;
}

export function getActionItems(): ActionItem[] {
  return actionItems;
}

// Check for duplicate resume submissions
function findDuplicateResume(resumeText: string, email: string): Candidate | null {
  return candidates.find(c => 
    c.email === email && 
    c.resumeText && 
    c.resumeText.trim().toLowerCase() === resumeText.trim().toLowerCase()
  ) || null;
}

export function addCandidate(candidate: Omit<Candidate, "id">, recommendedAction?: "Interview" | "Review" | "Reject") {
  // Check for duplicate resume
  const duplicate = candidate.resumeText 
    ? findDuplicateResume(candidate.resumeText, candidate.email)
    : null;
  
  if (duplicate && duplicate.role !== candidate.role) {
    // Same resume submitted for different role - add to action items
    actionItems = [
      {
        id: Date.now().toString(),
        type: "duplicate",
        candidateName: candidate.name,
        candidateId: duplicate.id,
        role: `${duplicate.role} → ${candidate.role}`,
        message: `Duplicate resume detected. Previously applied for ${duplicate.role}`,
        priority: "medium",
        createdAt: new Date(),
      },
      ...actionItems,
    ];
  }
  
  const newCandidate: Candidate = {
    ...candidate,
    id: Date.now().toString(),
  };
  candidates = [newCandidate, ...candidates];
  
  // Determine action type based on recommendedAction or fitScore
  const actionType = recommendedAction || 
    (candidate.fitScore >= 90 ? "Interview" : 
     candidate.fitScore < 40 ? "Reject" : "Review");
  
  // Add to action items based on recommended action
  // This ensures candidates appear in Action Items if not handled in screening results
  if (actionType === "Interview") {
    // Add action item for invite
    actionItems = [
      {
        id: Date.now().toString(),
        type: "review", // Using review type but with invite action
        candidateName: candidate.name,
        candidateId: newCandidate.id,
        role: candidate.role,
        message: `AI recommends Interview - ${candidate.fitScore}% fit score`,
        priority: candidate.fitScore >= 90 ? "high" : "medium",
        createdAt: new Date(),
      },
      ...actionItems,
    ];
  } else if (actionType === "Reject") {
    // Add action item for reject
    actionItems = [
      {
        id: Date.now().toString(),
        type: "review", // Using review type but with reject action
        candidateName: candidate.name,
        candidateId: newCandidate.id,
        role: candidate.role,
        message: `AI recommends Reject - ${candidate.fitScore}% fit score`,
        priority: "medium",
        createdAt: new Date(),
      },
      ...actionItems,
    ];
  } else {
    // Review case - add action item
    actionItems = [
      {
        id: Date.now().toString(),
        type: "review",
        candidateName: candidate.name,
        candidateId: newCandidate.id,
        role: candidate.role,
        message: `Candidate with ${candidate.fitScore}% fit score requires manual review`,
        priority: candidate.fitScore >= 70 ? "high" : "medium",
        createdAt: new Date(),
      },
      ...actionItems,
    ];
  }
  
  return newCandidate;
}

export function updateCandidateStatus(id: string, status: Candidate["status"]) {
  candidates = candidates.map((c) => (c.id === id ? { ...c, status } : c));
  if (status === "Invited" || status === "Rejected") {
    actionItems = actionItems.filter((a) => a.candidateId !== id);
  }
}
