import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActionItems, updateCandidateStatus, getCandidates, type ActionItem } from "@/lib/mock-api";
import { triggerInviteWebhook, triggerRejectWebhook } from "@/lib/webhook-store";
import { AlertCircle, Clock, Copy, UserX, CheckCircle, Mail, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ActionItems() {
  const [actionItems, setActionItems] = useState<ActionItem[]>(getActionItems());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshActionItems = () => {
    setActionItems(getActionItems());
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

  const handleInvite = async (item: ActionItem) => {
    setProcessingId(item.id);
    
    const candidateData = {
      name: item.candidateName,
      email: item.email || "",
      role: item.role,
      fitScore: item.fitScore || 0,
    };

    const webhookResult = await triggerInviteWebhook(candidateData);
    
    updateCandidateStatus(item.candidateId, "Invited");
    refreshActionItems();
    setProcessingId(null);
    
    if (webhookResult.success) {
      toast({
        title: "Interview Invite Sent",
        description: `${item.candidateName} has been invited. Webhook triggered successfully.`,
      });
    } else {
      toast({
        title: "Interview Invite Sent",
        description: `${item.candidateName} marked as invited. ${webhookResult.error ? `Webhook: ${webhookResult.error}` : "Configure webhook in Settings."}`,
      });
    }
  };

  const handleReject = async (item: ActionItem) => {
    setProcessingId(item.id);
    
    const candidateData = {
      name: item.candidateName,
      email: item.email || "",
      role: item.role,
      fitScore: item.fitScore || 0,
    };

    const webhookResult = await triggerRejectWebhook(candidateData);
    
    updateCandidateStatus(item.candidateId, "Rejected");
    refreshActionItems();
    setProcessingId(null);
    
    if (webhookResult.success) {
      toast({
        title: "Candidate Rejected",
        description: `${item.candidateName} has been rejected. Webhook triggered successfully.`,
      });
    } else {
      toast({
        title: "Candidate Rejected",
        description: `${item.candidateName} marked as rejected. ${webhookResult.error ? `Webhook: ${webhookResult.error}` : "Configure webhook in Settings."}`,
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Action Items</h1>
        <p className="text-muted-foreground mt-1">
          Candidates with scores between 41-89% requiring your review
        </p>
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
        <div className="space-y-4">
          {actionItems.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      item.priority === "high" && "bg-destructive/10 text-destructive",
                      item.priority === "medium" && "bg-warning/10 text-warning",
                      item.priority === "low" && "bg-secondary text-muted-foreground"
                    )}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{item.candidateName}</span>
                        {item.fitScore && (
                          <Badge variant="outline" className={cn(
                            item.fitScore >= 70 && "border-accent text-accent",
                            item.fitScore >= 50 && item.fitScore < 70 && "border-warning text-warning",
                            item.fitScore < 50 && "border-destructive text-destructive"
                          )}>
                            {item.fitScore}% fit
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{item.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{item.role}</span>
                        {item.email && (
                          <>
                            <span>•</span>
                            <span>{item.email}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{getTypeLabel(item.type)}</span>
                        <span>•</span>
                        <span>{format(item.createdAt, "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      className="bg-accent hover:bg-accent/90"
                      onClick={() => handleInvite(item)}
                      disabled={processingId === item.id}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Invite
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(item)}
                      disabled={processingId === item.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
