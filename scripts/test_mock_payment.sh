#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "This script requires 'jq' to parse JSON. Install it and retry."
  exit 1
fi

BASE_URL=${BASE_URL:-http://localhost:3000}
AUTH_TOKEN=${AUTH_TOKEN:-}
SHOWTIME_ID=${SHOWTIME_ID:-}
SEAT_LABEL=${SEAT_LABEL:-A1}
BOOKING_DATE=${BOOKING_DATE:-$(date +%Y-%m-%d)}
BOOKING_TIME=${BOOKING_TIME:-19:00}

if [ -z "$AUTH_TOKEN" ]; then
  echo "Please set AUTH_TOKEN environment variable (Bearer token for a test user)."
  echo "Example: export AUTH_TOKEN=eyJ..."
  exit 1
fi

echo "Using BASE_URL=$BASE_URL"
echo "Showtime: $SHOWTIME_ID | Seat: $SEAT_LABEL | Date: $BOOKING_DATE $BOOKING_TIME"

echo "--- Creating mock payment ---"
create_resp=$(curl -s -X POST "$BASE_URL/api/payments/mock/create" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"showtimeId\": \"$SHOWTIME_ID\", \"seats\": [\"$SEAT_LABEL\"], \"combos\": [], \"voucherCode\": null, \"bookingDate\": \"$BOOKING_DATE\", \"bookingTime\": \"$BOOKING_TIME\"}")

echo "$create_resp" | jq '.'

paymentId=$(echo "$create_resp" | jq -r '.data.paymentId // .paymentId // empty')
if [ -z "$paymentId" ]; then
  echo "ERROR: could not obtain paymentId from create response"
  exit 1
fi

echo "Payment created: $paymentId"

echo "--- Completing mock payment ---"
complete_resp=$(curl -s -X POST "$BASE_URL/api/payments/mock/$paymentId/complete" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bankCode":"MBBANK_MO_PHONG"}')

echo "$complete_resp" | jq '.'

echo "Sleeping briefly to allow backend persistence..."
sleep 1

echo "--- Fetching quick bookings for current user ---"
bookings_resp=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$BASE_URL/api/quick-bookings/mine")
echo "$bookings_resp" | jq '.'

echo "--- Latest booking (first item) ---"
echo "$bookings_resp" | jq '.data[0]'

echo "Done. If the booking above corresponds to the payment you created, the end-to-end flow works."
