import { useState } from "react";
import { Star, CheckCircle, ChevronDown, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Review {
  id: string;
  rating: number;
  review_title: string;
  review_body: string;
  reviewer_name: string;
  is_verified_purchase: boolean;
  review_date: string;
  images: string[];
}

interface ProductReviewDisplayProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

const StarBreakdown = ({ reviews, total }: { reviews: Review[]; total: number }) => {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-8 text-right text-muted-foreground">{star}★</span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-muted-foreground text-xs">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => {
  const images = Array.isArray(review.images) ? review.images : [];
  return (
    <div className="py-5 border-b border-border last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
              ))}
            </div>
            {review.review_title && <span className="font-semibold text-sm text-foreground">{review.review_title}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{review.reviewer_name}</span>
            {review.is_verified_purchase && (
              <span className="flex items-center gap-0.5 text-green-600">
                <CheckCircle className="h-3 w-3" /> Verified Purchase
              </span>
            )}
            <span>·</span>
            <span>{new Date(review.review_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.review_body}</p>
      {images.length > 0 && (
        <div className="flex gap-2 mt-3">
          {images.map((img, i) => (
            <a key={i} href={img} target="_blank" rel="noopener noreferrer">
              <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-border hover:opacity-80 transition" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductReviewDisplay = ({ reviews, averageRating, reviewCount }: ProductReviewDisplayProps) => {
  const [sortBy, setSortBy] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(5);

  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
  });

  const visible = sorted.slice(0, visibleCount);

  if (reviewCount === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-display font-bold text-foreground mb-6">Customer Reviews</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Aggregate */}
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-2 justify-center md:justify-start">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-5 w-5 ${i <= Math.round(averageRating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
        </div>

        {/* Breakdown */}
        <div className="md:col-span-2">
          <StarBreakdown reviews={reviews} total={reviewCount} />
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-9">
            <SortAsc className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review List */}
      <div className="divide-y divide-border">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {visibleCount < reviews.length && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => setVisibleCount((v) => v + 10)}>
            <ChevronDown className="h-4 w-4 mr-2" />
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductReviewDisplay;
