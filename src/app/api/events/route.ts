import { NextRequest } from "next/server";
import { clients } from "@/lib/events";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      req.signal.addEventListener("abort", () => {
        clients.delete(controller);
      });
    },
    cancel(controller) {
      clients.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
