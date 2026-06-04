import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import accountService from "@/api/account";

const IllustrationFrame = lazy(() =>
  import("@/components/illustrations/IllustrationFrame"),
);
const LearningIllustration = lazy(() =>
  import("@/components/illustrations/LearningIllustration"),
);

const ConfirmEmail = () => {
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // ================= RESEND EMAIL =================
  const handleResend = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email first",
      });
      return;
    }

    setIsResending(true);

    try {
      await accountService.resendConfirmEmail(email);

      toast({
        title: "Email sent 📩",
        description: "Check your inbox for confirmation link",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend email",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="page-shell-bg flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
        <Suspense fallback={null}>
          <IllustrationFrame className="animate-fade-in">
            <LearningIllustration />
          </IllustrationFrame>
        </Suspense>
      <Card className="w-full animate-scale-in shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Confirm Your Email
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* MESSAGE */}
          <p className="text-center text-muted-foreground">
            Please check your email to confirm your account.
          </p>

          {/* EMAIL INPUT (for resend) */}
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* RESEND BUTTON */}
          <Button
            className="w-full"
            variant="outline"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend Email"}
          </Button>

          {/* GO TO LOGIN */}
          <Button className="w-full" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ConfirmEmail;
