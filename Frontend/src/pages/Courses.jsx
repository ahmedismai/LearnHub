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
import { BookOpen, Search, User } from "lucide-react";
import { useState } from "react";
const Courses = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden bg-accent/10">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                )}
                <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground">
                  {course.categoryId?.name || "General"}
                </Badge>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <User className="w-4 h-4" />
                  <span>{course.instructorId?.name || "Instructor"}</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-0">
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {course.description}
                </p>
              </CardContent>
              <CardFooter className="p-6 flex items-center justify-between">
                <span className="text-xl font-bold text-primary">
                  ${course.price}
                </span>
                <Button asChild>
                  <Link to={`/courses/${course.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
