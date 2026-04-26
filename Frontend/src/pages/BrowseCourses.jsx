import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/api/axios";
import { Link } from "react-router-dom";
import { BookOpen, Search, User, PlayCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const BrowseCourses = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await api.get("/Course");
      return response.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/Category");
      return response.data;
    },
  });

  // Enrollment Logic for Smart Navigation
  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: async () => {
      const response = await api.get("/Enrollment/me");
      return response.data;
    },
    enabled: !!user && user?.role === "Student",
  });

  const isEnrolled = (courseId) => {
    return enrollments.some(
      (e) => (e.courseId?._id || e.courseId) === courseId
    );
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.categoryId?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      course.categoryId?.name === selectedCategory ||
      course.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Explore Courses
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Master new skills with our expert-led programs
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by course, instructor or category..."
            className="pl-12 h-12 text-base shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "All" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("All")}
          className="rounded-full px-6"
        >
          All Courses
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat._id}
            variant={selectedCategory === cat.name ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.name)}
            className="rounded-full px-6"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-96 animate-pulse bg-accent/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <Card
              key={course._id}
              className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-white"
            >
              <div className="aspect-video relative overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 border-none shadow-sm hover:bg-white">
                  {course.categoryId?.name || "General"}
                </Badge>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors duration-300">
                  {course.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span>{course.instructorId?.name || "Instructor"}</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-0">
                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
              <CardFooter className="p-6 flex items-center justify-between border-t border-slate-50 mt-4">
                <span className="text-2xl font-bold text-primary">
                  ${course.price}
                </span>
                {isEnrolled(course._id) ? (
                  <Button asChild variant="secondary" className="gap-2 rounded-full px-6">
                    <Link to={`/dashboard/courses/${course._id}`}>
                      <PlayCircle className="w-4 h-4" />
                      Continue
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="rounded-full px-6 shadow-glow hover:shadow-none transition-all">
                    <Link to={`/courses/${course._id}`}>View Details</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseCourses;
