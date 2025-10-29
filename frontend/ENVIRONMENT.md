# Environment Configuration

## Required Environment Variables

Create `.env.development` and `.env.production` files in the frontend directory with the following variables:

### Development Environment (`.env.development`)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8787
VITE_AUTH_TOKEN=dev-token-change-in-production

# Logging Configuration  
VITE_LOG_LEVEL=debug

# External Services (Development - Disabled)
VITE_SENTRY_DSN=
VITE_LOGROCKET_APP_ID=
VITE_LOGGING_ENDPOINT=
VITE_ERROR_REPORTING_ENDPOINT=

# Development Features
VITE_ENABLE_DEV_TOOLS=true
VITE_MOCK_API=false
```

### Production Environment (`.env.production`)
```bash
# API Configuration
VITE_API_BASE_URL=https://ppp-newsletter.tim-611.workers.dev
VITE_AUTH_TOKEN=your-production-auth-token

# Logging Configuration
VITE_LOG_LEVEL=warn

# External Services (Production)
VITE_SENTRY_DSN=your-production-sentry-dsn
VITE_LOGROCKET_APP_ID=your-production-logrocket-id
VITE_LOGGING_ENDPOINT=https://your-logging-service.com/api/logs
VITE_ERROR_REPORTING_ENDPOINT=https://your-error-service.com/api/errors

# Development Features
VITE_ENABLE_DEV_TOOLS=false
VITE_MOCK_API=false
```

## Environment Variable Descriptions

- `VITE_API_BASE_URL`: Base URL for the backend API
- `VITE_AUTH_TOKEN`: Authentication token for API calls
- `VITE_LOG_LEVEL`: Logging level (debug, info, warn, error)
- `VITE_SENTRY_DSN`: Sentry DSN for error tracking
- `VITE_LOGROCKET_APP_ID`: LogRocket application ID for session replay
- `VITE_LOGGING_ENDPOINT`: Custom logging endpoint for structured logs
- `VITE_ERROR_REPORTING_ENDPOINT`: Custom error reporting endpoint
- `VITE_ENABLE_DEV_TOOLS`: Enable development tools
- `VITE_MOCK_API`: Enable API mocking for testing

## Setup Instructions

1. Copy the appropriate configuration above
2. Create `.env.development` and `.env.production` files
3. Update the values with your actual configuration
4. Restart the development server after creating/updating .env files

## Cloudflare Pages Environment Variables

### Required Variables for Production Deployment

#### `VITE_UNSUBSCRIBE_WEBHOOK`
- **Description**: Webhook URL for processing unsubscribe requests from the frontend form
- **Required**: Yes  
- **Example**: `https://ppp-newsletter.tim-611.workers.dev/api/unsubscribe`
- **Usage**: When users submit the unsubscribe form, the frontend will POST to this URL
- **Fallback**: If not set, defaults to the direct API endpoint
- **CORS**: Configured to allow cross-origin requests from Cloudflare Pages

#### Configuration in Cloudflare Pages:
1. Go to Cloudflare Pages dashboard
2. Select your PPP Newsletter frontend project  
3. Go to Settings > Environment Variables
4. Add `VITE_UNSUBSCRIBE_WEBHOOK` with your worker's unsubscribe endpoint URL

### Technical Implementation
- The UnsubscribePage.tsx component uses `import.meta.env.VITE_UNSUBSCRIBE_WEBHOOK`
- CORS headers are configured in the backend to allow frontend requests
- Supports both JSON responses (for frontend) and HTML responses (for email links) 