import { useEffect, useState } from 'react';
import { getProviderServiceReviews, respondToServiceReview, toggleServiceReviewVisibility } from '../../../services/api';
import Button from '../../../components/Button';
import { Star, Eye, EyeSlash } from '@phosphor-icons/react';

export default function ReviewsManagement({ serviceProviderId, searchQuery = '' }) {
  const [reviews, setReviews] = useState([]);
  const [groupedReviews, setGroupedReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [expandedService, setExpandedService] = useState(null);

  // Filter states
  const [ratingFilter, setRatingFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, [serviceProviderId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getProviderServiceReviews(serviceProviderId);
      setReviews(data);

      // Group reviews by service
      const grouped = data.reduce((acc, review) => {
        const serviceKey = review.serviceCatalogId;
        if (!acc[serviceKey]) {
          acc[serviceKey] = {
            serviceName: review.serviceName,
            reviews: []
          };
        }
        acc[serviceKey].reviews.push(review);
        return acc;
      }, {});

      setGroupedReviews(grouped);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondClick = (review) => {
    setSelectedReview(review);
    setResponseText(review.providerResponse || '');
    setIsResponding(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      await respondToServiceReview(selectedReview.id, responseText);
      await fetchReviews();
      setIsResponding(false);
      setSelectedReview(null);
      setResponseText('');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    }
  };

  const handleToggleVisibility = async (reviewId) => {
    try {
      await toggleServiceReviewVisibility(reviewId);
      await fetchReviews();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility. Please try again.');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            weight={star <= rating ? 'fill' : 'regular'}
            className={star <= rating ? 'text-warning-text' : 'text-grey-stroke dark:text-charcoal-400'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics
  const calculateStatistics = () => {
    const totalReviews = reviews.length;
    const hiddenReviews = reviews.filter(r => r.isHidden).length;

    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(1)
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysReviews = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;

    return {
      totalReviews,
      averageRating,
      hiddenReviews,
      last30DaysReviews
    };
  };

  // Filter reviews based on search, rating, and date
  const filterReviews = (reviewsList) => {
    return reviewsList.filter(review => {
      // Search filter (customer name, comment, service name)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        review.customerName.toLowerCase().includes(searchLower) ||
        (review.comment && review.comment.toLowerCase().includes(searchLower)) ||
        review.serviceName.toLowerCase().includes(searchLower);

      // Rating filter
      const matchesRating = ratingFilter === 'all' ||
        review.overallRating === parseInt(ratingFilter);

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const reviewDate = new Date(review.createdAt);
        const today = new Date();

        if (dateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchesDate = reviewDate >= sevenDaysAgo;
        } else if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          matchesDate = reviewDate >= thirtyDaysAgo;
        } else if (dateFilter === '90days') {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(today.getDate() - 90);
          matchesDate = reviewDate >= ninetyDaysAgo;
        }
      }

      return matchesSearch && matchesRating && matchesDate;
    });
  };

  // Apply filters and group reviews
  const getFilteredGroupedReviews = () => {
    const filteredReviews = filterReviews(reviews);

    const grouped = filteredReviews.reduce((acc, review) => {
      const serviceKey = review.serviceCatalogId;
      if (!acc[serviceKey]) {
        acc[serviceKey] = {
          serviceName: review.serviceName,
          reviews: []
        };
      }
      acc[serviceKey].reviews.push(review);
      return acc;
    }, {});

    return grouped;
  };

  const statistics = calculateStatistics();
  const filteredGroupedReviews = getFilteredGroupedReviews();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-body-regular text-charcoal-400 dark:text-charcoal-300">Loading reviews...</div>
      </div>
    );
  }

  if (Object.keys(groupedReviews).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-grey-200 dark:bg-charcoal-500 rounded-lg">
        <Star size={48} className="text-charcoal-400 dark:text-charcoal-300 mb-4" />
        <p className="text-body-large text-charcoal-600 dark:text-white font-medium">No Reviews Yet</p>
        <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300 mt-2">
          Your service reviews will appear here once customers leave feedback
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-6 border border-grey-stroke dark:border-charcoal-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mb-1">Total Reviews</p>
              <p className="text-display-h2 text-charcoal-600 dark:text-white">{statistics.totalReviews}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-sage-500 dark:bg-sage-700 flex items-center justify-center">
              <Star size={24} weight="fill" className="text-sage-100" />
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-6 border border-grey-stroke dark:border-charcoal-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-display-h2 text-charcoal-600 dark:text-white">{statistics.averageRating}</p>
                <div className="flex gap-0.5 mt-1">
                  {renderStars(Math.round(parseFloat(statistics.averageRating)))}
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning-btn flex items-center justify-center">
              <Star size={24} weight="fill" className="text-white" />
            </div>
          </div>
        </div>

        {/* Hidden Reviews */}
        <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-6 border border-grey-stroke dark:border-charcoal-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mb-1">Hidden Reviews</p>
              <p className="text-display-h2 text-charcoal-600 dark:text-white">{statistics.hiddenReviews}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-error-btn flex items-center justify-center">
              <EyeSlash size={24} weight="fill" className="text-white" />
            </div>
          </div>
        </div>

        {/* Last 30 Days */}
        <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-6 border border-grey-stroke dark:border-charcoal-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-medium text-charcoal-400 dark:text-charcoal-300 mb-1">Last 30 Days</p>
              <p className="text-display-h2 text-charcoal-600 dark:text-white">{statistics.last30DaysReviews}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-info-btn flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 256 256">
                <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-grey-200 dark:bg-charcoal-500 rounded-lg p-4 border border-grey-stroke dark:border-charcoal-400">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-charcoal-400 dark:text-charcoal-300" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-grey-stroke dark:border-charcoal-400 bg-white dark:bg-charcoal-600 text-charcoal-600 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-charcoal-400 dark:text-charcoal-300" viewBox="0 0 256 256">
            <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"></path>
          </svg>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-grey-stroke dark:border-charcoal-400 bg-white dark:bg-charcoal-600 text-charcoal-600 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        {(ratingFilter !== 'all' || dateFilter !== 'all') && (
          <button
            onClick={() => {
              setRatingFilter('all');
              setDateFilter('all');
            }}
            className="ml-auto px-4 py-2 text-body-regular text-error-text hover:text-error-btn transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Reviews List */}
      {Object.keys(filteredGroupedReviews).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-grey-200 dark:bg-charcoal-500 rounded-lg">
          <Star size={48} className="text-charcoal-400 dark:text-charcoal-300 mb-4" />
          <p className="text-body-large text-charcoal-600 dark:text-white font-medium">No Reviews Found</p>
          <p className="text-body-regular text-charcoal-400 dark:text-charcoal-300 mt-2">
            Try adjusting your filters to see more results
          </p>
        </div>
      ) : (
        Object.entries(filteredGroupedReviews).map(([serviceId, { serviceName, reviews: serviceReviews }]) => (
        <div key={serviceId} className="bg-grey-200 dark:bg-charcoal-500 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedService(expandedService === serviceId ? null : serviceId)}
            className="w-full p-4 flex items-center justify-between hover:bg-grey-300 dark:hover:bg-charcoal-400 transition-colors"
          >
            <div className="flex items-center gap-4">
              <h3 className="text-body-large font-semibold text-charcoal-600 dark:text-white">
                {serviceName}
              </h3>
              <span className="px-3 py-1 bg-sage-500 dark:bg-sage-700 text-cream-50 text-label-medium rounded-full">
                {serviceReviews.length} {serviceReviews.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(serviceReviews.reduce((sum, r) => sum + r.overallRating, 0) / serviceReviews.length))}
                <span className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                  {(serviceReviews.reduce((sum, r) => sum + r.overallRating, 0) / serviceReviews.length).toFixed(1)}
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-charcoal-400 dark:text-charcoal-300 transition-transform ${
                  expandedService === serviceId ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedService === serviceId && (
            <div className="border-t border-grey-stroke dark:border-charcoal-400">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream-100 dark:bg-charcoal-500 border-b border-grey-stroke dark:border-charcoal-500">
                    <tr>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Customer</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Date</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Overall</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Quality</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Professional</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Timeliness</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Comment</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Your Response</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Status</th>
                      <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceReviews.map((review) => (
                      <tr key={review.id} className="bg-grey-200 dark:bg-[#2A2A2A] border-b border-grey-stroke dark:border-charcoal-500 hover:bg-cream-50 dark:hover:bg-charcoal-500 transition-colors">
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200 font-medium">{review.customerName}</td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">{formatDate(review.createdAt)}</td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            {renderStars(review.overallRating)}
                            <span className="text-label-medium">{review.overallRating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          {review.qualityRating ? (
                            <div className="flex items-center gap-2">
                              {renderStars(review.qualityRating)}
                              <span className="text-label-medium">{review.qualityRating}</span>
                            </div>
                          ) : (
                            <span className="text-charcoal-400 dark:text-charcoal-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          {review.professionalismRating ? (
                            <div className="flex items-center gap-2">
                              {renderStars(review.professionalismRating)}
                              <span className="text-label-medium">{review.professionalismRating}</span>
                            </div>
                          ) : (
                            <span className="text-charcoal-400 dark:text-charcoal-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          {review.timelinessRating ? (
                            <div className="flex items-center gap-2">
                              {renderStars(review.timelinessRating)}
                              <span className="text-label-medium">{review.timelinessRating}</span>
                            </div>
                          ) : (
                            <span className="text-charcoal-400 dark:text-charcoal-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          <div className="max-w-xs">
                            <p className="text-body-regular line-clamp-2" title={review.comment}>
                              {review.comment || <span className="text-charcoal-400 dark:text-charcoal-300">No comment</span>}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          <div className="max-w-xs">
                            {review.providerResponse ? (
                              <div>
                                <p className="text-body-regular line-clamp-2" title={review.providerResponse}>
                                  {review.providerResponse}
                                </p>
                                <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 mt-1">
                                  {formatDate(review.respondedAt)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-charcoal-400 dark:text-charcoal-300">Not responded</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            {review.isHidden ? (
                              <span className="flex items-center gap-1 text-error-text text-label-medium">
                                <EyeSlash size={16} />
                                Hidden
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-success-text text-label-medium">
                                <Eye size={16} />
                                Visible
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
                          <div className="flex gap-2">
                           <Button
                                  size="small"
                                  onClick={() => handleRespondClick(review)}
                                  className={
                                    review.providerResponse
                                      ? "bg-success-btn text-white hover:bg-success-btn/90 cursor-default"
                                      : ""
                                  }
                                  disabled={!!review.providerResponse}
                                >
                                  {review.providerResponse ? "Replied" : "Reply"}
                                </Button>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleToggleVisibility(review.id)}
                            >
                              {review.isHidden ? 'Show' : 'Hide'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))
      )}

      {isResponding && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-grey-200 dark:bg-charcoal-500 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-display-h3 text-charcoal-600 dark:text-white mb-4">
              {selectedReview.providerResponse ? 'Edit Response' : 'Respond to Review'}
            </h3>

            <div className="mb-4 p-4 bg-grey-300 dark:bg-charcoal-400 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-charcoal-600 dark:text-white">
                  {selectedReview.customerName}
                </span>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.overallRating)}
                  <span className="text-label-medium">{selectedReview.overallRating}/5</span>
                </div>
              </div>
              <p className="text-body-regular text-charcoal-600 dark:text-white">
                {selectedReview.comment}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-body-regular text-charcoal-600 dark:text-white font-medium mb-2">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response to this review..."
                className="w-full p-3 border border-grey-stroke dark:border-charcoal-400 bg-white dark:bg-charcoal-600 text-charcoal-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-32"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsResponding(false);
                  setSelectedReview(null);
                  setResponseText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitResponse}
                disabled={!responseText.trim()}
              >
                Submit Response
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
