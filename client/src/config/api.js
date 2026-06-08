// Centralized API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "";

/**
 * Validates and constructs a safe API URL
 * Prevents ERR_INVALID_URL errors by validating parameters
 */
export const buildApiUrl = (endpoint, params = {}) => {
  // Validate endpoint
  if (!endpoint || typeof endpoint !== "string") {
    throw new Error("Invalid endpoint provided to buildApiUrl");
  }

  // Clean up endpoint
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Replace path parameters and validate them
  const pathParamRegex = /:(\w+)/g;
  cleanEndpoint = cleanEndpoint.replace(pathParamRegex, (match, paramName) => {
    const paramValue = params[paramName];

    // Validate parameter exists and is not empty
    if (paramValue === undefined || paramValue === null || paramValue === "") {
      throw new Error(
        `Missing or invalid path parameter: ${paramName}. Received: ${paramValue}`
      );
    }

    // Safe encoding of parameter
    return `/${encodeURIComponent(String(paramValue))}`;
  });

  // Construct final URL
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Validate final URL is well-formed
  try {
    const baseOrigin = url.startsWith("/") ? (typeof window !== "undefined" ? window.location.origin : "http://localhost") : undefined;
    new URL(url, baseOrigin);
  } catch (error) {
    throw new Error(`Invalid URL constructed: ${url}. Error: ${error.message}`);
  }

  return url;
};

/**
 * Safe API request wrapper that validates parameters before making requests
 */
export const apiCall = {
  get: (endpoint, params = {}) => {
    const url = buildApiUrl(endpoint, params);
    return fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
  },

  post: (endpoint, data = {}, params = {}) => {
    const url = buildApiUrl(endpoint, params);
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json());
  },

  put: (endpoint, data = {}, params = {}) => {
    const url = buildApiUrl(endpoint, params);
    return fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json());
  },

  delete: (endpoint, params = {}) => {
    const url = buildApiUrl(endpoint, params);
    return fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
  },
};

export default API_BASE_URL;
