import { useState, useEffect } from 'react';
import { X, Star, Calendar, Scissors, Heart, Clock } from '@phosphor-icons/react';

const ServiceDetailsSheet = ({
  service,
  provider,
  isOpen,
  onClose,
  onBookService
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fetch service reviews when service changes
  useEffect(() => {
    if (service && isOpen) {
      fetchServiceReviews();
    }
  }, [service, isOpen]);

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

  const fetchServiceReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`https://localhost:7062/api/ServiceReviews?serviceId=${service.id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
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
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
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
                  <h1 className="text-3xl font-bold text-charcoal-600 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                    {service.name}
                  </h1>
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
                    <span className="text-charcoal-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ({reviews.length} Review{reviews.length !== 1 ? 's' : ''})
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
                      {reviews.length > 3 && (
                        <button className="text-sage-600 hover:text-sage-700 font-semibold text-sm transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                          View all {reviews.length}
                        </button>
                      )}
                    </div>

                    {/* Reviews Summary Bar */}
                    <div className="flex items-center gap-4 mb-5 pb-5 border-b border-grey-stroke">
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {averageRating}
                          </span>
                          <span className="text-lg text-charcoal-400 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            / 5
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              weight="fill"
                              className={i < Math.round(averageRating) ? "text-[#F5C563]" : "text-grey-stroke"}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-charcoal-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Rating Distribution */}
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = reviews.filter(r => r.rating === rating).length;
                          const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-charcoal-500 w-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {rating}
                              </span>
                              <Star size={12} weight="fill" className="text-[#F5C563]" />
                              <div className="flex-1 h-2 bg-cream-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#F5C563] rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-charcoal-400 w-8 text-right" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
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
                                        className={i < review.rating ? "text-[#F5C563]" : "text-grey-stroke"}
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
                <button
                  onClick={handleBookService}
                  className="w-full bg-sage-500 hover:bg-sage-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Calendar size={22} weight="bold" />
                  <span>Book Appointment</span>
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
