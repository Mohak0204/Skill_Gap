// Domain error types for the service layer
// These are mapped to HTTP status codes by the apiHandler

export class AppError extends Error {
    public readonly statusCode: number
    public readonly code: string

    constructor(message: string, statusCode: number, code: string) {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
        this.code = code
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND')
        this.name = 'NotFoundError'
    }
}

export class ValidationError extends AppError {
    public readonly details?: Record<string, string[]>

    constructor(message = 'Validation failed', details?: Record<string, string[]>) {
        super(message, 400, 'VALIDATION_ERROR')
        this.name = 'ValidationError'
        this.details = details
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED')
        this.name = 'UnauthorizedError'
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'FORBIDDEN')
        this.name = 'ForbiddenError'
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT')
        this.name = 'ConflictError'
    }
}

export class RateLimitError extends AppError {
    public readonly retryAfter?: number

    constructor(message = 'Too many requests', retryAfter?: number) {
        super(message, 429, 'RATE_LIMITED')
        this.name = 'RateLimitError'
        this.retryAfter = retryAfter
    }
}

export class ExternalServiceError extends AppError {
    constructor(message = 'External service error') {
        super(message, 502, 'EXTERNAL_SERVICE_ERROR')
        this.name = 'ExternalServiceError'
    }
}

export class FileTooLargeError extends AppError {
    constructor(message = 'File too large') {
        super(message, 413, 'FILE_TOO_LARGE')
        this.name = 'FileTooLargeError'
    }
}
