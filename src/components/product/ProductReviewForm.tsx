import { useState } from "react";
import { Star, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductReviewFormProps {
  productId: string;
  userId: string;
  userName: string;
  orderId: string;
  onSubmitted: () => void;
}

const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const ProductReviewForm = ({ productId, userId, userName, orderId, onSubmitted }: ProductReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState(userName);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeRating = hoverRating || rating;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }

    setUploading(true);
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `${userId}/${productId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("review-images").upload(path, file);
      if (error) {
        toast.error("Upload failed");
        continue;
      }
      const { data: urlData } = supabase.storage.from("review-images").getPublicUrl(path);
      newImages.push(urlData.publicUrl);
    }
    setImages((prev) => [...prev, ...newImages]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (!body.trim()) { toast.error("Please write a review"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: userId,
      order_id: orderId,
      reviewer_name: displayName || "Anonymous",
      rating,
      review_title: title.trim(),
      review_body: body.trim(),
      images: images,
      is_verified_purchase: true,
      status: "pending",
    } as any);

    if (error) {
      if (error.code === "23505") toast.error("You have already reviewed this product");
      else toast.error("Failed to submit review");
    } else {
      toast.success("Thank you for your review! It will be visible once approved by our team.");
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-6 py-4">
        <h3 className="text-lg font-display font-bold text-foreground">Write Your Review</h3>
        <p className="text-sm text-muted-foreground">Share your honest experience with this product</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Star Rating */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">
            Overall Rating <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-150 ${
                      i <= activeRating
                        ? "text-yellow-500 fill-yellow-500 scale-110"
                        : "text-muted-foreground/25 hover:text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            {activeRating > 0 && (
              <span className="text-sm font-medium text-foreground animate-in fade-in duration-200">
                {ratingLabels[activeRating]}
              </span>
            )}
          </div>
        </div>

        {/* Two column layout for title & name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Review Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              className="bg-background border-border"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-background border-border"
            />
          </div>
        </div>

        {/* Review Body */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-1.5 block">
            Your Review <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you like or dislike? How did this product perform for you?"
            maxLength={1000}
            rows={4}
            className="bg-background border-border resize-none"
          />
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-muted-foreground">Minimum 10 characters recommended</p>
            <p className="text-xs text-muted-foreground">{body.length}/1000</p>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Add Photos <span className="text-muted-foreground font-normal">(optional, max 3)</span>
          </Label>
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-border">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="bg-white/90 rounded-full p-1.5 hover:bg-white transition-colors"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Add Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your review will be published after approval.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewForm;
