Test mock payment flow
======================

This script automates a test of the mock payment flow in the backend:

- Create a mock payment (POST /api/payments/mock/create)
- Complete the mock payment (POST /api/payments/mock/:id/complete)
- Fetch the user's quick bookings (GET /api/quick-bookings/mine) and display the latest booking

Prerequisites
-------------

- `jq` installed (used to pretty-print JSON). On macOS: `brew install jq`.
- A valid `AUTH_TOKEN` (Bearer token for a test user in your backend).
- Optionally set `BASE_URL` if your backend isn't at `http://localhost:3000`.
- Set `SHOWTIME_ID` and `SEAT_LABEL` for the test booking.

Usage
-----

Set environment variables and run the script. Example:

```bash
export AUTH_TOKEN=eyJ...       # your bearer token
export SHOWTIME_ID=64f2e2...  # a real showtime id
export SEAT_LABEL=A4
export BASE_URL=http://localhost:3000
chmod +x scripts/test_mock_payment.sh
scripts/test_mock_payment.sh
```

The script prints each response. After completion, verify that the booking shown by `/api/quick-bookings/mine` matches the payment you created.
