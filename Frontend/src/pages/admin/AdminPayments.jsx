import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, History, User, BookOpen } from "lucide-react";
import api from "@/api/axios";
import { Skeleton } from "@/components/ui/skeleton";

const AdminPayments = () => {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const response = await api.get("/Order");
      return response.data;
    },
  });

  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mt-1">Monitor all platform financial activities</p>
        </div>
        <Card className="bg-primary/5 border-primary/20">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Recent Payments
          </CardTitle>
          <CardDescription>A chronological list of all course purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {p.studentId?.name || p.studentId?.username || "User"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      {p.courseId?.title || "Deleted Course"}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-primary">${p.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 h-7">
                      <CreditCard className="w-3 h-3" />
                      {p.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Success" ? "success" : "destructive"}>
                      {p.status || "Success"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
