import { cn } from "@/lib/cn";

const motifs: Record<string, string> = {
  fresh: "M12 21c4-1 7-4 7-8 0-5-4-8-7-9-3 1-7 4-7 9 0 4 3 7 7 8z",
  "rice-atta": "M7 18c2 2 8 2 10 0 1-6-2-12-5-14-3 2-6 8-5 14z",
  "dal-pulses": "M8 16c0 3 8 3 8 0 0-6-1-10-4-12-3 2-4 6-4 12z",
  spices: "M9 8h6v2H9zm-1 3h8l-1 9H9l-1-9zm2-5h4l1 3H10l1-3z",
  snacks: "M6 10h12l-1 8H7l-1-8zm2-3h8l1 2H7l1-2z",
  biscuits: "M8 8h8v2H8zm-1 3h10v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6z",
  drinks: "M9 3h6l-1 6h1l-1 12H10L9 9h1L9 3z",
  frozen: "M12 3v18M5 7l14 10M19 7L5 17",
  dairy: "M8 8h8v11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8zm1-3h6l1 3H8l1-3z",
  pickles: "M9 8h6v11H9zm1-3h4l1 3h-6l1-3z",
  instant: "M7 9h10v9H7zm1-4h8v3H8z",
  sweets: "M12 6l2 4 4 .5-3 3 .8 4.5L12 16l-3.8 2 .8-4.5-3-3L10 10z",
  cooking: "M8 10h8v8H8zm-1-3h10v2H7z",
  household: "M9 4h6l1 4H8l1-4zm-1 6h8v9H8z",
  "personal-care": "M10 3h4v4h2v13H8V7h2z",
};

export function ProductVisual({
  hue,
  category,
  name,
  className,
}: {
  hue: number;
  category?: string;
  name: string;
  className?: string;
}) {
  const path = motifs[category ?? ""] ?? motifs.spices;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(165deg, hsl(${hue} 62% 94%) 0%, hsl(${hue} 42% 78%) 100%)`,
      }}
      aria-hidden
    >
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/40" />
      <div className="absolute -bottom-8 left-4 h-24 w-24 rounded-full bg-white/25" />
      <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-1/2 w-1/2 text-brand-900/80">
        <path d={path} fill="currentColor" />
      </svg>
      <span className="sr-only">{name}</span>
    </div>
  );
}
