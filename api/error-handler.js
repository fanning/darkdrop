/**
 * Ecosystem Error Handler
 *
 * Standardized error handling for the HeadFarm API
 * Version: 1.0.0
 * Standard: ECOSYSTEM_ERROR_HANDLING_STANDARD.md
 */

class ErrorHandler {
  /**
   * Handle errors with ecosystem-standard messages
   * @param {Error} error - The error object
   * @param {string} context - Context string (e.g., "Registration", "File upload")
   * @returns {Object} Error response with status and messages
   */
  static handle(error, context) {
    // Log full error for debugging
    console.error(`${context} error:`, {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });

    // Validation errors - pass through as-is
    if (error.status === 400 && error.messages) {
      return {
        status: 400,
        messages: error.messages
      };
    }

    // AWS SES errors
    if (this.isAwsSesError(error)) {
      return {
        status: 400,
        messages: [this.getAwsSesMessage(error)]
      };
    }

    // AWS S3 errors
    if (this.isAwsS3Error(error)) {
      return {
        status: 400,
        messages: [this.getAwsS3Message(error)]
      };
    }

    // Database errors
    if (this.isPrismaError(error)) {
      return {
        status: 400,
        messages: [this.getPrismaMessage(error)]
      };
    }

    // Stripe errors
    if (this.isStripeError(error)) {
      return {
        status: 400,
        messages: [this.getStripeMessage(error)]
      };
    }

    // Twilio errors
    if (this.isTwilioError(error)) {
      return {
        status: 400,
        messages: [this.getTwilioMessage(error)]
      };
    }

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        status: 400,
        messages: [this.getNetworkMessage(error)]
      };
    }

    // Generic fallback with details
    return {
      status: 400,
      messages: [
        `${context} failed: ${error.message || 'Unknown error'}. Error code: ${error.code || 'N/A'}. Please contact support if this persists.`
      ]
    };
  }

  // AWS SES Detection and Messages
  static isAwsSesError(error) {
    return error.message?.includes('ConfigError') ||
           error.message?.includes('Missing region') ||
           error.code === 'MessageRejected' ||
           error.code === 'ServiceUnavailable' ||
           error.name === 'ServiceException' ||
           error.code === 'Throttling';
  }

  static getAwsSesMessage(error) {
    if (error.message?.includes('ConfigError') || error.message?.includes('Missing region')) {
      return 'AWS email service is misconfigured. Please contact support.';
    }
    if (error.code === 'MessageRejected' || error.code === 'ServiceUnavailable' || error.name === 'ServiceException') {
      return 'AWS email service is OFFLINE. Amazon\'s email servers are currently unavailable. Please try again in 10-15 minutes.';
    }
    if (error.code === 'Throttling') {
      return 'AWS rate limit exceeded. Too many requests. Please wait 5 minutes and try again.';
    }
    if (error.code === 'InvalidParameterValue') {
      return 'AWS rejected the email address format. Please use a different email address.';
    }
    return 'AWS email service error. Please try again or contact support.';
  }

  // AWS S3 Detection and Messages
  static isAwsS3Error(error) {
    return error.code === 'NoSuchKey' ||
           error.code === 'AccessDenied' ||
           error.code === 'EntityTooLarge' ||
           error.message?.includes('S3');
  }

  static getAwsS3Message(error) {
    if (error.code === 'EntityTooLarge') {
      return 'AWS rejected the file: exceeds maximum size. Please upload a smaller file.';
    }
    if (error.code === 'AccessDenied') {
      return 'AWS storage service denied access. This file may have been deleted or moved.';
    }
    if (error.code === 'NoSuchKey') {
      return 'File not found in AWS storage. It may have been deleted.';
    }
    return 'AWS storage service is temporarily unavailable. Please try again in a few minutes.';
  }

  // Prisma/Database Detection and Messages
  static isPrismaError(error) {
    return error.code?.startsWith('P20');
  }

  static getPrismaMessage(error) {
    switch (error.code) {
      case 'P2002':
        const field = error.meta?.target?.[0] || 'value';
        return `An account with this ${field} already exists.`;
      case 'P2003':
        return 'Database constraint violation. Invalid or missing related record.';
      case 'P2025':
        return 'Record not found. It may have been deleted.';
      default:
        return 'Database error. Please try again or contact support.';
    }
  }

  // Stripe Detection and Messages
  static isStripeError(error) {
    return error.type?.includes('Stripe') || error.message?.includes('Stripe');
  }

  static getStripeMessage(error) {
    if (error.code === 'card_declined') {
      return `Stripe payment processor declined the card. ${error.message}. Please use a different payment method.`;
    }
    if (error.code === 'insufficient_funds') {
      return 'Stripe reports insufficient funds. Please add funds or use a different card.';
    }
    return 'Stripe payment service error. Please try again or contact support.';
  }

  // Twilio Detection and Messages
  static isTwilioError(error) {
    return error.message?.includes('Twilio') ||
           error.message?.includes('SMS') ||
           error.message?.includes('OTP');
  }

  static getTwilioMessage(error) {
    return 'SMS provider is OFFLINE. Your action was completed, but verification code could not be sent. Please log in to resend.';
  }

  // Network Detection and Messages
  static isNetworkError(error) {
    return ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code);
  }

  static getNetworkMessage(error) {
    switch (error.code) {
      case 'ECONNREFUSED':
        return 'Connection refused to external service. Please try again in a few minutes.';
      case 'ETIMEDOUT':
        return 'Connection timed out. Please check your internet connection and try again.';
      case 'ENOTFOUND':
      case 'EAI_AGAIN':
        return 'DNS lookup failed. Network connectivity issue. Please try again.';
      default:
        return 'Network error. Please check your connection and try again.';
    }
  }
}

module.exports = ErrorHandler;
