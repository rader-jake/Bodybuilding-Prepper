import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
});

const API_URL = process.env.API_URL || 'http://localhost:52000';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function testConfirm(sessionId: string, token: string) {
    console.log(`Testing confirm for session ${sessionId}...`);
    const res = await fetch(`${API_URL}/api/billing/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    console.log('Confirm response:', data);
    return data;
}

async function triggerWebhook(type: string, object: any) {
    if (!WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET not set, cannot sign mock webhook');
        return;
    }

    console.log(`Triggering mock webhook ${type}...`);
    const payload = JSON.stringify({
        id: 'evt_test_' + Date.now(),
        type,
        data: { object },
        created: Math.floor(Date.now() / 1000),
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = stripe.webhooks.generateTestHeader({
        payload,
        secret: WEBHOOK_SECRET,
    });

    const res = await fetch(`${API_URL}/api/stripe/webhook`, {
        method: 'POST',
        headers: {
            'Stripe-Signature': signature,
            'Content-Type': 'application/json',
        },
        body: payload,
    });

    const text = await res.text();
    console.log(`Webhook response (${res.status}):`, text);
}

// Example usage (manual):
// testConfirm('cs_test_...', 'YOUR_JWT_TOKEN');
// triggerWebhook('checkout.session.completed', { ... });
