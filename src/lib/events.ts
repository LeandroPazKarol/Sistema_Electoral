export const clients = new Set<ReadableStreamDefaultController>();

export function broadcastEvent(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.enqueue(new TextEncoder().encode(message));
    } catch (e) {
      clients.delete(client);
    }
  }
}
