import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getCandidates, updateCandidateStatus, type Candidate } from "@/lib/mock-api";
import { triggerInviteWebhook, triggerRejectWebhook } from "@/lib/webhook-store";
import { Search, Users, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(getCandidates());
  const [search, setSearch] = useState("");
  const [fitFilter, setFitFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const refreshCandidates = () => {
    setCandidates(getCandidates());
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.role.toLowerCase().includes(search.toLowerCase());
    const matchesFit = fitFilter === "all" || c.fitCategory === fitFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesFit && matchesStatus;
  });

  const stats = {
    strong: candidates.filter((c) => c.fitCategory === "Strong").length,
    medium: candidates.filter((c) => c.fitCategory === "Medium").length,
    pending: candidates.filter((c) => c.status === "Pending" || c.status === "Review").length,
  };

  const handleInvite = async (candidate: Candidate) => {
    const webhookResult = await triggerInviteWebhook({
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      fitScore: candidate.fitScore,
    });

    updateCandidateStatus(candidate.id, "Invited");
    refreshCandidates();
    
    if (webhookResult.success) {
      toast({
        title: "Interview Invite Sent",
        description: `${candidate.name} has been invited. Webhook triggered successfully.`,
      });
    } else {
      toast({
        title: "Interview Invite Sent",
        description: `${candidate.name} marked as invited. ${webhookResult.error ? `Webhook: ${webhookResult.error}` : "Configure webhook in Settings."}`,
      });
    }
  };

  const handleReject = async (candidate: Candidate) => {
    const webhookResult = await triggerRejectWebhook({
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      fitScore: candidate.fitScore,
    });

    updateCandidateStatus(candidate.id, "Rejected");
    refreshCandidates();
    
    if (webhookResult.success) {
      toast({
        title: "Candidate Rejected",
        description: `${candidate.name} has been rejected. Webhook triggered successfully.`,
      });
    } else {
      toast({
        title: "Candidate Rejected",
        description: `${candidate.name} marked as rejected. ${webhookResult.error ? `Webhook: ${webhookResult.error}` : "Configure webhook in Settings."}`,
      });
    }
  };


  const getStatusBadge = (status: Candidate["status"]) => {
    const styles = {
      Pending: "bg-slate-100 text-slate-700",
      Invited: "bg-green-500 text-white",
      Rejected: "bg-red-500 text-white",
      Review: "bg-amber-500 text-white",
    };
    return styles[status];
  };

  const getFitBadge = (category: Candidate["fitCategory"]) => {
    const styles = {
      Strong: "bg-green-100 text-green-800 border-green-300",
      Medium: "bg-amber-100 text-amber-800 border-amber-300",
      Low: "bg-red-100 text-red-800 border-red-300",
    };
    return styles[category];
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all screened candidates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.strong}</div>
                <div className="text-sm text-muted-foreground">Strong Fits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.medium}</div>
                <div className="text-sm text-muted-foreground">Medium Fits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Awaiting Action</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={fitFilter} onValueChange={setFitFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fit Category" />
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Invited">Invited</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Fit Score</TableHead>
                <TableHead className="text-center">Category</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Screened</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.role}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-semibold",
                        candidate.fitScore >= 90 && "text-green-600",
                        candidate.fitScore >= 41 && candidate.fitScore < 90 && "text-amber-600",
                        candidate.fitScore <= 40 && "text-red-600"
                      )}>
                        {candidate.fitScore}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getFitBadge(candidate.fitCategory)}>
                        {candidate.fitCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusBadge(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(candidate.screenedAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(candidate.status === "Pending" || candidate.status === "Review") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                              onClick={() => handleInvite(candidate)}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Invite
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleReject(candidate)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
