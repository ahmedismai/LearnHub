import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import orderService from "@/api/order";
import enrollmentService from "@/api/enrollment";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.orders)) return response.orders;
  return [];
};

const formatDate = (value, fallback = "N/A") =>
  value ? new Date(value).toLocaleDateString() : fallback;

const MyOrders = () => {
  const { user } = useAuth();

  const { data: ordersResponse = {}, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => orderService.getMyOrders(),
  });

  const { data: enrollmentsResponse = {}, isLoading: isEnrollmentsLoading } =
    useQuery({
      queryKey: ["student-enrollments", user?.id],
      queryFn: () => enrollmentService.getByStudent(user.id),
      enabled: !!user?.id,
    });

  const orders = unwrapList(ordersResponse);
  const enrollments = unwrapList(enrollmentsResponse);
  const orderCourseIds = new Set(
    orders
      .map((order) => order.courseId || order.course?.courseId || order.course?.id)
      .filter(Boolean)
      .map(String),
  );
  const freeEnrollments = enrollments.filter((enrollment) => {
    const courseId =
      enrollment.courseId || enrollment.course?.courseId || enrollment.course?.id;
    return courseId && !orderCourseIds.has(String(courseId));
  });
  const rows = [
    ...orders.map((order) => ({ type: "order", data: order })),
    ...freeEnrollments.map((enrollment) => ({
      type: "enrollment",
      data: enrollment,
    })),
  ];

  if (isOrdersLoading || isEnrollmentsLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "Rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">My Order History</h1>
          <p className="page__subtitle">
            Track your course purchase requests and their status.
          </p>
        </div>
      </div>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Orders
          </CardTitle>
          <CardDescription>
            A detailed list of your course enrollment attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.5fr,1fr,0.8fr,1fr,0.9fr,0.9fr,1.2fr]">
              <span>Course</span>
              <span>Type</span>
              <span>Price</span>
              <span>Status</span>
              <span>Date</span>
              <span>Reviewed At</span>
              <span>Notes</span>
            </div>
            {rows.map((row) => {
                const order = row.data;
                const isEnrollment = row.type === "enrollment";
                const orderId = order.orderId || order.enrollmentId || order.id;
                const courseTitle =
                  order.courseTitle ||
                  order.course?.title ||
                  order.courseName ||
                  "Course";
                const price =
                  order.price ?? order.course?.price ?? order.amount ?? 0;
                const status = isEnrollment
                  ? "Approved"
                  : order.status || order.orderStatus || "Pending";
                const createdAt =
                  order.createdAt ||
                  order.orderDate ||
                  order.createdDate ||
                  order.enrolledAt ||
                  order.enrollmentDate;
                const reviewedAt = order.reviewedAt || order.reviewDate;
                const notes =
                  isEnrollment
                    ? "Direct enrollment"
                    :
                  status === "Rejected"
                    ? order.rejectionReason || order.notes || order.adminNotes
                    : order.notes || order.adminNotes;

                return (
                  <div
                    key={orderId || `${courseTitle}-${createdAt}`}
                    className="data-list__row grid-cols-[1.5fr,1fr,0.8fr,1fr,0.9fr,0.9fr,1.2fr]"
                  >
                    <div className="data-list__cell" data-label="Course">
                      <div className="flex items-center gap-2 font-medium">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate max-w-[250px]">
                          {courseTitle}
                        </span>
                      </div>
                    </div>
                    <div className="data-list__cell" data-label="Type">
                      <Badge variant={isEnrollment ? "success" : "secondary"}>
                        {isEnrollment ? "Free Enrollment" : "Paid Order"}
                      </Badge>
                    </div>
                    <div className="data-list__cell font-bold" data-label="Price">
                      {isEnrollment && Number(price) === 0 ? "Free" : `$${price}`}
                    </div>
                    <div className="data-list__cell" data-label="Status">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <Badge
                          variant={
                            status === "Approved"
                              ? "success"
                              : status === "Pending"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>
                    <div className="data-list__cell text-muted-foreground text-sm" data-label="Date">
                      {formatDate(createdAt)}
                    </div>
                    <div className="data-list__cell text-muted-foreground text-sm" data-label="Reviewed At">
                      {formatDate(reviewedAt, "Pending")}
                    </div>
                    <div className="data-list__cell text-sm italic text-muted-foreground truncate" data-label="Notes">
                      {notes || "-"}
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div className="empty-state">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <History className="w-8 h-8 opacity-20" />
                      <p>You haven't placed any orders yet.</p>
                    </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <div className="surface-glass flex gap-4 border-amber-200/70 bg-amber-50/70 p-4 sm:p-6">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800 space-y-1">
          <p className="font-bold">Important Note:</p>
          <p>
            Paid courses require manual verification of payment. Once you place
            an order, our admins will review your transaction. This usually
            takes 12-24 hours. You will gain access to the course content
            automatically once your order is marked as{" "}
            <span className="font-bold">Approved</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
