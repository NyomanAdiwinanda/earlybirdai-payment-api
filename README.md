# EarlyBird AI Payment API

## Table of Contents

- [Setup & Run Instructions](#setup--run-instructions)
- [Summary of Approach and Architecture](#summary-of-approach-and-architecture)
- [Assumptions or Design Decisions](#assumptions-or-design-decisions)
- [Notes on AI Tools Used](#notes-on-ai-tools-used)
- [What You'd Improve or Extend with More Time](#what-youd-improve-or-extend-with-more-time)

## Setup & Run Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/NyomanAdiwinanda/earlybirdai-payment-api
cd earlybirdai-payment-api
```

### 2. Environment Configuration

1. Rename `.env.example` to `.env`
2. Fill in all the missing blank variables with the following configuration:

```env
# Database connection string for PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@dev-db:5432/earlybirddb"

# Stripe secret key for API calls (used to get customer details like email)
STRIPE_API_KEY=

# JWT secret for token signing and verification
JWT_SECRET=your-super-secure-jwt-secret

# OpenExchangeRates API key for currency conversion
OPEN_EXCHANGE_APP_ID=

# Google OAuth client ID for authentication
GOOGLE_CLIENT_ID=

# Google OAuth client secret for authentication
GOOGLE_CLIENT_SECRET=

# Google OAuth callback URL
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

3. For the `STRIPE_API_KEY`, you can get it by creating a sandbox dashboard at https://stripe.com/

4. For the `OPEN_EXCHANGE_APP_ID`, you can get it from https://openexchangerates.org/ by creating a free account

5. For the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Configure the OAuth consent screen if prompted
   - Select "Web application" as the application type
   - Add `http://localhost:3000/auth/google/callback` to "Authorized redirect URIs"
   - Copy the generated Client ID and Client Secret to your `.env` file

**Important:** Make sure all environment variables are properly set, otherwise it will not work properly.

### 3. Prerequisites

- Make sure Docker is installed and running
- Ensure no local PostgreSQL is running on port 5432

### 4. Start the Application

```bash
docker-compose up -d
```

## Testing Webhook Payloads

### Stripe Webhooks

There are 2 ways to test Stripe webhook payloads:

#### Option 1: Trigger via Stripe CLI

**1) Install Stripe CLI:**

```bash
brew install stripe/stripe-cli/stripe
```

**2) Login to Stripe:**

```bash
stripe login
```

**3) Listen for webhooks:**

```bash
stripe listen --forward-to http://localhost:3000/webhooks/payment
```

**4) Trigger webhook via stripe-cli:**

- For `payment_intent.succeeded`:
  ```bash
  ./scripts/stripe-payment-success-webhook-test.sh
  ```
  Or you could just type:
  ```bash
  stripe trigger payment_intent.succeeded
  ```
- For `payment_intent.payment_failed`:
  ```bash
  ./scripts/stripe-payment-failed-webhook-test.sh
  ```
  Or you could just type:
  ```bash
  stripe trigger payment_intent.payment_failed
  ```

#### Option 2: Trigger via Official Stripe Development Dashboard

Since official webhooks from Stripe can't be passed to localhost, we need to build a bridge using UltraHook:

**1) Get UltraHook API key:**

- Visit: https://www.ultrahook.com/
- Sign up and get your API key

**2) Configure UltraHook:**

```bash
echo "api_key: <your_ultrahook_key>" > ~/.ultrahook
```

**3) Install UltraHook:**

```bash
gem install ultrahook
```

**4) Run UltraHook:**

```bash
ultrahook webhook 3000/webhooks/payment
```

**5) Copy the generated URL:**
It will log something like: `https://<namespace>-webhook.ultrahook.com -> http://localhost:3000/webhooks/payment`

**6) Configure Stripe Dashboard:**

- Use this URL `https://<namespace>-webhook.ultrahook.com` as the webhook URL in your Stripe dashboard
- Make sure you choose these events to listen for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`

**7) Test transactions:**
Try creating transactions from the Stripe development dashboard

### Airwallex Webhooks

For this project, Airwallex webhooks are simulated through script that does POST requests since Airwallex requires verified business identity to create an account and trigger webhooks from the official service. The payload being used is the same as mentioned in the official documentation example webhook payload: https://www.airwallex.com/docs/developer-tools__listen-for-webhook-events__payload-examples__online-payments#payment_attempt.\*

**Test scripts available:**

- `./scripts/airwallex-payment-success-webhook-test.sh`
- `./scripts/airwallex-payment-failed-webhook-test.sh`
- `./scripts/airwallex-refund-settled-webhook-test` (for refund, make sure payment success script is run first)

## API Endpoints

For comprehensive API documentation, you can import the Postman collection from [`EarlyBird-Payment-API.postman_collection.json`](./EarlyBird-Payment-API.postman_collection.json) in this codebase.

### Getting Google OAuth Access Token for Postman

To test authenticated endpoints in Postman, you need to obtain an access token:

1. **Start the server** (make sure it's running on `http://localhost:3000`)
2. **Open your browser** and navigate to: `http://localhost:3000/auth/google`
3. **Complete Google sign-in** - you'll be redirected to Google's sign-in page
4. **After successful authentication**, the response will contain an `access_token`
5. **Copy the access_token** and use it in Postman as a Bearer token for authenticated endpoints

## Technologies Used

- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Google OAuth2.0 with JWT
- **Exchange Rates:** OpenExchangeRates API (for converting currency on live ledgers)

## Project Structure

```
earlybirdai-payment-api/
├── src/
│   ├── constants/          # Application constants and configurations
│   ├── modules/
│   │   ├── auth/           # Google OAuth2.0 authentication module
│   │   ├── payments/       # Payment webhook processing module
│   │   ├── stripe/         # Stripe-specific services
│   │   ├── airwallex/      # Airwallex-specific services
│   │   ├── ledger/         # Ledger management and balance tracking
│   │   └── prisma/         # Database service module
│   └── main.ts             # Application entry point
├── prisma/                 # Database schema and migrations
└── scripts/                # Webhook testing scripts
```

## Summary of Approach and Architecture

### Architecture Overview

This project implements a **modular architecture** using NestJS, designed to handle payment webhooks from multiple payment providers (Stripe and Airwallex) while maintaining a comprehensive financial ledger system.

### Core Components

1. **Payment Webhook Gateway** (`/webhooks/payment`)
   - Single unified endpoint that accepts webhooks from both Stripe and Airwallex
   - Intelligent routing based on webhook signature headers
   - Idempotent processing to prevent duplicate transactions

2. **Modular Payment Services**
   - **Stripe Service**: Handles Stripe-specific webhook processing and customer data retrieval
   - **Airwallex Service**: Processes Airwallex payment events and status updates
   - Each service encapsulates provider-specific logic while implementing common interfaces

3. **Ledger System**
   - **Double-entry bookkeeping**: Every transaction creates corresponding debit/credit entries
   - **Multi-currency support**: Real-time currency conversion using OpenExchangeRates API
   - **Balance tracking**: Automatic balance calculation with USD normalization

### Data Flow Architecture

<img width="1822" height="603" alt="Image" src="https://github.com/user-attachments/assets/814985d1-fe15-4db2-9b79-e03fefd6f51b" />

#### Step-by-Step Process Flow

**1. Webhook Reception** _(PaymentController)_

- External payment providers (Stripe or Airwallex) send webhook notifications to the unified endpoint
- The **Payment Controller** (`src/modules/payments/payments.controller.ts`) receives all incoming webhooks at `/webhooks/payment`
- This single entry point simplifies webhook management and provides consistent logging

**2. Initial Processing** _(PaymentController → PaymentService)_

- The **Payment Controller** immediately forwards the webhook to the **Payment Service**
- The **Payment Service** (`src/modules/payments/payments.service.ts`) acts as the central orchestrator for all payment processing logic
- No business logic occurs at the controller level - it's purely for routing

**3. Provider Detection & Routing** _(PaymentService)_

- The **Payment Service** (`src/modules/payments/payments.service.ts`) examines the webhook signature headers to determine the source
- **Stripe Detection**: Looks for `stripe-signature` header
- **Airwallex Detection**: Looks for `x-signature` header
- **Unknown Source Handling**: If neither signature is found, the webhook is rejected/ignored for security

**4. Provider-Specific Processing** _(StripeService / AirwallexService)_

- **If Stripe**: Routes to **Stripe Service** (`src/modules/stripe/stripe.service.ts`) for Stripe-specific webhook processing
- **If Airwallex**: Routes to **Airwallex Service** (`src/modules/airwallex/airwallex.service.ts`) for Airwallex-specific webhook processing
- Each service handles provider-specific payload formats and business rules

**5. Financial Record Creation** _(StripeService / AirwallexService)_

- The corresponding payment gateway service (Stripe/Airwallex) processes the webhook data
- **Payment Record**: Creates a raw payment record in the database with original webhook data
- **Ledger Generation**: Transforms payment data into standardized financial ledger entries (debit/credit)
- **Currency Conversion**: Converts non-USD amounts to USD using real-time exchange rates

**6. Ledger Service Integration** _(LedgerService)_

- The processed ledger data is sent to the **Ledger Service** (`src/modules/ledger/ledger.service.ts`)
- **Double-Entry Bookkeeping**: Creates corresponding debit and credit entries
- **Balance Calculation**: Updates running balances and financial totals
- **Database Persistence**: Stores all financial records with timezone-aware timestamps

### Key Design Decisions

- **Single Point of Entry**: One webhook endpoint for all providers
- **Clean Separation**: Each service handles its specific responsibilities
- **Extensibility**: Easy to add new payment providers by creating new services

## Assumptions or Design Decisions

### Business Logic Assumptions

1. **USD as Base Currency**: All financial calculations and balance tracking use USD as the base currency for consistency and simplified reporting
2. **Real-time Exchange Rates**: Currency conversions use live exchange rates from OpenExchangeRates API, assuming network availability during transaction processing
3. **Double-Entry Bookkeeping**: Every payment creates both debit and credit entries to maintain financial accuracy and audit trails
4. **Idempotent Webhooks**: Payment providers may send duplicate webhooks, so the system is designed to handle reprocessing gracefully

### Technical Design Decisions

1. **Single Webhook Endpoint Strategy**
   - **Decision**: Use one unified endpoint (`/webhooks/payment`) for all payment providers
   - **Rationale**: Simplifies infrastructure, monitoring, and webhook management
   - **Trade-off**: Requires intelligent routing logic but reduces complexity in deployment

2. **Provider-Specific Service Separation**
   - **Decision**: Create dedicated services for each payment provider (Stripe, Airwallex)
   - **Rationale**: Encapsulates provider-specific logic and makes adding new providers easier
   - **Trade-off**: More modules to maintain but better separation of concerns

### Data Storage Decisions

1. **Separate Payment and Ledger Tables**
   - **Decision**: Store raw payment data separately from processed ledger entries
   - **Rationale**: Maintains audit trail of original webhook data while allowing normalized financial records
   - **Trade-off**: Some data duplication but better data integrity

2. **Precision Handling**
   - **Decision**: Use high-precision decimal types for all financial amounts
   - **Rationale**: Prevents floating-point rounding errors in financial calculations
   - **Trade-off**: Slightly more complex arithmetic but essential for financial accuracy

   **Example Payment Data Being Recorded From the Webhooks:**

   <img width="1795" height="430" alt="Image" src="https://github.com/user-attachments/assets/da299de9-8ab9-4042-931a-ab1ac9435122" />

   **Example Ledger Data Generation:**

   <img width="1794" height="461" alt="Image" src="https://github.com/user-attachments/assets/a0381f6f-bd2f-409d-8960-6fec8edbb528" />

## Notes on AI Tools Used

### Development Support with GitHub Copilot

During the development of this project, **GitHub Copilot** was utilized as a coding assistant to enhance productivity and code quality. The AI tool supported the development process in the following ways:

- **Error Handling**: Suggested proper error handling patterns and exception management strategies
- **Code Review**: Helped identify potential issues in code logic and suggested improvements
- **Refactoring**: Assisted in cleaning up code structure and improving maintainability

### Development Approach

**Important Note**: While AI tools provided valuable assistance, the core architectural decisions, business logic implementation, and problem-solving approaches were **human-driven**. The AI served as a **productivity multiplier** rather than a replacement for engineering expertise.

**My Role as Developer**:

- Defined the overall system architecture and design patterns
- Made critical technical decisions about database design, API structure
- Wrote and reviewed all business logic for payment processing and financial calculations

**AI Tool Benefits**:

- Accelerated development velocity by reducing time spent on repetitive coding tasks
- Provided suggestions for code improvements and best practices
- Helped catch potential bugs and edge cases during development
- Enhanced documentation quality and completeness

## What I Would Improve or Extend with More Time

Given additional development time, here are the key improvements and extensions that would enhance the system:

1. **Enhanced Currency Conversion Strategy**
   - **Current Issue**: Using OpenExchangeRates for all currency conversions may create discrepancies with actual gateway settlement rates
   - **Each payment gateway** (Stripe, Airwallex) has its own conversion API with rates that may differ from third-party services
   - **Improved Approach**: Store both conversion rates for better financial reconciliation:
     - `gatewayRate` — The actual conversion rate used by the payment gateway (for real settlement basis and exact payout matching)
     - `marketRate` — From OpenExchangeRates (for internal analytics and unified reporting currency consistency)
   - **Benefits**: This dual-rate system ensures accurate financial reconciliation while maintaining consistent internal reporting across multiple gateways

2. **Retry Mechanism**
   - Add a retry mechanism for failed event processing to prevent data loss during temporary outages.

3. **Additional Payment Gateways**
   - Extend the architecture to easily plug in additional providers beyond Stripe/Airwallex, following the same event-parsing pattern

4. **API Improvements**
   - Implement API versioning for backward compatibility

5. **Scenario Analysis & Edge Case Testing**
   - Due to time constraints, I haven't had sufficient opportunity to analyze all possible failure scenarios and edge cases that could occur. A thorough analysis would involve examining potential issues such as network failures, database inconsistencies, concurrent transaction conflicts, and unexpected webhook behaviors from payment providers.

6. **Testing**
   - Add unit testing since I haven't got time to make it
