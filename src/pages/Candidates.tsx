import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fetchCandidates, updateCandidateStatus, deleteCandidate, type Candidate } from "@/lib/candidates-db";
import { triggerInviteWebhook, triggerRejectWebhook } from "@/lib/webhook-store";
import { Search, Users, CheckCircle, XCircle, Clock, Mail, AlertTriangle, MessageSquare, TrendingUp, FileText, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ResumePreviewDialog } from "@/components/ResumePreviewDialog";

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fitFilter, setFitFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [actionType, setActionType] = useState<"invite" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const { toast } = useToast();

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      const data = await fetchCandidates();
      setCandidates(data);
    } catch (error) {
      console.error("Error loading candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.role.toLowerCase().includes(search.toLowerCase());
    const matchesFit = fitFilter === "all" || c.fitCategory === fitFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesFit && matchesStatus;
  });

  // Auto-calculated stats from actual candidate data
  const stats = {
    total: candidates.length,
    strong: candidates.filter((c) => c.fitCategory === "Strong").length,
    medium: candidates.filter((c) => c.fitCategory === "Medium").length,
    low: candidates.filter((c) => c.fitCategory === "Low").length,
    pending: candidates.filter((c) => c.status === "Pending" || c.status === "Review").length,
    invited: candidates.filter((c) => c.status === "Invited").length,
    rejected: candidates.filter((c) => c.status === "Rejected").length,
    duplicates: candidates.filter((c) => c.isDuplicate).length,
  };

  const openCommentDialog = (candidate: Candidate, type: "invite" | "reject") => {
    setSelectedCandidate(candidate);
    setActionType(type);
    setComment("");
    setCommentDialogOpen(true);
  };

  const openResumePreview = (candidate: Candidate) => {
    setPreviewCandidate(candidate);
    setPreviewOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedCandidate || !actionType) return;
    
    setIsProcessing(true);
    
    try {
      const webhookData = {
        name: selectedCandidate.name,
        email: selectedCandidate.email,
        role: selectedCandidate.role,
        fitScore: selectedCandidate.fitScore,
      };

      if (actionType === "invite") {
        const webhookResult = await triggerInviteWebhook(webhookData);
        await updateCandidateStatus(selectedCandidate.id, "Invited", comment);
        
        toast({
          title: "Interview Invite Sent",
          description: webhookResult.success 
            ? `${selectedCandidate.name} has been invited. Email workflow triggered.`
            : `${selectedCandidate.name} marked as invited.`,
        });
      } else {
        const webhookResult = await triggerRejectWebhook(webhookData);
        await updateCandidateStatus(selectedCandidate.id, "Rejected", comment);
        
        toast({
          title: "Candidate Rejected",
          description: webhookResult.success 
            ? `${selectedCandidate.name} has been rejected. Email workflow triggered.`
            : `${selectedCandidate.name} marked as rejected.`,
        });
      }
      
      await loadCandidates();
      setCommentDialogOpen(false);
    } catch (error) {
      console.error("Error processing action:", error);
      toast({
        title: "Error",
        description: "Failed to process action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDeleteDialog = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;
    
    setIsProcessing(true);
    
    try {
      await deleteCandidate(candidateToDelete.id);
      
      toast({
        title: "Candidate Deleted",
        description: `${candidateToDelete.name} has been removed from the database.`,
      });
      
      await loadCandidates();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({
        title: "Error",
        description: "Failed to delete candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all screened candidates ({stats.total} total)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.strong}</div>
                <div className="text-sm text-muted-foreground">Strong Fits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.medium}</div>
                <div className="text-sm text-muted-foreground">Medium Fits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Awaiting Action</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.invited}</div>
                <div className="text-sm text-muted-foreground">Invited</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Warning */}
      {stats.duplicates > 0 && (
        <Card className="shadow-sm mb-6 border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                <strong>{stats.duplicates} duplicate candidate(s)</strong> detected. These are marked with a warning icon.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <TableHead className="text-center">Screening Preview</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className={cn(candidate.isDuplicate && "bg-amber-50/50")}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {candidate.isDuplicate && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{candidate.name}</div>
                          <div className="text-sm text-muted-foreground">{candidate.email}</div>
                          {candidate.isDuplicate && (
                            <div className="text-xs text-amber-600 mt-1">{candidate.duplicateInfo}</div>
                          )}
                          {candidate.actionComment && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {candidate.actionComment}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{candidate.role}</TableCell>
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
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResumePreview(candidate)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Preview Resume"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {(candidate.status === "Pending" || candidate.status === "Review") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                              onClick={() => openCommentDialog(candidate, "invite")}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Invite
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => openCommentDialog(candidate, "reject")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(candidate)}
                          title="Delete candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "invite" ? "Invite Candidate" : "Reject Candidate"}
            </DialogTitle>
            <DialogDescription>
              {selectedCandidate && (
                <>
                  You are about to {actionType === "invite" ? "invite" : "reject"}{" "}
                  <strong>{selectedCandidate.name}</strong> for{" "}
                  <strong>{selectedCandidate.role}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">Add a comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Why are you taking this action? This helps track decisions..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={cn(
                actionType === "invite" && "bg-primary hover:bg-primary/90",
                actionType === "reject" && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isProcessing ? "Processing..." : actionType === "invite" ? "Send Invite" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Preview Dialog */}
      <ResumePreviewDialog
        candidate={previewCandidate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Candidate</DialogTitle>
            <DialogDescription>
              {candidateToDelete && (
                <>
                  Are you sure you want to delete <strong>{candidateToDelete.name}</strong>?
                  This action cannot be undone and will permanently remove all their data.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
