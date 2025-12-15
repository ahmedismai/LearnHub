import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, CheckCircle } from 'lucide-react';
import { mockCourses, mockEnrollments } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const MyCourses = () => {
  const { user } = useAuth();

  // For students, show enrolled courses
  // For instructors, show their created courses
  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';

  const studentEnrollments = mockEnrollments.filter((e) => e.studentId === '3'); // Using mock student ID
  const enrolledCourses = studentEnrollments.map((enrollment) => {
    const course = mockCourses.find((c) => c.id === enrollment.courseId);
    return { ...enrollment, course };
  }).filter((e) => e.course);

  const instructorCourses = mockCourses; // All courses belong to the mock instructor

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            {isStudent
              ? 'Continue your learning journey'
              : 'Manage your course catalog'}
          </p>
        </div>
        {isInstructor && (
          <Button asChild>
            <Link to="/dashboard/create-course">Create New Course</Link>
          </Button>
        )}
      </div>

      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={enrollment.course?.thumbnail}
                  alt={enrollment.course?.title}
                  className="w-full h-40 object-cover"
                />
                <Badge
                  className="absolute top-3 right-3"
                  variant={enrollment.status === 'completed' ? 'success' : 'secondary'}
                >
                  {enrollment.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    'In Progress'
                  )}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-2 line-clamp-2">
                  {enrollment.course?.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  By {enrollment.course?.instructorName}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </div>

                <Button className="w-full mt-4" variant={enrollment.status === 'completed' ? 'outline' : 'gradient'}>
                  <Play className="w-4 h-4 mr-2" />
                  {enrollment.status === 'completed' ? 'Review Course' : 'Continue'}
                </Button>
              </CardContent>
            </Card>
          ))}

          {enrolledCourses.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                You haven't enrolled in any courses yet
              </p>
              <Button asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {isInstructor && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructorCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
                <Badge className="absolute top-3 right-3" variant="secondary">
                  {course.category}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-2 line-clamp-2">{course.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{course.enrolledCount} students</span>
                  <span>${course.price}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" className="flex-1">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
