export interface CatalogCategory {
  slug: string;
  name: string;
  home?: boolean;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { slug: "fresh", name: "Fresh", home: true },
  { slug: "rice-atta", name: "Rice & Atta", home: true },
  { slug: "dal-pulses", name: "Dal & Pulses", home: true },
  { slug: "spices", name: "Spices", home: true },
  { slug: "snacks", name: "Snacks", home: true },
  { slug: "biscuits", name: "Biscuits", home: true },
  { slug: "drinks", name: "Drinks", home: true },
  { slug: "frozen", name: "Frozen", home: true },
  { slug: "dairy", name: "Dairy", home: true },
  { slug: "pickles", name: "Pickles", home: true },
  { slug: "instant", name: "Instant Food", home: true },
  { slug: "household", name: "Household", home: true },
  { slug: "sweets", name: "Sweets" },
  { slug: "cooking", name: "Cooking Essentials" },
  { slug: "personal-care", name: "Personal Care" },
];

export interface CatalogProduct {
  sku: string;
  name: string;
  brand: string;
  size: string;
  category: string;
  priceCents: number;
  compareAtCents?: number;
  rating: number;
  ratingCount: number;
  flags?: string;
  origin: string;
  hue: number;
  blurb: string;
  ingredients?: string;
  allergens?: string;
}

const gluten = "Contains wheat (gluten).";
const milk = "Contains milk.";
const none = "No major allergens highlighted. Check the pack before you cook.";

export const CATALOG: CatalogProduct[] = [
  { sku: "IG-RICE-5", name: "India Gate Classic Basmati Rice", brand: "India Gate", size: "5kg", category: "rice-atta", priceCents: 1999, compareAtCents: 2299, rating: 4.8, ratingCount: 312, flags: "pbf", origin: "India", hue: 42, blurb: "Extra-long basmati grains that stay separate, ideal for biryani and everyday rice.", ingredients: "Aged basmati rice.", allergens: "Naturally gluten free." },
  { sku: "ASH-ATTA-5", name: "Aashirvaad Whole Wheat Atta", brand: "Aashirvaad", size: "5kg", category: "rice-atta", priceCents: 1349, compareAtCents: 1499, rating: 4.7, ratingCount: 268, flags: "pbf", origin: "India", hue: 28, blurb: "Chakki-ground atta for soft rotis. A weekly staple in Irish Indian kitchens.", ingredients: "Whole wheat flour.", allergens: gluten },
  { sku: "TILDA-RICE-2", name: "Tilda Pure Basmati Rice", brand: "Tilda", size: "2kg", category: "rice-atta", priceCents: 849, rating: 4.6, ratingCount: 141, flags: "b", origin: "India", hue: 48, blurb: "A shorter bag when you do not need a full 5kg.", ingredients: "Basmati rice.", allergens: "Naturally gluten free." },
  { sku: "ROYAL-PONNI-5", name: "Ponni Boiled Rice", brand: "Royal", size: "5kg", category: "rice-atta", priceCents: 1149, rating: 4.5, ratingCount: 88, origin: "India", hue: 36, blurb: "Everyday South Indian boiled rice for sambar rice and curd rice.", ingredients: "Boiled ponni rice.", allergens: "Naturally gluten free." },
  { sku: "ASH-ATTA-10", name: "Aashirvaad Select Atta", brand: "Aashirvaad", size: "10kg", category: "rice-atta", priceCents: 2299, compareAtCents: 2499, rating: 4.7, ratingCount: 96, flags: "p", origin: "India", hue: 24, blurb: "The larger bag for families who make rotis most days.", ingredients: "Whole wheat flour.", allergens: gluten },
  { sku: "MANTRA-IDLI-2", name: "Organic Idli Rice", brand: "24 Mantra", size: "2kg", category: "rice-atta", priceCents: 649, rating: 4.4, ratingCount: 41, flags: "n", origin: "India", hue: 80, blurb: "Short-grain rice for idli and dosa batter.", ingredients: "Organic idli rice.", allergens: "Naturally gluten free." },
  { sku: "TS-TOOR-1", name: "Toor Dal", brand: "Tata Sampann", size: "1kg", category: "dal-pulses", priceCents: 499, rating: 4.7, ratingCount: 154, flags: "pf", origin: "India", hue: 38, blurb: "Unpolished toor dal for sambar, dal tadka and weekday lunches.", ingredients: "Split pigeon peas.", allergens: none },
  { sku: "TS-CHANA-1", name: "Chana Dal", brand: "Tata Sampann", size: "1kg", category: "dal-pulses", priceCents: 399, rating: 4.6, ratingCount: 102, flags: "f", origin: "India", hue: 46, blurb: "Split chickpeas with a nutty bite. Holds shape in dry sabzi.", ingredients: "Split Bengal gram.", allergens: none },
  { sku: "TS-MOONG-1", name: "Moong Dal", brand: "Tata Sampann", size: "1kg", category: "dal-pulses", priceCents: 449, rating: 4.6, ratingCount: 97, flags: "p", origin: "India", hue: 72, blurb: "Yellow moong dal that cooks quickly for a light dal.", ingredients: "Split yellow mung beans.", allergens: none },
  { sku: "TRS-MASOOR-1", name: "Masoor Dal", brand: "TRS", size: "1kg", category: "dal-pulses", priceCents: 349, rating: 4.5, ratingCount: 76, origin: "Canada / India", hue: 12, blurb: "Red lentils for a fast weeknight dal.", ingredients: "Split red lentils.", allergens: none },
  { sku: "TRS-URAD-1", name: "Urad Dal Split", brand: "TRS", size: "1kg", category: "dal-pulses", priceCents: 419, rating: 4.5, ratingCount: 64, origin: "India", hue: 0, blurb: "Split black gram for dosa batter, idli and dal makhani.", ingredients: "Split urad dal.", allergens: none },
  { sku: "TRS-RAJMA-1", name: "Red Kidney Beans", brand: "TRS", size: "1kg", category: "dal-pulses", priceCents: 379, rating: 4.6, ratingCount: 83, flags: "b", origin: "India", hue: 6, blurb: "Soak overnight for rajma. A Sunday pot that feeds a crowd.", ingredients: "Dried red kidney beans.", allergens: none },
  { sku: "TRS-CHANA-1", name: "Kabuli Chickpeas", brand: "TRS", size: "1kg", category: "dal-pulses", priceCents: 299, rating: 4.4, ratingCount: 59, origin: "India", hue: 50, blurb: "Whole chickpeas for chana masala and salads.", ingredients: "Dried chickpeas.", allergens: none },
  { sku: "MDH-GARAM-100", name: "Garam Masala", brand: "MDH", size: "100g", category: "spices", priceCents: 299, rating: 4.8, ratingCount: 221, flags: "pf", origin: "India", hue: 18, blurb: "Warm finishing masala. A pinch at the end of the tadka.", ingredients: "Coriander, cumin, black pepper, cloves, cinnamon, cardamom, bay leaf.", allergens: none },
  { sku: "EV-HALDI-200", name: "Turmeric Powder", brand: "Everest", size: "200g", category: "spices", priceCents: 249, rating: 4.7, ratingCount: 133, flags: "b", origin: "India", hue: 48, blurb: "Bright haldi for dal, rice and marinades.", ingredients: "Ground turmeric.", allergens: none },
  { sku: "MDH-CHANA-100", name: "Chana Masala", brand: "MDH", size: "100g", category: "spices", priceCents: 279, rating: 4.6, ratingCount: 91, origin: "India", hue: 22, blurb: "Blend for chickpea curry, measured for a home pot.", ingredients: "Coriander, chilli, salt, amchur, cumin, cloves.", allergens: none },
  { sku: "CATCH-JEERA-100", name: "Jeera Whole", brand: "Catch", size: "100g", category: "spices", priceCents: 199, rating: 4.5, ratingCount: 70, origin: "India", hue: 32, blurb: "Whole cumin seeds for the start of almost every tadka.", ingredients: "Cumin seeds.", allergens: none },
  { sku: "EV-CHILLI-200", name: "Red Chilli Powder", brand: "Everest", size: "200g", category: "spices", priceCents: 269, rating: 4.6, ratingCount: 118, flags: "p", origin: "India", hue: 8, blurb: "Kashmiri-style colour with moderate heat.", ingredients: "Ground dried red chillies.", allergens: none },
  { sku: "MDH-KK-100", name: "Kitchen King Masala", brand: "MDH", size: "100g", category: "spices", priceCents: 289, rating: 4.7, ratingCount: 109, flags: "b", origin: "India", hue: 16, blurb: "An all-rounder sprinkle for vegetables and paneer.", ingredients: "Coriander, chilli, turmeric, cumin, fenugreek, salt.", allergens: none },
  { sku: "SHAN-BIR-60", name: "Sindhi Biryani Masala", brand: "Shan", size: "60g", category: "spices", priceCents: 229, rating: 4.5, ratingCount: 54, flags: "n", origin: "Pakistan", hue: 14, blurb: "A single-pot biryani mix with a tangy Sindhi profile.", ingredients: "Spices, dried herbs, salt, citric acid.", allergens: none },
  { sku: "HAL-BHUJ-200", name: "Haldiram's Bhujia", brand: "Haldiram's", size: "200g", category: "snacks", priceCents: 395, rating: 4.8, ratingCount: 246, flags: "pbf", origin: "India", hue: 30, blurb: "Crisp sev tossed with gram flour and spices. The tea-time classic.", ingredients: "Gram flour, vegetable oil, salt, spices.", allergens: none },
  { sku: "HAL-ALOO-200", name: "Aloo Bhujia", brand: "Haldiram's", size: "200g", category: "snacks", priceCents: 349, rating: 4.6, ratingCount: 88, origin: "India", hue: 40, blurb: "Potato sev with a lighter crunch than classic bhujia.", ingredients: "Potato, gram flour, oil, spices, salt.", allergens: none },
  { sku: "KURK-90", name: "Kurkure Masala Munch", brand: "Kurkure", size: "90g", category: "snacks", priceCents: 179, rating: 4.4, ratingCount: 132, flags: "p", origin: "India", hue: 26, blurb: "Corn puffs with masala seasoning. A lunchbox favourite.", ingredients: "Corn meal, rice meal, oil, spices.", allergens: none },
  { sku: "BALAJI-135", name: "Simply Salted Wafers", brand: "Balaji", size: "135g", category: "snacks", priceCents: 169, rating: 4.3, ratingCount: 47, origin: "India", hue: 52, blurb: "Thin potato wafers, lightly salted.", ingredients: "Potatoes, vegetable oil, salt.", allergens: none },
  { sku: "HAL-MIX-200", name: "Khatta Meetha Mixture", brand: "Haldiram's", size: "200g", category: "snacks", priceCents: 349, rating: 4.6, ratingCount: 73, flags: "f", origin: "India", hue: 20, blurb: "Sweet, sour and spicy snack mix for sharing.", ingredients: "Rice flakes, peanuts, sev, sugar, spices, oil.", allergens: "Contains peanuts." },
  { sku: "PARLE-G-800", name: "Parle-G Glucose Biscuits", brand: "Parle", size: "800g", category: "biscuits", priceCents: 399, compareAtCents: 449, rating: 4.8, ratingCount: 280, flags: "pf", origin: "India", hue: 44, blurb: "The original glucose biscuit, dunked in chai across Ireland.", ingredients: "Wheat flour, sugar, edible oil, invert syrup, milk solids.", allergens: "Contains wheat and milk." },
  { sku: "BRIT-GD-216", name: "Good Day Cashew Cookies", brand: "Britannia", size: "216g", category: "biscuits", priceCents: 249, rating: 4.6, ratingCount: 99, flags: "b", origin: "India", hue: 34, blurb: "Buttery cashew cookies for a slower cup of tea.", ingredients: "Wheat flour, sugar, edible fat, cashews.", allergens: "Contains wheat, milk and cashew." },
  { sku: "PARLE-HS-120", name: "Hide & Seek Chocolate", brand: "Parle", size: "120g", category: "biscuits", priceCents: 199, rating: 4.4, ratingCount: 61, origin: "India", hue: 18, blurb: "Chocolate cream biscuits when the shopping list needs a treat.", ingredients: "Wheat flour, sugar, cocoa, edible oil.", allergens: "Contains wheat and milk. May contain soya." },
  { sku: "BRIT-MG-250", name: "Marie Gold Biscuits", brand: "Britannia", size: "250g", category: "biscuits", priceCents: 219, rating: 4.5, ratingCount: 58, origin: "India", hue: 46, blurb: "Light tea biscuits, less sweet than glucose classics.", ingredients: "Wheat flour, sugar, edible vegetable oil.", allergens: gluten },
  { sku: "THUMS-125", name: "Thums Up", brand: "Thums Up", size: "1.25L", category: "drinks", priceCents: 250, rating: 4.6, ratingCount: 174, flags: "pf", origin: "India", hue: 4, blurb: "Bold Indian cola. Serve very cold with the biryani.", ingredients: "Carbonated water, sugar, acidity regulators, caffeine, colour.", allergens: none },
  { sku: "LIMCA-125", name: "Limca", brand: "Limca", size: "1.25L", category: "drinks", priceCents: 250, rating: 4.5, ratingCount: 66, origin: "India", hue: 78, blurb: "Cloudy lemon drink. A fridge essential in warm weather.", ingredients: "Carbonated water, sugar, lemon, acidity regulators.", allergens: none },
  { sku: "MAAZA-1", name: "Maaza Mango Drink", brand: "Maaza", size: "1L", category: "drinks", priceCents: 229, rating: 4.6, ratingCount: 92, flags: "p", origin: "India", hue: 36, blurb: "Mango drink made to be poured over ice.", ingredients: "Mango pulp, water, sugar.", allergens: none },
  { sku: "TATA-TEA-500", name: "Tata Tea Gold", brand: "Tata Tea", size: "500g", category: "drinks", priceCents: 549, compareAtCents: 599, rating: 4.7, ratingCount: 188, flags: "pbf", origin: "India", hue: 150, blurb: "Strong leaf tea for masala chai. Enough for a busy household.", ingredients: "Black tea.", allergens: none },
  { sku: "RED-TEA-100", name: "Red Label Tea", brand: "Brooke Bond", size: "100g", category: "drinks", priceCents: 329, rating: 4.4, ratingCount: 44, origin: "India", hue: 8, blurb: "A smaller pack of strong black tea when you are trying a blend.", ingredients: "Black tea.", allergens: none },
  { sku: "MTR-BADAM-180", name: "Badam Drink Mix", brand: "MTR", size: "180g", category: "drinks", priceCents: 499, rating: 4.5, ratingCount: 37, flags: "n", origin: "India", hue: 32, blurb: "Almond drink mix. Warm milk, two spoons, done.", ingredients: "Sugar, almond, milk solids, cardamom.", allergens: "Contains almond and milk." },
  { sku: "FRZ-PARA-400", name: "Frozen Plain Paratha", brand: "Deepak", size: "400g", category: "frozen", priceCents: 349, rating: 4.5, ratingCount: 121, flags: "p", origin: "Ireland packed / India recipe", hue: 40, blurb: "Tawa or pan from frozen. Dinner in the time it takes the dal to heat.", ingredients: "Wheat flour, edible oil, salt.", allergens: gluten },
  { sku: "FRZ-SAMOSA-12", name: "Frozen Vegetable Samosas", brand: "Cambay", size: "12 pieces", category: "frozen", priceCents: 599, rating: 4.7, ratingCount: 143, flags: "pf", origin: "Packed in Ireland", hue: 28, blurb: "Oven or air fryer samosas. A Friday night tray.", ingredients: "Wheat pastry, potato, peas, spices, oil.", allergens: "Contains wheat. May contain mustard." },
  { sku: "FRZ-GULAB-500", name: "Frozen Gulab Jamun", brand: "Cambay", size: "500g", category: "frozen", priceCents: 649, rating: 4.6, ratingCount: 77, flags: "f", origin: "Packed in Ireland", hue: 350, blurb: "Warm gently and serve with the syrup already in the tray.", ingredients: "Milk solids, sugar, flour, cardamom, ghee.", allergens: "Contains milk and wheat." },
  { sku: "FRZ-NAAN-4", name: "Garlic Naan", brand: "Shana", size: "4 pieces", category: "frozen", priceCents: 329, rating: 4.4, ratingCount: 69, origin: "United Kingdom", hue: 42, blurb: "Heat in a dry pan until spotted. Garlic butter optional, encouraged.", ingredients: "Wheat flour, water, garlic, oil, yoghurt.", allergens: "Contains wheat and milk." },
  { sku: "AMUL-PAN-200", name: "Amul Paneer", brand: "Amul", size: "200g", category: "dairy", priceCents: 379, rating: 4.7, ratingCount: 156, flags: "pf", origin: "India", hue: 60, blurb: "Fresh-style paneer block. Cube it into palak or butter masala.", ingredients: "Milk solids.", allergens: milk },
  { sku: "AMUL-GHEE-500", name: "Pure Ghee", brand: "Amul", size: "500ml", category: "dairy", priceCents: 999, compareAtCents: 1099, rating: 4.8, ratingCount: 201, flags: "b", origin: "India", hue: 44, blurb: "Slow-cooked ghee for tadka, halwa and roasting spices.", ingredients: "Clarified butter.", allergens: milk },
  { sku: "AMUL-YOG-400", name: "Amul Masti Dahi", brand: "Amul", size: "400g", category: "dairy", priceCents: 189, rating: 4.5, ratingCount: 84, origin: "India", hue: 200, blurb: "Set yoghurt for raita, marinades and kadhi.", ingredients: "Toned milk, cultures.", allergens: milk },
  { sku: "AVON-MILK-1", name: "Avonmore Fresh Milk", brand: "Avonmore", size: "1L", category: "dairy", priceCents: 145, rating: 4.6, ratingCount: 64, flags: "p", origin: "Ireland", hue: 210, blurb: "Irish fresh milk for chai and the rest of the fridge.", ingredients: "Pasteurised whole milk.", allergens: milk },
  { sku: "AMUL-BUTTER-100", name: "Amul Butter", brand: "Amul", size: "100g", category: "dairy", priceCents: 269, rating: 4.6, ratingCount: 73, origin: "India", hue: 48, blurb: "Salted butter for pav, toast and finishing a dal.", ingredients: "Butter, salt.", allergens: milk },
  { sku: "PRIYA-MANGO-300", name: "Mango Pickle", brand: "Priya", size: "300g", category: "pickles", priceCents: 499, rating: 4.7, ratingCount: 139, flags: "pf", origin: "India", hue: 16, blurb: "Avakaya-style mango pickle. A spoon beside the rice is enough.", ingredients: "Mango, sesame oil, chilli, salt, mustard, fenugreek.", allergens: "Contains mustard and sesame." },
  { sku: "PRIYA-LIME-300", name: "Lime Pickle", brand: "Priya", size: "300g", category: "pickles", priceCents: 449, rating: 4.6, ratingCount: 71, origin: "India", hue: 78, blurb: "Sharp lime pickle for dal-chawal nights.", ingredients: "Lime, salt, chilli, spices, oil.", allergens: "Contains mustard." },
  { sku: "MOTHERS-MIX-300", name: "Mixed Pickle", brand: "Mother's Recipe", size: "300g", category: "pickles", priceCents: 479, rating: 4.5, ratingCount: 63, flags: "b", origin: "India", hue: 8, blurb: "Mixed vegetable pickle with a familiar North Indian profile.", ingredients: "Mango, carrot, lime, chilli, mustard oil, spices.", allergens: "Contains mustard." },
  { sku: "MAGGI-8", name: "Maggi 2-Minute Noodles Masala", brand: "Maggi", size: "8 pack", category: "instant", priceCents: 449, compareAtCents: 499, rating: 4.7, ratingCount: 260, flags: "pb", origin: "India", hue: 38, blurb: "The masala noodles most of Ireland already knows. Eight packs.", ingredients: "Wheat noodles, seasoning (spices, salt, sugar).", allergens: "Contains wheat. May contain milk, soya and mustard." },
  { sku: "MTR-POHA-180", name: "Poha", brand: "MTR", size: "180g", category: "instant", priceCents: 299, rating: 4.4, ratingCount: 39, origin: "India", hue: 50, blurb: "Flattened rice for a fifteen-minute breakfast.", ingredients: "Beaten rice.", allergens: none },
  { sku: "MTR-PANEER-300", name: "Ready to Eat Paneer Butter Masala", brand: "MTR", size: "300g", category: "instant", priceCents: 399, rating: 4.3, ratingCount: 58, flags: "n", origin: "India", hue: 14, blurb: "Heat in the pouch. Pair with the frozen naan.", ingredients: "Paneer, tomato, butter, cream, spices.", allergens: "Contains milk." },
  { sku: "GITS-POHA-200", name: "Ready Mix Upma", brand: "Gits", size: "200g", category: "instant", priceCents: 279, rating: 4.2, ratingCount: 28, origin: "India", hue: 42, blurb: "Semolina breakfast mix. Add water and a kettle.", ingredients: "Semolina, spices, salt, dehydrated vegetables.", allergens: gluten },
  { sku: "HAL-SOAN-250", name: "Soan Papdi", brand: "Haldiram's", size: "250g", category: "sweets", priceCents: 429, rating: 4.5, ratingCount: 66, flags: "f", origin: "India", hue: 36, blurb: "Flaky soan papdi that travels well in a shopping bag.", ingredients: "Sugar, gram flour, ghee, almonds, cardamom.", allergens: "Contains milk, nuts and gluten." },
  { sku: "HAL-RAS-1", name: "Rasgulla Tin", brand: "Haldiram's", size: "1kg", category: "sweets", priceCents: 699, rating: 4.6, ratingCount: 52, flags: "b", origin: "India", hue: 200, blurb: "Syrup-soaked chenna dumplings. Chill the tin before serving.", ingredients: "Chenna, sugar, rose water.", allergens: milk },
  { sku: "KPL-COCO-1", name: "Coconut Oil", brand: "KPL", size: "1L", category: "cooking", priceCents: 799, compareAtCents: 899, rating: 4.6, ratingCount: 94, flags: "p", origin: "India", hue: 70, blurb: "Pure coconut oil for Kerala-style cooking and tadka.", ingredients: "Coconut oil.", allergens: none },
  { sku: "TRS-MUSTARD-500", name: "Mustard Oil", brand: "TRS", size: "500ml", category: "cooking", priceCents: 449, rating: 4.5, ratingCount: 48, origin: "India", hue: 55, blurb: "Pungent mustard oil for pickles and certain fish curries.", ingredients: "Mustard oil.", allergens: "Contains mustard." },
  { sku: "TATA-SALT-1", name: "Tata Salt", brand: "Tata", size: "1kg", category: "cooking", priceCents: 129, rating: 4.7, ratingCount: 77, origin: "India", hue: 210, blurb: "Iodised salt. The bag you only notice when it runs out.", ingredients: "Iodised salt.", allergens: none },
  { sku: "VIM-750", name: "Vim Dishwash Liquid Lemon", brand: "Vim", size: "750ml", category: "household", priceCents: 249, rating: 4.4, ratingCount: 41, origin: "India", hue: 90, blurb: "Lemon dishwash liquid for the post-tadka sink.", ingredients: "Surfactants, lemon fragrance.", allergens: none },
  { sku: "SURF-1", name: "Surf Excel Quick Wash", brand: "Surf Excel", size: "1kg", category: "household", priceCents: 699, rating: 4.5, ratingCount: 53, flags: "b", origin: "India", hue: 200, blurb: "Detergent powder for everyday loads.", ingredients: "Anionic surfactants, enzymes, fragrance.", allergens: none },
  { sku: "DABUR-MESWAK", name: "Meswak Toothpaste", brand: "Dabur", size: "200g", category: "personal-care", priceCents: 349, rating: 4.4, ratingCount: 36, origin: "India", hue: 140, blurb: "Herbal toothpaste stocked beside the pantry, because that is how the shop is laid out.", ingredients: "Calcium carbonate, miswak extract, fluoride.", allergens: none },
  { sku: "HIMA-NEEM", name: "Neem Face Wash", brand: "Himalaya", size: "150ml", category: "personal-care", priceCents: 499, rating: 4.5, ratingCount: 49, flags: "n", origin: "India", hue: 150, blurb: "Neem face wash. Check the store — stock moves between Dublin shops.", ingredients: "Aqua, neem, surfactants.", allergens: none },
  { sku: "FRESH-CORI", name: "Coriander Bunch", brand: "Mini India Fresh", size: "1 bunch", category: "fresh", priceCents: 99, rating: 4.6, ratingCount: 88, flags: "p", origin: "Ireland / EU", hue: 130, blurb: "Washed coriander, packed the morning of your order.", ingredients: "Fresh coriander.", allergens: none },
  { sku: "FRESH-MINT", name: "Mint Bunch", brand: "Mini India Fresh", size: "1 bunch", category: "fresh", priceCents: 99, rating: 4.5, ratingCount: 42, origin: "Ireland / EU", hue: 150, blurb: "Fresh mint for raita, chai and chutney.", ingredients: "Fresh mint.", allergens: none },
  { sku: "FRESH-CHILLI", name: "Green Chillies", brand: "Mini India Fresh", size: "100g", category: "fresh", priceCents: 129, rating: 4.6, ratingCount: 57, flags: "f", origin: "EU", hue: 110, blurb: "Green chillies in a small tray so they survive the bike bag.", ingredients: "Fresh green chillies.", allergens: none },
  { sku: "FRESH-CURRY", name: "Curry Leaves", brand: "Mini India Fresh", size: "1 bunch", category: "fresh", priceCents: 149, rating: 4.7, ratingCount: 63, flags: "f", origin: "India", hue: 140, blurb: "Fresh curry leaves. Worth the trip if your nearest store has them today.", ingredients: "Fresh curry leaves.", allergens: none },
  { sku: "ONION-1", name: "Onions", brand: "Irish Grown", size: "1kg", category: "fresh", priceCents: 119, rating: 4.4, ratingCount: 34, origin: "Ireland", hue: 40, blurb: "Irish onions for the base of the gravy.", ingredients: "Onions.", allergens: none },
];

export const CATEGORY_DEFAULTS: Record<string, { ingredients: string; allergens: string }> = {
  fresh: { ingredients: "Fresh produce.", allergens: none },
  "rice-atta": { ingredients: "See the pack.", allergens: "Check whether the pack contains wheat." },
  "dal-pulses": { ingredients: "Dried pulses.", allergens: none },
  spices: { ingredients: "Ground or whole spices.", allergens: none },
  snacks: { ingredients: "See the pack.", allergens: "May contain nuts, milk or gluten." },
  biscuits: { ingredients: "Wheat biscuits.", allergens: gluten },
  drinks: { ingredients: "See the pack.", allergens: none },
  frozen: { ingredients: "Frozen prepared food.", allergens: "Check the pack for wheat and milk." },
  dairy: { ingredients: "Milk products.", allergens: milk },
  pickles: { ingredients: "Fruit or vegetables preserved with spices and oil.", allergens: "Often contains mustard." },
  instant: { ingredients: "Prepared mix or noodles.", allergens: "Often contains wheat." },
  sweets: { ingredients: "Milk, sugar and flour sweets.", allergens: "Contains milk. May contain nuts and gluten." },
  cooking: { ingredients: "Cooking oil, salt or staple.", allergens: none },
  household: { ingredients: "Household cleaning product. Not a food.", allergens: "Not for consumption." },
  "personal-care": { ingredients: "Personal care product. Not a food.", allergens: "Not for consumption." },
};
