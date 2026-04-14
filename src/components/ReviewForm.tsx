import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewFormProps {
  transactionId: string;
  reviewedId: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm = ({ transactionId, reviewedId, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        transaction_id: transactionId,
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this transaction.');
        } else {
          throw error;
        }
      } else {
        toast.success('Review submitted successfully!');
        onReviewSubmitted?.();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating}/5` : 'Select rating'}
        </span>
      </div>
      <Textarea
        placeholder="Share your experience (optional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        size="sm"
        className="heritage-button"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </div>
  );
};
