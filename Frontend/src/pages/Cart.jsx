import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import cartService from "@/api/cart";
import { getFullUrl } from "@/lib/urlHelper";

const Cart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: response = { data: [] }, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getAll,
  });

  const cartItems = response.data || [];
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.course?.price || 0),
    0,
  );

  const removeMutation = useMutation({
    mutationFn: cartService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Removed from cart" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => cartService.checkout("Visa"),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast({
        title: "Checkout submitted",
        description:
          result.skippedExistingOrders > 0
            ? "Existing pending orders were skipped."
            : "Your orders are waiting for admin approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Checkout failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="page__head">
        <div>
          <h1 className="page__title">Cart</h1>
          <p className="page__subtitle">Review courses before creating orders.</p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">Your cart is empty.</p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="grid gap-4">
            {cartItems.map((item) => {
              const course = item.course;
              return (
                <Card key={item.cartItemId || item.courseId}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <Link to={`/courses/${course.courseId}`} className="shrink-0">
                      <img
                        src={getFullUrl(course.imgPath)}
                        alt={course.title}
                        className="h-28 w-full rounded-xl object-cover sm:w-44"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/courses/${course.courseId}`}
                        className="text-lg font-bold text-foreground no-underline"
                      >
                        {course.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {course.categoryName} · By {course.instructorName}
                      </p>
                      <p className="mt-3 text-xl font-extrabold text-primary">
                        ${course.price}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => removeMutation.mutate(course.courseId)}
                      disabled={removeMutation.isPending}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Courses</span>
                <span className="font-semibold">{cartItems.length}</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                variant="gradient"
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending
                  ? "Submitting..."
                  : "Create Orders"}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                Orders are sent to admin approval. Access is granted when payment
                is approved.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Cart;
