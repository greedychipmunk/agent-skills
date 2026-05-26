# Terraform Configuration

## Provider Block

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = var.aws_region
}
```

## Variables (`variables.tf`)

```hcl
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}
```

## Variable Values (`.tfvars`)

```hcl
# terraform.tfvars (do NOT commit if it contains secrets)
aws_region  = "us-west-2"
environment = "staging"
```

```bash
# Pass at runtime
terraform apply -var="environment=prod" -var-file="prod.tfvars"
```

## Outputs (`outputs.tf`)

```hcl
output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.data.arn
  sensitive   = true  # hides value in CLI output
}
```

## Backend Configuration

### Local (default)

```hcl
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

### Remote — S3 + DynamoDB Locking

```hcl
terraform {
  backend "s3" {
    bucket         = "my-tf-state"
    key            = "env/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

### Remote — Terraform Cloud / HCP Terraform

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "my-workspace"
    }
  }
}
```

## Locals

```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_instance" "web" {
  tags = local.common_tags
}
```

## Provider Registry

Providers are found at <https://registry.terraform.io/browse/providers>.

For advanced provider development and custom providers, see the [Terraform Plugin Framework docs](https://developer.hashicorp.com/terraform/plugin/framework).
