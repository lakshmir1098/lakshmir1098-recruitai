import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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
  Briefcase,
  Clock,
  FileText,
  X
} from "lucide-react";
import { sendInterviewInvite, sendRejectionEmail, addCandidate, getCandidates, updateCandidateStatus, type ScreeningResult } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function Screen() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const jdValid = jobDescription.length >= 100;
  const resumeValid = resumeText.length >= 50;

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
        // Try to read as text for other formats
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
      // Create a synthetic event to reuse handleFileUpload logic
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        // Trigger the change handler manually
        const event = { target: input } as ChangeEvent<HTMLInputElement>;
        await handleFileUpload(event);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!jdValid || !resumeValid) {
      toast({
        title: "Validation Error",
        description: "Please ensure both fields meet minimum requirements.",
        variant: "destructive",
      });
      return;
    }
  
    setIsAnalyzing(true);
    setResult(null);
    setInviteSent(false);
    setRejected(false);
    setCandidateInfo(null);
  
    try {
      const response = await fetch(
        "https://mancyram.app.n8n.cloud/webhook/b41ad258-86d3-42e3-9319-88271b95e5ab",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jd: jobDescription,
            resume: resumeText,
          }),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("n8n webhook error:", response.status, response.statusText, errorText);
        throw new Error(`n8n webhook returned ${response.status}: ${response.statusText}`);
      }
  
      const raw = await response.json();
      
      // Validate response structure - backend should return ONLY these fields
      if (!raw || typeof raw !== 'object') {
        throw new Error("Invalid response format from backend");
      }
      
      // Validate and parse fitScore (0-100)
      const fitScore = raw.fitScore !== undefined && raw.fitScore !== null 
        ? Number(raw.fitScore) 
        : null;
      if (fitScore === null || isNaN(fitScore) || fitScore < 0 || fitScore > 100) {
        throw new Error(`Invalid fitScore: ${raw.fitScore}. Must be a number between 0-100`);
      }
      
      // Validate fitCategory (Strong | Medium | Low)
      const validFitCategories = ["Strong", "Medium", "Low"];
      if (!raw.fitCategory || !validFitCategories.includes(raw.fitCategory)) {
        throw new Error(`Invalid fitCategory: ${raw.fitCategory}. Must be one of: ${validFitCategories.join(", ")}`);
      }
      
      // Validate screeningSummary (should be a string, 3 sentences)
      if (!raw.screeningSummary || typeof raw.screeningSummary !== 'string') {
        throw new Error("Invalid screeningSummary: Must be a string");
      }
      
      // Validate strengths (array)
      if (!Array.isArray(raw.strengths)) {
        throw new Error("Invalid strengths: Must be an array");
      }
      
      // Validate gaps (array)
      if (!Array.isArray(raw.gaps)) {
        throw new Error("Invalid gaps: Must be an array");
      }
      
      // Validate recommendedAction (Interview | Review | Reject)
      const validActions = ["Interview", "Review", "Reject"];
      if (!raw.recommendedAction || !validActions.includes(raw.recommendedAction)) {
        throw new Error(`Invalid recommendedAction: ${raw.recommendedAction}. Must be one of: ${validActions.join(", ")}`);
      }
      
      // Create screening result with validated data
      const screeningResult: ScreeningResult = {
        fitScore: fitScore,
        fitCategory: raw.fitCategory,
        screeningSummary: raw.screeningSummary,
        strengths: raw.strengths,
        gaps: raw.gaps,
        recommendedAction: raw.recommendedAction,
      };
      
      // Extract candidate info from resume (basic extraction)
      const emailMatch = resumeText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const nameMatch = resumeText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
      const roleMatch = jobDescription.match(/(?:position|role|job|opening)[:\s]+([A-Z][^.!?]+)/i);
      
      const candidateName = nameMatch ? nameMatch[1] : `Candidate ${Date.now().toString().slice(-4)}`;
      const candidateEmail = emailMatch ? emailMatch[0] : `candidate${Date.now().toString().slice(-4)}@email.com`;
      const candidateRole = roleMatch ? roleMatch[1].trim() : "Applied Role";
      
      setCandidateInfo({ name: candidateName, email: candidateEmail, role: candidateRole });
      setResult(screeningResult);
      
      // Add candidate to list and Action Items based on recommendedAction
      // Actions will be taken either here (if user clicks) or in Action Items screen
      try {
        const newCandidate = addCandidate({
          name: candidateName || "Unknown Candidate",
          email: candidateEmail || "unknown@email.com",
          role: candidateRole || "Unknown Role",
          fitScore: screeningResult.fitScore,
          fitCategory: screeningResult.fitCategory,
          status: screeningResult.recommendedAction === "Interview" ? "Pending" : 
                  screeningResult.recommendedAction === "Reject" ? "Pending" : 
                  "Review",
          screenedAt: new Date(),
          lastRole: "Unknown",
          resumeText: resumeText || "",
          jobDescription: jobDescription || "",
        }, screeningResult.recommendedAction);
      } catch (error) {
        console.error("Error adding candidate:", error);
        // Continue even if adding candidate fails
      }
      
      toast({
        title: "Analysis Complete",
        description: `Fit score: ${screeningResult.fitScore}% - ${screeningResult.recommendedAction} recommended`,
      });
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Screening error:", err);
      
      // Check for CORS or network errors
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("CORS")) {
        toast({
          title: "Connection Failed",
          description: "Cannot connect to n8n. This may be a CORS issue. Check browser console for details.",
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
  

  const handleSendInvite = async () => {
    if (!candidateInfo || !result) return;
    
    try {
      const candidates = getCandidates();
      const existingCandidate = candidates.find(c => c.email === candidateInfo.email && c.role === candidateInfo.role);
      const candidateId = existingCandidate?.id || Date.now().toString();
      
      await sendInterviewInvite(
        candidateId,
        candidateInfo.email,
        candidateInfo.name,
        candidateInfo.role
      );
      setInviteSent(true);
      
      // Update candidate status if exists
      if (existingCandidate) {
        updateCandidateStatus(existingCandidate.id, "Invited");
      }
      
      toast({
        title: "Interview Invite Sent",
        description: `${candidateInfo.name} has been notified via email.`,
      });
    } catch (error) {
      console.error("Invite error:", error);
      toast({
        title: "Error",
        description: "Failed to send invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!candidateInfo || !result) return;
    
    try {
      const candidates = getCandidates();
      const existingCandidate = candidates.find(c => c.email === candidateInfo.email && c.role === candidateInfo.role);
      const candidateId = existingCandidate?.id || Date.now().toString();
      
      await sendRejectionEmail(
        candidateId,
        candidateInfo.email,
        candidateInfo.name,
        candidateInfo.role
      );
      setRejected(true);
      
      // Update candidate status if exists
      if (existingCandidate) {
        updateCandidateStatus(existingCandidate.id, "Rejected");
      }
      
      toast({
        title: "Rejection Email Sent",
        description: `${candidateInfo.name} has been notified.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Reject error:", error);
      toast({
        title: "Error",
        description: "Failed to send rejection email. Please try again.",
        variant: "destructive",
      });
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
    if (score >= 75) return "text-accent";
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

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Job Description Input */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-5 w-5 text-primary" />
              Job Description
            </CardTitle>
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
            {!uploadedFile ? (
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
                  <p className="font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
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
      <div className="flex justify-center mb-8">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !jdValid || !resumeValid}
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
      </div>

      {/* Results Section */}
      {result && typeof result.fitScore === "number" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Separator />
          
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

                {/* Recommended Action */}
                <div className="text-center flex flex-col items-center justify-center">
                  <Badge className={cn("text-lg px-4 py-1", getActionColor(result.recommendedAction))}>
                    {result.recommendedAction === "Interview" && <CheckCircle className="h-4 w-4 mr-1" />}
                    {result.recommendedAction === "Review" && <AlertCircle className="h-4 w-4 mr-1" />}
                    {result.recommendedAction === "Reject" && <XCircle className="h-4 w-4 mr-1" />}
                    {result.recommendedAction}
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

          

          {/* Action Buttons - Based on AI Recommended Action */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 justify-center">
                {/* Show Invite button when AI recommends Interview */}
                {result.recommendedAction === "Interview" && !inviteSent && (
                  <Button onClick={handleSendInvite} size="lg" className="bg-accent hover:bg-accent/90">
                    <Mail className="h-5 w-5 mr-2" />
                    Send Interview Invite
                  </Button>
                )}
                
                {/* Show Reject button when AI recommends Reject */}
                {result.recommendedAction === "Reject" && !rejected && (
                  <Button onClick={handleReject} size="lg" variant="destructive">
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject Candidate
                  </Button>
                )}
                
                {/* Show both buttons when AI recommends Review */}
                {result.recommendedAction === "Review" && (
                  <>
                    {!inviteSent && !rejected && (
                      <>
                        <Button onClick={handleSendInvite} size="lg" className="bg-accent hover:bg-accent/90">
                          <Mail className="h-5 w-5 mr-2" />
                          Send Interview Invite
                        </Button>
                        <Button onClick={handleReject} size="lg" variant="destructive">
                          <XCircle className="h-5 w-5 mr-2" />
                          Reject Candidate
                        </Button>
                      </>
                    )}
                  </>
                )}
                
                {/* Success messages for actions taken */}
                {inviteSent && (
                  <div className="flex items-center gap-2 text-accent font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Interview invite sent successfully
                  </div>
                )}
                
                {rejected && (
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <XCircle className="h-5 w-5" />
                    Rejection email sent
                  </div>
                )}
                
                {/* Note: If action not taken, candidate will appear in Action Items */}
                {!inviteSent && !rejected && (
                  <p className="text-sm text-muted-foreground w-full text-center mt-2">
                    Note: If you don't take action here, this candidate will appear in Action Items for review.
                  </p>
                )}
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setResult(null);
                    setJobDescription("");
                    setResumeText("");
                    setInviteSent(false);
                    setRejected(false);
                    setCandidateInfo(null);
                    setUploadedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
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
