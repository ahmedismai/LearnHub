import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/api/axios";
import { useAuth } from "@/contexts/AuthContext";

const ConfirmEmail = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const token = searchParams.get("token");
    const queryEmail = searchParams.get("email");
    const stateEmail = location.state?.email;
    if (token) {
      setCode(token);
    }
    if (queryEmail) {
      setEmail(queryEmail);
    } else if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    const token = searchParams.get("token");
    const queryEmail = searchParams.get("email");
    if (token && queryEmail && email && code) {
      handleConfirm();
    } else if (token && !queryEmail) {
      handleConfirmTokenOnly(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, email, code]);

  async function handleConfirm(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!email || !code) {
      return toast({
        variant: "destructive",
        title: "يرجى إدخال البريد والكود",
      });
    }
    setIsLoading(true);
    try {
      const response = await api.post("/Account/ConfirmEmailCode", {
        email,
        token: code,
      });
      const { accessToken, refreshToken, user: userData } = response.data;

      // Store tokens and user data
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({ title: "تم تأكيد البريد بنجاح" });

      // Redirect based on role
      if (userData?.role === "Administrator") {
        navigate("/dashboard");
      } else if (userData?.role === "Student") {
        navigate("/");
      } else {
        navigate("/dashboard"); // Default for Instructor
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فشل التأكيد",
        description:
          error.response?.data?.message || "حدث خطأ أثناء التحقق من الكود",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmTokenOnly(tokenOnly) {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/Account/ConfirmEmail?token=${tokenOnly}`,
      );
      const { accessToken, refreshToken, user: userData } = response.data;

      // Store tokens and user data
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({ title: "تم تأكيد البريد بنجاح" });

      // Redirect based on role
      if (userData?.role === "Administrator") {
        navigate("/dashboard");
      } else if (userData?.role === "Student") {
        navigate("/");
      } else {
        navigate("/dashboard"); // Default for Instructor
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فشل التأكيد",
        description:
          error.response?.data?.message || "حدث خطأ أثناء التحقق من الكود",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleResend = async () => {
    if (!email) {
      return toast({
        variant: "destructive",
        title: "يرجى إدخال البريد لإعادة الإرسال",
      });
    }
    setIsResending(true);
    try {
      await api.post("/Account/ResendConfirmEmail", { email });
      toast({ title: "تم إرسال الكود مرة أخرى إلى بريدك" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فشل إرسال الكود",
        description:
          error.response?.data?.message || "لم نتمكن من إرسال الكود الآن",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            تأكيد البريد الإلكتروني
          </CardTitle>
          <p className="text-muted-foreground text-center">
            أدخل بريدك الإلكترونى والكود الذى وصلك على الجيميل.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="كود التفعيل"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري التأكيد..." : "تأكيد البريد"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">لم يصل الكود؟</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "جاري الإرسال..." : "إعادة إرسال الكود"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
