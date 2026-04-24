# Server Workspace Agent Prompt

Please implement targeted observability/logging improvements in `server.js` for the Stripe -> Shopify -> BoldSign flow.

## Goal
We had real failures where payment was confirmed but Shopify order and/or BoldSign docs were not created, and server logs did not show where the flow failed.

Add structured logs with clear step markers and error logs so each transaction can be traced end-to-end.

## Files
- `server.js` (Magnolia-Stripe-API workspace)

## Required changes
1. Add request-start and request-end (or success) logs for:
   - `/prepare-payment`
   - `/update-payment-intent`
   - `/send-forms`
   - `/shopify-admin-api`

2. In `/shopify-admin-api`, log not only thrown exceptions, but also GraphQL `userErrors` returned in successful HTTP responses.

3. In `/send-forms`, add logs around each major step:
   - route entry with key identifiers (`order_id`, `order_number`, `contact_email`)
   - Shopify order note update call result
   - Google Sheets append result
   - BoldSign request(s) result
   - final success
   - any caught error with stack/message and relevant identifiers

4. Keep behavior unchanged (no flow refactor, no breaking API response shape) unless required to safely log errors.

5. Avoid logging sensitive full payloads (SSN, full form blobs). Prefer summary identifiers and booleans.

## Logging format
Use a consistent prefix such as:
- `[PREPARE_PAYMENT] ...`
- `[UPDATE_PAYMENT_INTENT] ...`
- `[SHOPIFY_ADMIN_API] ...`
- `[SEND_FORMS] ...`

## Acceptance criteria
- For a successful transaction, logs clearly show step-by-step progression.
- For a failure, logs clearly show which step failed and why.
- GraphQL `userErrors` are visible in logs even when HTTP status is 200.

## Validation
- Run lint/tests if available.
- Confirm no syntax errors.
- Summarize exact log points added and provide brief examples of success/error log lines.
