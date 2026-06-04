import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const { toast } = useToast();

  const handleUpdateNotifications = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Notification settings updated!" });
      setIsSaving(false);
    }, 1000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmNewPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
      });
      return;
    }
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Settings</h1>
          <p className="page__subtitle">
            Manage your application preferences and security.
          </p>
        </div>
      </div>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Control how you receive alerts and updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-toggle" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive updates about your courses and activities.
              </span>
            </Label>
            <Switch
              id="notifications-toggle"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>
          <Button onClick={handleUpdateNotifications} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password for security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={isSaving || !currentPassword || !newPassword || !confirmNewPassword}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
