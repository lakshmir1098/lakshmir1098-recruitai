import { format } from "date-fns";

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
  actionComment?: string;
  isDuplicate?: boolean;
  duplicateInfo?: string;
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
  fitScore?: number;
  email?: string;
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

  if (fitScore >= 90) {
    fitCategory = "Strong";
    recommendedAction = "Interview";
  } else if (fitScore > 40) {
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

export async function sendInterviewInvite(candidateId: string): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true };
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
    message: "Medium-fit candidate requires manual review (62% fit)",
    priority: "medium",
    createdAt: new Date(Date.now() - 172800000),
    fitScore: 62,
    email: "j.rivera@email.com",
  },
];

export function getCandidates(): Candidate[] {
  return candidates;
}

export function getActionItems(): ActionItem[] {
  return actionItems;
}

export function checkDuplicate(email: string, role: string): { isDuplicate: boolean; duplicateInfo?: string } {
  const existingByEmail = candidates.filter(c => c.email.toLowerCase() === email.toLowerCase());
  
  if (existingByEmail.length === 0) {
    return { isDuplicate: false };
  }
  
  const sameRole = existingByEmail.find(c => c.role.toLowerCase() === role.toLowerCase());
  if (sameRole) {
    return { 
      isDuplicate: true, 
      duplicateInfo: `Already screened for "${sameRole.role}" on ${format(sameRole.screenedAt, "MMM d, yyyy")} (Score: ${sameRole.fitScore}%)`
    };
  }
  
  const otherRoles = existingByEmail.map(c => c.role).join(", ");
  return { 
    isDuplicate: true, 
    duplicateInfo: `Previously screened for: ${otherRoles}`
  };
}

export function addCandidate(candidate: Omit<Candidate, "id">) {
  // Check for duplicates
  const duplicateCheck = checkDuplicate(candidate.email, candidate.role);
  
  const newCandidate: Candidate = {
    ...candidate,
    id: Date.now().toString(),
    isDuplicate: duplicateCheck.isDuplicate,
    duplicateInfo: duplicateCheck.duplicateInfo,
  };
  candidates = [newCandidate, ...candidates];
  
  // Add to action items if score is between 41-89 (Review status)
  if (candidate.status === "Review") {
    actionItems = [
      {
        id: (Date.now() + 1).toString(),
        type: duplicateCheck.isDuplicate ? "duplicate" : "review",
        candidateName: candidate.name,
        candidateId: newCandidate.id,
        role: candidate.role,
        message: duplicateCheck.isDuplicate 
          ? `Duplicate candidate - ${duplicateCheck.duplicateInfo}`
          : `Review needed - candidate scored ${candidate.fitScore}% fit`,
        priority: duplicateCheck.isDuplicate ? "high" : (candidate.fitScore >= 70 ? "high" : "medium"),
        createdAt: new Date(),
        fitScore: candidate.fitScore,
        email: candidate.email,
      },
      ...actionItems,
    ];
  }
  
  return newCandidate;
}

export function updateCandidateStatus(id: string, status: Candidate["status"], comment?: string) {
  candidates = candidates.map((c) => (c.id === id ? { ...c, status, actionComment: comment || c.actionComment } : c));
  if (status === "Invited" || status === "Rejected") {
    actionItems = actionItems.filter((a) => a.candidateId !== id);
  }
}

export function getActionItemByCandidateId(candidateId: string): ActionItem | undefined {
  return actionItems.find((a) => a.candidateId === candidateId);
}
