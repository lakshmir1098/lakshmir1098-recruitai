import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getActionItems, updateCandidateStatus, getCandidates, sendInterviewInvite, sendRejectionEmail, type ActionItem } from "@/lib/mock-api";
import { AlertCircle, Clock, Copy, UserX, CheckCircle, Mail, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ActionItems() {
  const [actionItems, setActionItems] = useState<ActionItem[]>(getActionItems());
  const { toast } = useToast();

  // Calculate summary stats
  const stats = {
    open: actionItems.length,
    highPriority: actionItems.filter(item => item.priority === "high").length,
    needReview: actionItems.filter(item => item.type === "review").length,
    awaitingReply: actionItems.filter(item => item.type === "response").length,
  };

  const getTypeIcon = (type: ActionItem["type"]) => {
    switch (type) {
      case "review":
        return <AlertCircle className="h-5 w-5" />;
      case "response":
        return <Clock className="h-5 w-5" />;
      case "duplicate":
        return <Copy className="h-5 w-5" />;
      case "invite_failed":
        return <UserX className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: ActionItem["type"]) => {
    switch (type) {
      case "review":
        return "Needs Review";
      case "response":
        return "Awaiting Response";
      case "duplicate":
        return "Potential Duplicate";
      case "invite_failed":
        return "Invite Failed";
    }
  };

  const getPriorityColor = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-secondary text-secondary-foreground";
    }
  };

  // Determine which buttons to show based on message content
  const getRecommendedAction = (message: string): "Interview" | "Reject" | "Review" => {
    if (message.includes("AI recommends Interview")) return "Interview";
    if (message.includes("AI recommends Reject")) return "Reject";
    return "Review";
  };

  const handleResolve = async (item: ActionItem, action: "invite" | "reject") => {
    try {
      const candidates = getCandidates();
      const candidate = candidates.find(c => c.id === item.candidateId);
      
      if (action === "invite") {
        await sendInterviewInvite(
          item.candidateId,
          candidate?.email,
          item.candidateName,
          item.role
        );
        updateCandidateStatus(item.candidateId, "Invited");
        toast({
          title: "Interview Invite Sent",
          description: `${item.candidateName} has been notified via email.`,
        });
      } else {
        await sendRejectionEmail(
          item.candidateId,
          candidate?.email,
          item.candidateName,
          item.role
        );
        updateCandidateStatus(item.candidateId, "Rejected");
        toast({
          title: "Rejection Email Sent",
          description: `${item.candidateName} has been notified.`,
          variant: "destructive",
        });
      }
      
      setActionItems(getActionItems());
    } catch (error) {
      console.error("Action error:", error);
      toast({
        title: "Error",
        description: `Failed to ${action === "invite" ? "send invite" : "send rejection email"}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          Action Items
        </h1>
        <p className="text-muted-foreground mt-1">
          Items that require your attention or action
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.open}</div>
            <div className="text-sm text-muted-foreground mt-1">Open Items</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.highPriority}</div>
            <div className="text-sm text-muted-foreground mt-1">High Priority</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.needReview}</div>
            <div className="text-sm text-muted-foreground mt-1">Need Review</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.awaitingReply}</div>
            <div className="text-sm text-muted-foreground mt-1">Awaiting Reply</div>
          </CardContent>
        </Card>
      </div>

      {actionItems.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No pending action items. Screen more candidates to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.candidateName}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span>{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-md">
                      {item.message}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(item.createdAt, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(() => {
                          const recommendedAction = getRecommendedAction(item.message);
                          // Show Invite button if AI recommends Interview or Review
                          const showInvite = recommendedAction === "Interview" || recommendedAction === "Review";
                          // Show Reject button if AI recommends Reject or Review
                          const showReject = recommendedAction === "Reject" || recommendedAction === "Review";
                          
                          return (
                            <>
                              {showInvite && (
                                <Button
                                  size="sm"
                                  className="bg-accent hover:bg-accent/90"
                                  onClick={() => handleResolve(item, "invite")}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Invite
                                </Button>
                              )}
                              {showReject && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolve(item, "reject")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
