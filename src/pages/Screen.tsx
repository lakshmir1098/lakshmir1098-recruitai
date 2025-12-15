import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  FileSearch, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Mail,
  TrendingUp,
  TrendingDown,
  FileText,
  X,
  Eye,
  Loader2
} from "lucide-react";
import { addCandidate, type Candidate, type FitCategory, type CandidateStatus } from "@/lib/candidates-db";
import { type ScreeningResult } from "@/lib/mock-api";
import { triggerInviteWebhook, triggerRejectWebhook } from "@/lib/webhook-store";
import { isAutoInviteEnabled, isAutoRejectEnabled } from "@/lib/settings-store";
import { cn } from "@/lib/utils";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { supabase } from "@/integrations/supabase/client";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Example Job Description for quick testing
const EXAMPLE_JD = `## Job Title: Senior Software Engineer

## Location: Bangalore, India (Hybrid)

## About the Role
We are looking for a Senior Software Engineer with strong experience in full-stack development to join our growing team. You will work on building scalable web applications and collaborate with cross-functional teams.

## Key Responsibilities
- Design and develop high-quality, scalable software solutions
- Write clean, maintainable code following best practices
- Collaborate with product managers and designers
- Mentor junior developers and conduct code reviews
- Participate in agile ceremonies and contribute to technical decisions

## Required Qualifications
- 4+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript, React, and Node.js
- Experience with databases (SQL and NoSQL)
- Familiarity with cloud services (AWS/GCP/Azure)
- Excellent problem-solving and communication skills

## Preferred Qualifications
- Experience with microservices architecture
- Knowledge of CI/CD pipelines and DevOps practices
- Contributions to open-source projects
`;

const SESSION_STORAGE_KEY = "recruitai_screening_session";

interface ScreeningSession {
  jobDescription: string;
  resumeText: string;
  candidateName: string;
  candidateEmail: string;
  roleTitle: string;
  result: ScreeningResult | null;
  processedStatus: "invited" | "rejected" | "review" | null;
  addedCandidateId: string | null;
  uploadedFileName: string | null;
}

const getStoredSession = (): ScreeningSession | null => {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveSession = (session: ScreeningSession) => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Error saving session:", e);
  }
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

export default function Screen() {
  const navigate = useNavigate();
  const storedSession = getStoredSession();
  
  const [jobDescription, setJobDescription] = useState(storedSession?.jobDescription || "");
  const [resumeText, setResumeText] = useState(storedSession?.resumeText || "");
  const [candidateName, setCandidateName] = useState(storedSession?.candidateName || "");
  const [candidateEmail, setCandidateEmail] = useState(storedSession?.candidateEmail || "");
  const [roleTitle, setRoleTitle] = useState(storedSession?.roleTitle || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(storedSession?.result || null);
  const [processedStatus, setProcessedStatus] = useState<"invited" | "rejected" | "review" | null>(storedSession?.processedStatus || null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(storedSession?.uploadedFileName || null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [addedCandidateId, setAddedCandidateId] = useState<string | null>(storedSession?.addedCandidateId || null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Persist session data when form changes
  useEffect(() => {
    saveSession({
      jobDescription,
      resumeText,
      candidateName,
      candidateEmail,
      roleTitle,
      result,
      processedStatus,
      addedCandidateId,
      uploadedFileName,
    });
  }, [jobDescription, resumeText, candidateName, candidateEmail, roleTitle, result, processedStatus, addedCandidateId, uploadedFileName]);

  const jdValid = jobDescription.length >= 100;
  const resumeValid = resumeText.length >= 50;
  const nameValid = candidateName.length >= 2;
  const emailValid = candidateEmail.includes("@");
  const roleValid = roleTitle.length >= 2;

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadedFileName(file.name);
    setIsParsingFile(true);

    try {
      let extractedText = "";
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        extractedText = await file.text();
      } else if (fileName.endsWith(".pdf")) {
        extractedText = await extractTextFromPdf(file);
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        extractedText = await extractTextFromDocx(file);
      } else {
        extractedText = await file.text();
      }

      setResumeText(extractedText.trim());
      toast({
        title: "Resume Uploaded",
        description: `Successfully extracted text from ${file.name}`,
      });
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "Parsing Error",
        description: "Could not extract text from the file. Please try pasting the content manually.",
        variant: "destructive",
      });
      setUploadedFile(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedFileName(null);
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        const event = { target: input } as ChangeEvent<HTMLInputElement>;
        await handleFileUpload(event);
      }
    }
  };

  const determineStatus = (score: number): CandidateStatus => {
    // Check settings to determine if auto-invite/auto-reject is enabled
    const autoInvite = isAutoInviteEnabled();
    const autoReject = isAutoRejectEnabled();
    
    if (score >= 90 && autoInvite) return "Invited";
    if (score <= 40 && autoReject) return "Rejected";
    return "Review";
  };

  const determineFitCategory = (score: number): FitCategory => {
    if (score >= 75) return "Strong";
    if (score >= 50) return "Medium";
    return "Low";
  };

  const handleAnalyze = async () => {
    if (!jdValid || !resumeValid || !nameValid || !emailValid || !roleValid) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }
  
    setIsAnalyzing(true);
    setResult(null);
    setProcessedStatus(null);
    setAddedCandidateId(null);
  
    try {
      // Call screening through authenticated edge function
      const { data: raw, error: funcError } = await supabase.functions.invoke('screen-candidate', {
        body: {
          jobDescription,
          resumeText,
        },
      });

      if (funcError) {
        console.error("Screening function error:", funcError);
        throw new Error(funcError.message || "Screening service unavailable");
      }

      if (raw?.error) {
        throw new Error(raw.error);
      }
      
      const screeningResult: ScreeningResult = {
        fitScore: Number(raw.fitScore),
        fitCategory: raw.fitCategory || determineFitCategory(Number(raw.fitScore)),
        screeningSummary: raw.screeningSummary,
        strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
        gaps: Array.isArray(raw.gaps) ? raw.gaps : [],
        recommendedAction: raw.recommendedAction,
      };
      
      setResult(screeningResult);

      // Determine status based on score
      const status = determineStatus(screeningResult.fitScore);
      const candidateData = {
        name: candidateName,
        email: candidateEmail,
        role: roleTitle,
        fitScore: screeningResult.fitScore,
      };

      // Add candidate to the database with resume and job description
      const newCandidate = await addCandidate({
        name: candidateName,
        email: candidateEmail,
        role: roleTitle,
        fitScore: screeningResult.fitScore,
        fitCategory: screeningResult.fitCategory,
        status,
        resumeText: resumeText,
        jobDescription: jobDescription,
        screeningSummary: screeningResult.screeningSummary,
        strengths: screeningResult.strengths,
        gaps: screeningResult.gaps,
        recommendedAction: screeningResult.recommendedAction,
      });

      setAddedCandidateId(newCandidate.id);

      // Trigger appropriate webhook based on status
      if (status === "Invited") {
        setProcessedStatus("invited");
        const webhookResult = await triggerInviteWebhook(candidateData);
        if (webhookResult.success) {
          toast({
            title: "Auto-Invited (90%+ Score)",
            description: `${candidateName} has been invited. Email workflow triggered.`,
          });
        } else {
          toast({
            title: "Auto-Invited (90%+ Score)",
            description: `${candidateName} invited but email workflow failed: ${webhookResult.error}`,
            variant: "destructive",
          });
        }
      } else if (status === "Rejected") {
        setProcessedStatus("rejected");
        const webhookResult = await triggerRejectWebhook(candidateData);
        if (webhookResult.success) {
          toast({
            title: "Auto-Rejected (≤40% Score)",
            description: `${candidateName} has been rejected. Email workflow triggered.`,
          });
        } else {
          toast({
            title: "Auto-Rejected (≤40% Score)",
            description: `${candidateName} rejected but email workflow failed: ${webhookResult.error}`,
            variant: "destructive",
          });
        }
      } else {
        setProcessedStatus("review");
        const score = screeningResult.fitScore;
        let message = `${candidateName} added to Candidates for manual review.`;
        
        // Provide context if auto-actions were disabled
        if (score >= 90 && !isAutoInviteEnabled()) {
          message = `${candidateName} scored 90%+ but auto-invite is disabled. Added to Candidates for manual review.`;
        } else if (score <= 40 && !isAutoRejectEnabled()) {
          message = `${candidateName} scored ≤40% but auto-reject is disabled. Added to Candidates for manual review.`;
        }
        
        toast({
          title: "Review Needed",
          description: message,
        });
      }
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Screening error:", err);
      
      if (errorMessage.includes("Unauthorized")) {
        toast({
          title: "Authentication Required",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: errorMessage || "Could not reach screening service.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setJobDescription("");
    setResumeText("");
    setCandidateName("");
    setCandidateEmail("");
    setRoleTitle("");
    setProcessedStatus(null);
    setUploadedFile(null);
    setUploadedFileName(null);
    setAddedCandidateId(null);
    clearSession();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualInvite = async () => {
    if (!addedCandidateId) return;
    
    setIsProcessingAction(true);
    try {
      const { updateCandidateStatus } = await import("@/lib/candidates-db");
      const webhookData = {
        name: candidateName,
        email: candidateEmail,
        role: roleTitle,
        fitScore: result?.fitScore || 0,
      };
      
      const webhookResult = await triggerInviteWebhook(webhookData);
      await updateCandidateStatus(addedCandidateId, "Invited", "Manually invited after screening");
      
      setProcessedStatus("invited");
      toast({
        title: "Candidate Invited",
        description: webhookResult.success 
          ? `${candidateName} has been invited. Email workflow triggered.`
          : `${candidateName} marked as invited.`,
      });
    } catch (error) {
      console.error("Error inviting candidate:", error);
      toast({
        title: "Error",
        description: "Failed to invite candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleManualReject = async () => {
    if (!addedCandidateId) return;
    
    setIsProcessingAction(true);
    try {
      const { updateCandidateStatus } = await import("@/lib/candidates-db");
      const webhookData = {
        name: candidateName,
        email: candidateEmail,
        role: roleTitle,
        fitScore: result?.fitScore || 0,
      };
      
      const webhookResult = await triggerRejectWebhook(webhookData);
      await updateCandidateStatus(addedCandidateId, "Rejected", "Manually rejected after screening");
      
      setProcessedStatus("rejected");
      toast({
        title: "Candidate Rejected",
        description: webhookResult.success 
          ? `${candidateName} has been rejected. Email workflow triggered.`
          : `${candidateName} marked as rejected.`,
      });
    } catch (error) {
      console.error("Error rejecting candidate:", error);
      toast({
        title: "Error",
        description: "Failed to reject candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "Interview":
        return "bg-accent text-accent-foreground";
      case "Review":
        return "bg-warning text-warning-foreground";
      case "Reject":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-primary";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Screening Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Paste a job description and resume to get AI-powered screening insights
        </p>
      </div>

      {/* Candidate Info Section */}
      <Card className="shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Candidate Information</CardTitle>
          <CardDescription>Enter the candidate's details for tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Candidate Name *</Label>
              <Input
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role Applied For *</Label>
              <Input
                placeholder="Senior Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Job Description Input */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSearch className="h-5 w-5 text-primary" />
                Job Description
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobDescription(EXAMPLE_JD)}
                className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Use Example
              </Button>
            </div>
            <CardDescription>Paste the full job description here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={cn(
                "text-sm",
                jdValid ? "text-accent" : "text-muted-foreground"
              )}>
                {jobDescription.length} / 100 min characters
              </span>
              {!jdValid && jobDescription.length > 0 && (
                <span className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Minimum 100 characters required
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resume Input */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-primary" />
              Resume
            </CardTitle>
            <CardDescription>Upload or paste the candidate's resume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Upload Zone */}
            {!uploadedFile && !uploadedFileName ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                  isDragOver 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.rtf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isParsingFile}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "p-4 rounded-full transition-colors",
                    isDragOver ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Upload className={cn(
                      "h-8 w-8 transition-colors",
                      isDragOver ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isParsingFile ? "Extracting text..." : "Drop resume here or click to upload"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports PDF, DOCX, DOC, TXT, MD
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadedFile?.name || uploadedFileName}</p>
                  {uploadedFile && (
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearUploadedFile}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or paste content</span>
              </div>
            </div>

            <Textarea
              placeholder="Paste the resume content here, or describe the candidate's experience..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[250px] resize-none"
            />
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-sm",
                resumeValid ? "text-accent" : "text-muted-foreground"
              )}>
                {resumeText.length} / 50 min characters
              </span>
              {!resumeValid && resumeText.length > 0 && (
                <span className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Minimum 50 characters required
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyze Button */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !jdValid || !resumeValid || !nameValid || !emailValid || !roleValid}
          className="px-8"
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Analyze with Recruit-AI
            </>
          )}
        </Button>

        {/* Analysis Progress Animation */}
        {isAnalyzing && (
          <Card className="w-full max-w-2xl shadow-sm">
            <CardContent className="pt-6">
              <AnalysisProgress isAnalyzing={isAnalyzing} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Section */}
      {result && typeof result.fitScore === "number" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Separator />

          {/* Status Banner */}
          {processedStatus && (
            <Card className={cn(
              "shadow-md border-l-4",
              processedStatus === "invited" && "border-l-accent bg-accent/5",
              processedStatus === "rejected" && "border-l-destructive bg-destructive/5",
              processedStatus === "review" && "border-l-warning bg-warning/5"
            )}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {processedStatus === "invited" && <CheckCircle className="h-6 w-6 text-accent" />}
                    {processedStatus === "rejected" && <XCircle className="h-6 w-6 text-destructive" />}
                    {processedStatus === "review" && <AlertCircle className="h-6 w-6 text-warning" />}
                    <div>
                      <p className="font-semibold text-foreground">
                        {processedStatus === "invited" && "Candidate Auto-Invited (Score ≥ 90%)"}
                        {processedStatus === "rejected" && "Candidate Auto-Rejected (Score ≤ 40%)"}
                        {processedStatus === "review" && "Candidate Added for Review (Score 41-89%)"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {processedStatus === "invited" && "Invite email workflow triggered. Candidate added to Candidates list."}
                        {processedStatus === "rejected" && "Reject email workflow triggered. Candidate added to Candidates list."}
                        {processedStatus === "review" && "Added to Candidates for manual review."}
                      </p>
                    </div>
                  </div>
                  {processedStatus === "review" && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/candidates")}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View in Candidates
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Fit Score Card */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Score */}
                <div className="text-center">
                  <div className={cn("text-6xl font-bold", getScoreColor(result.fitScore))}>
                    {result.fitScore}
                  </div>
                  <div className="text-muted-foreground mt-1">Fit Score</div>
                  <Progress value={result.fitScore} className="mt-3 h-2" />
                </div>

                {/* Category */}
                <div className="text-center flex flex-col items-center justify-center">
                  <Badge 
                    className={cn(
                      "text-lg px-4 py-1",
                      result.fitCategory === "Strong" && "bg-accent text-accent-foreground",
                      result.fitCategory === "Medium" && "bg-warning text-warning-foreground",
                      result.fitCategory === "Low" && "bg-destructive text-destructive-foreground"
                    )}
                  >
                    {result.fitCategory} Fit
                  </Badge>
                </div>

                {/* Status */}
                <div className="text-center flex flex-col items-center justify-center">
                  <Badge className={cn(
                    "text-lg px-4 py-1",
                    processedStatus === "invited" && "bg-accent text-accent-foreground",
                    processedStatus === "rejected" && "bg-destructive text-destructive-foreground",
                    processedStatus === "review" && "bg-warning text-warning-foreground"
                  )}>
                    {processedStatus === "invited" && <CheckCircle className="h-4 w-4 mr-1" />}
                    {processedStatus === "rejected" && <XCircle className="h-4 w-4 mr-1" />}
                    {processedStatus === "review" && <AlertCircle className="h-4 w-4 mr-1" />}
                    {processedStatus === "invited" && "Invited"}
                    {processedStatus === "rejected" && "Rejected"}
                    {processedStatus === "review" && "Review Needed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">AI Screening Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{result.screeningSummary}</p>
            </CardContent>
          </Card>

          {/* Strengths & Gaps */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-warning">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.gaps.map((gap, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 justify-center">
                {/* Show manual invite/reject buttons when status is "review" */}
                {processedStatus === "review" && (
                  <>
                    <Button 
                      size="lg" 
                      onClick={handleManualInvite}
                      disabled={isProcessingAction}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isProcessingAction ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-5 w-5 mr-2" />
                      )}
                      Invite Candidate
                    </Button>
                    <Button 
                      variant="destructive"
                      size="lg" 
                      onClick={handleManualReject}
                      disabled={isProcessingAction}
                    >
                      {isProcessingAction ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-5 w-5 mr-2" />
                      )}
                      Reject Candidate
                    </Button>
                  </>
                )}
                <Button variant="outline" size="lg" onClick={() => navigate("/candidates")}>
                  <Eye className="h-5 w-5 mr-2" />
                  View All Candidates
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                >
                  Screen Another Candidate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
