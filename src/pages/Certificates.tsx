import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Award, Calendar, ExternalLink } from 'lucide-react';
import { mockCertificates, mockCourses } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Certificates = () => {
  const { toast } = useToast();

  const certificates = mockCertificates.map((cert) => {
    const course = mockCourses.find((c) => c.id === cert.courseId);
    return { ...cert, course };
  });

  const handleDownload = (certificateId: string) => {
    toast({
      title: 'Download Started',
      description: 'Your certificate is being prepared for download.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          Download and share your achievements
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 gradient-hero flex items-center justify-center">
                <Award className="w-20 h-20 text-primary-foreground/80" />
              </div>
              <CardContent className="p-6">
                <Badge variant="success" className="mb-3">
                  Verified Certificate
                </Badge>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {cert.courseName || cert.course?.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Awarded to {cert.studentName || 'Jane Student'}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>Issued on {new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={() => handleDownload(cert.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete a course to earn your first certificate
            </p>
            <Button asChild>
              <a href="/dashboard/my-courses">View My Courses</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Certificates;
