#!/bin/bash

# Test Airwallex webhook for payment_attempt.paid event
# This is a simulated webhook through POST request, since I can't try triggering it using Airwallex because Airwallex requires verified business identity to create account and trigger the webhook from the official service
# The webhook payload here follow the same structure as mentioned on the official docs: https://www.airwallex.com/docs/developer-tools__listen-for-webhook-events__payload-examples__online-payments#payment_attempt.*

curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-signature: airwallex_test_signature_123" \
  -d '{
    "id": "evt_100_2025081101549020043_8321220011893766",
    "name": "payment_attempt.paid",
    "account_id": "78814faa-1b30-4598-a9c8-f0583db8d09d",
    "livemode": false,
    "created_at": "2025-08-11T00:16:04Z",
    "data": {
      "object": {
        "id": "pa_aaaat9w2hgh8mzi1111",
        "object": "payment_attempt",
        "payment_intent_id": "int_aaaat9w2hgh8mzi1111",
        "amount": 16.66,
        "currency": "USD",
        "status": "SUCCEEDED",
        "customer_id": "cus_test_customer_123",
        "created_at": "2025-08-11T00:16:04Z",
        "payment_method": {
          "type": "card",
          "card": {
            "brand": "visa",
            "last4": "4242",
            "exp_month": 12,
            "exp_year": 2030
          }
        },
        "metadata": {
          "merchant_order_id": "ORDER-12345",
          "plan": "pro"
        }
      }
    }
  }'

echo ""
echo "Airwallex payment_attempt.paid webhook sent!"
