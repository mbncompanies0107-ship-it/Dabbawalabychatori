import { handleApi } from "@/server/handlers";

export const dynamic = "force-dynamic";

async function dispatch(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  return handleApi(req, path);
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
export const PUT = dispatch;
export const DELETE = dispatch;
