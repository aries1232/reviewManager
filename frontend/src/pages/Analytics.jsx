import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, MessageSquare, MapPin, Star } from "lucide-react";
import { apiClient } from "../api/api";

const COLORS = {
  primary: "#3B82F6",
  accent: "#F59E0B",
};

// const SAMPLE_ANALYTICS = {
//   sentiment_counts: {
//     positive: 15,
//     negative: 8,
//     neutral: 12,
//   },
//   rating_distribution: {
//     1: 2,
//     2: 3,
//     3: 8,
//     4: 12,
//     5: 10,
//   },
//   location_stats: {
//     Downtown: 18,
//     Westside: 12,
//     Northside: 5,
//   },
// };

export default function Analytics() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAnalytics();
      if (Object.keys(data.sentiment_counts).length > 0) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareRatingData = () => {
    return Object.entries(analytics.rating_distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([rating, count]) => ({
        rating: `${rating} Star${rating !== "1" ? "s" : ""}`,
        count,
      }));
  };

  const prepareLocationData = () => {
    return Object.entries(analytics.location_stats).map(
      ([location, count]) => ({
        location,
        count,
      })
    );
  };

  const getTotalReviews = () => {
    return Object.values(analytics.sentiment_counts).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  const getAverageRating = () => {
    const total = Object.entries(analytics.rating_distribution).reduce(
      (sum, [rating, count]) => sum + parseInt(rating) * count,
      0
    );
    const totalReviews = Object.values(analytics.rating_distribution).reduce(
      (sum, count) => sum + count,
      0
    );
    return totalReviews > 0 ? (total / totalReviews).toFixed(1) : "0";
  };

  const getPositivePercentage = () => {
    const total = getTotalReviews();
    const positive = analytics.sentiment_counts.positive || 0;
    return total > 0 ? Math.round((positive / total) * 100) : 0;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            Count: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Insights and trends from customer reviews
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {getTotalReviews()}
              </p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {getAverageRating()}
              </p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {getPositivePercentage()}%
              </p>
              <p className="text-sm text-gray-500">Positive Reviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(analytics.location_stats).length}
              </p>
              <p className="text-sm text-gray-500">Locations</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Rating Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareRatingData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={COLORS.primary}
                    radius={[4,4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/*Location Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Reviews by Location
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareLocationData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip  content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={COLORS.accent}
                    radius={[4, 4, 0,0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
