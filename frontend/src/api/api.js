const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async healthCheck() {
    return this.request("/health");
  }

  async ingestReviews(reviews) {
    return this.request("/ingest", {
      method: "POST",
      body: JSON.stringify(reviews),
    });
  }

  async getReviews(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    return this.request(`/reviews?${params}`);
  }

  async getReview(id) {
    return this.request(`/reviews/${id}`);
  }

  async suggestReply(id) {
    return this.request(`/reviews/${id}/suggest-reply`, {
      method: "POST",
    });
  }

  async getAnalytics() {
    return this.request("/analytics");
  }

  async searchSimilarReviews(query, k = 5) {
    const params = new URLSearchParams({ q: query, k: k.toString() });
    return this.request(`/search?${params}`);
  }

  async getLocations() {
    return this.request("/locations");
  }
}

export const apiClient = new ApiClient();
