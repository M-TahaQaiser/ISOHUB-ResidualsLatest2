#!/bin/bash

# Security Setup Script for ISOHub Production Deployment
echo "🔒 Setting up production security environment..."

# Generate encryption key if not exists
if [ -z "$ENCRYPTION_KEY" ]; then
    export ENCRYPTION_KEY=$(openssl rand -hex 32)
    echo "✅ Generated new encryption key"
fi

# Set SESSION_SECRET if not exists
if [ -z "$SESSION_SECRET" ]; then
    export SESSION_SECRET=$(openssl rand -hex 64)
    echo "✅ Generated new session secret"
fi

echo "🔐 Security environment configured"
echo "Encryption Key: [HIDDEN]"
echo "Session Secret: [HIDDEN]"

# Test security endpoints
echo "🧪 Testing security assessment..."
curl -s http://localhost:5000/api/security/quick-check > /tmp/security-check.json
if [ $? -eq 0 ]; then
    echo "✅ Security endpoints accessible"
else
    echo "❌ Security endpoints failed"
fi

echo "🚀 Security setup complete"