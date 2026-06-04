import { lazy, Suspense, useEffect, useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  BadgeCheck,
  Landmark,
  WalletCards,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { getFullUrl } from "@/lib/urlHelper";
import api from "@/api/axios";
import enrollmentService from "@/api/enrollment";
import orderService from "@/api/order";

const IllustrationFrame = lazy(() =>
  import("@/components/illustrations/IllustrationFrame"),
);
const SecurePaymentIllustration = lazy(() =>
  import("@/components/illustrations/SecurePaymentIllustration"),
);

const Payment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("admin-review");
  const [isProcessing, setIsProcessing] = useState(false);

  const [course, setCourse] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/api/Course/${courseId}`);
        const data = response.data?.data || response.data;
        setCourse({
          id: data.courseId || data._id || data.id,
          ...data,
          instructorName:
            data.instructorName || data.instructorId?.name || "Unknown Instructor",
        });
      } catch (error) {
        console.error("Failed to load course:", error);
        toast({
          title: "Error",
          description: "Could not load course details.",
          variant: "destructive",
        });
      }
    };

    fetchCourse();
  }, [courseId, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Course Not Found
          </h1>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (course.isFree) {
        await enrollmentService.create({ 
          courseId: course.id,
          studentId: user.id 
        });
        toast({
          title: "Enrolled Successfully!",
          description: `You are now enrolled in ${course.title}`,
        });
        navigate("/dashboard/my-courses");
      } else {
        await orderService.create({ 
          courseId: course.id
        });
        toast({
          title: "Order Submitted!",
          description: "Your request has been sent for admin approval. You will gain access once verified.",
        });
        navigate("/dashboard/my-courses");
      }
    } catch (error) {
      toast({
        title: "Transaction failed",
        description:
          error.response?.data?.message ||
          "Unable to complete the request right now.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-shell-bg min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/60 bg-white/75 backdrop-blur-[10px]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap size={24} className="text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                LearnHub
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck size={18} className="text-primary" />
              Secure Checkout
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={null}>
              <IllustrationFrame className="max-h-[300px] overflow-hidden">
                <SecurePaymentIllustration />
              </IllustrationFrame>
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Submit your order for admin review. Do not enter card details in this app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all sm:items-center ${
                      paymentMethod === "admin-review"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setPaymentMethod("admin-review")}
                  >
                    <RadioGroupItem value="admin-review" id="admin-review" />
                    <Label
                      htmlFor="admin-review"
                      className="flex flex-1 cursor-pointer items-start gap-3 sm:items-center"
                    >
                      <Landmark size={24} className="text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">
                          Admin-reviewed order
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Create an order and wait for verification before access is granted
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all sm:items-center ${
                      paymentMethod === "e-wallet"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setPaymentMethod("e-wallet")}
                  >
                    <RadioGroupItem value="e-wallet" id="e-wallet" />
                    <Label
                      htmlFor="e-wallet"
                      className="flex flex-1 cursor-pointer items-start gap-3 sm:items-center"
                    >
                      <WalletCards size={24} className="text-accent" />
                      <div>
                        <p className="font-semibold text-foreground">
                          E-Wallet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PayPal, Apple Pay, Google Pay
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {paymentMethod === "admin-review" && (
              <Card className="animate-fade-in">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Payment details are handled outside this checkout. This page only creates the order record used by admins to approve access.
                  </p>
                </CardContent>
              </Card>
            )}

            {paymentMethod === "e-wallet" && (
              <Card className="animate-fade-in">
                <CardContent className="p-8 text-center">
                  <WalletCards size={64} className="mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Pay with E-Wallet
                  </p>
                  <p className="text-muted-foreground">
                    You'll be redirected to your E-Wallet provider to complete
                    the payment
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={getFullUrl(course.imgPath)}
                    alt={course.title}
                    className="w-20 h-14 rounded-lg object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      By {course.instructorName}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course Price</span>
                    <span className="text-foreground">${course.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-success">-$0.00</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ${course.price}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="gradient"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : course.isFree ? "Enroll for Free" : `Create Order $${course.price}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <ShieldCheck size={18} className="text-primary" />
                  <span>30-day money-back guarantee</span>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-foreground text-sm">
                    What you'll get:
                  </p>
                  <div className="space-y-1.5">
                    {[
                      "Full lifetime access",
                      "Certificate of completion",
                      "All course materials",
                      "Instructor Q&A support",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <BadgeCheck size={18} className="text-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
