import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((value) => value.toString(16).padStart(2, "0")).join("");
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID") || "";
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
    if (!url || !serviceKey || !razorpayKey || !razorpaySecret) {
      return json({ error: "Payment verification is not configured." }, 503);
    }

    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();
    const paymentId = String(body?.razorpayPaymentId || "").trim();
    const suppliedOrderId = String(body?.razorpayOrderId || "").trim();
    const signature = String(body?.razorpaySignature || "").trim().toLowerCase();
    if (!orderId || !paymentId || !suppliedOrderId || !/^[0-9a-f]{64}$/.test(signature)) {
      return json({ verified: false, error: "Missing or invalid payment verification details." }, 400);
    }

    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await db
      .from("customer_orders")
      .select("order_id,total_price,payment_status,razorpay_order_id,razorpay_payment_id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (orderError || !order) {
      console.error("Order lookup failed during verification:", orderError?.message);
      return json({ verified: false, error: "Saved order could not be found." }, 404);
    }

    const trustedRazorpayOrderId = String(order.razorpay_order_id || "");
    if (!trustedRazorpayOrderId || suppliedOrderId !== trustedRazorpayOrderId) {
      return json({ verified: false, error: "The Razorpay order does not match the saved order." }, 400);
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(razorpaySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expectedSignature = toHex(await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(trustedRazorpayOrderId + "|" + paymentId),
    ));
    if (!safeEqual(expectedSignature, signature)) {
      return json({ verified: false, error: "Razorpay payment signature is invalid." }, 400);
    }

    if (order.payment_status === "paid" && order.razorpay_payment_id === paymentId) {
      return json({ verified: true, orderId, alreadyProcessed: true });
    }
    if (order.payment_status === "paid" && order.razorpay_payment_id !== paymentId) {
      return json({ verified: false, error: "This order is already linked to a different successful payment." }, 409);
    }

    // Verify the amount, currency, linked order and captured status against Razorpay itself.
    const apiResponse = await fetch(
      "https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId),
      { headers: { "Authorization": "Basic " + btoa(razorpayKey + ":" + razorpaySecret) } },
    );
    const payment = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("Razorpay payment lookup failed:", payment?.error?.description || apiResponse.status);
      return json({ verified: false, error: "Could not confirm payment status with Razorpay. Please retry verification." }, 502);
    }
    const expectedAmount = Math.round(Number(order.total_price) * 100);
    if (
      payment.order_id !== trustedRazorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return json({ verified: false, error: "Payment details do not match this order." }, 409);
    }
    if (payment.status !== "captured") {
      return json({
        verified: false,
        error: payment.status === "authorized"
          ? "Payment is authorised but not yet captured. The order will be confirmed after capture."
          : "Razorpay has not marked this payment as captured. The order has not been confirmed.",
      }, 409);
    }

    const { error: updateError } = await db
      .from("customer_orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: paymentId,
        status: "paid",
      })
      .eq("order_id", orderId)
      .eq("razorpay_order_id", trustedRazorpayOrderId)
      .neq("payment_status", "paid");

    if (updateError) {
      console.error("Verified payment but order update failed:", updateError.message);
      return json({ verified: false, error: "Payment was captured, but the order update failed. Keep your order ID and contact the store." }, 500);
    }
    return json({ verified: true, orderId });
  } catch (error) {
    console.error("verify-razorpay-payment failed:", error);
    return json({ verified: false, error: error instanceof Error ? error.message : "Unexpected verification error." }, 500);
  }
});
