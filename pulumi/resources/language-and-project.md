# Pulumi Language & Project Layout

## Supported Languages

Pulumi programs are real code in your language of choice. All languages target the same Pulumi resource model.

### TypeScript / JavaScript

```typescript
// index.ts
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.BucketV2("my-bucket", {
    tags: { Environment: "dev" },
});

export const bucketName = bucket.bucket;
```

```bash
# Project files
Pulumi.yaml       # project metadata
Pulumi.dev.yaml   # stack config
package.json
tsconfig.json
index.ts          # main program
```

### Python

```python
# __main__.py
import pulumi
import pulumi_aws as aws

bucket = aws.s3.BucketV2("my-bucket",
    tags={"Environment": "dev"})

pulumi.export("bucket_name", bucket.bucket)
```

```bash
# Project files
Pulumi.yaml
Pulumi.dev.yaml
__main__.py
requirements.txt
```

### Go

```go
// main.go
package main

import (
    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        bucket, err := s3.NewBucketV2(ctx, "my-bucket", nil)
        if err != nil { return err }
        ctx.Export("bucketName", bucket.Bucket)
        return nil
    })
}
```

### C# / .NET

```csharp
// Program.cs
using Pulumi;
using Pulumi.Aws.S3;

return await Deployment.RunAsync(() =>
{
    var bucket = new BucketV2("my-bucket");
    return new Dictionary<string, object?> {
        ["bucketName"] = bucket.BucketName
    };
});
```

### YAML (no runtime needed)

```yaml
# Pulumi.yaml
name: my-project
runtime: yaml
resources:
  my-bucket:
    type: aws:s3:BucketV2
    properties:
      tags:
        Environment: dev
outputs:
  bucketName: ${my-bucket.bucket}
```

## `Pulumi.yaml` Project File

```yaml
name: my-project
runtime: nodejs     # nodejs | python | go | dotnet | java | yaml
description: "My infrastructure project"
config:
  aws:region:
    default: us-east-1
```

## Stack Config File (`Pulumi.<stack>.yaml`)

```yaml
config:
  aws:region: us-west-2
  my-project:environment: prod
  my-project:dbPassword:
    secure: AAABAHx...   # encrypted secret
```

## Resource Declaration Patterns

### Explicit dependencies

```typescript
const vpc = new aws.ec2.Vpc("main", { cidrBlock: "10.0.0.0/16" });
const subnet = new aws.ec2.Subnet("pub", {
    vpcId: vpc.id,        // Output<string> creates implicit dependency
    cidrBlock: "10.0.1.0/24",
});
```

### `dependsOn` (explicit)

```typescript
const table = new aws.dynamodb.Table("t", { ... });
const lambda = new aws.lambda.Function("fn", { ... }, {
    dependsOn: [table],
});
```

### Component Resources (reusable abstractions)

```typescript
class WebService extends pulumi.ComponentResource {
    constructor(name: string, args: WebServiceArgs, opts?: pulumi.ResourceOptions) {
        super("myorg:index:WebService", name, {}, opts);
        // define child resources...
    }
}
```

For advanced topics — dynamic providers, Pulumi Automation API, policy packs (CrossGuard) — see <https://www.pulumi.com/docs/concepts/>.
