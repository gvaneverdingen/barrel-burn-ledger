import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
}

interface ReviewListProps {
  /** The user/distillery profile_id being reviewed */
  reviewedId: string;
}

export const ReviewList = ({ reviewedId }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('reviewed_id', reviewedId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) setReviews(data);
      setLoading(false);
    };

    fetchReviews();
  }, [reviewedId]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No reviews yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="text-lg font-bold">{avgRating}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), 'dd MMM yyyy')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                  {review.comment}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
