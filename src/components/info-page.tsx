"use client";

const pages: Record<string, { title: string; body: string[] }> = {
  about: {
    title: "About Mini India",
    body: [
      "Mini India is an Irish grocery business packing Indian and Asian groceries from three stores: Dublin City, Sandyford and Limerick.",
      "Customers living within about 6 km of an open store can order for delivery when a rider can arrive within 60 minutes. We fulfil each order from a single store.",
      "The shop is aimed at people living in Ireland. Prices are in euro, phones use +353, and addresses use Eircodes.",
    ],
  },
  contact: {
    title: "Contact",
    body: [
      "Customer desk: hello@miniindia.ie · +353 1 555 0142",
      "Dublin City: 28 Westmoreland Street, Dublin 2.",
      "Sandyford: 7 Blackthorn Avenue, Sandyford, Dublin 18.",
      "Limerick: Unit 1, Chatori, Singland, Limerick, V94 F8F2.",
    ],
  },
  "delivery-info": {
    title: "Delivery information",
    body: [
      "A store can take an order when you are within about 6 km and the estimated arrival is 60 minutes or less. Both conditions are required.",
      "Delivery is €2.99 within 3 km and €4.99 between 3 km and 6 km. Orders over €50 have free delivery.",
      "Times on screen are simulated estimates for this demonstration. Live traffic is not connected.",
    ],
  },
  refunds: {
    title: "Refund policy",
    body: [
      "If an item is missing, damaged or not what you ordered, contact hello@miniindia.ie with your order number the same day.",
      "Chilled and frozen foods can be refunded when the problem is reported on delivery. We'll collect or credit the line.",
      "This demonstration does not move real money. Demo payments are recorded as paid and can be reversed in the admin ledger later.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "Mini India Ireland is the controller for account, address and order data used to deliver groceries.",
      "We store your name, phone, Eircode and order history. We do not store card numbers. Demo checkout keeps only a masked last four of 4242.",
      "You can ask for a copy or deletion of your demo account by emailing privacy@miniindia.ie.",
    ],
  },
  terms: {
    title: "Terms",
    body: [
      "Orders are an offer to buy the listed goods from the fulfilling Mini India store. The contract forms when the store accepts the order.",
      "Delivery windows are estimates. If we cannot reach you within the stated maximum of 60 minutes, you can cancel before the rider collects the bag.",
      "These pages describe the demonstration product. They are not a substitute for counsel-reviewed terms before a public launch.",
    ],
  },
  gdpr: {
    title: "GDPR",
    body: [
      "You can access, correct, export or delete personal data we hold, and you can object to marketing.",
      "Order records are kept so we can handle refunds and rider disputes, then deleted or anonymised on a schedule you set before launch.",
      "Complaints can go to the Data Protection Commission in Ireland as well as to privacy@miniindia.ie.",
    ],
  },
  careers: {
    title: "Careers",
    body: [
      "We are hiring store associates in Dublin 2, Sandyford and Limerick, plus bicycle and scooter riders who already know the city.",
      "Roles are based in Ireland. Send a note to careers@miniindia.ie with the store you want and whether you can work evenings.",
    ],
  },
};

export function InfoPage({ slug }: { slug: string }) {
  const page = pages[slug];
  if (!page) return null;
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl">{page.title}</h1>
      <div className="mt-4 space-y-3 text-stone-700">
        {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      {slug === "contact" && <ContactForm />}
    </article>
  );
}

function ContactForm() {
  return (
    <form
      className="mt-6 space-y-3 rounded-[24px] bg-white p-5 shadow-card"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const { api } = await import("@/lib/client");
        const result = await api<{ message: string }>("/api/contact", {
          method: "POST",
          body: JSON.stringify({ name: data.get("name"), email: data.get("email"), message: data.get("message") }),
        });
        event.currentTarget.reset();
        const note = document.getElementById("contact-note");
        if (note) note.textContent = result.message;
      }}
    >
      <label className="block text-sm">Name<input name="name" required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="block text-sm">Email<input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="block text-sm">Message<textarea name="message" required minLength={8} className="mt-1 w-full rounded-xl border px-3 py-2" rows={4} /></label>
      <button className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white" type="submit">Send</button>
      <p id="contact-note" className="text-sm text-brand-800" role="status" />
    </form>
  );
}
