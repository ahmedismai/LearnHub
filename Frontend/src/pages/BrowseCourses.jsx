import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import courseService from "@/api/course";
import { enrollmentService } from "@/api/enrollment";
import {
  Search,
  BookOpen,
  Users,
  Star,
  Play,
  Loader2,
  Sparkles,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { getFullUrl } from "@/lib/urlHelper";

const FALLBACK_CATEGORIES = [
  { categoryId: "web", categoryName: "Web Development" },
  { categoryId: "ai", categoryName: "AI & Data" },
  { categoryId: "design", categoryName: "Design" },
  { categoryId: "devops", categoryName: "DevOps" },
  { categoryId: "mobile", categoryName: "Mobile" },
  { categoryId: "programming", categoryName: "Programming" },
];

const FALLBACK_COURSES = [
  { courseId: 1, title: "React from Zero to Hero", categoryName: "Web Development", level: "Intermediate", price: 49, rating: 4.9, averageRating: 4.9, enrolledCount: 412, instructorName: "Mohamed Kamal", gradient: "linear-gradient(135deg, #99e4dd 0%, #14b8a6 100%)", hot: true },
  { courseId: 2, title: "Machine Learning Fundamentals", categoryName: "AI & Data", level: "Beginner", price: 79, rating: 4.8, averageRating: 4.8, enrolledCount: 218, instructorName: "Dr. Lina Khaled", gradient: "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)" },
  { courseId: 3, title: "Python for Absolute Beginners", categoryName: "Programming", level: "Beginner", price: 39, rating: 4.7, averageRating: 4.7, enrolledCount: 521, instructorName: "Ahmed Ismail", gradient: "linear-gradient(135deg, #ccf2ee 0%, #0f766e 100%)" },
  { courseId: 4, title: "UI/UX Design Foundations", categoryName: "Design", level: "All Levels", price: 59, rating: 4.6, averageRating: 4.6, enrolledCount: 184, instructorName: "Nour Rashad", gradient: "linear-gradient(135deg, #e9d5ff 0%, #8b5cf6 100%)", hot: true },
  { courseId: 5, title: "Cloud Computing with AWS", categoryName: "DevOps", level: "Intermediate", price: 89, rating: 4.8, averageRating: 4.8, enrolledCount: 156, instructorName: "Yara Magdy", gradient: "linear-gradient(135deg, #99e4dd 0%, #115e58 100%)" },
  { courseId: 6, title: "Build a SaaS with Next.js", categoryName: "Web Development", level: "Advanced", price: 99, rating: 4.9, averageRating: 4.9, enrolledCount: 263, instructorName: "Sara Ahmed", gradient: "linear-gradient(135deg, #ccf2ee 0%, #5fd1c7 100%)", hot: true },
  { courseId: 7, title: "Advanced TypeScript Patterns", categoryName: "Web Development", level: "Advanced", price: 69, rating: 4.8, averageRating: 4.8, enrolledCount: 187, instructorName: "Karim Hassan", gradient: "linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)" },
  { courseId: 8, title: "Deep Learning with PyTorch", categoryName: "AI & Data", level: "Advanced", price: 119, rating: 4.9, averageRating: 4.9, enrolledCount: 94, instructorName: "Dr. Omar Tarek", gradient: "linear-gradient(135deg, #c4b5fd 0%, #6d28d9 100%)", hot: true },
  { courseId: 9, title: "Figma for Developers", categoryName: "Design", level: "Beginner", price: 0, isFree: true, rating: 4.7, averageRating: 4.7, enrolledCount: 312, instructorName: "Nour Rashad", gradient: "linear-gradient(135deg, #fdba74 0%, #ea580c 100%)" },
];

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function CourseCard({ course, actionSlot, linkTo }) {
  const isCourseFree = course.isFree || course.price === 0;
  return (
    <div className="course-card">
      <Link to={linkTo} className="block no-underline text-inherit">
        <div className="course-card__thumb">
          {course.imgPath ? (
            <img src={getFullUrl(course.imgPath)} alt={course.title} />
          ) : (
            <div
              className="course-card__thumb-bg"
              style={{ background: course.gradient || "var(--gradient-primary)" }}
            >
              <BookOpen size={40} />
            </div>
          )}
          {!isCourseFree && (
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: 9999,
                backdropFilter: "blur(6px)",
              }}
            >
              ${course.price}
            </span>
          )}
          {isCourseFree && (
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "hsl(142 76% 36% / .85)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: 9999,
              }}
            >
              FREE
            </span>
          )}
        </div>
      </Link>
      <div className="course-card__body">
        <Link to={linkTo} className="flex flex-1 flex-col gap-2 no-underline text-inherit">
          <div className="course-card__cat">{course.categoryName}</div>
          <p className="course-card__title">{course.title}</p>
          <div className="course-card__instructor">{course.instructorName}</div>
          <div className="course-card__meta">
            <span className="row gap-1" style={{ color: "var(--amber-500)" }}>
              {[...Array(4)].map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
              <Star size={12} fill="none" />
            </span>
            <span className="row gap-1">
              <Users size={12} />
              {course.enrolledCount || 0}
            </span>
          </div>
        </Link>
        {actionSlot && <div className="mt-2">{actionSlot}</div>}
      </div>
    </div>
  );
}

function CourseListItem({ course, actionSlot, linkTo }) {
  const isCourseFree = course.isFree || course.price === 0;
  return (
    <div className="clist-item">
      <Link to={linkTo} className="block no-underline text-inherit">
      <div
        className="clist-item__thumb"
          style={!course.imgPath ? { background: course.gradient || "var(--gradient-primary)" } : {}}
      >
          {course.imgPath ? (
            <img
              src={getFullUrl(course.imgPath)}
              alt={course.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <BookOpen size={40} style={{ color: "rgba(255,255,255,0.7)" }} />
          )}
        </div>
      </Link>
      <div className="clist-item__body">
        <Link to={linkTo} className="block no-underline text-inherit">
          <div className="row gap-2" style={{ marginBottom: 4 }}>
            <span className="overline" style={{ color: "var(--teal-700)" }}>
              {course.categoryName}
            </span>
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              margin: "4px 0 6px",
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </h3>
          <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 10 }}>
            {course.instructorName}
          </div>
          <div
            className="row gap-4"
            style={{ fontSize: 13, color: "var(--fg-2)", flexWrap: "wrap" }}
          >
            <span className="row gap-1" style={{ color: "var(--amber-500)" }}>
              <Star size={13} fill="currentColor" />
              <strong style={{ color: "var(--fg-1)" }}>4.0</strong>
            </span>
            <span className="row gap-1">
              <Users size={13} /> {course.enrolledCount || 0}
            </span>
          </div>
        </Link>
        <div
          className="row"
          style={{ justifyContent: "space-between", marginTop: "auto", paddingTop: 14 }}
        >
          <span
            className="course-card__price"
            style={{ fontSize: 22 }}
          >
            {isCourseFree ? (
              <span style={{ color: "hsl(var(--success))" }}>Free</span>
            ) : (
              `$${course.price}`
            )}
          </span>
          {actionSlot}
        </div>
      </div>
    </div>
  );
}

const BrowseCourses = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [minimumRating, setMinimumRating] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [pageNumber, setPageNumber] = useState(1);
  const [view, setView] = useState("grid");
  const pageSize = 8;

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery(
    {
      queryKey: ["categories"],
      queryFn: async () => {
        const response = await api.get("/api/Category/list");
        return { data: response.data };
      },
    },
  );

  const { data: coursesResponse, isLoading: isCoursesLoading } = useQuery({
    queryKey: [
      "courses",
      debouncedSearchTerm,
      selectedCategoryId,
      sortBy,
      pageNumber,
    ],
    queryFn: async () => {
      if (!selectedCategoryId) {
        return courseService.getAll({
          name: debouncedSearchTerm,
          pageNumber,
          pageSize,
          sortBy,
        });
      }
      return courseService.getByCategory(selectedCategoryId);
    },
  });

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearchTerm, selectedCategoryId, sortBy]);

  const { data: enrollmentsResponse = { data: [] } } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: async () => {
      try {
        return await enrollmentService.getByStudent(user.id);
      } catch (error) {
        if (error.response?.status === 404) return { success: true, data: [] };
        throw error;
      }
    },
    enabled: !!user && (user?.role === "Student" || user?.role === "Administrator"),
  });

  const enrollments = enrollmentsResponse.data || [];
  const isEnrolled = (courseId) =>
    enrollments.some((e) => String(e.courseId) === String(courseId));

  const apiCategories = categoriesResponse?.data || [];
  const categories = apiCategories.length > 0 ? apiCategories : FALLBACK_CATEGORIES;
  const coursesData = coursesResponse?.data || coursesResponse || {};
  const apiCourses =
    coursesData.data || (Array.isArray(coursesData) ? coursesData : []);
  const courses = apiCourses.length > 0 ? apiCourses : FALLBACK_COURSES;
  const totalPages = coursesData.totalPages || 1;

  const selectedCategory = categories.find(
    (c) => c.categoryId === selectedCategoryId,
  );

  const visibleCourses = courses.filter((course) => {
    const price = Number(course.price || 0);
    const isFree = course.isFree || price === 0;
    const courseLevel = course.level || course.difficulty || "All Levels";
    const rating = Number(course.averageRating || course.rating || 4);
    const search = debouncedSearchTerm.trim().toLowerCase();

    if (
      search &&
      !`${course.title || ""} ${course.instructorName || ""} ${course.categoryName || ""}`
        .toLowerCase()
        .includes(search)
    ) return false;
    if (selectedCategory && course.categoryName !== selectedCategory.categoryName) return false;
    if (selectedLevels.length && !selectedLevels.includes(courseLevel)) return false;
    if (selectedPrice === "free" && !isFree) return false;
    if (selectedPrice === "under-50" && price >= 50) return false;
    if (selectedPrice === "paid" && isFree) return false;
    if (minimumRating && rating < minimumRating) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setSelectedLevels([]);
    setSelectedPrice("all");
    setMinimumRating(null);
  };

  const clearCategory = () => setSelectedCategoryId(null);
  const toggleLevel = (level) => {
    setSelectedLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level],
    );
  };

  function renderAction(course) {
    const isCourseFree = course.isFree || course.price === 0;
    if (user?.role === "Instructor" && course.instructorId === user.id) {
      return (
        <Button asChild variant="outline" size="sm">
          <Link to={`/dashboard/courses/${course.courseId}`}>Manage</Link>
        </Button>
      );
    }
    if (isEnrolled(course.courseId)) {
      return (
        <Button asChild size="sm">
          <Link to={`/dashboard/courses/${course.courseId}`}>
            <Play size={12} fill="currentColor" /> Continue
          </Link>
        </Button>
      );
    }
    if (isCourseFree) {
      return (
        <Button asChild size="sm" variant="success">
          <Link to={`/courses/${course.courseId}`}>
            <Sparkles size={12} /> Enroll Free
          </Link>
        </Button>
      );
    }
    return (
      <Button asChild size="sm">
        <Link to={`/courses/${course.courseId}`}>View Details</Link>
      </Button>
    );
  }

  if (isCoursesLoading || isCategoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Page head */}
      <div className="page__head">
        <div>
          <h1 className="page__title">Browse Courses</h1>
          <p className="page__subtitle">
            {visibleCourses.length} courses available · Updated daily
          </p>
        </div>
        <div className="row gap-2">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--teal-700)",
              background: "hsl(174 72% 32% / .08)",
              padding: "6px 12px",
              borderRadius: 9999,
            }}
          >
            <Sparkles size={12} /> 500+ Courses
          </span>
        </div>
      </div>

      <div className="browse-grid">
        {/* Filter sidebar */}
        <aside className="filters">
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 16 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
              Filters
            </h3>
            {(selectedCategoryId || selectedLevels.length > 0 || selectedPrice !== "all" || minimumRating) && (
              <Button
                type="button"
                variant="link"
                onClick={clearFilters}
                className="h-auto p-0 text-xs font-semibold text-primary"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="filters__group" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
            <div className="filters__label">Search</div>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--fg-3)",
                  pointerEvents: "none",
                }}
              />
              <Input
                type="text"
                placeholder="Search courses…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-[38px] bg-white pl-8 pr-3 text-[13px]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="filters__group">
            <div className="filters__label">Category</div>
            <div className="col">
              <label className="filter-opt">
                <input
                  type="checkbox"
                  checked={selectedCategoryId === null}
                  onChange={() => setSelectedCategoryId(null)}
                  readOnly
                />
                <span>All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.categoryId} className="filter-opt">
                  <input
                    type="checkbox"
                    checked={selectedCategoryId === cat.categoryId}
                    onChange={() =>
                      setSelectedCategoryId(
                        selectedCategoryId === cat.categoryId
                          ? null
                          : cat.categoryId,
                      )
                    }
                  />
                  <span>{cat.categoryName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters__group">
            <div className="filters__label">Level</div>
            <div className="col">
              {["Beginner", "Intermediate", "Advanced", "All Levels"].map((level) => (
                <label key={level} className="filter-opt">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(level)}
                    onChange={() => toggleLevel(level)}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters__group">
            <div className="filters__label">Price</div>
            <div className="col">
              {[
                ["all", "All prices"],
                ["free", "Free"],
                ["under-50", "Under $50"],
                ["paid", "Paid"],
              ].map(([value, label]) => (
                <label key={value} className="filter-opt">
                  <input
                    type="checkbox"
                    checked={selectedPrice === value}
                    onChange={() => setSelectedPrice(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters__group">
            <div className="filters__label">Rating</div>
            <div className="col">
              {[4.5, 4, 3.5].map((rating) => (
                <label key={rating} className="filter-opt">
                  <input
                    type="checkbox"
                    checked={minimumRating === rating}
                    onChange={() =>
                      setMinimumRating(minimumRating === rating ? null : rating)
                    }
                  />
                  <span className="row gap-1">
                    <span className="stars" style={{ color: "var(--amber-500)" }}>
                      {[0, 1, 2, 3, 4].map((index) => (
                        <Star
                          key={index}
                          size={12}
                          fill={index < Math.floor(rating) ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                    <span>& up</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="filters__group">
            <div className="filters__label">Sort By</div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="newest">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="title">Alphabetical (A–Z)</option>
            </select>
          </div>
        </aside>

        {/* Main content */}
        <div className="col">
          {/* Active filter chips */}
          {(selectedCategory || selectedLevels.length > 0 || selectedPrice !== "all" || minimumRating) && (
            <div className="active-filters">
              {selectedCategory && (
                <span className="filter-chip">
                  {selectedCategory.categoryName}
                  <Button type="button" variant="ghost" size="icon" onClick={clearCategory} aria-label="Remove category filter">
                    <X size={12} />
                  </Button>
                </span>
              )}
              {selectedLevels.map((level) => (
                <span key={level} className="filter-chip">
                  {level}
                  <Button type="button" variant="ghost" size="icon" onClick={() => toggleLevel(level)} aria-label={`Remove ${level}`}>
                    <X size={12} />
                  </Button>
                </span>
              ))}
              {selectedPrice !== "all" && (
                <span className="filter-chip">
                  {selectedPrice === "under-50" ? "Under $50" : selectedPrice}
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedPrice("all")} aria-label="Remove price filter">
                    <X size={12} />
                  </Button>
                </span>
              )}
              {minimumRating && (
                <span className="filter-chip">
                  {minimumRating}+ stars
                  <Button type="button" variant="ghost" size="icon" onClick={() => setMinimumRating(null)} aria-label="Remove rating filter">
                    <X size={12} />
                  </Button>
                </span>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="browse-toolbar">
            <div
              className="row gap-2"
              style={{ fontSize: 14, color: "var(--fg-2)" }}
            >
              Showing{" "}
              <strong style={{ color: "var(--fg-1)" }}>{visibleCourses.length}</strong>{" "}
              courses
            </div>
            <div className="row gap-3">
              <div className="view-toggle">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={view === "list" ? "active" : ""}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {visibleCourses.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid hsl(var(--border))",
                borderRadius: 16,
                padding: 64,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 9999,
                  background: "var(--slate-100)",
                  color: "var(--slate-400)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={32} />
              </div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: "20px 0 8px",
                }}
              >
                No courses match your filters
              </h3>
              <p style={{ color: "var(--fg-2)", margin: "0 0 20px" }}>
                Try adjusting your search or clearing a filter.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : view === "grid" ? (
            <div className="grid-3">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.courseId}
                  course={course}
                  linkTo={`/courses/${course.courseId}`}
                  actionSlot={renderAction(course)}
                />
              ))}
            </div>
          ) : (
            <div className="col gap-3">
              {visibleCourses.map((course) => (
                <CourseListItem
                  key={course.courseId}
                  course={course}
                  linkTo={`/courses/${course.courseId}`}
                  actionSlot={renderAction(course)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !selectedCategoryId && (
            <div className="pager">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  type="button"
                  variant={pageNumber === i + 1 ? "default" : "outline"}
                  size="icon"
                  key={i + 1}
                  className={pageNumber === i + 1 ? "active" : ""}
                  onClick={() => setPageNumber(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseCourses;
