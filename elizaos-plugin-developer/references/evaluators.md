# Current evaluator pipeline and legacy migration

Source: [pinned evaluator.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/evaluator.ts). Read the target runtime evaluator service before depending on scheduling/error semantics. Do not confuse post-turn Evaluator with response-handler/completion evaluator extension surfaces.

## Required contract and processors

Selected signatures; additional hooks omitted:

```ts
interface Evaluator<TOutput = JsonValue, TPrepared = unknown> {
  name: string;
  description: string;
  schema: JSONSchema;
  shouldRun(context: EvaluatorRunContext): Promise<boolean>;
  prepare?(context: EvaluatorRunContext & { state: State }): Promise<TPrepared>;
  prompt(context: EvaluatorPromptContext<TPrepared>): string;
  parse?(
    output: unknown,
    context?: EvaluatorPromptContext<TPrepared> & {
      outputSource?: "model" | "staged" | "resolved";
    }
  ): TOutput | null;
  processors?: Array<EvaluatorProcessor<TOutput, TPrepared>>;
}
interface EvaluatorProcessor<TOutput = JsonValue, TPrepared = unknown> {
  name?: string;
  priority?: number;
  process(context: EvaluatorProcessorContext<TOutput, TPrepared>):
    Promise<ActionResult | undefined>;
}
type RegisteredEvaluator = Evaluator<unknown, unknown>;
```

Run context contains runtime/message/optional state/options. Prompt context adds required state/prepared. Processor context adds output/evaluatorName. Register through Plugin.evaluators; verify generic assignability instead of casting away mismatches.

## Design the reducer

1. Define extracted information and authorized evidence. Generated assistant claims are not proof of external operations.
2. Gate eligibility with shouldRun and current run options, not obsolete alwaysRun.
3. Define schema-bound output; make prompt/parser agree.
4. Prepare inputs separately from persistence effects.
5. Parse/validate output; commit through processors after admission.
6. Verify failure, replay, and changed-source behavior at persistence boundaries.

For deterministic reduction, inspect resolveOutput(context):TOutput and resolveOutputWhen. An unconditional resolver must return defined output or throw; it is not an async handler replacement. Parsing/processors/progress still apply.

## Migrate deliberately

Public examples use examples/alwaysRun/validate/handler, not the pinned interface. Do not just rename validate to shouldRun. Move admission to shouldRun; model input/output design to schema/prompt/prepare/parse; committed writes to processors. Preserve and verify observable behavior. For actual 1.x targets, use that version's contract instead of unnecessary migration.

Leave incremental/background off until their full evidence contracts exist. Incremental reducers must consume runtime-owned extraction batches, make replay idempotent, reconcile changed/removed evidence, and checkpoint only after processors succeed. Background prepare/prompt must be repeatable because authorization/evidence may be revalidated under a new room lease. These are correctness commitments, not generic performance flags.

Do not call an evaluator safe because a mock returns JSON. Verify runtime admission, schema parsing, persistence, and replay separately.
