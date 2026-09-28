import { resetDatabase } from "../src/lib/db";

const db = resetDatabase();
console.log(
  `Seeded ${db.stores.length} stores, ${db.products.length} products, ${db.orders.length} orders, ${db.users.length} users.`,
);
console.log("Presentation order MI-10482 · Sarah Murphy · Dublin 2 · €47.90");
