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
import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/health", (c) => {
  return c.json({ ok: true, service: "akela-api" });
});

app.get("/formula", (c) => {
  return c.json({
    disclaimer: "model not an offer",
    value: {
      a: VALUE_A,
      b: VALUE_B,
      formula: VALUE_FORMULA,
      consistency: { min: CONSISTENCY_MIN, max: CONSISTENCY_MAX },
      exampleUsd: modelValue(10_000, 4_000, 1),
    },
    score: {
      formula: SCORE_FORMULA,
      weights: SCORE_WEIGHTS,
    },
  });
});

export default app;
