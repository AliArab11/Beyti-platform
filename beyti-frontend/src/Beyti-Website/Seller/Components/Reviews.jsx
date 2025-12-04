import React, { useEffect, useMemo, useState } from "react";
import * as Icon from "@phosphor-icons/react";

import AnalyticsCard from "../../../components/AnalyticsCard";
import StatusChip from "../../../components/StatusChip";
import CRUDButton from "../../../components/CRUDButton";
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

  // Group filtered reviews by product for card/accordion view
  const groupedByProduct = useMemo(() => {
    const map = new Map();
    filteredReviews.forEach((r) => {
      if (!map.has(r.productId)) {
        map.set(r.productId, {
          productId: r.productId,
          productName: r.productName || "Unnamed Product",
          reviews: [],
        });
      }
      map.get(r.productId).reviews.push(r);
    });
    return Array.from(map.values());
  }, [filteredReviews]);

  const topProductsByRating = useMemo(() => {
    if (!products.length) return [];
    return [...products]
      .filter((p) => p.totalReviews > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3);
  }, [products]);

  const recentReviewSnippets = useMemo(() => {
    const sorted = [...flatReviews].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : null;
      const db = b.createdAt ? new Date(b.createdAt) : null;
      return (db || 0) - (da || 0);
    });
    return sorted.slice(0, 5);
  }, [flatReviews]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  const toggleProductRow = (productId) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

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

    await fetch(`https://localhost:7062/api/Reviews/${review.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        IsCommentHiddenBySeller: mode === "hide",
        HiddenReason: mode === "hide" ? reason.trim() : null,
      }),
    });

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
                    }
                  : r
              ),
            }
          : p
      )
    );
  } catch (err) {
    console.error(err);
    alert("Failed to update review");
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

          {/* Filters row */}
          <section className="bg-grey-200 rounded-lg p-5 border border-grey-stroke shadow-soft-lift space-y-4">

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-charcoal-500">
                <Icon.Funnel size={18} className="text-sage-600" />
                <span className="text-body-medium">
                    {filteredReviews.length} review{filteredReviews.length === 1 ? "" : "s"}
                </span>
                </div>
                <div className="flex items-center gap-2 text-charcoal-500">
                <Icon.Star size={18} className="text-sage-600" weight="fill" />
                <span className="text-body-medium">
                    {filteredReviews.length} review
                    {filteredReviews.length === 1 ? "" : "s"} matching filters
                </span>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {/* Rating filter */}
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-grey-stroke bg-cream-50 text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400"
                >
                  <option value="all">All ratings</option>
                  <option value="5">5 stars only</option>
                  <option value="4plus">4 stars & up</option>
                  <option value="3plus">3 stars & up</option>
                  <option value="below3">Below 3 stars</option>
                </select>

                {/* Product filter */}
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-grey-stroke bg-cream-50 text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400"
                >
                  <option value="all">All products</option>
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName}
                    </option>
                  ))}
                </select>

                {/* Visibility filter */}
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-grey-stroke bg-cream-50 text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400"
                >
                  <option value="all">All reviews</option>
                  <option value="visible">Visible only</option>
                  <option value="hidden">Hidden only</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-grey-stroke bg-cream-50 text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="ratingHigh">Highest rating</option>
                  <option value="ratingLow">Lowest rating</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-charcoal-300">
                  <Icon.MagnifyingGlass size={16} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by comment, customer, product, or order #..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-grey-stroke bg-cream-50 text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
            </div>
          </section>

          {/* Main content: left (grouped cards) + right (highlights) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: grouped by product */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-card-h2 text-charcoal-600">
                    Reviews by Product
                  </h2>
                  <p className="text-body-regular text-charcoal-400">
                    Expand a product to read its reviews and manage visibility.
                  </p>
                </div>
              </div>

              {groupedByProduct.length === 0 ? (
                <div className="bg-grey-200 rounded-lg p-4 border border-grey-stroke">
                  <p className="text-body-regular text-charcoal-500">
                    No reviews match the current filters. Try adjusting your
                    rating or visibility filters.
                  </p>
                </div>
              ) : (
                groupedByProduct.map((group) => {
                  const productMeta = products.find(
                    (p) => p.productId === group.productId
                  );

                  return (
                    <div
                      key={group.productId}
                      className="bg-grey-200 rounded-lg border border-grey-stroke shadow-soft-lift overflow-hidden"
                    >
                      {/* Product header row */}
                      <button
                        type="button"
                        onClick={() => toggleProductRow(group.productId)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream-50 transition-all duration-200 text-left group"
                        >
                        <div className="flex items-center gap-4 flex-1">
                            {/* Expand/Collapse Icon */}
                            <div className={`
                            transition-transform duration-200
                            ${expandedProducts.has(group.productId) ? "rotate-90" : ""}
                            `}>
                            <Icon.CaretRight size={20} className="text-charcoal-400 group-hover:text-sage-600" />
                            </div>

                            {/* Product Image */}
                            <div className="w-12 h-12 rounded-lg bg-cream-50 flex items-center justify-center overflow-hidden border border-grey-stroke">
                            {productMeta?.productImage ? (
                                <img
                                src={productMeta.productImage}
                                alt={productMeta.productName}
                                className="w-full h-full object-cover"
                                />
                            ) : (
                                <Icon.Package size={20} className="text-charcoal-400" />
                            )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1">
                            <p className="text-body-medium text-charcoal-700 mb-0.5">
                                {group.productName}
                            </p>
                            <p className="text-label-medium text-charcoal-400">
                                {productMeta?.totalOrders || 0} orders • {productMeta?.totalReviews || group.reviews.length} review{(productMeta?.totalReviews || group.reviews.length) === 1 ? "" : "s"}
                            </p>
                            </div>
                        </div>

                        {/* Rating on the right */}
                        <div className="flex items-center gap-2">
                            <RatingStars value={productMeta?.avgRating || 0} size="sm" />
                        </div>
                        </button>

                      {/* Reviews list for this product */}
                      {expandedProducts.has(group.productId) && (
                        <div className="bg-cream-50 border-t border-grey-stroke px-4 py-4 md:px-5 md:py-5 space-y-3">
                          {group.reviews.map((review) => (
                            <div
                                key={review.id}
                                className={`
                                    rounded-lg border p-4 space-y-3
                                    ${review.isCommentHiddenBySeller
                                    ? "bg-error-bg/30 border-error-btn/60"
                                    : "bg-cream-50 border-grey-stroke hover:border-sage-400 transition-colors"}
                                `}
                                >
                                {/* Header Row with customer info and action button */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                    {/* Stars and customer name */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <RatingStars value={review.rating || 0} />
                                        <span className="text-body-medium text-charcoal-600 font-medium">
                                        {review.customerName || "Customer"}
                                        </span>
                                        {review.isCommentHiddenBySeller && (
                                        <StatusChip variant="error">Hidden</StatusChip>
                                        )}
                                    </div>
                                    
                                    {/* Date and order info */}
                                    <div className="flex items-center gap-3 text-label-medium text-charcoal-400">
                                        <span className="flex items-center gap-1">
                                        <Icon.CalendarBlank size={14} />
                                        {formatDate(review.createdAt)}
                                        </span>
                                        {review.orderId && (
                                        <span className="flex items-center gap-1">
                                            <Icon.ShoppingBag size={14} />
                                            Order #{review.orderId}
                                        </span>
                                        )}
                                    </div>
                                    </div>

                                    {/* Action Button - positioned top-right */}
                                    <CRUDButton
                                    variant={review.isCommentHiddenBySeller ? "success" : "danger"}
                                    onClick={() => handleToggleVisibility(review, group.productId)}
                                    disabled={updatingReviewId === review.id}
                                    >
                                    {updatingReviewId === review.id
                                        ? "Updating..."
                                        : review.isCommentHiddenBySeller
                                        ? "Unhide"
                                        : "Hide"}
                                    </CRUDButton>
                                </div>

                                {/* Review Comment */}
                                <p className={`
                                    text-body-regular leading-relaxed
                                    ${review.isCommentHiddenBySeller
                                    ? "text-charcoal-400 line-through"
                                    : "text-charcoal-700"}
                                `}>
                                    {review.comment || "No comment provided."}
                                </p>

                                {/* Hidden Reason - only shown if review is hidden */}
                                {review.isCommentHiddenBySeller && review.hiddenReason && (
                                    <div className="flex items-start gap-2 pt-2 border-t border-error-btn/20">
                                    <Icon.WarningCircle size={16} className="text-error-text mt-0.5 flex-shrink-0" />
                                    <p className="text-label-medium text-error-text">
                                        <span className="font-semibold">Reason:</span> {review.hiddenReason}
                                    </p>
                                    </div>
                                )}
                                </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: highlights / side panel */}
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              {/* Top products by rating */}
              <div className="bg-grey-200 rounded-lg p-5 border border-grey-stroke shadow-soft-lift space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-card-h2 text-charcoal-600">
                    Top Rated Products
                  </h2>
                  <Icon.ChartBar size={18} className="text-sage-600" />
                </div>
                {topProductsByRating.length === 0 ? (
                  <p className="text-body-regular text-charcoal-400">
                    Not enough reviews yet for rating insights.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {topProductsByRating.map((p) => (
                      <li
                        key={p.productId}
                        className="flex items-center justify-between bg-cream-50 rounded-lg px-3 py-2 border border-grey-stroke"
                      >
                        <div className="flex flex-col">
                          <span className="text-body-medium text-charcoal-600">
                            {p.productName}
                          </span>
                          <span className="text-label-medium text-charcoal-400">
                            {p.totalReviews} review
                            {p.totalReviews === 1 ? "" : "s"}
                          </span>
                        </div>
                        <RatingStars value={p.avgRating || 0} size="lg" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent reviews */}
              <div className="bg-grey-200 rounded-lg p-5 border border-grey-stroke shadow-soft-lift space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-card-h2 text-charcoal-600">
                    Recent Reviews
                  </h2>
                  <Icon.Clock size={18} className="text-sage-600" />
                </div>
                {recentReviewSnippets.length === 0 ? (
                  <p className="text-body-regular text-charcoal-400">
                    No recent reviews yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentReviewSnippets.map((r) => (
                      <li
                        key={r.id}
                        className="bg-cream-50 rounded-lg px-3 py-2 border border-grey-stroke"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-label-medium text-charcoal-500">
                              {r.productName}
                            </span>
                            <span className="text-label-medium text-charcoal-400">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                          <RatingStars value={r.rating || 0} size="sm" />
                        </div>
                        <p className="text-xs text-charcoal-600 mt-1 line-clamp-2">
                          {r.comment || "No comment provided."}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </section>

          {/* Table view */}
          <section className="bg-grey-200 rounded-lg p-5 border border-grey-stroke shadow-soft-lift space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon.Table size={20} className="text-sage-600" />
                <h2 className="text-card-h2 text-charcoal-600">All Reviews</h2>
                <span className="text-label-medium text-charcoal-400">
                    ({filteredReviews.length} total)
                </span>
                </div>
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
                        <span
                          key={`comment-${r.id}`}
                          className="block max-w-xs truncate"
                          title={r.comment || ""}
                        >
                          {r.comment || "No comment"}
                        </span>,
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

    </div>
  );
};

const ReviewVisibilityModal = ({ show, mode, review, onClose, onConfirm }) => {
  if (!show) return null;

  const [reason, setReason] = React.useState("");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-cream-50 w-full max-w-lg rounded-xl border border-grey-stroke shadow-2xl overflow-hidden">
        
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
