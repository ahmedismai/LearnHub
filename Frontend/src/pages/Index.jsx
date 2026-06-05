import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Play,
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Brain,
  Database,
  Palette,
  Smartphone,
  Layers,
  Code,
  TrendingUp,
  Lightbulb,
  Zap,
  Trophy,
  Send,
  Check,
  Plus,
  Download,
  Github,
  Globe,
  MessageCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getFullUrl } from "@/lib/urlHelper";
import { normalizeCourse } from "@/api/adapters";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ===================== SMALL REUSABLE PIECES ===================== */

function DesignAvatar({ initials, color = "teal", size = 28, className }) {
  const bg =
    {
      amber: "bg-amber-500",
      violet: "bg-violet-500",
      slate: "bg-slate-700",
      teal: "bg-teal-700",
    }[color] || "bg-teal-700";

  const sizeClass =
    {
      24: "w-6 h-6",
      28: "w-7 h-7",
      36: "w-9 h-9",
      64: "w-16 h-16",
    }[size] || "w-7 h-7";

  const fontClass =
    {
      24: "text-[9px]",
      28: "text-[11px]",
      36: "text-[14px]",
      64: "text-[24px]",
    }[size] || "text-[11px]";

  return (
    <Avatar
      className={cn(
        "border-2 border-white flex-shrink-0",
        sizeClass,
        className,
      )}
    >
      <AvatarFallback className={cn("text-white font-bold", bg, fontClass)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

const formatMetric = (value) => {
  const number = Number(value || 0);
  if (number >= 1000) return `${Math.round(number / 100) / 10}K+`;
  return String(number);
};

const getInitials = (name = "User") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const detectedIos =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !standalone;
    setIsIos(detectedIos);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setShowInstallHelp(false);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstallHelp((current) => !current);
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === "accepted") {
      setInstallPrompt(null);
      setShowInstallHelp(false);
    }
  };

  if (isInstalled) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="xl"
        className="bg-white/70 backdrop-blur-md border-primary/20"
        onClick={handleInstall}
      >
        <Download className="w-[18px] h-[18px]" />
        Install App
      </Button>
      {showInstallHelp && !installPrompt && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[260px] rounded-xl border border-primary/15 bg-white p-3 text-xs font-semibold leading-5 text-slate-700 shadow-xl">
          {isIos
            ? "On iPhone, tap Share, then Add to Home Screen."
            : "Open your browser menu, then choose Install app or Add to Home screen."}
        </div>
      )}
    </div>
  );
}

/* ===================== NAV ===================== */
function Nav({ isAuthenticated }) {
  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-border/40 !rounded-none">
      <div className="container-xl h-[68px] flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-3 no-underline text-inherit"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <GraduationCap className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-outfit">
            LearnHub
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/courses"
            className="text-sm text-muted-foreground font-medium no-underline hover:text-primary transition-colors"
          >
            Courses
          </Link>
          <a
            href="#categories"
            className="text-sm text-muted-foreground font-medium no-underline hover:text-primary transition-colors"
          >
            Categories
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground font-medium no-underline hover:text-primary transition-colors"
          >
            Pricing
          </a>
        </div>

        <div className="flex gap-2">
          {isAuthenticated ? (
            <Button asChild variant="gradient" size="default">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="default">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild variant="gradient" size="default">
                <Link to="/register" className="flex items-center gap-1.5">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ===================== HERO ===================== */
function Hero({ isAuthenticated }) {
  return (
    <section className="section pt-16 pb-20 relative overflow-hidden">
      <div className="hero-bg">
        <div className="hero-blob hero-blob--1" />
        <div className="hero-blob hero-blob--2" />
      </div>
      <div className="container-xl relative z-10">
        <div className="hero-grid">
          <div className="flex flex-col gap-5">
            <div className="hero-pill self-start">
              <span className="hero-pill__chip">NEW</span>
              <span className="font-medium">
                AI Tutor — Now in every course
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h1 className="display font-outfit">
              Master skills that{" "}
              <span className="text-gradient">change your career.</span>
            </h1>
            <p className="lead max-w-[520px]">
              Learn from world-class instructors with hands-on projects,
              AI-guided feedback, and certificates that recruiters actually care
              about.
            </p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <Button
                asChild
                variant="gradient"
                size="xl"
                className="shadow-lg"
              >
                <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                  {isAuthenticated
                    ? "Continue Learning"
                    : "Start Learning Free"}
                  <ArrowRight className="w-[18px] h-[18px]" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="xl"
                className="bg-white/70 backdrop-blur-md border-primary/20"
              >
                <Link to="/courses">
                  <Play className="w-[18px] h-[18px]" /> Browse Courses
                </Link>
              </Button>
              <InstallAppButton />
            </div>
            <div className="flex gap-4 items-center mt-5 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="avatar-stack">
                  {[
                    ["SA", "teal"],
                    ["LK", "amber"],
                    ["YM", "violet"],
                    ["MK", "slate"],
                  ].map(([i, c]) => (
                    <DesignAvatar key={i} initials={i} color={c} size={28} />
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 items-center">
                    <span className="stars flex gap-0.5 text-amber-500">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="w-3 h-3" fill="currentColor" />
                      ))}
                    </span>
                    <span className="font-bold text-[13px] ml-1">4.9</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground font-medium">
                    from 12,000+ reviews
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-[13px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> No credit
                  card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> 7-day free
                  trial
                </span>
              </div>
            </div>
          </div>

          {/* Floating preview cards */}
          <div className="floating-stack" aria-hidden="true">
            {/* Main course card */}
            <Card className="float w-[340px] top-[30px] left-[20px] animate-[floaty_5s_ease-in-out_infinite] p-0 overflow-hidden border-border/80 shadow-xl">
              <div className="h-[130px] gradient-primary flex items-center justify-center relative">
                <Badge className="absolute top-3 left-3 bg-white/92 text-foreground border-0 text-[11px] font-bold hover:bg-white">
                  Web Development
                </Badge>
                <div className="bg-white/20 w-[52px] h-[52px] rounded-full flex items-center justify-center text-white backdrop-blur-md">
                  <Play className="w-[22px] h-[22px]" fill="currentColor" />
                </div>
              </div>
              <CardContent className="p-[18px]">
                <div className="overline text-primary">
                  INTERMEDIATE · 12 LESSONS
                </div>
                <h3 className="text-base font-bold mt-1.5 mb-3 leading-tight font-outfit">
                  React from Zero to Hero
                </h3>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DesignAvatar initials="MK" size={24} />
                    <span className="text-[13px] text-muted-foreground">
                      Mohamed Kamal
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[13px] font-semibold">
                    <Star
                      className="w-3.5 h-3.5 text-amber-500"
                      fill="currentColor"
                    />
                    4.9
                  </span>
                </div>
                <div className="h-1 bg-primary/10 rounded-full overflow-hidden mt-3.5">
                  <div className="w-[68%] h-full bg-primary" />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                  68% completed
                </div>
              </CardContent>
            </Card>

            {/* Streak chip */}
            <Card className="float top-0 right-[10px] p-4 w-[210px] animate-[floatyB_6s_ease-in-out_infinite] border-border/80 shadow-xl">
              <CardContent className="p-0">
                <div className="flex justify-between mb-2.5">
                  <span className="overline">STREAK</span>
                  <Zap className="w-4 h-4 text-amber-500" fill="currentColor" />
                </div>
                <div className="text-[28px] font-extrabold tracking-tight font-outfit">
                  21{" "}
                  <span className="text-[13px] text-muted-foreground font-semibold">
                    days
                  </span>
                </div>
                <div className="flex gap-1 mt-2.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-[18px] h-[18px] rounded-[5px]",
                        i < 6 ? "bg-primary/80" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certificate */}
            <Card className="float bottom-[30px] right-0 p-5 w-[250px] animate-[floaty_7s_ease-in-out_infinite] delay-1000 border-border/80 shadow-xl">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Certificate Earned</div>
                  <div className="text-[12px] text-muted-foreground">
                    JavaScript Fundamentals
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live learners */}
            <Card className="float bottom-[80px] left-0 p-4 w-[210px] animate-[floatyB_8s_ease-in-out_infinite] delay-500 border-border/80 shadow-xl">
              <CardContent className="p-0">
                <div className="flex justify-between mb-2">
                  <span className="overline">LIVE NOW</span>
                  <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_0_4px_hsl(var(--success)/0.2)]" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="avatar-stack">
                    {[
                      ["SA", "teal"],
                      ["LK", "amber"],
                      ["YM", "violet"],
                      ["MK", "slate"],
                    ].map(([i, c]) => (
                      <DesignAvatar key={i} initials={i} color={c} size={24} />
                    ))}
                  </div>
                  <span className="text-[13px] font-bold">2.4K</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== TRUST STRIP ===================== */
function TrustStrip() {
  const logos = [
    "Cairo University",
    "AUC",
    "Stanford",
    "MIT OpenCourseWare",
    "Google for Education",
    "GitHub Education",
    "Microsoft Learn",
    "Meta",
    "freeCodeCamp",
  ];
  const row = () =>
    logos.map((l, i) => (
      <div
        key={i}
        className="text-base font-bold text-slate-400 whitespace-nowrap tracking-tight"
      >
        {l}
      </div>
    ));
  return (
    <section className="py-10 border-y border-border bg-white">
      <div className="container-xl flex flex-col gap-4">
        <div className="text-center text-[12px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
          Trusted by learners and educators at
        </div>
        <div className="marquee">
          <div className="marquee__track">
            {row()}
            {row()}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== STATS ===================== */
function Stats({ stats = {} }) {
  const metricItems = [
    { v: formatMetric(stats.totalStudents), l: "Active Students" },
    { v: formatMetric(stats.totalInstructors), l: "Expert Instructors" },
    { v: formatMetric(stats.totalCourses), l: "Quality Courses" },
    { v: formatMetric(stats.totalCertificates), l: "Certificates Earned" },
  ];
  return (
    <section className="section section--tight">
      <div className="container-xl">
        <div className="grid-4">
          {metricItems.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[clamp(36px,4.4vw,56px)] font-extrabold text-primary leading-none tracking-tighter font-outfit">
                {s.v}
              </div>
              <div className="text-sm text-muted-foreground mt-2.5 font-semibold">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== CATEGORIES ===================== */
const CATEGORY_STYLES = [
  {
    Icon: Code,
    title: "Web Development",
    count: "124 courses",
    variant: "primary",
  },
  {
    Icon: Brain,
    title: "AI & Machine Learning",
    count: "68 courses",
    variant: "violet",
  },
  {
    Icon: Database,
    title: "Data Science",
    count: "92 courses",
    variant: "primary",
  },
  {
    Icon: Palette,
    title: "Design & UI/UX",
    count: "76 courses",
    variant: "accent",
  },
  {
    Icon: Smartphone,
    title: "Mobile Development",
    count: "54 courses",
    variant: "primary",
  },
  {
    Icon: Layers,
    title: "DevOps & Cloud",
    count: "41 courses",
    variant: "success",
  },
  {
    Icon: TrendingUp,
    title: "Business & Career",
    count: "38 courses",
    variant: "accent",
  },
  {
    Icon: Lightbulb,
    title: "Soft Skills",
    count: "29 courses",
    variant: "violet",
  },
];

function Categories({ categories = [] }) {
  const getIconTileClass = (variant) => {
    switch (variant) {
      case "violet":
        return "icon-tile-violet";
      case "accent":
        return "icon-tile-accent";
      case "success":
        return "icon-tile-success";
      default:
        return "icon-tile";
    }
  };

  return (
    <section id="categories" className="section section--alt">
      <div className="container-xl flex flex-col gap-6">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-0 w-fit"
            >
              Categories
            </Badge>
            <h2 className="h2 font-outfit">Browse by what excites you</h2>
          </div>
          <Link
            to="/courses"
            className="text-sm font-semibold text-primary no-underline inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            All categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid-4 mt-2">
          {categories.length > 0 ? categories.map((category, i) => {
            const style = CATEGORY_STYLES[i % CATEGORY_STYLES.length];
            const Icon = style.Icon;

            return (
            <Link
              to={`/courses?category=${category.categoryId}`}
              key={category.categoryId || category.categoryName}
              className="cat-card no-underline group shadow-sm hover:shadow-md"
            >
              <div
                className={cn(
                  "transition-transform group-hover:scale-110 duration-300",
                  getIconTileClass(style.variant),
                )}
              >
                <Icon className="w-5.5 h-5.5" />
              </div>
              <div className="cat-card__title mt-3.5 font-bold">
                {category.categoryName}
              </div>
              <div className="cat-card__count text-[12px] text-muted-foreground font-medium">
                {category.courseCount} course{category.courseCount === 1 ? "" : "s"}
              </div>
            </Link>
            );
          }) : (
            <div className="col-span-full rounded-2xl border border-dashed bg-white p-8 text-center text-sm font-medium text-muted-foreground">
              Categories will appear here after they are created in the admin dashboard.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ===================== HOW IT WORKS ===================== */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Choose your path",
      desc: "Browse 500+ courses across 8 categories. Filter by level, skill, or career goal — and start your first lesson in seconds.",
    },
    {
      n: "02",
      title: "Learn by doing",
      desc: "Every course pairs videos with hands-on coding labs, quizzes, and real-world projects. Get instant feedback from our AI tutor.",
    },
    {
      n: "03",
      title: "Earn your certificate",
      desc: "Pass the final exam to earn a verified certificate. Add it to LinkedIn — recruiters from 800+ companies hire LearnHub grads.",
    },
  ];
  return (
    <section className="section">
      <div className="container-xl flex flex-col gap-8">
        <div className="text-center max-w-[640px] mx-auto flex flex-col items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-0"
          >
            How It Works
          </Badge>
          <h2 className="h2 font-outfit">
            From curious to certified in 3 steps
          </h2>
          <p className="lead">
            A clear path from "I want to learn this" to "I just got hired for
            this."
          </p>
        </div>
        <div className="grid-3 mt-4">
          {steps.map((s, i) => (
            <Card
              key={i}
              className="border-border/60 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden"
            >
              <CardContent className="p-7 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="step-num">{s.n}</div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted/30" />
                  )}
                </div>
                <h3 className="h3 font-outfit">{s.title}</h3>
                <p className="m-0 text-muted-foreground leading-relaxed text-[15px] font-medium">
                  {s.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== FEATURED COURSES ===================== */
function FeaturedCourses({ courses, isLoading, categories = [] }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", ...categories.map((category) => category.categoryName)]
    .filter(Boolean)
    .slice(0, 6);
  const sourceCourses = Array.isArray(courses) ? courses : [];
  const featuredCourses =
    filter === "All"
      ? sourceCourses
      : sourceCourses.filter((course) => course.categoryName === filter);

  return (
    <section className="section">
      <div className="container-xl flex flex-col gap-6">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-0 w-fit"
            >
              Top Rated
            </Badge>
            <h2 className="h2 font-outfit">Popular this week</h2>
          </div>
          <Button
            asChild
            variant="outline"
            size="default"
            className="bg-white/70 backdrop-blur-md"
          >
            <Link to="/courses" className="flex items-center gap-2">
              View All Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              className={cn("chip", filter === f && "active")}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid-3 mt-2">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="overflow-hidden border-border/60 shadow-sm"
                >
                  <Skeleton className="h-[156px] w-full" />
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-[60%] mb-2" />
                    <Skeleton className="h-5 w-[90%] mb-2" />
                    <Skeleton className="h-3.5 w-[70%]" />
                  </CardContent>
                </Card>
              ))
            : featuredCourses.length > 0 ? featuredCourses.slice(0, 6).map((course) => {
                const Icon = course.Icon || BookOpen;
                const isFallback = !course.imgPath;
                const price = Number(course.price || 0);
                const courseId = course.courseId || course.id || course._id;
                if (!courseId) return null;

                return (
                  <Link
                    to={`/courses/${courseId}`}
                    key={courseId}
                    className="no-underline group"
                  >
                    <Card className="card--solid overflow-hidden border-border/60 p-0 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                      <div
                        className="thumb overflow-hidden"
                        style={
                          isFallback
                            ? {
                                background:
                                  course.gradient || "var(--gradient-primary)",
                              }
                            : undefined
                        }
                      >
                        {isFallback ? (
                          <div className="thumb__icon">
                            <Icon size={56} />
                          </div>
                        ) : (
                          <img
                            src={getFullUrl(course.imgPath)}
                            alt={course.title}
                            className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                        <Badge className="absolute top-3.5 left-3.5 bg-white/95 text-foreground border-0 text-[11px] font-bold hover:bg-white">
                          {course.categoryName || "General"}
                        </Badge>
                        {course.hot && (
                          <Badge className="absolute top-3.5 right-3.5 border-0 bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-500">
                            HOT
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <div className="overline text-primary">
                          {(course.level || "All Levels").toUpperCase()} ·{" "}
                          {course.lessons || 0} LESSONS
                        </div>
                        <h3 className="text-base font-bold mt-2 mb-1 leading-tight text-foreground font-outfit">
                          {course.title}
                        </h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                          {course.instructorName ||
                            course.description ||
                            "Learn practical skills with guided projects and feedback."}
                        </p>
                        <div className="flex justify-between items-center pt-3.5 border-t border-muted/30">
                          <span className="flex items-center gap-1 text-[13px] font-semibold">
                            <Star
                              className="w-3.5 h-3.5 text-amber-500"
                              fill="currentColor"
                            />
                            {course.rating || 4.8}
                            {course.reviews && (
                              <span className="text-muted-foreground font-medium">
                                ({course.reviews})
                              </span>
                            )}
                          </span>
                          <span className="text-lg font-extrabold text-primary font-outfit">
                            {price === 0 ? "Free" : `$${price}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              }) : (
                <Card className="col-span-full border-dashed">
                  <CardContent className="p-10 text-center text-sm font-medium text-muted-foreground">
                    Approved courses will appear here after instructors publish content.
                  </CardContent>
                </Card>
              )}
        </div>
      </div>
    </section>
  );
}

/* ===================== AI TUTOR SECTION ===================== */
const AI_MESSAGES = [
  {
    role: "user",
    text: "Why is my React state not updating when I push to an array?",
  },
  {
    role: "bot",
    text: "Great question! React uses reference equality to detect changes. Pushing mutates the array but keeps the same reference, so React skips re-rendering. Use the spread operator instead:",
  },
  {
    role: "bot",
    text: "setItems([...items, newItem])  ← creates a new array",
    code: true,
  },
  { role: "user", text: "Got it. Can you quiz me on this?" },
];

function AITutorSection() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (shown >= AI_MESSAGES.length) return;
    const isBot = AI_MESSAGES[shown].role === "bot";
    if (isBot) {
      setTyping(true);
      const t1 = setTimeout(() => setTyping(false), 800);
      const t2 = setTimeout(() => setShown((s) => s + 1), 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      const t = setTimeout(() => setShown((s) => s + 1), 1400);
      return () => clearTimeout(t);
    }
  }, [shown]);

  useEffect(() => {
    if (shown >= AI_MESSAGES.length) {
      const t = setTimeout(() => setShown(0), 3500);
      return () => clearTimeout(t);
    }
  }, [shown]);

  return (
    <section className="section">
      <div className="container-xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.05fr] gap-14 items-center">
          <div className="flex flex-col gap-5">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-0 w-fit flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Tutor
            </Badge>
            <h2 className="h2 font-outfit">
              A patient tutor that{" "}
              <span className="text-gradient">never sleeps.</span>
            </h2>
            <p className="lead">
              Stuck on a concept at 2 AM the night before an exam? Ask. Our AI
              tutor explains in plain language, generates practice problems, and
              quizzes you until it sticks.
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {[
                "Conceptual explanations tailored to your level — not Stack Overflow rabbit holes.",
                "Generates infinite practice quizzes on any topic in your course.",
                "Reviews your code, suggests improvements, and explains why.",
              ].map((f, i) => (
                <li
                  key={i}
                  className="feat-line flex items-start gap-2.5 text-[14px] text-foreground leading-relaxed font-medium"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <Button asChild variant="gradient" size="default">
                <Link to="/courses" className="flex items-center gap-2">
                  Try AI Tutor <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="flex flex-col gap-3 p-7 shadow-xl border-border/60">
            <div className="flex justify-between pb-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-bold text-sm">LearnHub Tutor</div>
                  <div className="flex items-center gap-1.5 text-[12px] text-emerald-500 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-0 font-bold"
              >
                React Course
              </Badge>
            </div>
            <div className="flex flex-col gap-3 min-h-[240px]">
              {AI_MESSAGES.slice(0, shown).map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "bubble",
                    m.role === "user" ? "bubble--user" : "bubble--bot",
                    m.code &&
                      "font-mono bg-slate-900 text-cyan-200 text-[13px] border-none",
                  )}
                >
                  {m.text}
                </div>
              ))}
              {typing &&
                shown < AI_MESSAGES.length &&
                AI_MESSAGES[shown].role === "bot" && (
                  <div className="bubble bubble--bot">
                    <div className="typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
            </div>
            <div className="flex gap-2 mt-2 pt-3.5 border-t border-border">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-border text-muted-foreground text-[13px] font-medium">
                Ask anything about your course…
              </div>
              <Button
                variant="gradient"
                size="icon"
                className="rounded-xl w-10 h-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ===================== INSTRUCTOR SPOTLIGHT ===================== */
function InstructorSpotlight({ instructors = [] }) {
  const visibleInstructors = instructors;
  /*
    {
      name: "Dr. Lina Khaled",
      title: "Lead AI Researcher · ex-Google Brain",
      students: "24,300",
      courses: 6,
      rating: 4.9,
      cover: "",
      initials: "LK",
      blurb:
        "Machine learning that doesn't gatekeep. PhD-grade rigor, undergrad-friendly explanations.",
    },
    {
      name: "Mohamed Kamal",
      title: "Senior Engineer · Vercel",
      students: "41,800",
      courses: 9,
      rating: 4.9,
      cover: "alt2",
      initials: "MK",
      blurb:
        "Production React, the way teams actually ship it. No toy examples — real codebases.",
    },
    {
      name: "Nour Rashad",
      title: "Principal Designer · Figma",
      students: "18,700",
      courses: 4,
      rating: 4.8,
      cover: "alt",
      initials: "NR",
      blurb:
        "Design fundamentals you can apply in Day 1 — even if you've never opened a design tool.",
    },
  */
  return (
    <section className="section section--alt">
      <div className="container-xl flex flex-col gap-8">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div className="flex flex-col gap-2 max-w-[560px]">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-0 w-fit"
            >
              Instructors
            </Badge>
            <h2 className="h2 font-outfit">Learn from people who ship.</h2>
            <p className="lead">
              Working engineers, designers, and researchers — not lecture-hall
              theory.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="default"
            className="bg-white/70 backdrop-blur-md"
          >
            <Link to="/courses" className="flex items-center gap-2">
              Become an Instructor <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="grid-3">
          {visibleInstructors.map((inst, i) => (
            <Card
              key={inst.instructorId || i}
              className="inst-card overflow-hidden border-border/60 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div
                className={cn(
                  "inst-card__cover h-[140px] relative gradient-primary",
                  inst.cover === "alt" &&
                    "bg-gradient-to-br from-[#fde68a] to-[#f59e0b]",
                  inst.cover === "alt2" &&
                    "bg-gradient-to-br from-[#e9d5ff] to-[#8b5cf6]",
                )}
              >
                <div className="absolute left-6 -bottom-7">
                  <DesignAvatar
                    initials={getInitials(inst.name)}
                    size={64}
                    className="border-4 border-white shadow-md"
                  />
                </div>
              </div>
              <CardContent className="pt-10 pb-6 px-6 flex flex-col gap-3">
                <div>
                  <h3 className="h3 font-outfit">{inst.name}</h3>
                  <div className="text-[13px] text-muted-foreground mt-0.5 font-medium">
                    Instructor
                  </div>
                </div>
                <p className="m-0 text-[14px] text-muted-foreground leading-relaxed font-medium">
                  {inst.bio || "Creating practical courses for LearnHub students."}
                </p>
                <div className="flex justify-between mt-2 pt-4 border-t border-muted/20">
                  {[
                    ["Students", formatMetric(inst.studentsCount)],
                    ["Courses", inst.coursesCount],
                  ].map(([label, val]) => (
                    <div key={label} className="flex flex-col">
                      <span className="font-extrabold text-[16px] flex items-center gap-1 font-outfit">
                        {val}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-bold tracking-wider uppercase">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== TESTIMONIALS ===================== */
function Testimonials({ testimonials = [] }) {
  const items = testimonials;
  /*
    {
      quote:
        "I went from changing my major to landing a junior dev role at a YC startup in 8 months. LearnHub's React track was my whole curriculum.",
      name: "Sara Ahmed",
      role: "Junior Engineer @ Beta Acres",
      initials: "SA",
      color: "teal",
    },
    {
      quote:
        "The AI tutor is wild — it caught a bug in my code at 1am and explained the fix better than my actual TA. Got a 94 on the final.",
      name: "Youssef Magdy",
      role: "CS Student, Cairo University",
      initials: "YM",
      color: "amber",
    },
    {
      quote:
        "As a self-taught designer, I needed structure. The UI/UX track gave me a portfolio I'm actually proud of. Three interviews, two offers.",
      name: "Nour El-Sayed",
      role: "Product Designer @ Wuzzuf",
      initials: "NS",
      color: "violet",
    },
  */
  return (
    <section className="section">
      <div className="container-xl flex flex-col gap-8">
        <div className="text-center flex flex-col items-center max-w-[640px] mx-auto gap-3">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-0"
          >
            Loved by 50K+ learners
          </Badge>
          <h2 className="h2 font-outfit">
            Stories that started with one course.
          </h2>
        </div>
        <div className="grid-3">
          {items.length > 0 ? items.map((t, i) => (
            <Card
              key={i}
              className="p-7 flex flex-col gap-4 border-border/60 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="flex gap-0.5 text-amber-500">
                {[0, 1, 2, 3, 4].map((j) => (
                  <Star key={j} className="w-4 h-4" fill="currentColor" />
                ))}
              </div>
              <p className="text-base leading-relaxed text-foreground m-0 font-medium italic">
                "{t.comment}"
              </p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-muted/20">
                <DesignAvatar initials={getInitials(t.studentName)} color="teal" size={36} />
                <div>
                  <div className="font-bold text-sm">{t.studentName}</div>
                  <div className="text-[12px] text-muted-foreground font-medium">
                    {t.courseTitle}
                  </div>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="col-span-full border-dashed">
              <CardContent className="p-10 text-center text-sm font-medium text-muted-foreground">
                Student reviews will appear here after learners review courses.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

/* ===================== PRICING ===================== */
function Pricing({ isAuthenticated }) {
  const tiers = [
    {
      name: "Free",
      price: 0,
      period: "forever",
      desc: "Browse and audit course content. Great for sampling.",
      features: [
        "Access to 50+ free courses",
        "Community forums",
        "Basic AI tutor (10 questions/day)",
      ],
      cta: "Get Started",
      variant: "outline",
      featured: false,
    },
    {
      name: "Pro",
      price: 19,
      period: "per month",
      desc: "Everything a serious learner needs to ship.",
      features: [
        "Unlimited courses, all categories",
        "Unlimited AI tutor",
        "Verified certificates",
        "Hands-on project reviews",
        "Priority instructor Q&A",
      ],
      cta: "Start Free Trial",
      variant: "gradient",
      featured: true,
      tag: "MOST POPULAR",
    },
    {
      name: "Teams",
      price: 49,
      period: "per seat / month",
      desc: "For universities, bootcamps, and small teams.",
      features: [
        "Everything in Pro",
        "Admin dashboard & analytics",
        "Custom learning paths",
        "SSO & team management",
        "Dedicated success manager",
      ],
      cta: "Talk to Sales",
      variant: "default",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="section section--alt">
      <div className="container-xl flex flex-col gap-8">
        <div className="text-center flex flex-col items-center max-w-[640px] mx-auto gap-3">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-0"
          >
            Pricing
          </Badge>
          <h2 className="h2 font-outfit">Pick a plan. Cancel whenever.</h2>
          <p className="lead">
            Start free. Upgrade when you're ready to go deep. No hidden fees,
            ever.
          </p>
        </div>
        <div className="grid-3 items-stretch">
          {tiers.map((t, i) => (
            <Card
              key={i}
              className={cn(
                "relative flex flex-col gap-5 p-7 border-border/60 transition-all duration-300 shadow-sm",
                t.featured
                  ? "bg-gradient-to-b from-white to-[#f0fbfa] border-primary/40 shadow-xl -translate-y-1.5"
                  : "hover:shadow-lg hover:-translate-y-1",
              )}
            >
              {t.tag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest whitespace-nowrap shadow-md">
                  {t.tag}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="text-[12px] font-extrabold text-primary uppercase tracking-widest">
                  {t.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-outfit">
                    ${t.price}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {t.period}
                  </span>
                </div>
                <p className="m-0 text-muted-foreground text-[14px] leading-relaxed font-medium">
                  {t.desc}
                </p>
              </div>
              <Button asChild variant={t.variant} size="lg" className="w-full">
                <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                  {t.cta}
                </Link>
              </Button>
              <div className="h-px bg-muted/30" />
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                {t.features.map((f, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-[14px] font-medium leading-relaxed"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===================== FAQ ===================== */
function FAQ() {
  const items = [
    {
      q: "Do I need any prior experience to get started?",
      a: "Not at all. We have beginner-friendly tracks across every category. Each course tells you exactly what you need to know going in — and most start from absolute zero.",
    },
    {
      q: "How long does it take to complete a course?",
      a: "Most courses take 10–25 hours of focused work. You can binge a course in a weekend or stretch it over a month — your progress saves automatically wherever you stop.",
    },
    {
      q: "Are the certificates accredited?",
      a: "Our certificates are verified by LearnHub, not accredited by a university. That said, they're recognized by 800+ hiring partners, and our grads have a 95% interview-callback rate.",
    },
    {
      q: "What happens if I cancel my subscription?",
      a: "You keep access to any free content, your earned certificates, and your account. You can re-subscribe anytime and pick up where you left off.",
    },
    {
      q: "Is there a student discount?",
      a: "Yes — 50% off Pro for verified university students. Sign up with your .edu email or upload your student ID to claim it.",
    },
  ];

  return (
    <section className="section">
      <div className="container-xl max-w-[880px] mx-auto flex flex-col gap-8">
        <div className="text-center flex flex-col items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-0"
          >
            FAQ
          </Badge>
          <h2 className="h2 font-outfit">Questions, answered.</h2>
        </div>
        <Accordion
          type="single"
          collapsible
          className="w-full border border-border rounded-2xl bg-white overflow-hidden shadow-sm"
        >
          {items.map((it, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b last:border-0 px-6"
            >
              <AccordionTrigger className="text-[16px] font-bold text-foreground hover:no-underline hover:text-primary transition-colors py-5">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed font-medium pb-5">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ===================== CTA BANNER ===================== */
function CTABanner({ isAuthenticated }) {
  return (
    <section className="section section--alt">
      <div className="container-xl">
        <Card className="cta-banner text-center flex flex-col items-center gap-5 p-10 md:p-16 !bg-none gradient-primary shadow-2xl border-none rounded-[28px] relative overflow-hidden">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 text-gray-400 border-white/20 text-[12px] font-bold"
          >
            <Sparkles className="w-3 h-3" /> Limited offer · 50% off student
            plan
          </Badge>
          <h2 className="h2 text-gray-300 max-w-[720px] font-outfit">
            The course you keep meaning to take? Take it this week.
          </h2>
          <p className="lead text-gray-400/80 max-w-[560px]">
            Free to start. No credit card. Cancel anytime.
          </p>
          <div className="flex gap-3 flex-wrap justify-center relative z-10 mt-2">
            <Button asChild variant="accent" size="xl" className="shadow-xl">
              <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Continue Learning" : "Create Free Account"}
                <ArrowRight className="w-[18px] h-[18px]" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="bg-white/10 text-gray-400 border-white/30 hover:bg-white/20 hover:text-gray-800"
            >
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ===================== FOOTER ===================== */
function Footer() {
  const col = (title, links) => (
    <div className="flex flex-col gap-4">
      <h4 className="text-[12px] uppercase tracking-[0.2em] text-white/50 font-bold m-0">
        {title}
      </h4>
      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <a
            key={l}
            href="#"
            className="text-[14px] text-white/60 no-underline hover:text-white transition-colors"
          >
            {l}
          </a>
        ))}
      </div>
    </div>
  );
  return (
    <footer className="footer bg-slate-950 text-white/70 py-16 pb-8">
      <div className="container-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr,1fr,1fr,1fr,1fr] gap-10">
        <div className="flex flex-col gap-4">
          <Link to="/" className="inline-flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight font-outfit">
              LearnHub
            </span>
          </Link>
          <p className="m-0 text-[14px] text-white/60 leading-relaxed max-w-[280px] font-medium">
            The learning platform for university CS students. Master the skills
            that actually get you hired.
          </p>
          <div className="flex gap-2.5 mt-2">
            {[Github, MessageCircle, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        {col("Learn", [
          "Browse Courses",
          "Categories",
          "Career Paths",
          "Certificates",
          "For Teams",
        ])}
        {col("Company", ["About", "Instructors", "Careers", "Press", "Blog"])}
        {col("Support", [
          "Help Center",
          "Contact",
          "System Status",
          "Accessibility",
        ])}
        {col("Legal", ["Privacy", "Terms", "Cookies", "GDPR"])}
      </div>
      <div className="container-xl flex flex-col sm:flex-row justify-between mt-12 pt-6 border-t border-white/5 text-[13px] text-white/40 gap-4">
        <span>© 2026 LearnHub. Built for university CS students.</span>
        <span className="font-medium">Made by ahmed ismail</span>
      </div>
    </footer>
  );
}

/* ===================== MAIN PAGE ===================== */
const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !user?.emailConfirmed) {
      navigate("/confirm-email");
    }
  }, [isAuthenticated, user, navigate]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["courses", "landing"],
    queryFn: async () => {
      const response = await api.get("/api/Course");
      return response.data;
    },
  });

  const { data: publicData = {} } = useQuery({
    queryKey: ["public-dashboard"],
    queryFn: async () => {
      const response = await api.get("/api/Dashboard/Public");
      return response.data;
    },
  });

  const rawCourses = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : Array.isArray(response)
        ? response
        : [];
  const courses = rawCourses.map(normalizeCourse);

  return (
    <div className="min-h-screen bg-background">
      <Nav isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <TrustStrip />
      <Stats stats={publicData.stats} />
      <Categories categories={publicData.categories || []} />
      <HowItWorks />
      <FeaturedCourses
        courses={courses}
        categories={publicData.categories || []}
        isLoading={isLoading}
      />
      <AITutorSection />
      <InstructorSpotlight instructors={publicData.instructors || []} />
      <Testimonials testimonials={publicData.testimonials || []} />
      <Pricing isAuthenticated={isAuthenticated} />
      <FAQ />
      <CTABanner isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
};

export default Index;
