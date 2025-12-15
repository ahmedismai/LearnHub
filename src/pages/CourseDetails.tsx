import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap,
  Star,
  Clock,
  Users,
  Award,
  Play,
  FileText,
  CheckCircle,
  Lock,
  ArrowLeft,
  Share2,
  Heart,
  BookOpen,
  Video,
  ClipboardList,
} from 'lucide-react';
import { mockCourses, mockLessons, mockReviews, mockEnrollments } from '@/data/mockData';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const course = mockCourses.find((c) => c.id === id);
  const lessons = mockLessons.filter((l) => l.courseId === id);
  const reviews = mockReviews.filter((r) => r.courseId === id);

  const isEnrolled =
    user?.role === 'student' &&
    mockEnrollments.some((e) => e.studentId === user.id && e.courseId === id);

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

  const handleEnroll = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to enroll in this course.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Navigate to payment page
    navigate(`/payment/${course.id}`);
  };

  const curriculum = [
    {
      title: 'Getting Started',
      lessons: lessons.slice(0, 3).map((l) => ({
        ...l,
        type: 'video',
        completed: false,
        locked: false,
      })),
    },
    {
      title: 'Core Concepts',
      lessons: [
        { id: '4', title: 'Advanced Techniques', duration: '45 min', type: 'video', completed: false, locked: true },
        { id: '5', title: 'Best Practices', duration: '30 min', type: 'document', completed: false, locked: true },
        { id: '6', title: 'Module Quiz', duration: '20 min', type: 'quiz', completed: false, locked: true },
      ],
    },
    {
      title: 'Practical Projects',
      lessons: [
        { id: '7', title: 'Project Setup', duration: '60 min', type: 'video', completed: false, locked: true },
        { id: '8', title: 'Building the App', duration: '90 min', type: 'video', completed: false, locked: true },
        { id: '9', title: 'Final Assignment', duration: '120 min', type: 'assignment', completed: false, locked: true },
      ],
    },
  ];

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'quiz':
        return ClipboardList;
      case 'assignment':
        return BookOpen;
      default:
        return Play;
    }
  };

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

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
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

      {/* Breadcrumb */}
      <div className="pt-20 pb-4 px-4 bg-secondary/30 border-b border-border">
        <div className="container mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>
      </div>

      {/* Course Header */}
      <section className="py-8 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="muted" className="capitalize">
                  {course.level}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent fill-accent" />
                  <span className="font-semibold text-foreground">{course.rating}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span>{course.enrolledCount} students</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="w-5 h-5" />
                  <span>Certificate included</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <p className="text-muted-foreground">
                  Created by{' '}
                  <span className="text-primary font-semibold">{course.instructorName}</span>
                </p>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-xl border-0">
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center rounded-t-xl">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="rounded-full w-16 h-16"
                    >
                      <Play className="w-8 h-8" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-foreground">${course.price}</span>
                    <span className="text-lg text-muted-foreground line-through">
                      ${(course.price * 1.5).toFixed(2)}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <Button className="w-full mb-4" size="lg" variant="gradient" asChild>
                      <Link to={`/dashboard/my-courses`}>
                        <Play className="w-5 h-5 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full mb-4" size="lg" variant="gradient" onClick={handleEnroll}>
                      Enroll Now
                    </Button>
                  )}

                  <div className="flex gap-3 mb-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`}
                      />
                      Wishlist
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-muted-foreground">Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-muted-foreground">Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-muted-foreground">30-day money-back guarantee</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content Tabs */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="lg:max-w-4xl">
            <Tabs defaultValue="curriculum">
              <TabsList className="w-full justify-start mb-6 bg-secondary/50">
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Curriculum</CardTitle>
                    <p className="text-muted-foreground">
                      {curriculum.reduce((sum, section) => sum + section.lessons.length, 0)} lessons
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" defaultValue={['0']} className="space-y-4">
                      {curriculum.map((section, sectionIndex) => (
                        <AccordionItem
                          key={sectionIndex}
                          value={String(sectionIndex)}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-4">
                              <span className="font-semibold">{section.title}</span>
                              <Badge variant="muted">{section.lessons.length} lessons</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {section.lessons.map((lesson) => {
                                const Icon = getLessonIcon(lesson.type);
                                return (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        {lesson.locked ? (
                                          <Lock className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                          <Icon className="w-4 h-4 text-primary" />
                                        )}
                                      </div>
                                      <span
                                        className={
                                          lesson.locked ? 'text-muted-foreground' : 'text-foreground'
                                        }
                                      >
                                        {lesson.title}
                                      </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {lesson.duration}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">About This Course</h3>
                    <p className="text-muted-foreground mb-6">{course.description}</p>

                    <h3 className="text-xl font-bold text-foreground mb-4">What You'll Learn</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {[
                        'Master the fundamentals and core concepts',
                        'Build real-world projects from scratch',
                        'Learn industry best practices',
                        'Understand advanced techniques',
                        'Get hands-on experience with tools',
                        'Prepare for professional opportunities',
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-4">Requirements</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Basic computer skills</li>
                      <li>Willingness to learn and practice</li>
                      <li>No prior experience required</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                        {course.instructorName?.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{course.instructorName}</h3>
                        <p className="text-muted-foreground mb-4">Senior {course.category} Expert</p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-accent" />
                            4.9 Instructor Rating
                          </span>
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            15,000+ Students
                          </span>
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            12 Courses
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          An experienced professional with over 10 years in the industry. Passionate
                          about teaching and helping students achieve their learning goals.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-foreground">{course.rating}</p>
                        <div className="flex gap-1 my-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(course.rating || 0)
                                  ? 'text-accent fill-accent'
                                  : 'text-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">Course Rating</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <Progress
                              value={rating === 5 ? 80 : rating === 4 ? 15 : 5}
                              className="h-2"
                            />
                            <span className="text-sm text-muted-foreground w-8">{rating}★</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review.id} className="border-b border-border pb-6 last:border-0">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                S
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-foreground">Student</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating
                                            ? 'text-accent fill-accent'
                                            : 'text-muted'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-muted-foreground">{review.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No reviews yet. Be the first to review this course!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetails;
