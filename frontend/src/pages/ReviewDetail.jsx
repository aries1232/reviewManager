import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  Sparkles,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../api/api";
import toast from "react-hot-toast";

export default function ReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [suggestedReply, setSuggestedReply] = useState(null);
  const [similarReviews, setSimilarReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);

  useEffect(() => {
    loadReview();
  }, [id]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const reviewData = await apiClient.getReview(parseInt(id));
      setReview(reviewData);

      // Load similar reviews
      if (reviewData.review_text) {
        const similarData = await apiClient.searchSimilarReviews(
          reviewData.review_text,
          3
        );
        setSimilarReviews(
          similarData.similar_reviews.filter((r) => r.id !== reviewData.id)
        );
      }
    } catch (error) {
      console.error("Failed to load review:", error);
      toast.error("Failed to load review details.");
    } finally {
      setLoading(false);
    }
  };

  const generateReply = async () => {
    if (!review) return;

    setGeneratingReply(true);
    try {
      const reply = await apiClient.suggestReply(review.id);
      setSuggestedReply(reply);
      toast.success("Reply suggestion generated successfully!");
    } catch (error) {
      console.error("Failed to generate reply:", error);
      toast.error("Failed to generate reply suggestion.");
    } finally {
      setGeneratingReply(false);
    }
  };

  const copyReply = async () => {
    if (suggestedReply?.reply) {
      try {
        await navigator.clipboard.writeText(suggestedReply.reply);
        setCopiedReply(true);
        setTimeout(() => setCopiedReply(false), 2000);
      } catch (error) {
        toast.error("Failed to copy reply.");
      }
    }
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${configs[sentiment]}`}
      >
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
        {score && (
          <span className="ml-2 text-xs opacity-75">
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
            className={`h-5 w-5 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {rating}/5
        </span>
      </div>
    );
  };

  const getToneStyle = (tone) => {
    const styles = {
      grateful: "bg-green-50 text-green-700 border-green-200",
      apologetic: "bg-red-50 text-red-700 border-red-200",
      professional: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return styles[tone] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Review not found.</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reviews
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Review Details</h1>
      </div>

      {/* Review Card */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <User className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {review.customer_name}
                </h2>
                <p className="text-gray-600">{review.business_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 mb-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{review.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{review.date}</span>
              </div>
            </div>
          </div>

          <div className="lg:ml-6 space-y-3">
            <div>{getRatingStars(review.rating)}</div>
            {review.sentiment && (
              <div>
                {getSentimentBadge(review.sentiment, review.sentiment_score)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Review</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              {review.review_text}
            </p>
          </div>
        </div>

        {review.topics && review.topics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {review.topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Generate Reply Button */}
        <div className="border-t pt-6">
          <button
            onClick={generateReply}
            disabled={generatingReply}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generatingReply ? "Generating..." : "Generate AI Reply"}
          </button>
        </div>
      </div>

      {/* Suggested Reply */}
      {suggestedReply && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Suggested Reply (AI Generated)
            </h3>
            <button
              onClick={copyReply}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copiedReply ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-gray-800 leading-relaxed">
              {suggestedReply.reply}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tone</h4>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm border ${getToneStyle(
                  suggestedReply.tone
                )}`}
              >
                {suggestedReply.tone.charAt(0).toUpperCase() +
                  suggestedReply.tone.slice(1)}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Key Points to Address
              </h4>
              <ul className="space-y-1">
                {suggestedReply.key_points.map((point, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 flex items-center"
                  >
                    <CheckCircle className="h-3 w-3 mr-2 text-green-500 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Similar Reviews */}
      {similarReviews.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Similar Reviews
          </h3>
          <div className="space-y-4">
            {similarReviews.map((similarReview) => (
              <div
                key={similarReview.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium text-sm text-gray-900">
                      {similarReview.customer_name}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      • {similarReview.location}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < similarReview.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {similarReview.review_text}
                </p>
                <Link
                  to={`/review/${similarReview.id}`}
                  className="text-xs text-blue-600 hover:text-blue-500 transition-colors"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
