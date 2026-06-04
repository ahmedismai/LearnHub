import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import accountService from "@/api/account";
import { useToast } from "@/components/ui/use-toast";

const IllustrationFrame = lazy(() =>
  import("@/components/illustrations/IllustrationFrame"),
);
const SecurePaymentIllustration = lazy(() =>
  import("@/components/illustrations/SecurePaymentIllustration"),
);

const ConfirmReset = () => {
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerify = useCallback(async (manualUserId, manualToken) => {
    const finalUserId = manualUserId || userId;
    const finalToken = manualToken || token;

    if (!finalUserId || !finalToken) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both User ID and Token.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await accountService.confirmResetPassword(finalUserId, finalToken);

      // On success, redirect to the new password page
      navigate(
        `/reset-password?userId=${finalUserId}&token=${encodeURIComponent(finalToken)}`,
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.response?.data?.message || "Invalid Token or User ID.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast, token, userId]);

  // Auto-verify if data exists in the URL
  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    const tokenFromUrl = searchParams.get("token");

    if (userIdFromUrl && tokenFromUrl) {
      handleVerify(userIdFromUrl, tokenFromUrl);
    }
  }, [handleVerify, searchParams]);

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
          <CardTitle className="text-center text-2xl font-bold">
            Verify Reset Request
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Enter the User ID and token from your email.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isLoading}
          />
          <Input
            placeholder="Verification Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isLoading}
          />
          <Button
            className="w-full"
            onClick={() => handleVerify()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ConfirmReset;
