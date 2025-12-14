import { useState } from 'react';
import { Star, X } from '@phosphor-icons/react';
import Button from './Button';

export default function ServiceReviewModal({ isOpen, onClose, booking, onSubmit }) {
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState({ overall: 0, quality: 0, professionalism: 0, timeliness: 0 });

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      serviceBookingId: booking.id,
      customerId: booking.customerId,
      serviceProviderId: booking.serviceProviderId,
      serviceCatalogId: booking.serviceCatalogId,
      overallRating,
      qualityRating: qualityRating || null,
      professionalismRating: professionalismRating || null,
      timelinessRating: timelinessRating || null,
      comment: comment.trim() || null,
    };

    try {
      await onSubmit(reviewData);
      // Reset form
      setOverallRating(0);
      setQualityRating(0);
      setProfessionalismRating(0);
      setTimelinessRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setOverallRating(0);
      setQualityRating(0);
      setProfessionalismRating(0);
      setTimelinessRating(0);
      setComment('');
      onClose();
    }
  };

  const StarRating = ({ rating, onRatingChange, label, name }) => {
    return (
      <div className="mb-6">
        <label className="block text-body-regular text-charcoal-600 dark:text-cream-50 font-medium mb-3">
          {label} {name === 'overall' && <span className="text-error-text">*</span>}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar({ ...hoveredStar, [name]: star })}
              onMouseLeave={() => setHoveredStar({ ...hoveredStar, [name]: 0 })}
              onClick={() => onRatingChange(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                size={32}
                weight={star <= (hoveredStar[name] || rating) ? 'fill' : 'regular'}
                className={
                  star <= (hoveredStar[name] || rating)
                    ? 'text-warning-text'
                    : 'text-grey-stroke dark:text-charcoal-400'
                }
              />
            </button>
          ))}
          <span className="ml-3 text-body-regular text-charcoal-600 dark:text-cream-50 flex items-center">
            {rating > 0 ? `${rating} / 5` : 'Not rated'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 dark:bg-charcoal-600 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50 dark:bg-charcoal-600 border-b border-grey-stroke dark:border-charcoal-400 p-6 flex items-center justify-between">
          <h2 className="text-display-h3 text-charcoal-600 dark:text-cream-50">Add Review</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-300 dark:hover:text-cream-50 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Service Info */}
          <div className="mb-6 p-4 bg-grey-200 dark:bg-charcoal-500 rounded-lg">
            <h3 className="text-card-h3 text-charcoal-600 dark:text-cream-50 mb-2">
              {booking.serviceName || 'Service'}
            </h3>
            <p className="text-body-small text-charcoal-400 dark:text-charcoal-300">
              Provider: {booking.businessName || booking.providerName || 'N/A'}
            </p>
            <p className="text-body-small text-charcoal-400 dark:text-charcoal-300">
              Booking ID: #{booking.id}
            </p>
          </div>

          {/* Overall Rating */}
          <StarRating
            rating={overallRating}
            onRatingChange={setOverallRating}
            label="Overall Rating"
            name="overall"
          />

          {/* Quality Rating */}
          <StarRating
            rating={qualityRating}
            onRatingChange={setQualityRating}
            label="Quality of Service"
            name="quality"
          />

          {/* Professionalism Rating */}
          <StarRating
            rating={professionalismRating}
            onRatingChange={setProfessionalismRating}
            label="Professionalism"
            name="professionalism"
          />

          {/* Timeliness Rating */}
          <StarRating
            rating={timelinessRating}
            onRatingChange={setTimelinessRating}
            label="Timeliness"
            name="timeliness"
          />

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-body-regular text-charcoal-600 dark:text-cream-50 font-medium mb-3">
              Your Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              className="w-full p-3 border border-grey-stroke dark:border-charcoal-400 bg-white dark:bg-charcoal-500 text-charcoal-600 dark:text-cream-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-32"
              maxLength={1000}
            />
            <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-2">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-grey-stroke dark:border-charcoal-400">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || overallRating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
