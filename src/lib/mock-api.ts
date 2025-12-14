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
    candidateSnapshot: {
      estimatedSeniority: fitScore >= 70 ? "Senior" : fitScore >= 50 ? "Mid-level" : "Junior",
      yearsOfExperience: Math.floor(fitScore / 15) + 1,
      lastRole: resumeLower.includes("engineer") ? "Software Engineer" : resumeLower.includes("manager") ? "Engineering Manager" : "Developer",
    },
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

export function addCandidate(candidate: Omit<Candidate, "id">) {
  const newCandidate: Candidate = {
    ...candidate,
    id: Date.now().toString(),
  };
  candidates = [newCandidate, ...candidates];
  
  if (candidate.fitCategory === "Medium") {
    actionItems = [
      {
        id: Date.now().toString(),
        type: "review",
        candidateName: candidate.name,
        candidateId: newCandidate.id,
        role: candidate.role,
        message: "Medium-fit candidate requires manual review",
        priority: "medium",
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
