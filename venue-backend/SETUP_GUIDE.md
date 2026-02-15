# Backend Testing Setup Guide

Step-by-step guide to configure Jest, Supertest, and k6 for VENUE backend testing.

## Prerequisites

Required tools:
- Node.js v18+ 
- MongoDB (local or Atlas)
- npm package manager
- Git

## 1. Install Testing Dependencies

```bash
cd venue-backend
npm install --save-dev cross-env
npm install
```

Installs:
- jest (testing framework)
- supertest (HTTP testing)
- cross-env (environment variables)

## 2. Verify Configuration Files

Check these files exist:
- jest.config.js
- .env.test
- tests/setup.js
- tests/helpers.js

## 3. Configure Test Database

Edit `.env.test`:

```env
MONGO_URI=mongodb://localhost:27017/venue-test
```

**CRITICAL:** Use a separate test database, never production.

## 4. Start MongoDB

```bash
# Windows
net start MongoDB

# Verify
mongosh --eval "db.version()"
```

## 5. Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Integration only
npm run test:integration

# Unit only
npm run test:unit

# Watch mode
npm run test:watch

# Specific file
npm test -- tests/integration/auth.test.js
```

## 6. Install k6 (Load Testing)

**Windows (Chocolatey):**
```powershell
choco install k6
k6 version
```

**Windows (Scoop):**
```powershell
scoop install k6
```

**Windows (Manual):**
Download: https://dl.k6.io/msi/k6-latest-amd64.msi

**macOS:**
```bash
brew install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## 7. Run Load Tests

Start server first:
```bash
npm run dev
```

Then run tests:
```bash
# General load test
npm run k6:load

# Booking concurrency
npm run k6:booking

# Rate limiting
npm run k6:rate-limit

# Custom configuration
k6 run --vus 50 --duration 60s k6/load-test.js
```

## Project Structure

```
venue-backend/
├── tests/
│   ├── setup.js              # Global setup
│   ├── helpers.js            # Test utilities
│   ├── integration/          # API tests
│   └── unit/                 # Unit tests
├── k6/                       # Load tests
├── coverage/                 # Coverage reports
├── jest.config.js
└── .env.test
```

## Troubleshooting

**Tests hang/timeout:**
```bash
mongosh --eval "db.version()"
# Increase timeout in jest.config.js
```

**Module not found:**
```bash
npm install
npm test -- --clearCache
```

**MongoDB connection error:**
```bash
net start MongoDB
# Verify MONGO_URI in .env.test
```

**k6 not found:**
```bash
choco install k6
# Add to PATH if needed
```

**Port in use:**
```bash
# Windows
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000
```

## Quick Reference

```bash
# Testing
npm test                  # All tests
npm run test:coverage     # With coverage
npm run test:watch        # Watch mode

# Load Testing
npm run k6:load          # General load
npm run k6:booking       # Concurrency
npm run k6:rate-limit    # Rate limits

# Utilities
npm test -- --clearCache  # Clear cache
mongosh --eval "db.version()"  # Check MongoDB
```

## Resources

- [Full Testing Documentation](./TESTING.md)
- [k6 Scripts](./k6/README.md)
- [Jest Documentation](https://jestjs.io/docs/)
- [k6 Documentation](https://k6.io/docs/)
