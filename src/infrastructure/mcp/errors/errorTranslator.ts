/**
 * Converts raw backend HTTP/Network errors into warm, natural, human-friendly messages.
 * NEVER mentions "MCP", "404", "500", "resourceUri", or raw stack traces to the user.
 */
export function translateApiError(
  status: number | string | undefined,
  rawMessage: string | undefined,
  apiName: string = "service",
): { userMessage: string; actionSuggestion: string } {
  const msgLower = (rawMessage || "").toLowerCase();
  const statusNum = typeof status === "number" ? status : parseInt(String(status || 0), 10);

  if (statusNum === 404 || msgLower.includes("not found") || msgLower.includes("404")) {
    return {
      userMessage: `I couldn't locate that specific ${apiName.toLowerCase()} item. Let's select it from the available list below.`,
      actionSuggestion: `Please pick an item from the cards below or specify the exact name/ID.`,
    };
  }

  if (statusNum === 401 || statusNum === 403 || msgLower.includes("unauthorized") || msgLower.includes("forbidden")) {
    return {
      userMessage: `Authentication is required to access ${apiName}.`,
      actionSuggestion: `Please verify your API key or permissions in platform settings.`,
    };
  }

  if (msgLower.includes("econnrefused") || msgLower.includes("networkerror") || msgLower.includes("fetch failed")) {
    return {
      userMessage: `The ${apiName} service is currently taking longer than expected to connect.`,
      actionSuggestion: `Please verify that your backend server is online and try again.`,
    };
  }

  if (statusNum >= 500) {
    return {
      userMessage: `The ${apiName} service experienced a temporary server issue.`,
      actionSuggestion: `Please try your request again in a few moments.`,
    };
  }

  return {
    userMessage: `I wasn't able to complete the request for ${apiName} with the provided information.`,
    actionSuggestion: `Please choose an option below or specify what you'd like to update.`,
  };
}
