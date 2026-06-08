# Cloud & Infrastructure Security Reference

This reference supports cloud infrastructure, CI/CD pipelines, and deployment
configuration reviews.

## When to Load

Load this reference when reviewing:

- Deployments to AWS, Vercel, Railway, Cloudflare, or similar platforms
- IAM roles, service accounts, or permission boundaries
- CI/CD pipelines and deployment credentials
- Infrastructure as code such as Terraform or CloudFormation
- Secrets managers, KMS, bucket policies, CDN, edge security, or disaster recovery

## Cloud Security Checklist

### 1. IAM & Access Control

#### Principle of Least Privilege

```yaml
# PASS: CORRECT: Minimal permissions
iam_role:
  permissions:
    - s3:GetObject
    - s3:ListBucket
  resources:
    - arn:aws:s3:::my-bucket/*

# FAIL: WRONG: Overly broad permissions
iam_role:
  permissions:
    - s3:*
  resources:
    - "*"
```

#### Multi-Factor Authentication (MFA)

```bash
aws iam enable-mfa-device \
  --user-name admin \
  --serial-number arn:aws:iam::123456789:mfa/admin \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

#### Verification Steps

- [ ] No root account usage in production
- [ ] MFA enabled for all privileged accounts
- [ ] Service accounts use roles, not long-lived credentials
- [ ] IAM policies follow least privilege
- [ ] Regular access reviews conducted
- [ ] Unused credentials rotated or removed

### 2. Secrets Management

#### Cloud Secrets Managers

```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });
const secret = await client.getSecretValue({ SecretId: 'prod/api-key' });
const apiKey = JSON.parse(secret.SecretString).key;

const fallbackApiKey = process.env.API_KEY; // FAIL: not rotated, not audited
```

#### Secrets Rotation

```bash
aws secretsmanager rotate-secret \
  --secret-id prod/db-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotate \
  --rotation-rules AutomaticallyAfterDays=30
```

#### Verification Steps

- [ ] All secrets stored in cloud secrets manager
- [ ] Automatic rotation enabled for database credentials
- [ ] API keys rotated at least quarterly
- [ ] No secrets in code, logs, or error messages
- [ ] Audit logging enabled for secret access

### 3. Network Security

#### VPC and Firewall Configuration

```terraform
resource "aws_security_group" "app" {
  name = "app-sg"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "bad" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```
