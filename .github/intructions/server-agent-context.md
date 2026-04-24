# Server Logging Context

## Why this is needed
A failed checkout was observed where Stripe payment was confirmed but Shopify order and BoldSign docs were not created. Server logs had no useful trail for that transaction.

The current implementation appears to only log thrown exceptions in some places. Shopify GraphQL often returns HTTP 200 with `userErrors`; those can be silent without explicit logging.

## Current end-to-end flow context
Client (`PayButton`) performs:
1. `POST /prepare-payment`
2. `stripe.confirmPayment`
3. Create Shopify order via `POST /shopify-admin-api` (from client helper)
4. `POST /update-payment-intent` with Shopify order id metadata
5. `POST /send-forms` to do post-order processing (Shopify notes, Sheets, BoldSign)

Critical requirement: logs must make it obvious where a transaction stopped.

## High-value identifiers to include in logs
- `paymentIntentId` (when available)
- `order_id`
- `order_number`
- `contact_email`
- route name
- step name

## Do not log
- full `formData`
- SSN values
- full personally sensitive payload fields
- secrets / access tokens

## Specific endpoint notes

### `/shopify-admin-api`
- Log request entry with a safe operation hint (first line/snippet of query or detected operation name).
- Log when GraphQL response contains `userErrors` anywhere in returned mutation payload.
- Keep existing response behavior.

### `/prepare-payment`
- Log start with `paymentIntentId`, `paymentMethodId` (or masked), `amount`.
- Log success summary (`insufficientFunds`, `isInstantVerification`).
- Log full error message on catch.

### `/update-payment-intent`
- Log start with `paymentIntentId`, has `metadata`, has `price`.
- Log success with updated intent id.
- Log catch with message.

### `/send-forms`
At minimum add logs at:
- route entry (identifiers)
- before/after Shopify order notes update
- before/after Google Sheets append
- before/after BoldSign API call(s)
- completion success
- catch/failure with identifiers + error

Also log when downstream call returns non-OK response, including status and a compact response summary.

## Expected outcome
After patching, one failed transaction should be diagnosable from logs without needing browser console access.