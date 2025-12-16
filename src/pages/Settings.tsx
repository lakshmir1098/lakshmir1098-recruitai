import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Database, Palette, Sun, Moon, Monitor } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/settings-store";
import { useTheme } from "next-themes";
import { lightThemes, darkThemes, getThemeConfig, saveThemeConfig } from "@/lib/theme-store";

export default function Settings() {
  const [autoInviteStrong, setAutoInviteStrong] = useState(true);
  const [autoRejectLow, setAutoRejectLow] = useState(true);
  const [maxInvitesPerWeek, setMaxInvitesPerWeek] = useState("50");
  const [timezone, setTimezone] = useState("America/New_York");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dataRetention, setDataRetention] = useState("90");
  const [selectedLightTheme, setSelectedLightTheme] = useState("default");
  const [selectedDarkTheme, setSelectedDarkTheme] = useState("default");
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Load settings on mount
  useEffect(() => {
    const settings = getSettings();
    setAutoInviteStrong(settings.autoInviteEnabled);
    setAutoRejectLow(settings.autoRejectEnabled);
    
    const themeConfig = getThemeConfig();
    setSelectedLightTheme(themeConfig.lightTheme);
    setSelectedDarkTheme(themeConfig.darkTheme);
  }, []);

  // Save automation settings immediately on toggle
  const handleAutoInviteChange = (checked: boolean) => {
    setAutoInviteStrong(checked);
    saveSettings({ autoInviteEnabled: checked });
    toast({
      title: checked ? "Auto-Invite Enabled" : "Auto-Invite Disabled",
      description: checked 
        ? "Candidates with 90%+ score will be auto-invited." 
        : "High-scoring candidates will require manual review.",
    });
  };

  const handleAutoRejectChange = (checked: boolean) => {
    setAutoRejectLow(checked);
    saveSettings({ autoRejectEnabled: checked });
    toast({
      title: checked ? "Auto-Reject Enabled" : "Auto-Reject Disabled",
      description: checked 
        ? "Candidates with ≤40% score will be auto-rejected." 
        : "Low-scoring candidates will require manual review.",
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    saveThemeConfig({ mode: newTheme as "light" | "dark" | "system" });
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme === "system" ? "system" : newTheme} mode.`,
    });
  };

  const handleLightThemeChange = (themeId: string) => {
    setSelectedLightTheme(themeId);
    saveThemeConfig({ lightTheme: themeId });
    toast({
      title: "Light Theme Updated",
      description: `Light theme set to ${lightThemes.find(t => t.id === themeId)?.name}.`,
    });
  };

  const handleDarkThemeChange = (themeId: string) => {
    setSelectedDarkTheme(themeId);
    saveThemeConfig({ darkTheme: themeId });
    toast({
      title: "Dark Theme Updated",
      description: `Dark theme set to ${darkThemes.find(t => t.id === themeId)?.name}.`,
    });
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your screening preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("light")}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("system")}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Light Theme</Label>
                <Select value={selectedLightTheme} onValueChange={handleLightThemeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lightThemes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: `hsl(${t.primary})` }}
                          />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dark Theme</Label>
                <Select value={selectedDarkTheme} onValueChange={handleDarkThemeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {darkThemes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: `hsl(${t.primary})` }}
                          />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  Automatically send interview invites and trigger email workflow for candidates with 90%+ fit
                </p>
              </div>
              <Switch checked={autoInviteStrong} onCheckedChange={handleAutoInviteChange} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-reject low scorers (≤40%)</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically reject and trigger email workflow for candidates with 40% or lower fit
                </p>
              </div>
              <Switch checked={autoRejectLow} onCheckedChange={handleAutoRejectChange} />
            </div>
            <Separator />
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Score 41-89%:</strong> Candidates in this range are added to Candidates for manual review.
                You can invite or reject them from the Candidates page.
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
