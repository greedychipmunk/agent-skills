# Plugin, action, provider, service

Use these extracts only for a matching target. Sources: pinned [plugin.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/plugin.ts), [components.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/components.ts), [service.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/service.ts), [runtime types](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/runtime.ts).

## Minimal source-derived shape (not runtime-tested)

```ts
import type { Action, Plugin } from "@elizaos/core";
const ping: Action = {
  name: "PING",
  description: "Return a diagnostic response without external effects",
  validate: async () => true,
  handler: async () => ({ success: true, text: "pong" }),
};
export const plugin: Plugin = {
  name: "example",
  description: "Diagnostic example",
  actions: [ping],
};
export default plugin;
```

Do not use unconditional validation for privileged actions. Supply host registration/configuration separately; this is not a full package scaffold.

## Plugin

Require name/description strings. Optional arrays: actions: Action[], providers: Provider[], evaluators: RegisteredEvaluator[], services: ServiceClass[], tests: TestSuite[]. Dependencies/testDependencies are optional string arrays. Inspect loader semantics rather than assuming dependency/priority order.

```ts
init?: (config: Record<string, string>, runtime: IAgentRuntime) => Promise<void> | void;
dispose?: (runtime: IAgentRuntime) => Promise<void> | void;
applyConfig?: (config: Record<string, string>, runtime: IAgentRuntime) => Promise<void> | void;
preflight?: () => Promise<void> | void;
config?: Record<string, string | number | boolean | null>;
```

Treat preflight as preparation. Keep plugin-owned resources in init/dispose and service-owned resources in start/stop. Inspect models/events/views/widgets/adapter factory/remote/context declarations only when needed; do not invent route support from older docs.

## Action

```ts
type Handler = (
  runtime: IAgentRuntime, message: Memory, state?: State,
  options?: HandlerOptions | Record<string, JsonValue | undefined>,
  callback?: HandlerCallback, responses?: Memory[]
) => Promise<ActionResult>;
type Validator = (
  runtime: IAgentRuntime, message: Memory, state?: State,
  options?: HandlerOptions | Record<string, JsonValue | undefined>
) => Promise<boolean>;
type HandlerCallback = (response: Content, actionName?: string) => Promise<Memory[]>;
```

Require name, description, handler, validate. Optional examples/similes guide selection, not permission. Current HandlerOptions includes parameters, parameterErrors, abortSignal, actionContext, actionPlan. Narrow options before use. Inspect ActionParameter before declaring schemas. Return success:false for handled failures; never forge success to keep a chain moving.

## Provider

```ts
get: (
  runtime: IAgentRuntime, message: Memory, state: State,
  context?: ProviderExecutionContext
) => Promise<ProviderResult>;
// ProviderExecutionContext.signal: AbortSignal
// ProviderResult has optional text, values, data, advanced source representations.
```

Require name/get. Route prompt contributions with contexts/contextGate; description alone is not guaranteed planner input. Respect role/disclosure gates. Private means explicit invocation, not confidentiality. Position is ordering metadata, not a guarantee of serialized I/O. Keep get read-only; propagate cancellation to interruptible work.

## Service

Subclass Service; set static serviceType:string and instance capabilityDescription:string. Implement static start(runtime:IAgentRuntime):Promise<Service> and instance stop():Promise<void>. Constructor accepts optional runtime; retain it with super(runtime). Optional prepareStop(reason:string):void stops admitting work before drains; optional static stopRuntime(runtime):Promise<void> supports shutdown. Register [MyService], not constructed instances.

Use synchronous runtime.getService<T extends Service>(name):T|null; check null. getServicesByType<T>(name):T[] and allowsMultiple mean singleton assumptions are not universal. Close timers/connections and avoid unowned delayed callbacks firing after unload.
