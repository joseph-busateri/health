# Environment Configuration — Personal AI Health Agent

**Version**: 1.0  
**Last Updated**: April 5, 2026

---

## Overview

This document describes all environment variables used by the Personal AI Health Agent Version 1.

---

## Required Variables

### API Configuration
```bash
# Base URL for the API server
API_BASE_URL=http://localhost:3001

# Server port
PORT=3001

# Node environment
NODE_ENV=development  # or 'production'
```

### OpenAI Configuration
```bash
# OpenAI API key for AI enrichment
OPENAI_API_KEY=sk-...

# OpenAI model (default: gpt-4)
OPENAI_MODEL=gpt-4
```

---

## AI Enrichment Feature Flags

### Global AI Enrichment
```bash
# Master switch for all AI enrichment
# Default: true
USE_AI_ENRICHMENT=true
```

### Per-Engine AI Enrichment Flags
```bash
# Recovery Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_RECOVERY=true

# Stress Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_STRESS=true

# Joint Health Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_JOINT=true

# Adherence Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_ADHERENCE=true

# Workout Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_WORKOUT=true

# Nutrition Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_NUTRITION=true

# Metabolic Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_METABOLIC=true

# Cardiovascular Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_CARDIOVASCULAR=true

# Sexual Health Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_SEXUAL_HEALTH=true

# Supplement Engine AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_SUPPLEMENT=true

# Cross-Engine Intelligence AI enrichment
# Default: inherits from USE_AI_ENRICHMENT
USE_AI_ENRICHMENT_CROSS_ENGINE_INTELLIGENCE=true
```

---

## Optional Variables

### Database Configuration
```bash
# Supabase URL (if using Supabase)
SUPABASE_URL=https://your-project.supabase.co

# Supabase anonymous key
SUPABASE_ANON_KEY=eyJ...
```

### Logging Configuration
```bash
# Log level: debug, info, warn, error
LOG_LEVEL=info

# Enable verbose logging
VERBOSE_LOGGING=false
```

### Performance Configuration
```bash
# AI enrichment timeout (milliseconds)
AI_ENRICHMENT_TIMEOUT=10000

# API request timeout (milliseconds)
API_TIMEOUT=30000
```

---

## Environment-Specific Configurations

### Development Environment
```bash
NODE_ENV=development
API_BASE_URL=http://localhost:3001
PORT=3001
USE_AI_ENRICHMENT=true
LOG_LEVEL=debug
VERBOSE_LOGGING=true
```

### Production Environment
```bash
NODE_ENV=production
API_BASE_URL=https://api.healthagent.com
PORT=3001
USE_AI_ENRICHMENT=true
LOG_LEVEL=info
VERBOSE_LOGGING=false
AI_ENRICHMENT_TIMEOUT=10000
```

### Testing Environment
```bash
NODE_ENV=test
API_BASE_URL=http://localhost:3001
PORT=3001
USE_AI_ENRICHMENT=false  # Use deterministic fallbacks for testing
LOG_LEVEL=warn
```

---

## Feature Flag Behavior

### AI Enrichment Hierarchy
1. **Global flag disabled** (`USE_AI_ENRICHMENT=false`):
   - All engines use deterministic fallbacks
   - Per-engine flags ignored
   - System operates in fully deterministic mode

2. **Global flag enabled, per-engine flag disabled**:
   - Specific engine uses deterministic fallback
   - Other engines use AI enrichment
   - Useful for selective AI usage

3. **Global flag enabled, per-engine flag enabled** (default):
   - Engine uses AI enrichment
   - Falls back to deterministic on AI failure
   - Recommended for production

### Fallback Behavior
- **AI enrichment fails**: System automatically falls back to deterministic recommendation
- **AI enrichment disabled**: System uses deterministic recommendation
- **No crashes**: System always returns valid response

---

## Configuration Examples

### Example 1: Full AI Enrichment (Recommended)
```bash
USE_AI_ENRICHMENT=true
# All per-engine flags inherit true
```

### Example 2: Selective AI Enrichment
```bash
USE_AI_ENRICHMENT=true
USE_AI_ENRICHMENT_RECOVERY=true
USE_AI_ENRICHMENT_STRESS=true
USE_AI_ENRICHMENT_WORKOUT=true
USE_AI_ENRICHMENT_NUTRITION=true
# Other engines use deterministic fallbacks
```

### Example 3: Deterministic Only (Testing)
```bash
USE_AI_ENRICHMENT=false
# All engines use deterministic recommendations
```

### Example 4: Cross-Engine Only
```bash
USE_AI_ENRICHMENT=false
USE_AI_ENRICHMENT_CROSS_ENGINE_INTELLIGENCE=true
# Only cross-engine uses AI, engines use deterministic
```

---

## Environment File Template

Create a `.env` file in the server root:

```bash
# API Configuration
API_BASE_URL=http://localhost:3001
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4

# AI Enrichment (Global)
USE_AI_ENRICHMENT=true

# AI Enrichment (Per-Engine) - Optional, inherits from global
# USE_AI_ENRICHMENT_RECOVERY=true
# USE_AI_ENRICHMENT_STRESS=true
# USE_AI_ENRICHMENT_JOINT=true
# USE_AI_ENRICHMENT_ADHERENCE=true
# USE_AI_ENRICHMENT_WORKOUT=true
# USE_AI_ENRICHMENT_NUTRITION=true
# USE_AI_ENRICHMENT_METABOLIC=true
# USE_AI_ENRICHMENT_CARDIOVASCULAR=true
# USE_AI_ENRICHMENT_SEXUAL_HEALTH=true
# USE_AI_ENRICHMENT_SUPPLEMENT=true
# USE_AI_ENRICHMENT_CROSS_ENGINE_INTELLIGENCE=true

# Database (Optional)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=eyJ...

# Logging (Optional)
LOG_LEVEL=info
# VERBOSE_LOGGING=false

# Performance (Optional)
# AI_ENRICHMENT_TIMEOUT=10000
# API_TIMEOUT=30000
```

---

## Validation

### Verify Configuration
```bash
# Check if all required variables are set
npm run validate:version1
```

### Test AI Enrichment
```bash
# Test with AI enrichment enabled
USE_AI_ENRICHMENT=true npm run validate:version1

# Test with AI enrichment disabled (deterministic only)
USE_AI_ENRICHMENT=false npm run validate:version1
```

---

## Troubleshooting

### AI Enrichment Not Working
1. Verify `OPENAI_API_KEY` is set correctly
2. Check `USE_AI_ENRICHMENT=true`
3. Check per-engine flags if using selective enrichment
4. Review logs for `ai_enrichment_fallback` messages

### System Using Fallbacks
1. Check OpenAI API quota/limits
2. Verify API key permissions
3. Check network connectivity
4. Review timeout settings

### Missing Environment Variables
1. Ensure `.env` file exists in server root
2. Verify variable names match exactly (case-sensitive)
3. Restart server after changing `.env`
4. Check for typos in variable names

---

## Security Best Practices

### API Keys
- **Never commit** `.env` file to version control
- Use `.env.example` as template
- Rotate API keys regularly
- Use different keys for dev/staging/prod

### Production Deployment
- Use environment-specific configuration
- Enable HTTPS in production
- Set `NODE_ENV=production`
- Use secure key management (e.g., AWS Secrets Manager)

---

## Migration Guide

### From Development to Production
1. Copy `.env.example` to `.env`
2. Update `NODE_ENV=production`
3. Update `API_BASE_URL` to production URL
4. Set production `OPENAI_API_KEY`
5. Adjust logging levels
6. Test with `npm run validate:version1`

---

## Support

### Questions
- Review this documentation
- Check logs for error messages
- Run validation scripts
- Verify environment variables are set

### Common Issues
- **AI enrichment not working**: Check OpenAI API key
- **System slow**: Check timeout settings
- **Inconsistent behavior**: Verify feature flags
- **Missing data**: Check database configuration

---

**Status**: ✅ COMPLETE  
**Version**: 1.0  
**Last Updated**: April 5, 2026
