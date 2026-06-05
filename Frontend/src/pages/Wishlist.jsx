import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import wishlistService from "@/api/wishlist";
import cartService from "@/api/cart";
import { getFullUrl } from "@/lib/urlHelper";

const Wishlist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: response = { data: [] }, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistService.getAll,
  });

  const wishlist = response.data || [];

  const removeMutation = useMutation({
    mutationFn: wishlistService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: cartService.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart" });
    },
    onError: (error) => {
      toast({
        title: "Could not add to cart",
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
          <h1 className="page__title">Wishlist</h1>
          <p className="page__subtitle">Courses you saved for later.</p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">
              Your wishlist is empty.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {wishlist.map((item) => {
            const course = item.course;
            const isFree = course.isFree || Number(course.price || 0) === 0;

            return (
              <Card key={item.wishlistItemId || item.courseId}>
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
                      {isFree ? "Free" : `$${course.price}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:w-40">
                    {!isFree && (
                      <Button
                        onClick={() => addToCartMutation.mutate(course.courseId)}
                        disabled={addToCartMutation.isPending}
                        className="gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" /> Add to Cart
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => removeMutation.mutate(course.courseId)}
                      disabled={removeMutation.isPending}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
