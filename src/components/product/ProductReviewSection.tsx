import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

  // Check if user has a delivered order containing this product
  const { data: eligibility } = useQuery({
    queryKey: ["review-eligibility", user?.id, productId],
    queryFn: async () => {
      if (!user) return { canReview: false, orderId: null, userName: "" };

      // Check if user already reviewed
      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) return { canReview: false, alreadyReviewed: true, orderId: null, userName: "" };

      // Check for delivered orders with this product
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(id, user_id, status)")
        .eq("product_id", productId)
        .eq("orders.user_id" as any, user.id)
        .eq("orders.status" as any, "delivered");

      const hasDelivered = orderItems && orderItems.length > 0;
      const orderId = hasDelivered ? (orderItems[0] as any).order_id : null;

      // Get user name
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

  return (
    <div className="mt-12 border-t border-border pt-8">
      <ProductReviewDisplay reviews={approvedReviews} averageRating={averageRating} reviewCount={reviewCount} />

      {/* Review Form or Message */}
      <div className="mt-8">
        {!user ? (
          <p className="text-sm text-muted-foreground italic">Please log in to leave a review.</p>
        ) : eligibility?.alreadyReviewed ? (
          <p className="text-sm text-muted-foreground italic">✅ You have already reviewed this product.</p>
        ) : eligibility?.canReview && eligibility.orderId ? (
          <ProductReviewForm
            productId={productId}
            userId={user.id}
            userName={eligibility.userName}
            orderId={eligibility.orderId}
            onSubmitted={refetchReviews}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Only customers who have purchased and received this product can leave a review.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductReviewSection;
