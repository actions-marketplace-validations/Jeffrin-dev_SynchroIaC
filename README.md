# SynchroIaC

**Infrastructure Drift Reconciliation Platform**

[![Version](https://img.shields.io/badge/version-v0.1.0-green.svg)](https://github.com/Jeffrin-dev/SynchroIaC/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.22-blue.svg)](https://golang.org)
[![Next.js](https://img.shields.io/badge/next.js-14-black.svg)](https://nextjs.org)
[![Marketplace](https://img.shields.io/badge/GitHub%20Actions-Marketplace-purple.svg)](https://github.com/marketplace/actions/synchroiac-drift-scanner)
[![Deploy](https://img.shields.io/badge/deployed%20on-Vercel-black.svg)](https://synchroiac-io.vercel.app)

Detects, explains, and helps reconcile drift between your Terraform configuration and live AWS infrastructure.

Most tools tell you drift exists. SynchroIaC tells you what drifted, why it matters, and how to fix it — with AI explanations and automated fix PRs.

---

## How it works

1. Add the GitHub Action to your repo
2. It reads your Terraform state and calls AWS APIs (read-only)
3. Drift is detected, risk-classified, and sent to your dashboard
4. Get AI explanations and auto-generated fix PRs for each drift

Your AWS credentials never leave your GitHub Actions environment.

---

## Quick start

Create `.github/workflows/synchroiac.yml` in your repo:

```yaml
name: Drift Check

on:
  schedule:
    - cron: "0 9 * * 1-5"
  workflow_dispatch:

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: Jeffrin-dev/SynchroIaC@v0.1.0
        with:
          api-key: ${{ secrets.SYNCHROIAC_API_KEY }}
          project-id: ${{ secrets.SYNCHROIAC_PROJECT_ID }}
          terraform-path: ./terraform
          aws-region: us-east-1
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

Then add these secrets to your repo:

| Secret | Where to find it |
|--------|-----------------|
| `SYNCHROIAC_API_KEY` | Dashboard → Settings |
| `SYNCHROIAC_PROJECT_ID` | Dashboard → Projects |
| `AWS_ACCESS_KEY_ID` | Your read-only IAM user |
| `AWS_SECRET_ACCESS_KEY` | Your read-only IAM user |

---

## Required AWS IAM permissions

Attach the minimal policy from [`docs/iam-policy.json`](docs/iam-policy.json) to your IAM user. Read-only — SynchroIaC never writes to your AWS account.

Permissions cover:
- EC2 instance inspection
- S3 bucket configuration
- IAM user security posture

---

## Supported AWS resources

| Resource | Attributes scanned |
|----------|-------------------|
| `aws_instance` | instance_type, AMI, subnet, VPC, termination protection, monitoring, tags |
| `aws_s3_bucket` | encryption, versioning, public access block, logging, tags |
| `aws_iam_user` | MFA, access keys, console access, admin policy attachment |

More resources coming in v0.2.0.

---

## Risk classification

Every drift is automatically classified:

| Level | Example |
|-------|---------|
| 🔴 Critical | S3 bucket encryption disabled, IAM user without MFA |
| 🟠 High | EC2 instance type changed, S3 versioning disabled |
| 🟡 Medium | Monitoring disabled, access key count changed |
| ⚪ Low | Tag changes, name changes |

---

## Dashboard

View drift history, generate AI explanations, open fix PRs, and mark drifts resolved at:

**[synchroiac-io.vercel.app](https://synchroiac-io.vercel.app)**

---

## Stack

| Layer | Technology |
|-------|-----------|
| Scanner | Go |
| API | Next.js on Vercel |
| Database | Supabase |
| AI | OpenRouter |
| PRs | GitHub API |
| Email alerts | Resend |
| Billing | Paddle |

---

## Self-hosting

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full deployment guide.

---

## Feedback

Built by [@Jeffrin-dev](https://github.com/Jeffrin-dev).

This is v0.1.0. If you use Terraform and AWS, I want to know:
- Does this solve a real problem for your team?
- What resources should be added next?
- What would make you pay for this?

Open an issue or start a discussion on GitHub.
