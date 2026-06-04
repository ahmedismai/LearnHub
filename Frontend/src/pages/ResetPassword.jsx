import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import accountService from "@/api/account";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

const IllustrationFrame = lazy(() =>
  import("@/components/illustrations/IllustrationFrame"),
);
const SecurePaymentIllustration = lazy(() =>
  import("@/components/illustrations/SecurePaymentIllustration"),
);

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(true); // 👈 لحماية الـ Initial Verification Flow
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token || !userId) {
        toast({
          variant: "destructive",
          title: "Invalid Link",
          description:
            "The password reset link is missing required parameters.",
        });
        navigate("/login");
        return;
      }

      try {
        await accountService.confirmResetPassword(userId, token);
        if (isMounted) setIsVerifying(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid or Expired Link",
          description:
            error.response?.data?.message ||
            "This password reset link is no longer valid.",
        });
        navigate("/login");
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, userId, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Passwords do not match.",
      });
    }

    if (newPassword.length < 6) {
      return toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
      });
    }

    setIsLoading(true);
    try {
      await accountService.newPassword({
        userId,
        token,
        newPassword,
        confirmPassword,
      });

      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description:
          error.response?.data?.message ||
          "Could not reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell-bg flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
        <Suspense fallback={null}>
          <IllustrationFrame className="animate-fade-in">
            <SecurePaymentIllustration />
          </IllustrationFrame>
        </Suspense>
      <Card className="w-full animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Set New Password
          </CardTitle>
          <p className="text-muted-foreground text-center text-sm">
            {isVerifying
              ? "Verifying secure token..."
              : "Enter your new secure password below."}
          </p>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            // 🔄 شاشة الانتظار اللطيفة أثناء الـ Check عشان نمنع الـ Glitches
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Securing session...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            asChild
            className="w-full"
            disabled={isLoading || isVerifying}
          >
            <Link to="/login" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
