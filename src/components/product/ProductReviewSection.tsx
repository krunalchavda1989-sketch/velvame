import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, ShieldCheck, MessageSquarePlus, LogIn, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ProductReviewForm from "./ProductReviewForm";
import ProductReviewDisplay from "./ProductReviewDisplay";

interface ProductReviewSectionProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
  approvedReviews: any[];
  refetchReviews: () => void;
}

const ProductReviewSection = ({ productId, averageRating, reviewCount, approvedReviews, refetchReviews }: ProductReviewSectionProps) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: eligibility } = useQuery({
    queryKey: ["review-eligibility", user?.id, productId],
    queryFn: async () => {
      if (!user) return { canReview: false, orderId: null, userName: "", alreadyReviewed: false };

      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) return { canReview: false, alreadyReviewed: true, orderId: null, userName: "" };

      const { data: userOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "delivered");

      if (!userOrders || userOrders.length === 0) return { canReview: false, orderId: null, userName: "", alreadyReviewed: false };

      const orderIds = userOrders.map((o) => o.id);
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("product_id", productId)
        .in("order_id", orderIds)
        .limit(1);

      const hasDelivered = orderItems && orderItems.length > 0;
      const orderId = hasDelivered ? (orderItems[0] as any).order_id : null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      return {
        canReview: hasDelivered,
        orderId,
        userName: profile?.full_name || "",
        alreadyReviewed: false,
      };
    },
    enabled: !!user,
  });

  const canWrite = eligibility?.canReview && eligibility.orderId;

  return (
    <div className="mt-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Ratings & Reviews</h2>
            <p className="text-sm text-muted-foreground">
              {reviewCount > 0
                ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""} from verified buyers`
                : "Be the first to review this product"}
            </p>
          </div>
        </div>

        {/* Write Review CTA */}
        {canWrite && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form (expandable) */}
      {showForm && canWrite && eligibility && (
        <div className="mb-10 animate-in slide-in-from-top-2 duration-300">
          <ProductReviewForm
            productId={productId}
            userId={user!.id}
            userName={eligibility.userName}
            orderId={eligibility.orderId!}
            onSubmitted={() => {
              setShowForm(false);
              refetchReviews();
            }}
          />
        </div>
      )}

      {/* Review Display */}
      <ProductReviewDisplay reviews={approvedReviews} averageRating={averageRating} reviewCount={reviewCount} />

      {/* Status Messages */}
      {!showForm && (
        <div className="mt-8">
          {!user ? (
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LogIn className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="font-semibold text-foreground">Want to share your experience?</p>
                <p className="text-sm text-muted-foreground">Log in to your account to leave a review for this product.</p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
                  <LogIn className="h-4 w-4" />
                  Log In
                </Button>
              </Link>
            </div>
          ) : eligibility?.alreadyReviewed ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Thank you for your review!</p>
                <p className="text-sm text-muted-foreground">You have already submitted a review for this product.</p>
              </div>
            </div>
          ) : !canWrite ? (
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="font-semibold text-foreground">Verified purchases only</p>
                <p className="text-sm text-muted-foreground">
                  Only customers who have purchased and received this product can leave a review. This ensures authentic feedback.
                </p>
              </div>
              <Link to="/shop">
                <Button variant="outline" size="sm" className="gap-2">
                  <Package className="h-4 w-4" />
                  Shop Now
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProductReviewSection;
