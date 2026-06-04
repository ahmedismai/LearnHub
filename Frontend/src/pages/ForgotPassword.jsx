import { lazy, Suspense, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Loader2, Mail, ArrowLeft, ArrowRight } from "lucide-react";

const IllustrationFrame = lazy(() =>
  import("@/components/illustrations/IllustrationFrame"),
);
const LearningIllustration = lazy(() =>
  import("@/components/illustrations/LearningIllustration"),
);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await accountService.resetPassword(email);

      // إشعار نجاح العملية
      toast({
        title: "Check your email",
        description:
          "We've sent the instructions to your email. Once you have the User ID and Token, proceed to verification.",
      });

      // توجيه المستخدم مباشرة لصفحة إدخال البيانات يدوياً
      navigate("/confirm-reset");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error.response?.data?.message || "Something went wrong.",
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
            <LearningIllustration />
          </IllustrationFrame>
        </Suspense>
      <Card className="w-full animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Reset Password
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Enter your email and we will send reset instructions.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Reset Link
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/confirm-reset">
              Already have your Token? Enter it here{" "}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/login">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
