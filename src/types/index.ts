// User Types
export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Instructor extends User {
  role: 'instructor';
  instructorId: string;
  bio?: string;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  enrollmentDate: Date;
}

// Course Types
export interface Course {
  id: string;
  courseId: string;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  instructorName?: string;
  thumbnail?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  enrolledCount?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  duration?: string;
  videoUrl?: string;
  createdAt: Date;
}

export interface Content {
  id: string;
  contentId: string;
  lessonId: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  url?: string;
  createdDate: Date;
  updatedDate: Date;
}

// Assignment Types
export interface Assignment {
  id: string;
  assignmentId: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  dueDate: Date;
  maxScore?: number;
  createdAt: Date;
}

export interface Submission {
  id: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  fileUrl?: string;
  content?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  quizId: string;
  courseId: string;
  lessonId?: string;
  title: string;
  totalMarks: number;
  duration?: number;
  createdAt: Date;
}

export interface Question {
  id: string;
  questionId: string;
  quizId: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  marks?: number;
}

// Enrollment & Payment Types
export interface Enrollment {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'active' | 'completed' | 'dropped';
  progress?: number;
}

export interface Payment {
  id: string;
  paymentId: string;
  studentId: string;
  courseId: string;
  amount: number;
  date: Date;
  method: 'e-wallet' | 'visa' | 'mastercard' | 'paypal';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

// Grade & Certificate Types
export interface Grade {
  id: string;
  gradeId: string;
  studentId: string;
  courseId?: string;
  quizId?: string;
  assignmentId?: string;
  score: number;
  maxScore: number;
  percentage?: number;
  gradedAt: Date;
}

export interface Certificate {
  id: string;
  certificateId: string;
  studentId: string;
  courseId: string;
  issueDate: Date;
  certificateUrl?: string;
  courseName?: string;
  studentName?: string;
}

// Review Types
export interface Review {
  id: string;
  reviewId: string;
  studentId: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Dashboard Stats
export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeEnrollments: number;
  recentUsers: User[];
  recentEnrollments: Enrollment[];
}

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  recentEnrollments: Enrollment[];
  coursePerformance: { courseId: string; title: string; enrollments: number; revenue: number }[];
}

export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  certificatesEarned: number;
  averageGrade: number;
  upcomingAssignments: Assignment[];
  recentGrades: Grade[];
}
