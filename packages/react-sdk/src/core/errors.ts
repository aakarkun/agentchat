export class AgentChatError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AgentChatError";
    Object.setPrototypeOf(this, AgentChatError.prototype);
  }

  static fromFetchError(error: unknown, context?: string): AgentChatError {
    if (error instanceof AgentChatError) {
      return error;
    }

    if (typeof Response !== "undefined" && error instanceof Response) {
      return new AgentChatError(
        "HTTP_ERROR",
        error.status,
        `HTTP ${error.status}: ${error.statusText}${
          context ? ` (${context})` : ""
        }`,
        { url: error.url, statusText: error.statusText }
      );
    }

    if (error instanceof Error) {
      return new AgentChatError("NETWORK_ERROR", 0, error.message, {
        originalError: error,
      });
    }

    return new AgentChatError("UNKNOWN_ERROR", 0, String(error), {
      originalError: error,
    });
  }

  static isAuthError(error: unknown): boolean {
    return (
      error instanceof AgentChatError &&
      (error.status === 401 || error.status === 403)
    );
  }

  static isNetworkError(error: unknown): boolean {
    return error instanceof AgentChatError && error.code === "NETWORK_ERROR";
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.message,
      details: this.details,
    };
  }
}

