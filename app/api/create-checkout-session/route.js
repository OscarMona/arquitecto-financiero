import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  MX: process.env.STRIPE_PRICE_MXN,   // $89 MXN
  US: process.env.STRIPE_PRICE_USD_799, // $7.99 USD
  DEFAULT: process.env.STRIPE_PRICE_USD_499, // $4.99 USD
};

export async function POST(req) {
  try {
    const { email, nombre, pais } = await req.json();

    let priceId;
    if (pais === "MX") priceId = PRICES.MX;
    else if (pais === "US") priceId = PRICES.US;
    else priceId = PRICES.DEFAULT;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { nombre },
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/suscribete`,
      locale: "es",
      automatic_tax: { enabled: pais === "MX" },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
