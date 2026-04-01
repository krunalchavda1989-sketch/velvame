import { useState } from "react";
import { Star, Upload, X, Loader2 } from "lucide-react";
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

const ProductReviewForm = ({ productId, userId, userName, orderId, onSubmitted }: ProductReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState(userName);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Write a Review</h3>

      {/* Star Rating */}
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Rating *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i)}
              className="p-0.5"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  i <= (hoverRating || rating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground">Review Title (optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="mt-1 bg-background border-border"
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground">Your Review *</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts about this product..."
          maxLength={1000}
          rows={4}
          className="mt-1 bg-background border-border resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{body.length}/1000</p>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground">Display Name</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="mt-1 bg-background border-border"
        />
      </div>

      {/* Image Upload */}
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Photos (optional, max 3)</Label>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit Review"}
      </Button>
    </div>
  );
};

export default ProductReviewForm;
