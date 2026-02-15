# Codecov Setup Guide

## Quick Setup (5 minutes)

### 1. Sign Up for Codecov

1. Go to https://codecov.io
2. Click "Sign up with GitHub"
3. Authorize Codecov to access your repositories

### 2. Add Your Repository

1. After login, click "+ Add new repository"
2. Find and select your `VENUE` repository
3. Click "Setup repo"

### 3. Get Upload Token (Optional for Public Repos)

For **public repositories**:
- No token needed! GitHub Actions can upload without authentication

For **private repositories**:
1. In Codecov dashboard → Settings → Copy the upload token
2. Go to GitHub repo → Settings → Secrets → Actions
3. Add new secret: `CODECOV_TOKEN` with the value you copied

### 4. Verify Upload

After your next CI run:
1. Check GitHub Actions logs
2. Look for "Upload Backend Coverage to Codecov" step
3. Should see: ✅ "Uploaded coverage reports"

### 5. Update README Badges

Replace `YOUR_USERNAME` in README.md:

```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/VENUE/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/VENUE)
```

Example if your username is `johndoe`:
```markdown
[![codecov](https://codecov.io/gh/johndoe/VENUE/branch/main/graph/badge.svg)](https://codecov.io/gh/johndoe/VENUE)
```

---

## Optional: Configure Coverage Requirements

Create `codecov.yml` in repository root:

```yaml
coverage:
  status:
    project:
      default:
        target: 80%           # Minimum coverage required
        threshold: 2%         # Allow 2% drop
    patch:
      default:
        target: 80%           # New code must have 80% coverage

comment:
  layout: "reach, diff, flags, files"
  behavior: default
  require_changes: false
  
ignore:
  - "tests/**"
  - "**/*.test.js"
  - "**/node_modules/**"
```

---

## What You Get

✅ **Coverage Reports**: See detailed coverage for every commit  
✅ **PR Comments**: Codecov automatically comments on PRs with coverage changes  
✅ **Badges**: Beautiful badges for your README  
✅ **Trends**: Track coverage over time  
✅ **File Browser**: See which files need more tests  

---

## Troubleshooting

### Badge Shows "unknown"
- Wait 5-10 minutes after first upload
- Ensure CI has run successfully
- Check Codecov dashboard for uploaded reports

### Upload Failed in CI
- For private repos: Verify `CODECOV_TOKEN` is set
- Check GitHub Actions logs for specific error
- Ensure `coverage/lcov.info` file exists after tests

### Coverage Not Updating
- Clear Codecov cache: Dashboard → Settings → Caches → Clear
- Re-run CI pipeline
- Check that tests actually run in CI

---

## Cost

- **Free** for open-source public repositories
- **Free** for private repos (limited to 1 user)
- **Paid** for teams on private repos (~$10/month)

---

**That's it!** Your coverage tracking is now automated. 🎉
