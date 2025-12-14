import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getCandidates, updateCandidateStatus, sendInterviewInvite, sendRejectionEmail, type Candidate } from "@/lib/mock-api";
import { Search, Users, CheckCircle, XCircle, Clock, Mail, Eye, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(getCandidates());
  const [search, setSearch] = useState("");
  const [fitFilter, setFitFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // Detect duplicate submissions
  const findDuplicates = (candidate: Candidate) => {
    return candidates.filter(c => 
      c.email === candidate.email && 
      c.id !== candidate.id &&
      c.resumeText && 
      candidate.resumeText &&
      c.resumeText.trim().toLowerCase() === candidate.resumeText.trim().toLowerCase()
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.role.toLowerCase().includes(search.toLowerCase()) ||
                         c.email.toLowerCase().includes(search.toLowerCase());
    const matchesFit = fitFilter === "all" || c.fitCategory === fitFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesFit && matchesStatus;
  });

  const stats = {
    total: candidates.length,
    strong: candidates.filter((c) => c.fitCategory === "Strong").length,
    medium: candidates.filter((c) => c.fitCategory === "Medium").length,
    inProgress: candidates.filter((c) => c.status === "Pending" || c.status === "Review" || c.status === "Invited").length,
  };

  // Extract skills from resume text
  const extractSkills = (resumeText?: string): string[] => {
    if (!resumeText) return [];
    const commonSkills = ["React", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "CSS", "REST APIs", "PostgreSQL", "MongoDB", "AWS", "Docker"];
    const found = commonSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
    return found.slice(0, 3);
  };

  // Extract experience years from resume text
  const extractExperience = (resumeText?: string): number => {
    if (!resumeText) return 0;
    const expMatch = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
    if (expMatch) return parseInt(expMatch[1]);
    // Fallback: estimate from fitScore
    return Math.floor(Math.random() * 8) + 2;
  };

  const handleInvite = async (candidate: Candidate) => {
    try {
      await sendInterviewInvite(candidate.id, candidate.email, candidate.name, candidate.role);
      updateCandidateStatus(candidate.id, "Invited");
      setCandidates(getCandidates());
      toast({
        title: "Interview Invite Sent",
        description: `${candidate.name} has been notified via email.`,
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

  const handleReject = async (candidate: Candidate) => {
    try {
      await sendRejectionEmail(candidate.id, candidate.email, candidate.name, candidate.role);
      updateCandidateStatus(candidate.id, "Rejected");
      setCandidates(getCandidates());
      toast({
        title: "Rejection Email Sent",
        description: `${candidate.name} has been notified.`,
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

  const getStatusBadge = (status: Candidate["status"]) => {
    const styles = {
      Pending: "bg-secondary text-secondary-foreground",
      Invited: "bg-accent text-accent-foreground",
      Rejected: "bg-destructive text-destructive-foreground",
      Review: "bg-warning text-warning-foreground",
    };
    return styles[status];
  };

  const getFitBadge = (category: Candidate["fitCategory"]) => {
    const styles = {
      Strong: "bg-accent/10 text-accent border-accent",
      Medium: "bg-warning/10 text-warning border-warning",
      Low: "bg-destructive/10 text-destructive border-destructive",
    };
    return styles[category];
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Candidates</h1>
        <p className="text-muted-foreground mt-1">
          View and manage candidates across all jobs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Candidates</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-accent">{stats.strong}</div>
            <div className="text-sm text-muted-foreground mt-1">Strong Fits</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-warning">{stats.medium}</div>
            <div className="text-sm text-muted-foreground mt-1">Medium Fits</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground mt-1">In Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="shadow-sm mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm font-medium">Filters:</div>
            <Select value="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue>All Jobs</SelectValue>
              </SelectTrigger>
            </Select>
            <Select value={fitFilter} onValueChange={setFitFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>All Fits</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fits</SelectItem>
                <SelectItem value="Strong">Strong</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>All Status</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Invited">Invited</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Bulk Invite
              </Button>
              <Button variant="outline" size="sm">
                Bulk Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="text-center">Fit Score</TableHead>
                <TableHead>Key Skills</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => {
                  const duplicates = findDuplicates(candidate);
                  const skills = extractSkills(candidate.resumeText);
                  const experience = extractExperience(candidate.resumeText);
                  return (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.role}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "font-semibold text-lg",
                          candidate.fitScore >= 75 && "text-accent",
                          candidate.fitScore >= 50 && candidate.fitScore < 75 && "text-warning",
                          candidate.fitScore < 50 && "text-destructive"
                        )}>
                          {candidate.fitScore}
                        </span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          getFitBadge(candidate.fitCategory)
                        )}>
                          {candidate.fitCategory.toLowerCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {skills.length > 0 ? (
                          skills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{experience} years</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(candidate.screenedAt, "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
