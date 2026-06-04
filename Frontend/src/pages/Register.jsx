import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Briefcase,
  Star,
  ArrowRight,
  Code,
  Brain,
  Database,
  Palette,
  Smartphone,
  Layers,
  Play,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

function passwordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return Math.min(score, 4);
}

const INTERESTS = [
  { id: "web-dev", label: "Web Dev", icon: Code },
  { id: "ai", label: "AI & ML", icon: Brain },
  { id: "data", label: "Data Science", icon: Database },
  { id: "design", label: "Design", icon: Palette },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "devops", label: "DevOps", icon: Layers },
];

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("student");
  const [interests, setInterests] = useState(["web-dev"]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const googleButtonRef = useRef(null);
  const { register, startOAuthLogin, renderGmailButton } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    renderGmailButton({
      container: googleButtonRef.current,
      mode: "signup",
      role,
      onSuccess: () => {
        if (cancelled) return;
        toast({ title: "Account created", description: "Welcome to LearnHub." });
        navigate(role === "student" ? "/" : "/dashboard");
      },
      onError: (error) => {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Google sign-up failed",
          description: error.message || "Please try again.",
        });
      },
    }).catch((error) => {
      if (cancelled) return;
      toast({
        variant: "destructive",
        title: "Google sign-up failed",
        description: error.message || "Please check Google configuration.",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, renderGmailButton, role, toast]);

  const toggleInterest = (id) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const strength = passwordStrength(password);
  const strengthLabel = ["", "Weak", "Weak", "Okay", "Strong"][strength] || "Strong";
  const strengthClass = strength <= 2 ? "on--weak" : strength === 3 ? "on--ok" : "on--strong";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setTermsError(true);
      return toast({
        variant: "destructive",
        title: "Terms required",
        description: "Please accept the Terms to continue.",
      });
    }
    setTermsError(false);

    if (password !== confirmPassword) {
      return toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Passwords do not match",
      });
    }

    setIsLoading(true);
    try {
      await register(
        fullName,
        email,
        password,
        confirmPassword,
        role === "instructor" ? "Instructor" : "Student",
      );

      toast({
        title: "Registration successful!",
        description: "Please check your email to confirm your account.",
      });

      navigate("/confirm-email", { state: { email } });
    } catch (error) {
      console.error("Registration Error:", error.response?.data);

      let errorMsg = "Something went wrong";
      if (typeof error.response?.data === "object") {
        const errors = error.response.data;
        errorMsg = Object.values(errors).flat().join(". ");
      } else if (typeof error.response?.data === "string") {
        errorMsg = error.response.data;
      }

      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left visual panel */}
      <div className="auth-shell__visual">
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
            Where curious students{" "}
            <em style={{ fontStyle: "normal", color: "var(--amber-400)" }}>become builders.</em>
          </h1>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,.85)", lineHeight: 1.6,
            maxWidth: 400, margin: 0,
          }}>
            Join 50,000+ university CS students learning from working engineers,
            designers, and researchers.
          </p>

          {/* Glass mock card */}
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
                  <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Your dashboard awaits</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>500+ courses ready to start</div>
                </div>
              </div>
              <Play style={{ width: 20, height: 20, color: "#fff" }} fill="currentColor" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["React", "Python", "AWS"].map((t) => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px",
                  background: "rgba(255,255,255,.15)", borderRadius: 9999,
                  color: "#fff",
                }}>{t}</span>
              ))}
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
            "I went from zero to landing a junior dev offer in 8 months.
            LearnHub's React track was my whole curriculum."
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
              Create your free account
            </h2>
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontSize: 15 }}>
              Already have one?{" "}
              <Link to="/login" style={{ color: "var(--teal-700)", fontWeight: 700, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Role tabs */}
          <div className="role-tabs">
            <Button
              type="button"
              variant={role === "student" ? "default" : "outline"}
              className={`role-tabs__btn ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
            >
              <User style={{ width: 16, height: 16 }} /> I'm a Student
            </Button>
            <Button
              type="button"
              variant={role === "instructor" ? "default" : "outline"}
              className={`role-tabs__btn ${role === "instructor" ? "active" : ""}`}
              onClick={() => setRole("instructor")}
            >
              <Briefcase style={{ width: 16, height: 16 }} /> I'm an Instructor
            </Button>
          </div>

          {/* Social */}
          <div style={{ display: "flex", gap: 8 }}>
            <div ref={googleButtonRef} className="social-btn flex-1 justify-center overflow-hidden" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="social-btn social-btn--icon-only"
              aria-label="Sign up with GitHub"
              onClick={() => startOAuthLogin("github", role)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </Button>
          </div>

          <div className="auth-divider">or with email</div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }} noValidate>
            {/* Full name */}
            <div className="field">
              <label className="field__label" htmlFor="reg-name">Full name</label>
              <div className="auth-input-wrap">
                <User className="auth-icon" />
                <Input
                  id="reg-name"
                  className="auth-input pl-10"
                  type="text"
                  placeholder="Sara Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="field">
              <label className="field__label" htmlFor="reg-email">
                {role === "student" ? "University email" : "Work email"}
              </label>
              <div className="auth-input-wrap">
                <Mail className="auth-icon" />
                <Input
                  id="reg-email"
                  className="auth-input pl-10"
                  type="email"
                  placeholder={role === "student" ? "you@cu.edu.eg" : "you@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              {role === "student" && (
                <span className="field__hint">
                  Use your <strong>.edu</strong> address to unlock 50% off Pro automatically.
                </span>
              )}
            </div>

            {/* Password */}
            <div className="field">
              <label className="field__label" htmlFor="reg-password">Password</label>
              <div className="auth-input-wrap">
                <Lock className="auth-icon" />
                <Input
                  id="reg-password"
                  className="auth-input pl-10 pr-11"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              {password && (
                <>
                  <div className="password-meter">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`password-meter__bar ${i < strength ? strengthClass : ""}`}
                      />
                    ))}
                  </div>
                  <span className="field__hint" style={{ marginTop: 6 }}>
                    Strength:{" "}
                    <strong style={{ color: strength <= 2 ? "hsl(var(--destructive))" : strength === 3 ? "var(--amber-600)" : "hsl(var(--success))" }}>
                      {strengthLabel}
                    </strong>
                    {" "}· Mix upper/lowercase, numbers, symbols.
                  </span>
                </>
              )}
            </div>

            {/* Confirm password */}
            <div className="field">
              <label className="field__label" htmlFor="reg-confirm">Confirm password</label>
              <div className="auth-input-wrap">
                <Lock className="auth-icon" />
                <Input
                  id="reg-confirm"
                  className="auth-input pl-10 pr-11"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="auth-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm
                    ? <EyeOff style={{ width: 18, height: 18 }} />
                    : <Eye style={{ width: 18, height: 18 }} />}
                </Button>
              </div>
            </div>

            {/* Interests (student only) */}
            {role === "student" && (
              <div className="field">
                <label className="field__label">What are you interested in?</label>
                <div className="interests-chips">
                  {INTERESTS.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant={interests.includes(item.id) ? "default" : "outline"}
                      size="sm"
                      className={`interest-chip ${interests.includes(item.id) ? "active" : ""}`}
                      onClick={() => toggleInterest(item.id)}
                    >
                      <item.icon style={{ width: 14, height: 14 }} />
                      {item.label}
                    </Button>
                  ))}
                </div>
                <span className="field__hint">Pick a few — we'll personalize your dashboard.</span>
              </div>
            )}

            {/* Instructor bio */}
            {role === "instructor" && (
              <div className="field">
                <label className="field__label" htmlFor="reg-bio">Briefly, what do you teach?</label>
                <Textarea
                  id="reg-bio"
                  className="auth-input"
                  placeholder="e.g. 'Senior React engineer with 8 years — I teach production patterns.'"
                  rows="3"
                  style={{ height: "auto", minHeight: 88, padding: 12, resize: "vertical", lineHeight: 1.5, paddingLeft: 14 }}
                />
                <span className="field__hint">We'll review your application within 2 business days.</span>
              </div>
            )}

            {/* Terms */}
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => { setTermsAccepted(e.target.checked); setTermsError(false); }}
              />
              <span>
                I agree to LearnHub's{" "}
                <span style={{ color: "var(--teal-700)", fontWeight: 600, cursor: "pointer" }}>Terms</span>
                {" "}and{" "}
                <span style={{ color: "var(--teal-700)", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>.
              </span>
            </label>
            {termsError && (
              <span className="field__error" style={{ marginTop: -8 }}>
                Please accept the Terms to continue.
              </span>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={isLoading}
              className="mt-1 h-[52px] w-full"
            >
              {isLoading ? "Creating account…" : (
                <>
                  {role === "student" ? "Create my account" : "Apply to teach"}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </Button>
          </form>

          <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: 0, textAlign: "center" }}>
            Have a confirmation code?{" "}
            <Link to="/confirm-email" style={{ color: "var(--teal-700)", fontWeight: 600, textDecoration: "none" }}>
              Confirm Email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
