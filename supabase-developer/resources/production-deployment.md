# Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] All RLS policies enabled on public tables
- [ ] Service role key never exposed to client
- [ ] Environment variables properly configured
- [ ] CORS settings configured correctly
- [ ] API rate limiting configured
- [ ] Database backups enabled
- [ ] SSL/TLS enforced for all connections

### Performance
- [ ] Database indexes created
- [ ] Connection pooling enabled
- [ ] Image transformations configured
- [ ] CDN enabled for Storage
- [ ] Query performance tested
- [ ] RLS policies optimized

### Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics setup
- [ ] Database monitoring enabled
- [ ] Log aggregation configured
- [ ] Alerts configured for critical metrics

### Code Quality
- [ ] All tests passing
- [ ] TypeScript types generated
- [ ] Linting passing
- [ ] Security scan completed
- [ ] Code review completed

## Project Setup

### 1. Create Production Project

Via Dashboard:
1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose organization
4. Enter project details
5. Select region (choose closest to users)
6. Set strong database password
7. Wait for provisioning (~2 minutes)

Via CLI:
```bash
supabase projects create production-app \
  --org-id <your-org-id> \
  --db-password <strong-password> \
  --region us-east-1
```

### 2. Configure Environment Variables

Create `.env.production`:
```bash
# Public keys (safe for client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Private keys (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# App configuration
NEXT_PUBLIC_APP_URL=https://yourapp.com
NODE_ENV=production
```

Never commit to git:
```gitignore
.env.production
.env.local
.env*.local
```

### 3. Link Local to Production
```bash
# Link to production project
supabase link --project-ref <your-project-ref>

# Verify link
supabase projects list
```

## Database Migration

### 1. Review Migrations
```bash
# Check all migrations
ls -la supabase/migrations/

# Review each migration file
cat supabase/migrations/20240101000000_initial_schema.sql
```

### 2. Test Migrations Locally
```bash
# Reset local database
supabase db reset

# Ensure all migrations apply successfully
# Test application thoroughly
```

### 3. Deploy to Production
```bash
# Deploy migrations to production
supabase db push --linked

# Verify deployment
supabase migration list --linked
```

### 4. Backup Before Major Changes
```bash
# Create backup before deploying
# Via Dashboard: Database > Backups > Create backup

# Or via pg_dump
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump
```

## Edge Functions Deployment

### 1. Test Functions Locally
```bash
# Serve functions locally
supabase functions serve

# Test each function
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/my-function' \
  --header 'Authorization: ******' \
  --data '{"test": true}'
```

### 2. Configure Secrets
```bash
# Set production secrets
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  SENDGRID_API_KEY=SG.xxx \
  --project-ref <project-ref>

# Verify secrets
supabase secrets list --project-ref <project-ref>
```

### 3. Deploy Functions
```bash
# Deploy single function
supabase functions deploy my-function --project-ref <project-ref>

# Deploy all functions
supabase functions deploy --project-ref <project-ref>

# Verify deployment
curl https://your-project.supabase.co/functions/v1/my-function
```

### 4. Monitor Function Logs
```bash
# View logs
supabase functions logs my-function --project-ref <project-ref>

# Stream logs
supabase functions logs my-function --follow
```

## Application Deployment

### Vercel Deployment

#### 1. Configure Environment Variables
In Vercel Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### 2. Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### 3. Configure Custom Domain
```bash
vercel domains add yourapp.com
```

### Netlify Deployment

#### 1. netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
```

#### 2. Set Environment Variables
In Netlify Dashboard > Site settings > Environment variables

#### 3. Deploy
```bash
netlify deploy --prod
```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

#### Deploy
```bash
# Build image
docker build -t myapp:latest .

# Run locally
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  myapp:latest

# Push to registry
docker push myapp:latest

# Deploy to production (K8s, ECS, etc.)
```

## Post-Deployment

### 1. Verify Deployment

#### Health Checks
```bash
# API health
curl https://your-project.supabase.co/rest/v1/

# Application health
curl https://yourapp.com/api/health

# Database connection
psql -h db.your-project.supabase.co -U postgres -c "SELECT 1"
```

#### Smoke Tests
```typescript
// Run critical user flows
describe('Production Smoke Tests', () => {
  it('can sign up', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(error).toBeNull()
  })
  
  it('can fetch data', async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
    expect(error).toBeNull()
  })
})
```

### 2. Monitor Performance

#### Database Metrics
- Query performance
- Connection count
- Database size
- Cache hit rate

#### API Metrics
- Request rate
- Response time
- Error rate
- Bandwidth usage

#### Application Metrics
- Page load time
- Core Web Vitals
- User engagement
- Conversion rates

### 3. Set Up Alerts

#### Database Alerts
```sql
-- Alert on high connection count
SELECT count(*) FROM pg_stat_activity
WHERE state != 'idle';

-- Alert on slow queries
SELECT * FROM pg_stat_statements
WHERE mean_time > 1000;
```

#### Application Alerts
- Error rate > 1%
- Response time > 2s
- Database connections > 80%
- Storage usage > 80%

## Backup Strategy

### Automated Backups

Supabase automatically backs up databases:
- Daily backups for paid plans
- Point-in-time recovery available
- Backups retained for 7-30 days

### Manual Backups
```bash
# Create on-demand backup via Dashboard
# Database > Backups > Create backup

# Or via pg_dump
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### Backup Storage
```bash
# Upload to S3
aws s3 cp backup.dump s3://mybucket/backups/

# Or to Google Cloud Storage
gsutil cp backup.dump gs://mybucket/backups/
```

### Restore from Backup
```bash
# Via Dashboard: Database > Backups > Restore

# Or via pg_restore
pg_restore -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -c \
  backup.dump
```

## Scaling Considerations

### Database Scaling

#### Vertical Scaling
- Upgrade plan for more resources
- Monitor database performance
- Add read replicas if needed

#### Horizontal Scaling
- Use connection pooling
- Implement caching layers
- Consider sharding for very large datasets

### Connection Pooling

#### Enable Pooler
Dashboard > Settings > Database > Enable connection pooling

#### Use Pooler URL
```typescript
// Use pooler URL for serverless
const poolerUrl = process.env.SUPABASE_POOLER_URL

const supabase = createClient(poolerUrl, serviceRoleKey, {
  db: { schema: 'public' }
})
```

### CDN & Caching

#### Enable CDN
- Supabase Storage includes CDN
- Configure cache headers
- Use edge caching for API responses

#### Caching Strategy
```typescript
// API route caching
export async function GET(request: Request) {
  const data = await getData()
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'CDN-Cache-Control': 'max-age=3600',
    },
  })
}
```

## Security Hardening

### 1. Review RLS Policies
```sql
-- Ensure all tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Review policies
SELECT *
FROM pg_policies
WHERE schemaname = 'public';
```

### 2. Configure CORS
Dashboard > Settings > API > CORS

```typescript
// Or in Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourapp.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}
```

### 3. Rate Limiting
Dashboard > Settings > API > Rate Limiting

Configure per:
- IP address
- User
- API key

### 4. Enable 2FA
- Enable for all team members
- Use strong passwords
- Regular security audits

## Maintenance

### Regular Tasks

#### Weekly
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor disk usage
- [ ] Review security alerts

#### Monthly
- [ ] Database VACUUM ANALYZE
- [ ] Review and optimize slow queries
- [ ] Update dependencies
- [ ] Security patches
- [ ] Backup verification

#### Quarterly
- [ ] Full security audit
- [ ] Performance optimization
- [ ] Disaster recovery drill
- [ ] Review and update documentation

### Database Maintenance
```sql
-- Analyze tables
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Full vacuum (requires downtime)
VACUUM FULL;

-- Reindex if needed
REINDEX DATABASE postgres;
```

## Troubleshooting

### High Database Load
1. Identify slow queries
2. Add missing indexes
3. Optimize RLS policies
4. Enable connection pooling
5. Consider caching

### Connection Issues
1. Check connection pool settings
2. Verify firewall rules
3. Review connection limits
4. Check for connection leaks

### Deployment Failures
1. Review migration logs
2. Check for syntax errors
3. Verify permissions
4. Test migrations locally first

## Rollback Procedures

### Database Rollback
```bash
# Restore from backup
# Dashboard > Database > Backups > Restore

# Or create reverse migration
supabase migration new rollback_feature_x
# Write SQL to undo changes
supabase db push --linked
```

### Application Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Docker/K8s
kubectl rollout undo deployment/myapp
```

## Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Supabase Status Page](https://status.supabase.com/)
- [Community Discord](https://discord.supabase.com/)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
