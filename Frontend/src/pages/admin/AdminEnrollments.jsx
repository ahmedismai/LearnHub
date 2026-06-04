import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Calendar, Trash2, Loader2, Search, Eye, Edit2, Info, CreditCard, User, ExternalLink, Image as ImageIcon, Filter } from "lucide-react";
import enrollmentService from "@/api/enrollment";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@uidotdev/usehooks";
import { getFullUrl } from "@/lib/urlHelper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminEnrollments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const [editData, setEditData] = useState({
    courseId: 0,
    studentId: "",
  });

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // 1. Fetch List
  const { data: enrollmentsResponse = {}, isLoading: isListLoading, isError, error } = useQuery({
    queryKey: ["admin", "enrollments", pageNumber, debouncedSearch],
    queryFn: () => enrollmentService.getAll({ 
      pageNumber, 
      pageSize, 
      searchTerm: debouncedSearch 
    }),
    retry: false
  });

  // 2. Fetch Single Details
  const { data: detailsResponse, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["enrollment-details", selectedEnrollmentId],
    queryFn: () => enrollmentService.getById(selectedEnrollmentId),
    enabled: !!selectedEnrollmentId && isDetailsDialogOpen,
  });

  const enrollmentDetails = detailsResponse?.data;

  const deleteMutation = useMutation({
    mutationFn: (id) => enrollmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "enrollments"]);
      toast({ title: "Enrollment removed successfully" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => enrollmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "enrollments"]);
      toast({ title: "Enrollment updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.response?.data?.message || "Verify Student ID and Course ID.",
      });
    }
  });

  const enrollments = enrollmentsResponse.data || [];
  const totalPages = enrollmentsResponse.totalPages || 1;

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch]);

  const handleEditClick = (e) => {
    setSelectedEnrollmentId(e.enrollmentId);
    setEditData({
      courseId: e.courseId,
      studentId: e.studentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDetailsClick = (id) => {
    setSelectedEnrollmentId(id);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: selectedEnrollmentId,
      data: {
        courseId: Number(editData.courseId),
        studentId: editData.studentId,
      },
    });
  };

  if (isListLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const isNoDataError = isError && (error.response?.data?.success === false);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Enrollment Management</h1>
          <p className="page__subtitle">
            Platform-wide student-course records and access control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search student or course..." 
              className="h-11 pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="surface-glass overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-background/50 pb-4">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-outfit text-xl">Active Records</CardTitle>
                <CardDescription>Verified student enrollments</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-white/80 px-3 py-1.5 rounded-full border border-border/40">
              <span className="text-primary">{enrollmentsResponse.totalItems || enrollments.length}</span> Records
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isNoDataError || enrollments.length === 0 ? (
            <div className="empty-state">
               <div className="rounded-full bg-muted p-4 text-muted-foreground">
                 <Users className="w-12 h-12" />
               </div>
               <p className="font-medium italic">{isNoDataError ? error.response?.data?.message : "No enrollment data available."}</p>
               {searchTerm && <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>Clear Search</Button>}
            </div>
          ) : (
            <>
              <div className="data-list">
                <div className="data-list__head grid-cols-[1.3fr,1.3fr,1fr,1fr]">
                  <span>Student</span>
                  <span>Course Target</span>
                  <span>Enrollment Date</span>
                  <span className="text-right">Actions</span>
                </div>
                  {enrollments.map((e) => (
                    <div key={e.enrollmentId} className="data-list__row grid-cols-[1.3fr,1.3fr,1fr,1fr] group">
                      <div className="data-list__cell" data-label="Student">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-white shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {e.studentName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm">{e.studentName || "N/A"}</span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{e.studentId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="data-list__cell" data-label="Course Target">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-accent/10 text-accent">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-[200px] font-semibold text-sm">{e.courseTitle}</span>
                        </div>
                      </div>
                      <div className="data-list__cell" data-label="Enrollment Date">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-primary/60" />
                          {new Date(e.enrollmentDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                      </div>
                      <div className="data-list__cell data-list__actions" data-label="Actions">
                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => handleDetailsClick(e.enrollmentId)}
                            title="Quick Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-colors"
                            onClick={() => handleEditClick(e)}
                            title="Edit IDs"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                              if (confirm("Are you sure? This student will lose course access.")) {
                                deleteMutation.mutate(e.enrollmentId);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-6 bg-slate-50/30 border-t border-border/40">
                  <Button 
                    variant="ghost" size="sm" className="h-9 px-4 rounded-lg"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(prev => prev - 1)}
                  >Previous</Button>
                  <div className="text-sm font-bold bg-white border border-border/40 px-4 py-1.5 rounded-full shadow-sm">
                    Page <span className="text-primary">{pageNumber}</span> / {totalPages}
                  </div>
                  <Button 
                    variant="ghost" size="sm" className="h-9 px-4 rounded-lg"
                    disabled={pageNumber >= totalPages}
                    onClick={() => setPageNumber(prev => prev + 1)}
                  >Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Details Dialog (PREVIEW) --- */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {isDetailsLoading ? (
            <div className="py-20 flex flex-col items-center gap-4 bg-white">
              <Loader2 className="animate-spin text-primary w-10 h-10" />
              <p className="text-muted-foreground animate-pulse font-medium">Fetching details from server...</p>
            </div>
          ) : enrollmentDetails ? (
            <div className="animate-in fade-in zoom-in duration-300 bg-white">
               {/* Header / Thumbnail */}
               <div className="relative h-56 bg-slate-900">
                  {enrollmentDetails.course?.imgPath ? (
                    <img 
                      src={getFullUrl(enrollmentDetails.course.imgPath)} 
                      alt="Course" 
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                       <ImageIcon className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8">
                     <Badge className="mb-3 bg-white/20 text-white backdrop-blur-md border-none px-3 py-1 uppercase tracking-widest text-[10px] font-bold">
                        {enrollmentDetails.course?.categoryName || "General"}
                     </Badge>
                     <h2 className="text-2xl font-extrabold text-white leading-tight line-clamp-2 font-outfit">
                        {enrollmentDetails.course?.title}
                     </h2>
                  </div>
               </div>

               <div className="p-8 space-y-8">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                     <Avatar className="h-14 w-14 border-4 border-white shadow-md">
                        <AvatarFallback className="bg-primary text-white font-bold text-xl">
                          {enrollmentDetails.student?.fullName?.[0]}
                        </AvatarFallback>
                     </Avatar>
                     <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Student Identity</p>
                        <p className="font-extrabold text-slate-900 text-lg font-outfit">{enrollmentDetails.student?.fullName}</p>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{enrollmentDetails.studentId}</p>
                     </div>
                  </div>

                  {/* Payment & Enrollment Stats */}
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5 p-5 rounded-[1.5rem] bg-primary/[0.03] border border-primary/10">
                        <p className="text-[10px] font-bold text-primary/60 uppercase flex items-center gap-1.5 tracking-wider">
                           <CreditCard className="w-3 h-3" /> Transaction
                        </p>
                        <p className="text-2xl font-black text-primary font-outfit">
                           {enrollmentDetails.course?.isFree || enrollmentDetails.course?.price === 0 ? (
                             <span className="text-success">FREE</span>
                           ) : `$${enrollmentDetails.course?.price}`}
                        </p>
                     </div>
                     <div className="space-y-1.5 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider">
                           <Calendar className="w-3 h-3" /> Date Enrolled
                        </p>
                        <p className="text-lg font-bold text-slate-900 font-outfit">
                           {new Date(enrollmentDetails.enrollmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                     </div>
                  </div>

                  {/* Course Quick Links */}
                  <div className="flex gap-4 pt-2">
                     <Button asChild className="flex-1 rounded-2xl h-14 font-bold shadow-glow hover:shadow-lg transition-all duration-300">
                        <Link to={`/dashboard/courses/${enrollmentDetails.courseId}`}>
                           Manage Curriculum
                        </Link>
                     </Button>
                     <Button variant="outline" className="rounded-2xl h-14 px-8 border-slate-200 hover:bg-slate-50 transition-colors" onClick={() => setIsDetailsDialogOpen(false)}>
                        Dismiss
                     </Button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="p-16 text-center space-y-5 bg-white">
               <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                 <ImageIcon className="w-8 h-8" />
               </div>
               <p className="font-bold text-slate-900 font-outfit text-xl">Data Mismatch</p>
               <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">Unable to retrieve detailed records for this enrollment.</p>
               <Button onClick={() => setIsDetailsDialogOpen(false)} variant="secondary" className="rounded-xl px-8">Close Viewer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Edit Dialog (UPDATE) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-outfit text-slate-900">Update Enrollment</DialogTitle>
            <DialogDescription className="text-slate-500">Carefully modify the target identifiers for this record.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2.5">
              <Label htmlFor="courseId" className="font-bold text-slate-700 text-xs uppercase tracking-widest ml-1">Target Course ID</Label>
              <Input 
                id="courseId" type="number" className="rounded-2xl h-12 border-slate-200 focus:ring-primary/20 focus:border-primary transition-all"
                value={editData.courseId} 
                onChange={(e) => setEditData({ ...editData, courseId: e.target.value })}
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="studentId" className="font-bold text-slate-700 text-xs uppercase tracking-widest ml-1">Student UUID</Label>
              <Input 
                id="studentId" className="rounded-2xl h-12 font-mono text-sm border-slate-200 focus:ring-primary/20 focus:border-primary transition-all"
                value={editData.studentId} 
                onChange={(e) => setEditData({ ...editData, studentId: e.target.value })}
              />
            </div>
            <div className="p-4 bg-amber-50/80 rounded-[1.25rem] border border-amber-100 flex gap-3">
               <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
               <p className="text-[11px] text-amber-800 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block mb-0.5">Administrative Caution</span>
                  Reassigning these IDs will immediately shift course access. Verify the new Course ID and Student UUID before confirming.
               </p>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0 mt-2">
            <Button variant="ghost" className="rounded-2xl h-12 px-6" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-2xl h-12 px-10 font-bold shadow-accent-glow" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnrollments;
