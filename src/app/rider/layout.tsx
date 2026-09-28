import { readSession } from "@/lib/token";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = readSession(jar.get("mi_token")?.value);
  if (!session || (session.role !== "RIDER" && session.role !== "ADMIN")) redirect("/login?next=/rider");
  return children;
}
