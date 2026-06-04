import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Code,
  Play,
  Star,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const { login, startOAuthLogin, renderGmailButton } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    renderGmailButton({
      container: googleButtonRef.current,
      mode: "login",
      onSuccess: (userData) => {
        if (cancelled) return;
        toast({ title: "Welcome back!" });
        navigate(userData?.role === "Student" ? "/" : "/dashboard");
      },
      onError: (error) => {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Google login failed",
          description: error.message || "Please try again.",
        });
      },
    }).catch((error) => {
      if (cancelled) return;
      toast({
        variant: "destructive",
        title: "Google login failed",
        description: error.message || "Please check Google configuration.",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, renderGmailButton, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await login(email, password);

      if (!userData?.emailConfirmed) {
        toast({
          title: "Email not confirmed",
          description: "Please confirm your email address to continue.",
          variant: "warning",
        });
        navigate("/confirm-email", { state: { email } });
        return;
      }

      toast({ title: "Welcome back!" });
      if (userData?.role === "Administrator") {
        navigate("/dashboard");
      } else if (userData?.role === "Student") {
        navigate("/");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left visual panel */}
      <div className="auth-shell__visual">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: -120, left: -120,
            width: 360, height: 360, borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(255,255,255,.25), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute", bottom: -200, right: -120,
            width: 480, height: 480, borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(245,158,11,.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#fff", position: "relative" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em" }}>LearnHub</span>
        </Link>

        {/* Headline + glass card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
          <h1 style={{
            fontSize: "clamp(32px,3.8vw,42px)", fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.025em", margin: 0, color: "#fff", maxWidth: 420,
          }}>
            Welcome back, ready to{" "}
            <em style={{ fontStyle: "normal", color: "var(--amber-400)" }}>level up?</em>
          </h1>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,.85)", lineHeight: 1.6,
            maxWidth: 400, margin: 0,
          }}>
            Your courses, streaks, and certificates are exactly where you left them.
          </p>

          {/* Floating glass mock card */}
          <div
            className="glass-card"
            style={{
              maxWidth: 360,
              animation: "floaty 6s ease-in-out infinite",
              display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Code style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Today's Lesson</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>React Hooks Deep Dive</div>
                </div>
              </div>
              <Play style={{ width: 20, height: 20, color: "#fff" }} fill="currentColor" />
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.15)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: "var(--amber-400)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.7)" }}>
              <span>Lesson 9 of 14</span>
              <span>~14 min left</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
          <div style={{ display: "flex", gap: 2, color: "var(--amber-400)" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} style={{ width: 14, height: 14 }} fill="currentColor" />
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.95)", maxWidth: 420 }}>
            "Eight months from changing my major to a junior dev offer at a YC startup.
            LearnHub was the whole curriculum."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "9999px",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, color: "#fff", border: "2px solid rgba(255,255,255,0.3)",
            }}>SA</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Sara Ahmed</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>Junior Engineer @ Beta Acres</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-shell__form">
        <div className="auth-card">
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "hsl(var(--foreground))" }}>
              Sign in to LearnHub
            </h2>
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontSize: 15 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--teal-700)", fontWeight: 700, textDecoration: "none" }}>
                Create one free
              </Link>
            </p>
          </div>

          {/* Social buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <div ref={googleButtonRef} className="social-btn flex-1 justify-center overflow-hidden" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="social-btn social-btn--icon-only"
              aria-label="Continue with GitHub"
              onClick={() => startOAuthLogin("github")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </Button>
          </div>

          <div className="auth-divider">or sign in with email</div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <Mail className="auth-icon" />
                <Input
                  id="login-email"
                  className="auth-input pl-10"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="field__label" htmlFor="login-password">Password</label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-700)", textDecoration: "none" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrap">
                <Lock className="auth-icon" />
                <Input
                  id="login-password"
                  className="auth-input pl-10 pr-11"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="auth-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 18, height: 18 }} />
                    : <Eye style={{ width: 18, height: 18 }} />}
                </Button>
              </div>
            </div>

            <label className="auth-checkbox" style={{ marginTop: 4 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Keep me signed in for 30 days
            </label>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={isLoading}
              className="mt-1 h-[52px] w-full"
            >
              {isLoading ? "Signing in…" : (
                <>Sign In <ArrowRight style={{ width: 16, height: 16 }} /></>
              )}
            </Button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: 0, textAlign: "center" }}>
              Have a confirmation code?{" "}
              <Link to="/confirm-email" style={{ color: "var(--teal-700)", fontWeight: 600, textDecoration: "none" }}>
                Confirm Email
              </Link>
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
              By signing in you agree to LearnHub's{" "}
              <span style={{ color: "hsl(var(--muted-foreground))", textDecoration: "underline", cursor: "pointer" }}>Terms</span>
              {" "}and{" "}
              <span style={{ color: "hsl(var(--muted-foreground))", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
