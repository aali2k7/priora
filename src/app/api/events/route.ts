import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prioraEvents, PrioraServerEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) stream for real-time frontend updates.
 * Allows open browser tabs to receive instant push events when new emails arrive.
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connected handshake
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`)
        );

        const onEvent = (event: PrioraServerEvent) => {
          if (!event.userId || event.userId === userId) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch {
              // Stream closed
            }
          }
        };

        prioraEvents.on("priora-event", onEvent);

        // Heartbeat keep-alive every 25 seconds
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(pingInterval);
          }
        }, 25000);

        req.signal.addEventListener("abort", () => {
          prioraEvents.off("priora-event", onEvent);
          clearInterval(pingInterval);
          try {
            controller.close();
          } catch {
            // ignore
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Content-Encoding": "none",
      },
    });
  } catch (error) {
    console.error("[Events SSE] Error initializing stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
