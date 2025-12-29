import { useState, useEffect } from 'react';
import { X, Star, Calendar, Scissors, Heart, Clock } from '@phosphor-icons/react';

const ServiceDetailsSheet = ({
  service,
  provider,
  isOpen,
  onClose,
  onBookService,
  allReviews = [],
  bookings = []
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Filter reviews for this specific service when service changes
  useEffect(() => {
    if (service && isOpen) {
      filterServiceReviews();
    }
  }, [service, isOpen, allReviews, bookings]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const filterServiceReviews = () => {
    try {
      setLoadingReviews(true);
      // Filter reviews for this specific service by matching review -> booking -> serviceId
      const serviceReviews = allReviews.filter(review => {
        // Find the booking for this review
        const booking = bookings.find(b => b.id === review.serviceBookingId);
        // Check if booking exists, matches this service ID, and review is not hidden
        return booking && booking.serviceId === service.id && !review.isHidden;
      });
      console.log(`[ServiceDetailsSheet] Service ${service.id}: Found ${serviceReviews.length} visible reviews out of ${allReviews.length} total reviews`);
      setReviews(serviceReviews);
    } catch (err) {
      console.error("Error filtering reviews:", err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBookService = () => {
    const bookingData = {
      serviceId: service.id,
      serviceName: service.name,
      serviceProviderId: provider.id,
      serviceProviderName: provider.businessName || provider.displayName,
      minPrice: service.minPrice,
      maxPrice: service.maxPrice,
      estimatedDuration: service.estimatedDuration,
      serviceCatalogId: service.serviceCatalogId
    };
    onBookService(bookingData);
    onClose();
  };

  const calculateAverageRating = () => {
    // Calculate rating from ALL reviews (including hidden ones) for this specific service
    const allServiceReviews = allReviews.filter(review => {
      // Find the booking for this review
      const booking = bookings.find(b => b.id === review.serviceBookingId);
      // Check if booking exists and matches this service ID (include hidden reviews for rating calculation)
      return booking && booking.serviceId === service.id;
    });

    if (allServiceReviews.length === 0) return 0;
    const sum = allServiceReviews.reduce((acc, review) => acc + (review.overallRating || 0), 0);
    return (sum / allServiceReviews.length).toFixed(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!service) return null;

  const averageRating = calculateAverageRating();
  const isActive = service?.isActive !== false; // Default to true if undefined

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh' }}
      >
        <div className="bg-cream-50 rounded-3xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all"
          >
            <X size={20} className="text-charcoal-600" weight="bold" />
          </button>

          {/* Content Container */}
          <div className="flex flex-col md:flex-row" style={{ maxHeight: '90vh' }}>
            {/* Left Side - Service Icon */}
            <div className="w-full md:w-2/5 bg-gradient-to-br from-[#E8D8E0] to-[#DFC9D8] relative flex items-center justify-center p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-sage-500/10 to-sage-700/10" />

              {/* Favorite Button */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
              >
                <Heart
                  size={22}
                  weight={isFavorite ? "fill" : "regular"}
                  className={isFavorite ? "text-red-500" : "text-charcoal-600"}
                />
              </button>

              {/* Service Icon */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="w-64 h-64 bg-white/30 rounded-full flex items-center justify-center">
                  <Scissors className="w-32 h-32 text-white/60" weight="regular" />
                </div>
              </div>
            </div>

            {/* Right Side - Service Info */}
            <div className="w-full md:w-3/5 flex flex-col">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Service Title */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
                      {service.name}
                    </h1>
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-charcoal-500 text-white'
                    }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {provider && (
                    <p className="text-base text-charcoal-400 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {provider.businessName || provider.displayName}
                    </p>
                  )}
                </div>

                {/* Price Range */}
                <div className="flex items-baseline gap-2">
                  {service.minPrice && service.maxPrice ? (
                    <>
                      <span className="text-4xl font-black text-sage-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {service.minPrice.toFixed(3)} - {service.maxPrice.toFixed(3)} BD
                      </span>
                    </>
                  ) : service.minPrice ? (
                    <>
                      <span className="text-sm text-charcoal-500 mr-1">Starting from</span>
                      <span className="text-4xl font-black text-sage-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {service.minPrice.toFixed(3)} BD
                      </span>
                    </>
                  ) : (
                    <span className="text-base text-charcoal-500">Contact for pricing</span>
                  )}
                </div>

                {/* Duration */}
                {service.estimatedDuration && (
                  <div className="flex items-center gap-2 text-charcoal-600">
                    <Clock size={20} weight="regular" />
                    <span className="text-base font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Estimated duration: {service.estimatedDuration} minutes
                    </span>
                  </div>
                )}

                {/* Rating */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          weight="fill"
                          className={i < Math.round(averageRating) ? "text-[#F5C563]" : "text-grey-stroke"}
                        />
                      ))}
                    </div>
                    <span className="text-base font-bold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {averageRating}
                    </span>
                  </div>
                )}

                {/* Description */}
                {service.description && (
                  <div>
                    <p className="text-charcoal-500 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Customer Reviews */}
                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="bg-cream-100 rounded-2xl p-6 border border-grey-stroke">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Customer Reviews
                      </h3>
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {reviews.slice(0, 5).map((review, idx) => (
                        <div key={review.id} className={`bg-white p-4 rounded-xl border border-grey-stroke ${idx !== 0 ? 'mt-3' : ''}`}>
                          {/* Review Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {(review.customerName || 'A')[0].toUpperCase()}
                                </span>
                              </div>

                              <div>
                                <div className="font-bold text-charcoal-600 text-sm mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {review.customerName || 'Anonymous Customer'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={13}
                                        weight="fill"
                                        className={i < (review.overallRating || 0) ? "text-[#F5C563]" : "text-grey-stroke"}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    • {formatDate(review.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Comment */}
                          {review.comment && (
                            <p className="text-charcoal-500 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-cream-100 p-8 rounded-2xl text-center border border-grey-stroke">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Star size={28} className="text-grey-stroke" />
                    </div>
                    <p className="text-charcoal-600 font-bold text-base mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      No reviews yet
                    </p>
                    <p className="text-charcoal-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Be the first to share your thoughts!
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar - Fixed */}
              <div className="bg-white border-t-2 border-grey-stroke p-6">
                {!isActive && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-sm text-amber-800 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      This service is currently unavailable for booking.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleBookService}
                  disabled={!isActive}
                  className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 ${
                    isActive
                      ? 'bg-sage-500 hover:bg-sage-600 hover:shadow-lg text-white cursor-pointer'
                      : 'bg-grey-200 text-charcoal-400 cursor-not-allowed'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Calendar size={22} weight="bold" />
                  <span>{isActive ? 'Book Appointment' : 'Service Unavailable'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetailsSheet;
