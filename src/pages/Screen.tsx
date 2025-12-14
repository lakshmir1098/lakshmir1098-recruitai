import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Briefcase,
  Clock
} from "lucide-react";
import { screenCandidate, sendInterviewInvite, addCandidate, type ScreeningResult } from "@/lib/mock-api";
import { cn } from "@/lib/utils";

export default function Screen() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const { toast } = useToast();

  const jdValid = jobDescription.length >= 100;
  const resumeValid = resumeText.length >= 50;

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

    try {
      const screeningResult = await screenCandidate(jobDescription, resumeText);
      setResult(screeningResult);

      // Add to candidates list
      addCandidate({
        name: `Candidate ${Date.now().toString().slice(-4)}`,
        email: `candidate${Date.now().toString().slice(-4)}@email.com`,
        role: "Analyzed Role",
        fitScore: screeningResult.fitScore,
        fitCategory: screeningResult.fitCategory,
        status: screeningResult.recommendedAction === "Interview" ? "Pending" : 
                screeningResult.recommendedAction === "Review" ? "Review" : "Rejected",
        screenedAt: new Date(),
        lastRole: screeningResult.candidateSnapshot.lastRole,
      });

      toast({
        title: "Analysis Complete",
        description: `Fit score: ${screeningResult.fitScore}% - ${screeningResult.fitCategory} match`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "An error occurred during screening.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendInvite = async () => {
    await sendInterviewInvite("new-candidate");
    setInviteSent(true);
    toast({
      title: "Interview Invite Sent",
      description: "The candidate has been notified.",
    });
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
          <CardContent>
            <Textarea
              placeholder="Paste the resume content here, or describe the candidate's experience..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
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
      {result && (
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

          {/* Candidate Snapshot */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Candidate Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Last Role</div>
                    <div className="font-medium">{result.candidateSnapshot.lastRole}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div className="font-medium">{result.candidateSnapshot.yearsOfExperience} years</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Seniority</div>
                    <div className="font-medium">{result.candidateSnapshot.estimatedSeniority}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 justify-center">
                {result.recommendedAction === "Interview" && !inviteSent && (
                  <Button onClick={handleSendInvite} size="lg" className="bg-accent hover:bg-accent/90">
                    <Mail className="h-5 w-5 mr-2" />
                    Send Interview Invite
                  </Button>
                )}
                {inviteSent && (
                  <div className="flex items-center gap-2 text-accent font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Interview invite sent successfully
                  </div>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setResult(null);
                    setJobDescription("");
                    setResumeText("");
                    setInviteSent(false);
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
