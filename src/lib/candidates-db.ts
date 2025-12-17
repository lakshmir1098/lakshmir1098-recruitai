import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export type CandidateStatus = "Pending" | "Invited" | "Rejected" | "Review";
export type FitCategory = "Strong" | "Medium" | "Low";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  fitScore: number;
  fitCategory: FitCategory;
  status: CandidateStatus;
  screenedAt: Date;
  lastRole: string;
  actionComment?: string;
  isDuplicate?: boolean;
  duplicateInfo?: string;
  resumeText?: string;
  resumeFilePath?: string;
  jobDescription?: string;
  screeningSummary?: string;
  strengths?: string[];
  gaps?: string[];
  recommendedAction?: string;
}

export interface CandidateAction {
  id: string;
  candidateId: string;
  actionType: "screened" | "invited" | "rejected" | "reviewed" | "status_changed";
  comment?: string;
  previousStatus?: string;
  newStatus?: string;
  createdAt: Date;
}

// Transform database row to Candidate type
function transformCandidate(row: any): Candidate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    fitScore: row.fit_score,
    fitCategory: row.fit_category as FitCategory,
    status: row.status as CandidateStatus,
    screenedAt: new Date(row.screened_at),
    lastRole: row.role, // Using role as lastRole for now
    actionComment: row.action_comment,
    isDuplicate: row.is_duplicate,
    duplicateInfo: row.duplicate_info,
    resumeText: row.resume_text,
    resumeFilePath: row.resume_file_path,
    jobDescription: row.job_description,
    screeningSummary: row.screening_summary,
    strengths: row.strengths,
    gaps: row.gaps,
    recommendedAction: row.recommended_action,
  };
}

// Fetch all candidates from database
export async function fetchCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("screened_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }

  return (data || []).map(transformCandidate);
}

// Check for duplicate candidates
export async function checkDuplicate(email: string, role: string): Promise<{ isDuplicate: boolean; duplicateInfo?: string }> {
  const { data: existingByEmail, error } = await supabase
    .from("candidates")
    .select("*")
    .ilike("email", email);

  if (error) {
    console.error("Error checking duplicates:", error);
    return { isDuplicate: false };
  }

  if (!existingByEmail || existingByEmail.length === 0) {
    return { isDuplicate: false };
  }

  const sameRole = existingByEmail.find(c => c.role.toLowerCase() === role.toLowerCase());
  if (sameRole) {
    return {
      isDuplicate: true,
      duplicateInfo: `Already screened for "${sameRole.role}" on ${format(new Date(sameRole.screened_at), "MMM d, yyyy")} (Score: ${sameRole.fit_score}%)`
    };
  }

  const otherRoles = existingByEmail.map(c => c.role).join(", ");
  return {
    isDuplicate: true,
    duplicateInfo: `Previously screened for: ${otherRoles}`
  };
}

// Add a new candidate to the database
export async function addCandidate(candidate: {
  name: string;
  email: string;
  role: string;
  fitScore: number;
  fitCategory: FitCategory;
  status: CandidateStatus;
  resumeText?: string;
  resumeFilePath?: string;
  jobDescription?: string;
  screeningSummary?: string;
  strengths?: string[];
  gaps?: string[];
  recommendedAction?: string;
}): Promise<Candidate> {
  // Check for duplicates first
  const duplicateCheck = await checkDuplicate(candidate.email, candidate.role);

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      fit_score: candidate.fitScore,
      fit_category: candidate.fitCategory,
      status: candidate.status,
      resume_text: candidate.resumeText,
      resume_file_path: candidate.resumeFilePath,
      job_description: candidate.jobDescription,
      screening_summary: candidate.screeningSummary,
      strengths: candidate.strengths,
      gaps: candidate.gaps,
      recommended_action: candidate.recommendedAction,
      is_duplicate: duplicateCheck.isDuplicate,
      duplicate_info: duplicateCheck.duplicateInfo,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding candidate:", error);
    throw error;
  }

  // Log the screening action
  await logCandidateAction(data.id, "screened", undefined, undefined, candidate.status);

  return transformCandidate(data);
}

// Update candidate status
export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus,
  comment?: string
): Promise<void> {
  // Get current status first for logging
  const { data: current } = await supabase
    .from("candidates")
    .select("status")
    .eq("id", id)
    .single();

  const previousStatus = current?.status;

  const { error } = await supabase
    .from("candidates")
    .update({
      status,
      action_comment: comment,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating candidate status:", error);
    throw error;
  }

  // Log the action
  const actionType = status === "Invited" ? "invited" : status === "Rejected" ? "rejected" : "status_changed";
  await logCandidateAction(id, actionType, comment, previousStatus, status);
}

// Log candidate action for audit trail
export async function logCandidateAction(
  candidateId: string,
  actionType: "screened" | "invited" | "rejected" | "reviewed" | "status_changed",
  comment?: string,
  previousStatus?: string,
  newStatus?: string
): Promise<void> {
  const { error } = await supabase
    .from("candidate_actions")
    .insert({
      candidate_id: candidateId,
      action_type: actionType,
      comment,
      previous_status: previousStatus,
      new_status: newStatus,
    });

  if (error) {
    console.error("Error logging candidate action:", error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

// Get candidate actions (audit trail)
export async function getCandidateActions(candidateId: string): Promise<CandidateAction[]> {
  const { data, error } = await supabase
    .from("candidate_actions")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidate actions:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    candidateId: row.candidate_id,
    actionType: row.action_type as CandidateAction["actionType"],
    comment: row.comment,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    createdAt: new Date(row.created_at),
  }));
}

// Upload resume file to storage
export async function uploadResumeFile(file: File, candidateEmail: string): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.${fileExt}`;
  const filePath = `resumes/${fileName}`;

  const { error } = await supabase.storage
    .from("resumes")
    .upload(filePath, file);

  if (error) {
    console.error("Error uploading resume:", error);
    return null;
  }

  return filePath;
}

// Get signed URL for resume file
export async function getResumeUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    console.error("Error getting resume URL:", error);
    return null;
  }

  return data.signedUrl;
}

// Get a single candidate by ID
export async function getCandidateById(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching candidate:", error);
    return null;
  }

  return data ? transformCandidate(data) : null;
}

// Delete a candidate from database
export async function deleteCandidate(id: string): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting candidate:", error);
    throw error;
  }
}
