# Cloud and Remote Docker Workflows

Use this reference for remote builders, offload execution, and cloud-assisted build workflows.

## Related Deep References

- `references/images.md` for Buildx details.
- `references/registry.md` for push destination hygiene.

## Docker Offload

```powershell
docker offload version
docker offload status
docker offload start
docker offload stop
```

Confirm account/org readiness and expected cost/performance before enabling offload sessions.

## Build Cloud and Remote Build Strategies

```powershell
docker buildx ls
docker buildx create --name <builder> --driver remote <endpoint>
docker buildx use <builder>
```

Confirm credentials and registry push targets before distributed builds.

## Remote Context Operations

```powershell
docker context create <name> --docker "host=<endpoint>"
docker context use <name>
docker context inspect <name>
```

Switch context deliberately and report active context before high-impact commands.

## Reliability Pattern

1. Check context and builder selection.
2. Verify auth and endpoint reachability.
3. Run read-only status probes.
4. Execute build/deploy operations with explicit tags and destinations.

## Source Links

- <https://docs.docker.com/offload/>
- <https://docs.docker.com/build-cloud/>
- <https://docs.docker.com/build/>
- <https://docs.docker.com/reference/cli/docker/offload/>
- <https://docs.docker.com/reference/cli/docker/buildx/>
- <https://docs.docker.com/reference/cli/docker/context/>
