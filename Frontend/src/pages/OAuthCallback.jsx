import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const { toast } = useToast();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) return;

    try {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const user = searchParams.get("user");

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Missing OAuth login data");
      }

      const userData = completeOAuthLogin({ accessToken, refreshToken, user });
      toast({ title: "Signed in successfully" });
      navigate(userData?.role === "Student" ? "/" : "/dashboard", {
        replace: true,
      });
    } catch (callbackError) {
      console.error("OAuth callback failed:", callbackError);
      navigate(
        `/login?error=${encodeURIComponent(
          callbackError.message || "OAuth login failed",
        )}`,
        { replace: true },
      );
    }
  }, [completeOAuthLogin, error, navigate, searchParams, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="surface-glass max-w-md p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h1 className="mb-2 text-xl font-bold">Sign-in failed</h1>
          <p className="mb-5 text-sm text-muted-foreground">{error}</p>
          <Button asChild>
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default OAuthCallback;
