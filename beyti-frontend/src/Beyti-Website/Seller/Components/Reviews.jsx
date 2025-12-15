import React, { useEffect, useMemo, useState } from "react";
import * as Icon from "@phosphor-icons/react";

import AnalyticsCard from "../../../components/AnalyticsCard";
import StatusChip from "../../../components/StatusChip";
import CRUDButton from "../../../components/CRUDButton";
import Snackbar from "../../../components/Snackbar";
import { Table, TableHeader, TableBody, TableRow } from "../../../components/Table";

import { getSellerOrders } from "../../../services/api";


// ---------- Helpers ----------
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRatingLabel = (rating) => {
  if (!rating) return "No rating";
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Average";
  if (rating >= 1.5) return "Poor";
  return "Very Poor";
};

const RatingStars = ({ value, size = "sm" }) => {
  const max = 5;
  const rounded = Math.round(value || 0);
  const textSize = size === "lg" ? "text-base" : "text-xs";
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
            {[1, 2, 3, 4, 5].map((s, idx) => (
                <span
                key={s}
                className={
                    idx < Math.round(value)
                    ? "text-yellow-400 !text-yellow-400"
                    : "text-gray-300 !text-gray-300 dark:!text-gray-500"
                }
                >
                ★
                </span>
            ))}
            </div>
      <span className={`${textSize} text-charcoal-400`}>
        {value ? value.toFixed(1) : "–"}
      </span>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16 space-y-4">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-sage-200" />
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-sage-600 border-t-transparent absolute top-0 left-0" />
    </div>
    <p className="text-body-regular text-charcoal-500">Loading reviews...</p>
  </div>
);


// ---------- Main Component ----------
const Reviews = ({ sellerId, sellerName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [expandedComments, setExpandedComments] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  // productsWithReviews: [{ productId, productName, totalOrders, reviews: [...], totalReviews, avgRating, hiddenCount, lastReviewAt }]
  const [products, setProducts] = useState([]);

  // Filters
  const [ratingFilter, setRatingFilter] = useState("all"); // all | 5 | 4plus | 3plus | below3
  const [productFilter, setProductFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all | visible | hidden
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | ratingHigh | ratingLow
  const [searchTerm, setSearchTerm] = useState("");

  // UI state
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [updatingReviewId, setUpdatingReviewId] = useState(null);

  const [visibilityModal, setVisibilityModal] = useState({
  show: false,
  review: null,
  productId: null,
  mode: "hide", // hide | unhide
    });


  // ------------------------------------------------------------------
  // Data loading: derive products from seller orders, then fetch reviews per product
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!sellerId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setProducts([]);
      setExpandedProducts(new Set());

      try {
        // 1) Load all orders for this seller
        const orders = await getSellerOrders(sellerId);
        const productMap = new Map();

        (orders || []).forEach((order) => {
          (order.orderItems || []).forEach((item) => {
            if (!item.productId) return;

            if (!productMap.has(item.productId)) {
              productMap.set(item.productId, {
                productId: item.productId,
                productName: item.productName || "Unnamed Product",
                productImage: item.productImage || item.imageUrl || null,
                totalOrders: 0,
              });
            }

            const entry = productMap.get(item.productId);
            entry.totalOrders += 1;
          });
        });

        const baseProducts = Array.from(productMap.values());
        if (baseProducts.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // 2) For each product, fetch its reviews from API
        const baseUrl = "https://localhost:7062/api/Reviews";

        const productsWithReviews = await Promise.all(
          baseProducts.map(async (p) => {
            try {
              const res = await fetch(`${baseUrl}?productId=${p.productId}`);
              if (!res.ok) throw new Error("Failed to load reviews");
              const data = await res.json();
              const reviews = Array.isArray(data) ? data : [];

              let ratingSum = 0;
              let ratingCount = 0;
              let hiddenCount = 0;
              let lastReviewAt = null;

              reviews.forEach((r) => {
                if (typeof r.rating === "number") {
                  ratingSum += r.rating;
                  ratingCount += 1;
                }
                if (r.isCommentHiddenBySeller) {
                  hiddenCount += 1;
                }
                if (r.createdAt) {
                  const d = new Date(r.createdAt);
                  if (!Number.isNaN(d.getTime())) {
                    if (!lastReviewAt || d > lastReviewAt) lastReviewAt = d;
                  }
                }
              });

              const avgRating = ratingCount ? ratingSum / ratingCount : 0;

              return {
                ...p,
                reviews,
                totalReviews: reviews.length,
                avgRating,
                hiddenCount,
                lastReviewAt,
              };
            } catch (err) {
              console.error("Failed loading reviews for product", p.productId, err);
              return {
                ...p,
                reviews: [],
                totalReviews: 0,
                avgRating: 0,
                hiddenCount: 0,
                lastReviewAt: null,
              };
            }
          })
        );

        setProducts(productsWithReviews);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sellerId]);

    // Auto-hide snackbar after duration
  useEffect(() => {
    if (snackbar.show) {
      const timer = setTimeout(() => {
        setSnackbar({ show: false, message: '', type: 'success' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.show]);


  // ------------------------------------------------------------------
  // Derived metrics
  // ------------------------------------------------------------------
  const { metrics, flatReviews } = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        metrics: {
          totalReviews: 0,
          avgRating: 0,
          hiddenReviews: 0,
          recent30: 0,
        },
        flatReviews: [],
      };
    }

    let totalReviews = 0;
    let sumRatings = 0;
    let ratingCount = 0;
    let hiddenReviews = 0;
    let recent30 = 0;

    const now = new Date();
    const days30Ago = new Date(now);
    days30Ago.setDate(now.getDate() - 30);

    const flat = [];

    products.forEach((p) => {
      (p.reviews || []).forEach((r) => {
        totalReviews += 1;
        if (typeof r.rating === "number") {
          sumRatings += r.rating;
          ratingCount += 1;
        }
        if (r.isCommentHiddenBySeller) hiddenReviews += 1;

        const created = r.createdAt ? new Date(r.createdAt) : null;
        if (created && !Number.isNaN(created.getTime()) && created >= days30Ago) {
          recent30 += 1;
        }

        flat.push({
          ...r,
          productId: p.productId,
          productName: p.productName,
        });
      });
    });

    const avgRating = ratingCount ? sumRatings / ratingCount : 0;

    return {
      metrics: {
        totalReviews,
        avgRating,
        hiddenReviews,
        recent30,
      },
      flatReviews: flat,
    };
  }, [products]);

  // ------------------------------------------------------------------
  // Filtering + sorting
  // ------------------------------------------------------------------
  const filteredReviews = useMemo(() => {
    let list = [...flatReviews];

    if (!list.length) return [];

    // rating filter
    list = list.filter((r) => {
      const rating = typeof r.rating === "number" ? r.rating : null;
      if (!ratingFilter || ratingFilter === "all" || rating == null) return true;

      switch (ratingFilter) {
        case "5":
          return rating === 5;
        case "4plus":
          return rating >= 4;
        case "3plus":
          return rating >= 3;
        case "below3":
          return rating > 0 && rating < 3;
        default:
          return true;
      }
    });

    // product filter
    if (productFilter !== "all") {
      const pid = Number(productFilter);
      list = list.filter((r) => r.productId === pid);
    }

    // visibility filter
    if (visibilityFilter === "visible") {
      list = list.filter((r) => !r.isCommentHiddenBySeller);
    } else if (visibilityFilter === "hidden") {
      list = list.filter((r) => r.isCommentHiddenBySeller);
    }

    // search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const comment = r.comment || "";
        const customer = r.customerName || "";
        const orderId = r.orderId ? `#${r.orderId}` : "";

        return (
          comment.toLowerCase().includes(q) ||
          customer.toLowerCase().includes(q) ||
          orderId.toLowerCase().includes(q) ||
          (r.productName || "").toLowerCase().includes(q)
        );
      });
    }

    // sorting
    list.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : null;
      const db = b.createdAt ? new Date(b.createdAt) : null;

      if (sortBy === "oldest") {
        return (da || 0) - (db || 0);
      }

      if (sortBy === "ratingHigh") {
        const ra = typeof a.rating === "number" ? a.rating : 0;
        const rb = typeof b.rating === "number" ? b.rating : 0;
        return rb - ra || (db || 0) - (da || 0);
      }

      if (sortBy === "ratingLow") {
        const ra = typeof a.rating === "number" ? a.rating : 0;
        const rb = typeof b.rating === "number" ? b.rating : 0;
        return ra - rb || (db || 0) - (da || 0);
      }

      // default: newest
      return (db || 0) - (da || 0);
    });

    return list;
  }, [flatReviews, ratingFilter, productFilter, visibilityFilter, sortBy, searchTerm]);


  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------


  const handleToggleVisibility = (review, productId) => {
  setVisibilityModal({
    show: true,
    review,
    productId,
    mode: review.isCommentHiddenBySeller ? "unhide" : "hide",
  });
};

const confirmVisibilityChange = async (reason) => {
  const { review, productId, mode } = visibilityModal;

  try {
    setUpdatingReviewId(review.id);

    const response = await fetch(`https://localhost:7062/api/Reviews/${review.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        IsCommentHiddenBySeller: mode === "hide",
        HiddenReason: mode === "hide" ? reason.trim() : null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update review: ${response.status}`);
    }

    // update UI
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? {
              ...p,
              reviews: p.reviews.map((r) =>
                r.id === review.id
                  ? {
                      ...r,
                      isCommentHiddenBySeller: mode === "hide",
                      hiddenReason: mode === "hide" ? reason.trim() : null,
                      hiddenAt: mode === "hide" ? new Date().toISOString() : null,
                    }
                  : r
              ),
              hiddenCount: mode === "hide" 
                ? (p.hiddenCount || 0) + 1 
                : Math.max(0, (p.hiddenCount || 0) - 1),
            }
          : p
      )
    );

    setSnackbar({
      show: true,
      message: `Review ${mode === "hide" ? "hidden" : "unhidden"} successfully!`,
      type: 'success'
    });
  } catch (err) {
    console.error(err);
    setSnackbar({
      show: true,
      message: `Failed to update review: ${err.message}`,
      type: 'error'
    });
  } finally {
    setUpdatingReviewId(null);
    setVisibilityModal({ show: false, review: null, productId: null, mode: "hide" });
  }
};


  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!sellerId) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-display-h1 text-charcoal-600">Reviews</h1>
        <p className="text-body-regular text-charcoal-400">
          Select a store from the left sidebar to view and manage its reviews.
        </p>
        <div className="bg-grey-200 rounded-lg p-6 border border-grey-stroke">
          <p className="text-body-regular text-charcoal-500">
            Once a store is selected, you’ll see product ratings, review trends,
            and tools to hide inappropriate comments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Loading / error */}
      {loading && (
        <div className="bg-grey-200 rounded-lg shadow-soft-lift border border-grey-stroke">
            <LoadingSpinner />
        </div>
        )}

      {error && !loading && (
        <div className="bg-error-bg border-l-4 border-error-btn rounded p-4 shadow-soft-lift">
          <p className="text-body-medium text-error-text">{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="bg-grey-200 rounded-lg p-12 shadow-soft-lift border border-grey-stroke text-center">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center">
            <Icon.ChatCircleDots size={32} className="text-sage-600" />
            </div>
            <div>
            <h3 className="text-card-h2 text-charcoal-600 mb-2">No Reviews Yet</h3>
            <p className="text-body-regular text-charcoal-500">
                Once customers start leaving feedback, you'll see product ratings and comments here.
            </p>
            </div>
        </div>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {/* Top Metric Cards */}
          <section className="space-y-4">
            <h2 className="text-card-h2 text-charcoal-600">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-grey-200 rounded-lg p-5 border border-grey-stroke shadow-soft-lift">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-card-h2 text-charcoal-600">Total Reviews</h3>
                    <Icon.ChatCircleDots size={24} className="text-sage-600" />
                </div>
                <p className="text-metric-h3 text-charcoal-700">{metrics.totalReviews}</p>
                <p className="text-label-medium text-charcoal-400">Across all products</p>
                </div>
              <AnalyticsCard
                title="Average Rating"
                metrics={[
                  {
                    value:
                      metrics.avgRating && metrics.avgRating > 0
                        ? metrics.avgRating.toFixed(2)
                        : "–",
                    label: getRatingLabel(metrics.avgRating),
                  },
                ]}
              />
              <AnalyticsCard
                title="Hidden Reviews"
                metrics={[
                  {
                    value: metrics.hiddenReviews,
                    label: "Hidden by seller",
                  },
                ]}
              />
              <AnalyticsCard
                title="Last 30 Days"
                metrics={[
                  {
                    value: metrics.recent30,
                    label: "New reviews",
                  },
                ]}
              />
            </div>
          </section>

          {/* Simple Filters */}
          <section className="bg-grey-200 rounded-lg p-4 border border-grey-stroke shadow-soft-lift">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Icon.MagnifyingGlass 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-grey-stroke rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              {/* Rating filter */}
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5★</option>
                <option value="4plus">4★+</option>
                <option value="3plus">3★+</option>
                <option value="below3">&lt;3★</option>
              </select>

              {/* Product filter */}
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName}
                  </option>
                ))}
              </select>

              {/* Visibility */}
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="all">All</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-grey-stroke rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="ratingHigh">Highest ★</option>
                <option value="ratingLow">Lowest ★</option>
              </select>
              
              <span className="text-sm text-charcoal-500 whitespace-nowrap py-2">
                {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </section>

         

          {/* Table view */}
          <section className="bg-grey-200 rounded-lg p-5 border border-grey-stroke shadow-soft-lift space-y-4">
            <div className="flex items-center gap-2">
              <Icon.ChatCircleDots size={20} className="text-sage-600" />
              <h2 className="text-card-h2 text-charcoal-600">All Reviews</h2>
            </div>

            {filteredReviews.length === 0 ? (
              <p className="text-body-regular text-charcoal-500">
                No reviews to display.
              </p>
            ) : (
              <Table>
                <TableHeader
                  columns={[
                    "Product",
                    "Customer",
                    "Rating",
                    "Comment",
                    "Date",
                    "Visibility",
                    "Action",
                  ]}
                />
                <TableBody>
                  {filteredReviews.map((r) => (
                    <TableRow
                      key={r.id}
                      data={[
                        r.productName || "Product",
                        r.customerName || "Customer",
                        <RatingStars key={`stars-${r.id}`} value={r.rating || 0} />,
                       <div key={`comment-${r.id}`} className="max-w-xs">
                        <p className={`text-sm ${
                          r.isCommentHiddenBySeller 
                            ? 'text-charcoal-400 line-through' 
                            : 'text-charcoal-700'
                        } ${expandedComments.has(r.id) ? '' : 'line-clamp-2'}`}>
                          {r.comment || "No comment"}
                        </p>
                        {r.comment && r.comment.length > 100 && (
                          <button
                            onClick={() => {
                              setExpandedComments(prev => {
                                const next = new Set(prev);
                                if (next.has(r.id)) next.delete(r.id);
                                else next.add(r.id);
                                return next;
                              });
                            }}
                            className="text-xs text-sage-600 hover:text-sage-700 font-medium mt-1"
                          >
                            {expandedComments.has(r.id) ? 'Show less' : 'Show more'} →
                          </button>
                        )}
                        {r.isCommentHiddenBySeller && r.hiddenReason && (
                          <div className="mt-2 p-2 bg-error-bg border-l-2 border-error-btn rounded">
                            <p className="text-xs text-error-text">
                              <span className="font-semibold">Hidden reason:</span> {r.hiddenReason}
                            </p>
                            {r.hiddenAt && (
                              <p className="text-xs text-charcoal-400 mt-1">
                                Hidden on {formatDate(r.hiddenAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>,
                        formatDate(r.createdAt),
                        <StatusChip
                          key={`vis-${r.id}`}
                          variant={
                            r.isCommentHiddenBySeller ? "error" : "success"
                          }
                        >
                          {r.isCommentHiddenBySeller ? "Hidden" : "Visible"}
                        </StatusChip>,
                      ]}
                      actions={
                        <CRUDButton
                          variant={
                            r.isCommentHiddenBySeller ? "success" : "danger"
                          }
                          onClick={() =>
                            handleToggleVisibility(r, r.productId)
                          }
                          disabled={updatingReviewId === r.id}
                        >
                          {updatingReviewId === r.id
                            ? "Updating..."
                            : r.isCommentHiddenBySeller
                            ? "Unhide"
                            : "Hide"}
                        </CRUDButton>
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      )}
      <ReviewVisibilityModal
      show={visibilityModal.show}
      mode={visibilityModal.mode}
      review={visibilityModal.review}
      onClose={() =>
        setVisibilityModal({ show: false, review: null, productId: null, mode: "hide" })
      }
      onConfirm={confirmVisibilityChange}
    />

    {/* Snackbar */}
    <Snackbar
      open={snackbar.show}
      message={snackbar.message}
      type={snackbar.type}
      autoHideDuration={4000}
      onClose={() => setSnackbar({ show: false, message: '', type: 'success' })}
    />

    </div>
  );
};

const ReviewVisibilityModal = ({ show, mode, review, onClose, onConfirm }) => {
  if (!show) return null;

  const [reason, setReason] = React.useState("");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 modal-backdrop-enter">
      <div className="bg-cream-50 w-full max-w-lg rounded-xl border border-grey-stroke shadow-2xl overflow-hidden modal-content-enter">
        
        {/* Header Section */}
        <div className="bg-grey-200 px-6 py-4 border-b border-grey-stroke">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${mode === "hide" ? "bg-error-bg" : "bg-success-bg"}
            `}>
              <Icon.EyeSlash 
                size={20} 
                className={mode === "hide" ? "text-error-text" : "text-success-text"} 
              />
            </div>
            <h2 className="text-display-h2 text-charcoal-700">
              {mode === "hide" ? "Hide Review" : "Unhide Review"}
            </h2>
          </div>
        </div>

        {/* Body Section */}
        <div className="p-6 space-y-4">
          {mode === "hide" ? (
            <>
              <p className="text-body-regular text-charcoal-600">
                Please provide a reason for hiding this review. This will be logged for your records.
              </p>
              <textarea
                className="w-full border border-grey-stroke rounded-lg p-4 bg-white text-body-regular text-charcoal-700 focus:ring-2 focus:ring-sage-400 focus:outline-none resize-none"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Contains inappropriate content, violates community guidelines..."
                autoFocus
              />
            </>
          ) : (
            <div className="bg-sage-100 border-l-4 border-sage-600 p-4 rounded">
              <p className="text-body-regular text-charcoal-700">
                This review will become visible to customers again. Are you sure you want to continue?
              </p>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="bg-grey-200 px-6 py-4 border-t border-grey-stroke flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-cream-50 hover:bg-grey-300 border border-grey-stroke text-charcoal-700 text-button transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={mode === "hide" && !reason.trim()}
            className={`
              px-5 py-2.5 rounded-lg text-button font-medium transition-all
              ${mode === "hide"
                ? "bg-error-btn hover:bg-error-text disabled:opacity-50 disabled:cursor-not-allowed text-white"
                : "bg-success-btn hover:bg-success-text text-white"}
            `}
          >
            {mode === "hide" ? "Hide Review" : "Unhide Review"}
          </button>
        </div>
      </div>
    </div>
  );
};


export default Reviews;
