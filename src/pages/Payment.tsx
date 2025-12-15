import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap,
  CreditCard,
  Wallet,
  Lock,
  ArrowLeft,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { mockCourses } from '@/data/mockData';

const Payment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [isProcessing, setIsProcessing] = useState(false);

  const course = mockCourses.find((c) => c.id === courseId);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: 'Payment Successful!',
      description: `You are now enrolled in ${course.title}`,
    });
    
    setIsProcessing(false);
    navigate('/dashboard/my-courses');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnHub</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              Secure Checkout
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                  <div
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === 'visa' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setPaymentMethod('visa')}
                  >
                    <RadioGroupItem value="visa" id="visa" />
                    <Label htmlFor="visa" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === 'e-wallet' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setPaymentMethod('e-wallet')}
                  >
                    <RadioGroupItem value="e-wallet" id="e-wallet" />
                    <Label htmlFor="e-wallet" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Wallet className="w-6 h-6 text-accent" />
                      <div>
                        <p className="font-semibold text-foreground">E-Wallet</p>
                        <p className="text-sm text-muted-foreground">PayPal, Apple Pay, Google Pay</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {paymentMethod === 'visa' && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Card Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input id="cardName" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" type="password" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'e-wallet' && (
              <Card className="animate-fade-in">
                <CardContent className="p-8 text-center">
                  <Wallet className="w-16 h-16 mx-auto text-primary mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Pay with E-Wallet
                  </p>
                  <p className="text-muted-foreground">
                    You'll be redirected to your E-Wallet provider to complete the payment
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-20 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground line-clamp-2">{course.title}</p>
                    <p className="text-sm text-muted-foreground">By {course.instructorName}</p>
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
                    <span className="text-2xl font-bold text-primary">${course.price}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="gradient"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Pay $${course.price}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>30-day money-back guarantee</span>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-foreground text-sm">What you'll get:</p>
                  <div className="space-y-1.5">
                    {[
                      'Full lifetime access',
                      'Certificate of completion',
                      'All course materials',
                      'Instructor Q&A support',
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success" />
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
