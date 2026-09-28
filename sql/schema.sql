-- Mini India Ireland
-- PostgreSQL + PostGIS schema for a later production cutover.
-- The demo application runs from data/db.json and does not require this database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN', 'STORE_OPERATOR', 'RIDER');
CREATE TYPE store_status AS ENUM ('OPEN', 'BUSY', 'CLOSED');
CREATE TYPE order_status AS ENUM (
  'PLACED', 'STORE_CONFIRMED', 'PICKING', 'PACKED',
  'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
);
CREATE TYPE delivery_status AS ENUM (
  'ASSIGNED', 'ACCEPTED', 'ARRIVED_AT_STORE', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'DELIVERED'
);
CREATE TYPE payment_method AS ENUM ('card', 'apple_pay', 'google_pay');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  password_hash text NOT NULL,
  store_id uuid,
  rider_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  address_line text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  eircode text NOT NULL,
  phone text,
  latitude double precision,
  longitude double precision,
  geog geography(Point, 4326),
  status store_status NOT NULL DEFAULT 'OPEN',
  opening_hours text,
  service_radius_km numeric NOT NULL DEFAULT 6,
  max_eta_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text NOT NULL,
  size text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id),
  description text NOT NULL,
  ingredients text,
  allergens text,
  origin text,
  price_cents integer NOT NULL,
  compare_at_cents integer,
  rating numeric NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  popular boolean NOT NULL DEFAULT false,
  bestseller boolean NOT NULL DEFAULT false,
  favourite boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  hue integer NOT NULL DEFAULT 140,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE store_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id),
  product_id uuid NOT NULL REFERENCES products(id),
  sku text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  reserved integer NOT NULL DEFAULT 0,
  reorder_threshold integer NOT NULL DEFAULT 6,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (store_id, product_id)
);

CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  county text,
  eircode text NOT NULL,
  instructions text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  store_id uuid REFERENCES stores(id),
  promo_code text,
  latitude double precision,
  longitude double precision,
  address_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  user_id uuid REFERENCES users(id),
  store_id uuid NOT NULL REFERENCES stores(id),
  status order_status NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  eircode text NOT NULL,
  instructions text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  subtotal_cents integer NOT NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  delivery_fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  promo_code text,
  eta_minutes integer NOT NULL,
  eta_label text NOT NULL,
  distance_km numeric NOT NULL,
  payment_method payment_method NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  name text NOT NULL,
  brand text NOT NULL,
  size text NOT NULL,
  sku text NOT NULL,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL,
  picked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  method payment_method NOT NULL,
  status text NOT NULL,
  amount_cents integer NOT NULL,
  provider text NOT NULL,
  last4 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  phone text NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id),
  online boolean NOT NULL DEFAULT false,
  latitude double precision,
  longitude double precision,
  rating numeric NOT NULL DEFAULT 5,
  completed_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  rider_id uuid REFERENCES riders(id),
  store_id uuid NOT NULL REFERENCES stores(id),
  status delivery_status NOT NULL,
  otp text NOT NULL,
  eta_minutes integer NOT NULL,
  distance_km numeric NOT NULL,
  customer_latitude double precision NOT NULL,
  customer_longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid,
  order_id uuid NOT NULL REFERENCES orders(id),
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  amount_cents integer NOT NULL,
  min_subtotal_cents integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  user_id uuid REFERENCES users(id),
  author text NOT NULL,
  rating integer NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD CONSTRAINT users_store_fk FOREIGN KEY (store_id) REFERENCES stores(id);
ALTER TABLE users
  ADD CONSTRAINT users_rider_fk FOREIGN KEY (rider_id) REFERENCES riders(id);
