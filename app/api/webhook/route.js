import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function sendPasswordResetEmail(email) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Error enviando email");
  return data;
}

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const db = getFirestore();
  const authAdmin = getAuth();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;
    const nombre = session.metadata?.nombre || "";
    const ref = session.metadata?.ref || ""; // ← capturamos el ref
    const customerId = session.customer;

    try {
      let uid;
      try {
        const existing = await authAdmin.getUserByEmail(email);
        uid = existing.uid;
      } catch {
        const newUser = await authAdmin.createUser({ email, displayName: nombre });
        uid = newUser.uid;
      }

      // Guardar usuario con ref del influencer
      await db.collection("usuarios").doc(uid).set({
        suscripcionActiva: true,
        stripeCustomerId: customerId,
        email,
        nombre,
        suscripcionInicio: new Date().toISOString(),
        ...(ref && { ref }), // ← solo si tiene ref
      }, { merge: true });

      // Si tiene ref, actualizar contador del influencer
      if (ref) {
        const refDoc = db.collection("referidos").doc(ref);
        await refDoc.set({
          nombre: ref,
          totalUsuarios: 0,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        await refDoc.update({
          totalUsuarios: (await refDoc.get()).data()?.totalUsuarios + 1 || 1,
          updatedAt: new Date().toISOString(),
        });
      }

      await sendPasswordResetEmail(email);

    } catch (err) {
      console.error("Error procesando webhook:", err);
      return new Response("Error interno", { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
    const obj = event.data.object;
    const customerId = obj.customer;
    try {
      const snap = await db.collection("usuarios").where("stripeCustomerId", "==", customerId).get();
      snap.forEach(doc => doc.ref.update({ suscripcionActiva: false }));
    } catch (err) {
      console.error("Error cancelando suscripción:", err);
    }
  }

  return new Response("OK", { status: 200 });
}
