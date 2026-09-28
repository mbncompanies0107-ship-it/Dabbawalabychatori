# Mini India Ireland

Indian groceries, snacks and everyday essentials, packed in Dublin and Limerick and delivered in under an hour.

This is a presentation-ready quick-commerce MVP for customers living in Ireland. Prices are in euro, addresses use Eircodes, and phones use +353.

## What was built

- Customer shop: home, search, categories, deals, product pages, basket, checkout and order confirmation
- Delivery check: a customer must be within about 6 km of an open store **and** the estimated arrival must be 60 minutes or less
- Store selection by lowest ETA, then shortest distance, then stock coverage. One store fulfils each order
- Order tracking with a simulated map and a status timeline
- Store dashboard with accept, pick and pack
- Rider app with status steps and demo OTP `1234`
- Admin dashboard for orders, products, inventory, stores, riders, customers, promotions, analytics and delivery settings
- Demo addresses for Dublin, Sandyford, Limerick and outside the zone
- Seeded presentation order `MI-10482` for Sarah Murphy, out for delivery with rider James

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The first request creates `data/db.json`. To rebuild the demo data:

```bash
npm run seed
```

Restart the dev server after seeding so it reloads the file.

```bash
npm test
```

runs the delivery-engine checks.

## Database setup

The MVP does not need PostgreSQL, PostGIS or Redis. Orders, stock and sessions live in `data/db.json`, which mirrors the entities in `sql/schema.sql`.

When you are ready for Postgres:

1. Create a database and run `sql/schema.sql`
2. Set `DATABASE_URL` in `.env.local`
3. Point the data access in `src/lib/db.ts` at Postgres. The delivery rules in `src/lib/delivery.ts` stay the same

Latitude and longitude are already stored on stores and addresses so a geography column can be filled later.

## Demo credentials

Development only. Do not use these accounts in production.

Password for every demo account: `MiniIndiaDemo!`

| Role | Email | Opens |
| --- | --- | --- |
| Admin | admin@miniindia.ie | /admin |
| Store | store@miniindia.ie | /store |
| Rider | rider@miniindia.ie | /rider |
| Customer | customer@example.com | /account |

Sign-in shortcuts are on `/login`.

## Demo presentation flow

1. Open `/`. The headline is “Indian groceries delivered fast.”
2. Choose **Enter your Eircode**, then **Demo Dublin**. You should see delivery available, Mini India Dublin City, and 25–35 min.
3. Shop, and add India Gate Basmati Rice, Aashirvaad Atta, Toor Dal, Haldiram's Bhujia, Mango Pickle and Thums Up.
4. Open the basket. Apply `WELCOME`. Totals: subtotal €49.91, delivery €2.99, discount −€5.00, total €47.90, ETA 25–35 min.
5. Checkout with the filled Dublin 2 address and demo card. Place the order.
6. The confirmation shows the order number and ETA.
7. Track the order through placed, picking, packed, rider and on the way.
8. In another tab, sign in as the store. Accept, start picking, tick every line, mark packed.
9. Sign in as the rider. Accept the delivery and step through to the door. OTP is `1234`.
10. The customer tracking screen moves to Delivered.
11. Sign in as admin for revenue, orders, riders, stores, inventory and analytics.

`/track/MI-10482` is the seeded Dublin order already on the way with James, if you want that screen before placing a new order.

Also try **Demo Sandyford**, **Demo Limerick** and **Demo Outside Zone** (waitlist).

## Environment variables

Copy `.env.example` to `.env.local`. None of the secrets are required for the demo.

| Variable | Role in this MVP |
| --- | --- |
| `DATABASE_URL` | Reserved for Postgres |
| `REDIS_URL` | Reserved for cache |
| `GOOGLE_MAPS_API_KEY` | Reserved. The map is simulated |
| `STRIPE_SECRET_KEY` | Reserved. Checkout is demo payment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Reserved |
| `JWT_SECRET` | Signs the demo session cookie. Replace before any public deploy |
| `NEXT_PUBLIC_API_URL` | Optional public API origin |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `false` to hide demo address buttons |

## Mocked versus production-ready

| Area | Now | Later |
| --- | --- | --- |
| Catalogue, orders, stock | JSON file, same shape as `sql/schema.sql` | Postgres |
| Maps and ETA | Haversine distance and a fixed urban formula | Google routes or a rider telematics feed |
| Payments | Demo card, Apple Pay and Google Pay. No card numbers stored | Stripe |
| Auth | Signed demo cookie and scrypt passwords | Production identity provider |
| SMS / calls | `tel:` link and an in-app rider note | Real messaging |
| Geocoding | Known demo Eircodes and area names | Address lookup for all of Ireland |

Delivery fees are editable in admin settings: €2.99 within 3 km, €4.99 out to 6 km, free over €50. A store is eligible only when the customer is inside the radius, the store is open or busy, the basket is in stock, and the ETA is within 60 minutes. Busy stores add 8 minutes and can fall outside the time limit.

## Recommended next steps

- Connect `sql/schema.sql` and move `src/lib/db.ts` to Postgres with PostGIS
- Replace the simulated map and ETA with a routing API
- Add Stripe and stop accepting the demo payment flag
- Lock store operators to one store and riders to their own jobs in production auth
- Add real product photography and allergen data from suppliers
- Notify customers by SMS when the rider is on the way
