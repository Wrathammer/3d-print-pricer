import Fastify from "fastify";
import { z } from "zod";
import { calculateQuote } from "@app/core";

const SupplySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unit: z.enum(["g", "fixed"]),
  unitCost: z.number().nonnegative(),
  quantity: z.number().nonnegative()
});

const QuoteSchema = z.object({
  supplies: z.array(SupplySchema).min(1),
  profitPercent: z.number().nonnegative()
});

export function buildApp() {
  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ ok: true }));

  app.post("/quote", async (req, reply) => {
    const parsed = QuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    try {
      const result = calculateQuote(parsed.data);
      return reply.send(result);
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  return app;
}
