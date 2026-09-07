import {
  CONSISTENCY_MAX,
  CONSISTENCY_MIN,
  SCORE_FORMULA,
  SCORE_WEIGHTS,
  VALUE_A,
  VALUE_B,
  VALUE_FORMULA,
  modelValue,
} from "@akela/core";
import type { ChainId } from "@akela/core";
import type { NameSystem } from "@akela/identity";
import { Hono } from "hono";
import { getAgent, insertClaimedAgent, pingDb, readFormulaConfig, type ClaimInput } from "./db";
import { getPriceSource, putPriceSource } from "./prices";

const CHAINS: ChainId[] = ["algorand", "solana", "base"];
const SYSTEMS: NameSystem[] = ["nfd", "sns", "basename", "ens"];

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/health", async (c) => {
  const db = await pingDb(c.env.DB);
  const priceSource = await getPriceSource(c.env.PRICES);
  return c.json({
    ok: db,
    service: "akela-api",
    db,
    prices: { bound: true, source: priceSource },
  });
});

app.get("/formula", async (c) => {
  const knobs = await readFormulaConfig(c.env.DB);
  const a = Number(knobs.value_a ?? VALUE_A);
  const b = Number(knobs.value_b ?? VALUE_B);
  return c.json({
    disclaimer: "model not an offer",
    source: knobs.price_source ?? "unset",
    sourceFallback: knobs.price_source_fallback ?? "unset",
    value: {
      a,
      b,
      formula: VALUE_FORMULA,
      consistency: {
        min: Number(knobs.consistency_min ?? CONSISTENCY_MIN),
        max: Number(knobs.consistency_max ?? CONSISTENCY_MAX),
      },
      exampleUsd: modelValue(10_000, 4_000, 1),
    },
    score: {
      formula: SCORE_FORMULA,
      weights: {
        activity: Number(knobs.score_activity ?? SCORE_WEIGHTS.activity),
        usefulness: Number(knobs.score_usefulness ?? SCORE_WEIGHTS.usefulness),
        trust: Number(knobs.score_trust ?? SCORE_WEIGHTS.trust),
      },
    },
    floors: {
      minActivity: knobs.min_activity_floor ?? "unset",
      minEquityUsd: knobs.min_equity_floor_usd ?? "unset",
    },
  });
});

app.post("/v1/agents", async (c) => {
  const body = (await c.req.json()) as Partial<ClaimInput>;
  if (!body.chain || !CHAINS.includes(body.chain)) {
    return c.json({ error: "chain must be algorand, solana, or base" }, 400);
  }
  if (!body.system || !SYSTEMS.includes(body.system)) {
    return c.json({ error: "system must be nfd, sns, basename, or ens" }, 400);
  }
  if (!body.name?.trim() || !body.address?.trim()) {
    return c.json({ error: "name and address are required" }, 400);
  }

  const id = await insertClaimedAgent(c.env.DB, {
    chain: body.chain,
    system: body.system,
    name: body.name.trim(),
    address: body.address.trim(),
    proof: body.proof ?? "",
  });
  const agent = await getAgent(c.env.DB, id);
  return c.json(agent, 201);
});

app.get("/v1/agents/:id", async (c) => {
  const agent = await getAgent(c.env.DB, c.req.param("id"));
  if (!agent) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(agent);
});

app.put("/v1/prices/source", async (c) => {
  const body = (await c.req.json()) as { source?: string };
  if (!body.source?.trim()) {
    return c.json({ error: "source is required" }, 400);
  }
  await putPriceSource(c.env.PRICES, body.source.trim());
  return c.json({ source: body.source.trim() });
});

export default app;
