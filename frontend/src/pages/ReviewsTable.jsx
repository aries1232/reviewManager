import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Upload,
  Star,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "../api/api";
import toast from "react-hot-toast";

export default function ReviewsTable() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    location: "",
    sentiment: "",
    search: "",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showUpload, setShowUpload] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getReviews(filters);
      setReviews(response.reviews);
      setTotalPages(response.pages);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews. Using sample data.");
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      //dedicated locations endpoint for better performance
      const response = await apiClient.getLocations();
      setLocations(response.locations);
    } catch (error) {
      console.error("Failed to load locations:", error);
      try {
        const reviewsResponse = await apiClient.getReviews({ limit: 100 });
        const uniqueLocations = [
          ...new Set(reviewsResponse.reviews.map((review) => review.location)),
        ]
          .filter((location) => location)  
          .sort(); 
        setLocations(uniqueLocations);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || "",
      page: 1, //reset to first page when filteiring
    }));
  };

  const getSentimentBadge = (sentiment, score) => {
    if (!sentiment) return null;

    const configs = {
      positive: "bg-green-100 text-green-800 border-green-200",
      negative: "bg-red-100 text-red-800 border-red-200",
      neutral: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${configs[sentiment]}`}
      >
        {sentiment}
        {score && (
          <span className="ml-1 text-xs opacity-75">
            ({score > 0 ? "+" : ""}
            {score.toFixed(2)})
          </span>
        )}
      </span>
    );
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const reviewsData = JSON.parse(text);

      const response = await apiClient.ingestReviews(reviewsData);
      toast.success(`Successfully uploaded ${response.count} reviews!`);
      loadReviews();
      setShowUpload(false);
    } catch (error) {
      console.error("failed to upload reviews:", error);
      toast.error("Failed to upload reviews. Please check the file format.");
    }

    //Clear file input
    event.target.value = "";
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  //load reviews when filters change
  useEffect(() => {
    loadReviews();
  }, [filters]);

  //Load locations when component mounts
  useEffect(() => {
    loadLocations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customer Reviews
            </h1>
            <p className="mt-2 text-gray-600">
              Manage and analyze customer feedback
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Upload Reviews
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Upload a JSON file
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleUpload}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              JSON array with: business_name, location, customer_name, rating,
              review_text, date
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentiment
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.sentiment}
              onChange={(e) => handleFilterChange("sentiment", e.target.value)}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReviews}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No reviews found matching your filters.
            </p>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick = {() => navigate(`/review/${review.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.customer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {review.business_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <p className="line-clamp-2">{review.review_text}</p>
                          {review.topics && review.topics.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {review.topics.slice(0, 2).map((topic, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRatingStars(review.rating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSentimentBadge(
                          review.sentiment,
                          review.sentiment_score
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {review.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {review.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/review/${review.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() =>
                        handlePageChange(Math.max(1, filters.page - 1))
                      }
                      disabled={filters.page <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, filters.page + 1))
                      }
                      disabled={filters.page >= totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{filters.page}</span>{" "}
                        of <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() =>
                            handlePageChange(Math.max(1, filters.page - 1))
                          }
                          disabled={filters.page <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, filters.page + 1)
                            )
                          }
                          disabled={filters.page >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
