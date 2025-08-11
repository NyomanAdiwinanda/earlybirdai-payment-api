#!/bin/bash

# Test Airwallex webhook for refund.settled event
# This is a simulated webhook through POST request, since I can't try triggering it using Airwallex because Airwallex requires verified business identity to create account and trigger the webhook from the official service
# The webhook payload here follow the same structure as mentioned on the official docs: https://www.airwallex.com/docs/developer-tools__listen-for-webhook-events__payload-examples__online-payments#refund.*

curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-signature: airwallex_test_signature_123" \
  -d '{
    "id": "evt_100_2025081101549020043_8321220011893777",
    "name": "refund.settled",
    "account_id": "78814faa-1b30-4598-a9c8-f0583db8d09d",
    "livemode": false,
    "created_at": "2025-08-11T00:18:30Z",
    "data": {
      "object": {
        "id": "rfd_aaaanqn5bgh8mnssssh_ga04nr",
        "object": "refund",
        "payment_attempt_id": "pa_aaaat9w2hgh8mzi1111",
        "payment_intent_id": "int_aaaat9w2hgh8mzi1111",
        "amount": 16.66,
        "currency": "USD",
        "reason": "Customer requested refund",
        "status": "SETTLED",
        "created_at": "2025-08-11T00:17:15Z",
        "settled_at": "2025-08-11T00:18:30Z",
        "metadata": {
          "original_order_id": "ORDER-12345"
        }
      }
    }
  }'

echo ""
echo "Airwallex refund.settled webhook sent!"
