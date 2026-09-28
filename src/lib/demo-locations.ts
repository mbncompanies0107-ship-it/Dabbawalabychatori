import type { DemoAddress } from "./types";

export const DEMO_LOCATIONS: DemoAddress[] = [
  {
    id: "dublin",
    label: "Demo Dublin",
    shortLabel: "Dublin 2",
    name: "Sarah Murphy",
    phone: "+353 87 123 4567",
    line1: "18 Dame Street",
    line2: "Apartment 3",
    city: "Dublin 2",
    county: "Dublin",
    eircode: "D02 XY45",
    instructions: "Second bell. Reception can take the delivery if I'm not in.",
    lat: 53.33928,
    lng: -6.2589,
  },
  {
    id: "sandyford",
    label: "Demo Sandyford",
    shortLabel: "Sandyford",
    name: "Conor Hayes",
    phone: "+353 86 555 0198",
    line1: "22 Blackthorn Road",
    line2: "",
    city: "Sandyford, Dublin 18",
    county: "Dublin",
    eircode: "D18 HK32",
    instructions: "Call on arrival. The gate code is on the intercom.",
    lat: 53.2847,
    lng: -6.2075,
  },
  {
    id: "limerick",
    label: "Demo Limerick",
    shortLabel: "Limerick",
    name: "Niamh Ryan",
    phone: "+353 85 222 0144",
    line1: "14 Singland Road",
    line2: "",
    city: "Limerick",
    county: "Limerick",
    eircode: "V94 A2P3",
    instructions: "Leave with the neighbour at No. 16 if needed.",
    lat: 52.6706,
    lng: -8.6048,
  },
  {
    id: "outside",
    label: "Demo Outside Zone",
    shortLabel: "Galway",
    name: "Aoife Kelly",
    phone: "+353 87 640 2281",
    line1: "12 Shop Street",
    line2: "",
    city: "Galway",
    county: "Galway",
    eircode: "H91 A1C2",
    instructions: "",
    lat: 53.2704,
    lng: -9.0568,
  },
  {
    id: "overlap",
    label: "Between Dublin stores",
    shortLabel: "Dundrum",
    name: "Sean Doyle",
    phone: "+353 83 441 2090",
    line1: "8 Main Street",
    line2: "",
    city: "Dundrum, Dublin 14",
    county: "Dublin",
    eircode: "D14 KT80",
    instructions: "",
    lat: 53.3119,
    lng: -6.2332,
  },
];

const ALIASES: { id: string; test: RegExp }[] = [
  { id: "dublin", test: /d02|dame street|dublin\s*2|westmoreland|temple bar|grafton|college green/ },
  { id: "sandyford", test: /d18|sandyford|blackthorn/ },
  { id: "limerick", test: /v94|limerick|singland|chatori/ },
  { id: "outside", test: /galway|h91|cork|t12|belfast|bt1|outside/ },
  { id: "overlap", test: /dundrum|milltown|goatstown|d14|dual/ },
];

export function resolveAddressQuery(query: string): DemoAddress | null {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return null;
  const compact = q.replace(/\s+/g, "");
  const direct = DEMO_LOCATIONS.find((location) => {
    const eir = location.eircode.toLowerCase().replace(/\s+/g, "");
    return (
      compact === eir ||
      q === location.label.toLowerCase() ||
      q === location.city.toLowerCase() ||
      q === location.line1.toLowerCase() ||
      q.includes(location.eircode.toLowerCase())
    );
  });
  if (direct) return direct;
  const alias = ALIASES.find((entry) => entry.test.test(q));
  if (!alias) return null;
  return DEMO_LOCATIONS.find((location) => location.id === alias.id) ?? null;
}

export const PRESENTATION_BUTTONS = ["dublin", "sandyford", "limerick", "outside"] as const;
