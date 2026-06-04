import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { Trophy, GraduationCap, Clock, Sparkles, TrendingUp, X, Download, Linkedin, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

function CertCard({ cert, userName, onOpen }) {
  const issueDate = cert.issueDate || cert.createdAt;
  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="cert-card" onClick={onOpen}>
      <div className="cert-card__preview">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", opacity: 0.85 }}>
              CERTIFICATE OF COMPLETION
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              Issued {formattedDate}
            </div>
          </div>
          <div className="cert-card__seal">
            <Trophy size={22} />
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>
            This is to certify that
          </div>
          <div style={{ fontFamily: "var(--font-signature)", fontSize: 22, color: "#fff", lineHeight: 1.2 }}>
            {userName}
          </div>
        </div>
      </div>
      <div className="cert-card__body">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "var(--teal-700)", textTransform: "uppercase" }}>
          has completed
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.3 }}>
          {cert.courseId?.title || "Course Certificate"}
        </h3>
        <div className="cert-card__divider" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "var(--fg-3)" }}>ISSUED</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{formattedDate}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "var(--fg-3)" }}>STATUS</span>
            <span style={{
              background: "hsl(142 76% 36% / .12)", color: "var(--success)",
              fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 9999
            }}>VERIFIED</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button
            type="button"
            size="sm"
            style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
          >
            View
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              if (cert.certificateUrl) window.open(cert.certificateUrl, "_blank");
            }}
          >
            <Share2 size={13} /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}

function CertModal({ cert, userName, onClose }) {
  const issueDate = cert.issueDate || cert.createdAt;
  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const credentialId = cert._id
    ? `LH-${new Date(issueDate).getFullYear()}-${cert._id.slice(-6).toUpperCase()}`
    : "—";

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
        <Button type="button" variant="ghost" size="icon" className="cert-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </Button>

        <div style={{ padding: 32 }}>
          <div className="certificate">
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "var(--gradient-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 8px 24px -8px hsl(174 72% 32% / .5)"
                }}>
                  <GraduationCap size={28} />
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--fg-1)", marginBottom: 4, letterSpacing: "-0.01em" }}>
                LearnHub
              </div>
              <div className="certificate__overline">Certificate of Completion</div>

              <div className="certificate__intro">This certifies that</div>
              <div className="certificate__name">{userName}</div>
              <div className="certificate__has-completed">
                has successfully completed all requirements for
              </div>
              <div className="certificate__course">
                {cert.courseId?.title || "Course Certificate"}
              </div>

              <div className="certificate__divider" />

              <p style={{ fontSize: 14, color: "var(--fg-2)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
                demonstrating dedication and mastery of the course curriculum through assessments, projects, and hands-on practice.
              </p>

              <div className="certificate__foot">
                <div className="certificate__sig">
                  <div className="certificate__sig-line">LearnHub</div>
                  <div className="certificate__sig-label">Platform</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="certificate__seal">
                    <Trophy size={28} />
                  </div>
                  <div className="certificate__sig-label" style={{ marginTop: 8 }}>VERIFIED</div>
                </div>

                <div className="certificate__sig" style={{ alignItems: "flex-end" }}>
                  <div className="certificate__sig-line" style={{ textAlign: "right" }}>{formattedDate}</div>
                  <div className="certificate__sig-label">Date of Issue</div>
                </div>
              </div>

              <div className="certificate__id">
                Credential ID: {credentialId}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: "16px 32px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Share your accomplishment</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
              Add to LinkedIn, share on socials, or download a PDF for your records.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cert.certificateUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(cert.certificateUrl, "_blank")}
              >
                <Download size={14} /> Download PDF
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`https://www.linkedin.com/`, "_blank")}
            >
              <Linkedin size={14} /> Add to LinkedIn
            </Button>
            <Button type="button">
              <Share2 size={14} /> Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Certificates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [openCert, setOpenCert] = useState(null);

  const {
    data: certificates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: async () => {
      const response = await api.get("/api/Certificate");
      return response.data;
    },
    enabled: !!user,
  });

  const userName = user?.fullName || user?.name || user?.username || "Learner";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div className="page__head">
        <div>
          <h1 className="page__title">Certificates</h1>
          <p className="page__subtitle">
            Every course you've completed — verified, shareable, and yours forever.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="button" variant="outline">
            <Sparkles size={16} /> Verify a credential
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--amber"><Trophy size={20} /></div>
          </div>
          <div className="stat__val">{isLoading ? "—" : certificates.length}</div>
          <div className="stat__label">Certificates earned</div>
        </div>
        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--teal"><Clock size={20} /></div>
          </div>
          <div className="stat__val">—</div>
          <div className="stat__label">Hours of instruction</div>
        </div>
        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--green"><TrendingUp size={20} /></div>
          </div>
          <div className="stat__val">—</div>
          <div className="stat__label">Average final grade</div>
        </div>
        <div className="stat">
          <div className="stat__head">
            <div className="stat__icon stat__icon--violet"><Sparkles size={20} /></div>
          </div>
          <div className="stat__val">—</div>
          <div className="stat__label">In progress</div>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--fg-3)" }}>
          Loading your certificates…
        </div>
      )}

      {isError && (
        <div style={{
          background: "hsl(0 84% 60% / .06)", border: "1px solid hsl(0 84% 60% / .2)",
          borderRadius: 14, padding: 24, color: "var(--destructive)", fontWeight: 600
        }}>
          Failed to load certificates. Please try again later.
        </div>
      )}

      {!isLoading && certificates.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 16px" }}>
            Earned ({certificates.length})
          </h2>
          <div className="cert-grid" style={{ marginBottom: 40 }}>
            {certificates.map((cert) => (
              <CertCard
                key={cert._id}
                cert={cert}
                userName={userName}
                onOpen={() => setOpenCert(cert)}
              />
            ))}
          </div>
        </>
      )}

      {!isLoading && certificates.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon" style={{ margin: "0 auto 20px" }}>
            <Trophy size={32} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>No Certificates Yet</h3>
          <p style={{ color: "var(--fg-2)", maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Complete all lessons, quizzes, and assignments, and pass the final exam with at least 70% to receive your certificate automatically.
          </p>
          <Button asChild variant="outline">
            <a href="/dashboard/my-courses">Keep Learning</a>
          </Button>
        </div>
      )}

      {openCert && (
        <CertModal
          cert={openCert}
          userName={userName}
          onClose={() => setOpenCert(null)}
        />
      )}
    </div>
  );
};

export default Certificates;
