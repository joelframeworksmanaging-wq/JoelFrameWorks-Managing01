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
const frameSizePrices: Record<string, number> = {
  "10 × 8": 300,
  "12 × 8": 350,
  "12 × 10": 380,
  "15 × 10": 500,
  "15 × 12": 580,
  "18 × 12": 750,
  "20 × 16": 1000,
  "20 × 30": 2500,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID") || "";
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
    if (!url || !serviceKey || !razorpayKey || !razorpaySecret) {
      return json({ error: "Payment gateway is not configured. Ask the store administrator to add Razorpay Edge Function secrets." }, 503);
    }

    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();
    if (!/^JFW(?:-C)?-\d{8}-[A-Z0-9]{4,6}$/.test(orderId)) {
      return json({ error: "Invalid Joel Frame Work order reference." }, 400);
    }

    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await db
      .from("customer_orders")
      .select("order_id,order_type,total_price,order_details,payment_status,razorpay_order_id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError.message);
      return json({ error: "Could not read the saved order. Please contact the store." }, 500);
    }
    if (!order) return json({ error: "Saved order was not found. Please return to checkout and try again." }, 404);
    if (order.payment_status === "paid") return json({ error: "This order is already marked as paid." }, 409);

    const details = order.order_details && typeof order.order_details === "object" ? order.order_details : {};
    let expectedRupees: number | null = null;

    if (order.order_type === "product") {
      const productId = String((details as Record<string, unknown>).productId || "");
      const size = String((details as Record<string, unknown>).size || "");
      const { data: productsRow, error: productsError } = await db
        .from("site_content").select("content").eq("key", "products").maybeSingle();
      if (productsError) {
        console.error("Product catalogue lookup failed:", productsError.message);
        return json({ error: "Could not validate the product catalogue. Please try again later." }, 500);
      }
      const products = Array.isArray(productsRow?.content) ? productsRow.content : [];
      const product = products.find((item: Record<string, unknown>) => item.id === productId && item.active !== false);
      if (!product) return json({ error: "This frame design is unavailable. Please refresh the product page." }, 409);
      expectedRupees = frameSizePrices[size] ?? null;
    } else if (order.order_type === "combo") {
      const comboId = String((details as Record<string, unknown>).comboId || "");
      const { data: combosRow, error: combosError } = await db
        .from("site_content").select("content").eq("key", "combo_offers").maybeSingle();
      if (combosError) {
        console.error("Combo catalogue lookup failed:", combosError.message);
        return json({ error: "Could not validate the combo catalogue. Please try again later." }, 500);
      }
      const combos = Array.isArray(combosRow?.content) ? combosRow.content : [];
      const combo = combos.find((item: Record<string, unknown>) => item.id === comboId && item.active !== false);
      if (!combo) return json({ error: "This combo offer is unavailable. Please refresh the combo page." }, 409);
      expectedRupees = Number(combo.price);
    } else {
      return json({ error: "Unsupported order type." }, 400);
    }

    if (!Number.isFinite(expectedRupees) || expectedRupees === null || expectedRupees <= 0) {
      return json({ error: "The selected product or size has no valid price in the store catalogue." }, 409);
    }
    const savedRupees = Number(order.total_price);
    if (!Number.isFinite(savedRupees) || Math.round(savedRupees * 100) !== Math.round(expectedRupees * 100)) {
      return json({ error: "The saved order total does not match the current catalogue price. Please restart checkout so the order can be recalculated." }, 409);
    }

    const amount = Math.round(expectedRupees * 100);
    const auth = btoa(razorpayKey + ":" + razorpaySecret);
    const rpHeaders = { "Authorization": "Basic " + auth, "Content-Type": "application/json" };

    // Reuse the existing Razorpay order on retry to avoid creating duplicate payable orders.
    let razorpayOrder: Record<string, unknown> | null = null;
    if (order.razorpay_order_id) {
      const existingResponse = await fetch(
        "https://api.razorpay.com/v1/orders/" + encodeURIComponent(String(order.razorpay_order_id)),
        { headers: rpHeaders },
      );
      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        if (existing.status === "paid") {
          return json({ error: "Razorpay shows this order as paid. Please contact the store if the website has not updated yet." }, 409);
        }
        if (existing.amount === amount && existing.currency === "INR" && existing.receipt === orderId) {
          razorpayOrder = existing;
        }
      }
    }

    if (!razorpayOrder) {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: rpHeaders,
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: orderId,
          notes: { joel_order_id: orderId },
        }),
      });
      const created = await response.json();
      if (!response.ok) {
        console.error("Razorpay order creation failed:", created?.error?.description || response.status);
        return json({ error: created?.error?.description || "Razorpay could not create the payment order." }, 502);
      }
      razorpayOrder = created;
    }

    const { error: updateError } = await db
      .from("customer_orders")
      .update({
        razorpay_order_id: razorpayOrder.id,
        payment_status: "pending",
        status: "payment_pending",
      })
      .eq("order_id", orderId);

    if (updateError) {
      console.error("Could not save Razorpay order ID:", updateError.message);
      return json({ error: "Razorpay order was created, but it could not be linked to the saved order. Please contact the store before retrying." }, 500);
    }

    return json({
      keyId: razorpayKey,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || "INR",
    });
  } catch (error) {
    console.error("create-razorpay-order failed:", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected payment setup error." }, 500);
  }
});
