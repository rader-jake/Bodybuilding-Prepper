import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRICE_PRODUCT_ID || "";
export const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:52000";

export function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be set.");
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}
