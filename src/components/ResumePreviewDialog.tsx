import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, ExternalLink, User, Briefcase, Calendar, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { getResumeUrl, type Candidate } from "@/lib/candidates-db";
import { cn } from "@/lib/utils";

interface ResumePreviewDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumePreviewDialog({ candidate, open, onOpenChange }: ResumePreviewDialogProps) {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  useEffect(() => {
    async function loadResumeUrl() {
      if (candidate?.resumeFilePath) {
        setIsLoadingUrl(true);
        const url = await getResumeUrl(candidate.resumeFilePath);
        setResumeUrl(url);
        setIsLoadingUrl(false);
      } else {
        setResumeUrl(null);
      }
    }

    if (open && candidate) {
      loadResumeUrl();
    }
  }, [open, candidate]);

  if (!candidate) return null;

  const getFitBadgeStyle = (category: string) => {
    switch (category) {
      case "Strong":
        return "bg-green-100 text-green-800 border-green-300";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Low":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "";
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Invited":
        return "bg-green-500 text-white";
      case "Rejected":
        return "bg-red-500 text-white";
      case "Review":
        return "bg-amber-500 text-white";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Preview - {candidate.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* Candidate Info Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-lg">{candidate.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{candidate.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={getFitBadgeStyle(candidate.fitCategory)}>
                  {candidate.fitScore}% - {candidate.fitCategory}
                </Badge>
                <Badge className={getStatusBadgeStyle(candidate.status)}>
                  {candidate.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {candidate.role}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Screened {format(candidate.screenedAt, "MMM d, yyyy")}
              </div>
            </div>

            <Separator />

            {/* Screening Summary */}
            {candidate.screeningSummary && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Screening Summary</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {candidate.screeningSummary}
                </p>
              </div>
            )}

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-2 gap-4">
              {candidate.strengths && candidate.strengths.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Strengths
                  </h3>
                  <ul className="space-y-1">
                    {candidate.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {candidate.gaps && candidate.gaps.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Gaps
                  </h3>
                  <ul className="space-y-1">
                    {candidate.gaps.map((gap, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Comment */}
            {candidate.actionComment && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Recruiter Comment</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md italic">
                    "{candidate.actionComment}"
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Resume Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Resume Content</h3>
                {candidate.resumeFilePath && (
                  <div className="flex gap-2">
                    {isLoadingUrl ? (
                      <Button variant="outline" size="sm" disabled>
                        Loading...
                      </Button>
                    ) : resumeUrl ? (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={resumeUrl} download>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {candidate.resumeText ? (
                <div className="bg-muted p-4 rounded-md max-h-[300px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                    {candidate.resumeText}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No resume text available for preview.
                </p>
              )}
            </div>

            {/* Job Description */}
            {candidate.jobDescription && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Job Description Used</h3>
                  <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                      {candidate.jobDescription}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
