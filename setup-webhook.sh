#!/bin/bash

# Personal Wealth AI - WAHA Webhook Setup Script
# Update WORKER_URL setelah deploy

WAHA_URL="https://waha-qikiufjwa2nh.cgk-max.sumopod.my.id"
SESSION="investku"
WORKER_URL="https://wealth-ai-waha.YOUR_SUBDOMAIN.workers.dev"  # GANTI INI!

echo "🔧 Setting up WAHA Webhook..."
echo "WAHA URL: $WAHA_URL"
echo "Session: $SESSION"
echo "Worker URL: $WORKER_URL"
echo ""

# Set webhook configuration
curl -X PUT "$WAHA_URL/api/sessions/$SESSION" \
  -H "Content-Type: application/json" \
  -d "{
    \"config\": {
      \"webhooks\": [{
        \"url\": \"$WORKER_URL/webhook\",
        \"events\": [\"message\", \"message.any\"],
        \"retries\": {
          \"delaySeconds\": 2,
          \"attempts\": 3
        }
      }]
    }
  }"

echo ""
echo "✅ Webhook configured!"
echo ""
echo "Test dengan kirim pesan '/help' ke WhatsApp"
