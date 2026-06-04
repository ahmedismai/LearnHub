import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, History, User, BookOpen, CheckCircle, XCircle, Loader2 } from "lucide-react";
import orderService from "@/api/order";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const AdminPayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordersResponse = {}, isLoading } = useQuery({
    queryKey: ["Administrator", "payments"],
    queryFn: () => orderService.getAll(),
  });

  const orders = ordersResponse.data || [];

  const reviewMutation = useMutation({
    mutationFn: (reviewData) => orderService.review(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(["Administrator", "payments"]);
      toast({ title: "Order status updated successfully!" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    }
  });

  const totalRevenue = orders
    .filter(o => o.status === "Approved")
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  if (isLoading) return <div className="p-8"><Skeleton className="h-80 w-full" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Order Management</h1>
          <p className="page__subtitle">
            Review and approve course purchase requests.
          </p>
        </div>
        <Card className="surface-glass border-primary/20 bg-primary/5">
          <CardContent className="py-4 px-6 flex items-center gap-4">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transaction Requests
          </CardTitle>
          <CardDescription>Manage enrollment requests for paid courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-list">
            <div className="data-list__head grid-cols-[1.3fr,1.4fr,0.7fr,0.8fr,0.8fr,0.8fr]">
              <span>Student</span>
              <span>Course</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-right">Actions</span>
            </div>
              {orders.map((o) => (
                <div key={o.orderId} className="data-list__row grid-cols-[1.3fr,1.4fr,0.7fr,0.8fr,0.8fr,0.8fr]">
                  <div className="data-list__cell" data-label="Student">
                    <div className="flex items-center gap-2 font-medium">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                        {o.studentName ? o.studentName[0] : "U"}
                      </div>
                      <div className="flex flex-col">
                         <span>{o.studentName || "Unknown Student"}</span>
                        <span className="text-[10px] text-muted-foreground">ID: {o.studentId?.substring(0,8) || "N/A"}...</span>
                      </div>
                    </div>
                  </div>
                  <div className="data-list__cell" data-label="Course">
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <BookOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{o.courseTitle}</span>
                    </div>
                  </div>
                  <div className="data-list__cell font-bold text-primary" data-label="Amount">${o.price}</div>
                  <div className="data-list__cell" data-label="Status">
                    <Badge 
                      variant={
                        o.status === "Approved" ? "success" : 
                        o.status === "Pending" ? "warning" : "destructive"
                      }
                    >
                      {o.status}
                    </Badge>
                  </div>
                  <div className="data-list__cell text-muted-foreground text-sm" data-label="Date">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                  <div className="data-list__cell data-list__actions" data-label="Actions">
                    {o.status === "Pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => reviewMutation.mutate({ orderId: o.orderId, isApproved: true, rejectionReason: "" })}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/5"
                          onClick={() => {
                            const reason = window.prompt("Rejection reason:", "Payment not verified");
                            if (reason !== null) {
                              reviewMutation.mutate({ orderId: o.orderId, isApproved: false, rejectionReason: reason });
                            }
                          }}
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Processed</span>
                    )}
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                 <div className="empty-state text-muted-foreground">
                       No orders found in the platform history.
                 </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
