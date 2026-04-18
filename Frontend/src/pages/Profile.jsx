import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Camera, User, Mail, Shield, BookOpen } from "lucide-react";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setCategoryData] = useState({
    name: user?.name || "",
    profileImage: user?.profileImage || "",
    bio: user?.bio || "",
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile information and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <Card className="md:col-span-1 border-none shadow-lg h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-primary/10">
                <AvatarImage src={formData.profileImage} />
                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                  {user?.name?.[0] || user?.username?.[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white w-8 h-8" />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{user?.name || user?.username}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-2 capitalize">
                {user?.role}
              </Badge>
            </div>

            <div className="w-full pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Verified Account</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal information and how others see you on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      disabled={!isEditing}
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setCategoryData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      disabled
                      className="pl-10 opacity-70"
                      value={user?.email || ""}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Image URL</Label>
                <Input
                  id="avatar"
                  disabled={!isEditing}
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.profileImage}
                  onChange={(e) => setCategoryData({ ...formData, profileImage: e.target.value })}
                />
              </div>

              {user?.role === "Instructor" && (
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <textarea
                    id="bio"
                    disabled={!isEditing}
                    className="w-full min-h-[120px] p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="Tell your students about your background and expertise..."
                    value={formData.bio}
                    onChange={(e) => setCategoryData({ ...formData, bio: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                {!isEditing ? (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setCategoryData({
                          name: user?.name || "",
                          profileImage: user?.profileImage || "",
                          bio: user?.bio || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
