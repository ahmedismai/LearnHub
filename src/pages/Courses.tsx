import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Search, Star, Filter, Grid, List } from 'lucide-react';
import { mockCourses, categories, levels } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const Courses = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.enrolledCount || 0) - (a.enrolledCount || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

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

      {/* Header */}
      <section className="pt-24 pb-8 px-4 bg-secondary/30 border-b border-border">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Explore Courses</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover courses taught by industry experts. Find the perfect course to advance your career.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 border-b border-border bg-card sticky top-16 z-40">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level === 'All' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <p className="text-muted-foreground mb-6">
            Showing {sortedCourses.length} courses
          </p>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <Link to={`/courses/${course.id}`}>
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
                      <p className="text-sm text-muted-foreground mb-4">
                        By {course.instructorName}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="font-semibold text-foreground">{course.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({course.enrolledCount})
                          </span>
                        </div>
                        <p className="text-xl font-bold text-primary">${course.price}</p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/courses/${course.id}`}>
                    <div className="flex flex-col md:flex-row">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full md:w-64 h-48 md:h-auto object-cover"
                      />
                      <CardContent className="p-6 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="secondary">{course.category}</Badge>
                          <Badge variant="muted" className="capitalize">
                            {course.level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{course.duration}</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          By {course.instructorName}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-accent fill-accent" />
                              <span className="font-semibold text-foreground">{course.rating}</span>
                            </div>
                            <span className="text-muted-foreground text-sm">
                              {course.enrolledCount} students
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-primary">${course.price}</p>
                        </div>
                      </CardContent>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          {sortedCourses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No courses found</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedLevel('All');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Courses;
