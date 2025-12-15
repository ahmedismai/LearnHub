import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockGrades, mockCourses, mockQuizzes, mockAssignments } from '@/data/mockData';

const Grades = () => {
  const grades = mockGrades.map((grade) => {
    const course = mockCourses.find((c) => c.id === grade.courseId);
    const quiz = mockQuizzes.find((q) => q.id === grade.quizId);
    const assignment = mockAssignments.find((a) => a.id === grade.assignmentId);
    return { ...grade, course, quiz, assignment };
  });

  const overallGrade = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length)
    : 0;

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'default';
    if (percentage >= 70) return 'warning';
    return 'destructive';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Grades</h1>
        <p className="text-muted-foreground mt-1">Track your academic performance</p>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="w-32 h-32 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-primary-foreground">
                {getGradeLetter(overallGrade)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground">Overall Grade</h3>
            <p className="text-3xl font-bold text-primary mt-2">{overallGrade}%</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'A (90-100%)', percentage: 75, count: grades.filter(g => (g.percentage || 0) >= 90).length },
                { label: 'B (80-89%)', percentage: 60, count: grades.filter(g => (g.percentage || 0) >= 80 && (g.percentage || 0) < 90).length },
                { label: 'C (70-79%)', percentage: 40, count: grades.filter(g => (g.percentage || 0) >= 70 && (g.percentage || 0) < 80).length },
                { label: 'D (60-69%)', percentage: 20, count: grades.filter(g => (g.percentage || 0) >= 60 && (g.percentage || 0) < 70).length },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{item.count} items</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Grades */}
      <Card>
        <CardHeader>
          <CardTitle>All Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grades.length > 0 ? (
              grades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge variant="muted">
                        {grade.quiz ? 'Quiz' : 'Assignment'}
                      </Badge>
                      <h4 className="font-semibold text-foreground">
                        {grade.quiz?.title || grade.assignment?.title || 'Assessment'}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {grade.course?.title} • Graded on{' '}
                      {new Date(grade.gradedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getGradeColor(grade.percentage || 0)} className="text-lg px-3 py-1">
                      {grade.score}/{grade.maxScore}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {grade.percentage}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No grades available yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Grades;
