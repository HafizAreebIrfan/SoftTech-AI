export interface TranslatedApiError {
  userMessage: string;
  actionSuggestion: string;
}

export function translateApiError(
  status: number | string | undefined,
  rawMessage: string | undefined,
  apiName: string = "service",
): TranslatedApiError {
  const name = apiName || "service";
  const message = String(rawMessage || "").trim();
  const msgLower = message.toLowerCase();

  const statusNum =
    typeof status === "number"
      ? status
      : Number.parseInt(String(status || ""), 10) || undefined;

  if (
    statusNum === 400 ||
    statusNum === 422 ||
    msgLower.includes("bad request") ||
    msgLower.includes("validation error") ||
    msgLower.includes("validation failed")
  ) {
    return {
      userMessage: `The ${name} request was rejected because some information is missing or invalid.`,
      actionSuggestion: "Please check the requested information and try again.",
    };
  }

  if (
    statusNum === 401 ||
    msgLower.includes("unauthorized") ||
    msgLower.includes("invalid token") ||
    msgLower.includes("invalid api key") ||
    msgLower.includes("authentication failed")
  ) {
    return {
      userMessage: `The ${name} service could not authenticate the request.`,
      actionSuggestion:
        "Please verify the configured authentication credentials.",
    };
  }

  if (
    statusNum === 403 ||
    msgLower.includes("forbidden") ||
    msgLower.includes("permission denied") ||
    msgLower.includes("access denied")
  ) {
    return {
      userMessage: `The ${name} service does not allow this operation with the current permissions.`,
      actionSuggestion:
        "Please verify that the configured credentials have permission to perform this operation.",
    };
  }

  if (
    statusNum === 404 ||
    msgLower.includes("not found") ||
    /\b404\b/.test(msgLower)
  ) {
    return {
      userMessage: `The ${name} service could not find the requested resource.`,
      actionSuggestion:
        "Please verify the requested item, identifier, or API endpoint and try again.",
    };
  }

  if (
    statusNum === 408 ||
    msgLower.includes("timeout") ||
    msgLower.includes("timed out") ||
    msgLower.includes("etimedout")
  ) {
    return {
      userMessage: `The ${name} service took too long to respond.`,
      actionSuggestion:
        "Please try the request again. If the problem continues, verify that the API is available.",
    };
  }

  if (
    msgLower.includes("econnrefused") ||
    msgLower.includes("enotfound") ||
    msgLower.includes("networkerror") ||
    msgLower.includes("fetch failed") ||
    msgLower.includes("failed to fetch") ||
    msgLower.includes("socket hang up") ||
    msgLower.includes("connection refused")
  ) {
    return {
      userMessage: `The ${name} service could not be reached.`,
      actionSuggestion:
        "Please verify that the API server is online and reachable, then try again.",
    };
  }
  if (
    statusNum === 429 ||
    msgLower.includes("too many requests") ||
    msgLower.includes("rate limit")
  ) {
    return {
      userMessage: `The ${name} service is temporarily limiting requests.`,
      actionSuggestion: "Please wait a moment and try the request again.",
    };
  }

  if (statusNum !== undefined && statusNum >= 500 && statusNum <= 599) {
    return {
      userMessage: `The ${name} service encountered a temporary server problem.`,
      actionSuggestion: "Please try the request again in a few moments.",
    };
  }
  return {
    userMessage: `The request to ${name} could not be completed.`,
    actionSuggestion:
      "Please check the provided information and try the request again.",
  };
}
