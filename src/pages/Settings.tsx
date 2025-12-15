import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Database, Webhook, Mail, XCircle } from "lucide-react";
import { 
  getInviteWebhookUrl, 
  setInviteWebhookUrl, 
  getRejectWebhookUrl, 
  setRejectWebhookUrl 
} from "@/lib/webhook-store";

export default function Settings() {
  const [autoInviteStrong, setAutoInviteStrong] = useState(true);
  const [autoRejectLow, setAutoRejectLow] = useState(true);
  const [maxInvitesPerWeek, setMaxInvitesPerWeek] = useState("50");
  const [timezone, setTimezone] = useState("America/New_York");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dataRetention, setDataRetention] = useState("90");
  const [inviteWebhook, setInviteWebhook] = useState(getInviteWebhookUrl());
  const [rejectWebhook, setRejectWebhook] = useState(getRejectWebhookUrl());
  const { toast } = useToast();

  const handleSave = () => {
    setInviteWebhookUrl(inviteWebhook);
    setRejectWebhookUrl(rejectWebhook);
    
    toast({
      title: "Settings Saved",
      description: "Your preferences and webhook URLs have been updated.",
    });
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your screening preferences and webhook integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* Webhook Configuration */}
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Configure webhook URLs for automated invite and rejection emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                Invite Webhook URL
              </Label>
              <Input
                placeholder="https://your-webhook-url.com/invite"
                value={inviteWebhook}
                onChange={(e) => setInviteWebhook(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This webhook is triggered when a candidate is invited (score ≥ 90% auto-invite, or manual invite)
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Reject Webhook URL
              </Label>
              <Input
                placeholder="https://your-webhook-url.com/reject"
                value={rejectWebhook}
                onChange={(e) => setRejectWebhook(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This webhook is triggered when a candidate is rejected (score ≤ 40% auto-reject, or manual reject)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Screening Automation */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Screening Automation
            </CardTitle>
            <CardDescription>
              Configure how candidates are automatically processed based on fit score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-invite high scorers (≥90%)</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send interview invites and trigger webhook for candidates with 90%+ fit
                </p>
              </div>
              <Switch checked={autoInviteStrong} onCheckedChange={setAutoInviteStrong} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-reject low scorers (≤40%)</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically reject and trigger webhook for candidates with 40% or lower fit
                </p>
              </div>
              <Switch checked={autoRejectLow} onCheckedChange={setAutoRejectLow} />
            </div>
            <Separator />
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Score 41-89%:</strong> Candidates in this range are added to Action Items for manual review.
                You can invite or reject them from the Action Items page.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max invites per week</Label>
                <Input
                  type="number"
                  value={maxInvitesPerWeek}
                  onChange={(e) => setMaxInvitesPerWeek(e.target.value)}
                  min="1"
                  max="500"
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive updates and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for new action items and candidate updates
                </p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Configure data retention and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Data retention period</Label>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Candidate data older than this period will be automatically archived
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
