import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';
import { mockCourses } from '@/data/mockData';

const Index = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: 'Expert-Led Courses',
      description: 'Learn from industry professionals with real-world experience',
    },
    {
      icon: Users,
      title: 'Interactive Learning',
      description: 'Engage with quizzes, assignments, and hands-on projects',
    },
    {
      icon: Award,
      title: 'Earn Certificates',
      description: 'Get recognized credentials to boost your career',
    },
    {
      icon: Play,
      title: 'Learn at Your Pace',
      description: 'Access content anytime, anywhere on any device',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Students' },
    { value: '200+', label: 'Expert Instructors' },
    { value: '500+', label: 'Quality Courses' },
    { value: '95%', label: 'Success Rate' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Courses
              </Link>
              <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </Link>
              <Link to="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              The Future of Online Learning
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
              Unlock Your Potential with{' '}
              <span className="text-primary">Expert-Led</span> Courses
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join thousands of learners worldwide and master new skills with our comprehensive 
              learning platform. From web development to data science.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" asChild>
                <Link to="/register">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/courses">
                  <Play className="w-5 h-5 mr-2" />
                  Browse Courses
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform provides all the tools and resources you need for effective learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge variant="secondary" className="mb-4">Top Rated</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Popular Courses</h2>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/courses">
                View All Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCourses.slice(0, 6).map((course) => (
              <Card key={course.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4" variant="secondary">
                    {course.category}
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Badge variant="muted" className="capitalize">
                      {course.level}
                    </Badge>
                    <span>•</span>
                    <span>{course.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-semibold text-foreground">{course.rating}</span>
                      <span className="text-muted-foreground text-sm">({course.enrolledCount})</span>
                    </div>
                    <p className="text-xl font-bold text-primary">${course.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/courses">
                View All Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <Card className="gradient-hero border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Join our community of learners and take the first step towards mastering new skills
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="accent" asChild>
                  <Link to="/register">
                    Create Free Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnHub</span>
            </Link>
            <div className="flex items-center gap-6 text-muted-foreground">
              <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
              <Link to="#" className="hover:text-foreground transition-colors">About</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 LearnHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
