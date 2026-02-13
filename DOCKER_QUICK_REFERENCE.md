# VENUE Docker Infrastructure Reference

This documentation provides technical details for managing the containerized VENUE application.

## Quick Start (Local Development)

The project includes automation scripts to initialize the development environment across different operating systems.

### Windows Environments

```bash
./docker-dev.bat
```

### Linux and macOS Environments

```bash
chmod +x docker-dev.sh
./docker-dev.sh
```

---

## Essential Docker Operations

### Standard Lifecycle Commands

- **Initialize Services**: `docker compose up -d`
- **Terminate Services**: `docker compose down`
- **Rebuild with Source Changes**: `docker compose up --build -d`
- **Operational Status**: `docker compose ps`
- **Log Monitoring**: `docker compose logs -f`

### Housekeeping and Maintenance

- **Purge Persistence (Reset Database)**: `docker compose down -v`
- **Clean Unused Docker Assets**: `docker system prune`

---

## Production Deployment Workflow

For production environments, use the base configuration along with the production-specific override file:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Service Architecture

| Service               | Protocol/Host Access              | Internal Port | Technical Description                          |
| :-------------------- | :-------------------------------- | :------------ | :--------------------------------------------- |
| **Frontend**          | `http://localhost:3000`           | 80            | React single-page application served via Nginx |
| **Backend**           | `http://localhost:5000`           | 5000          | Node.js REST API with Express framework        |
| **API Documentation** | `http://localhost:5000/docs`      | 5000          | Open API / Swagger documentation layer         |
| **MongoDB**           | `localhost:27017` (Authenticated) | 27017         | NoSQL database for application persistence     |
| **Redis**             | `localhost:6379`                  | 6379          | In-memory store for caching and rate-limiting  |

---

## Configuration Management

Environment variables are managed through localized `.env` files within each component's directory.

### Key Deployment Parameters

- `ALLOWED_ORIGINS`: Defines cross-origin resource sharing policies (must include frontend URL).
- `VITE_API_URL`: Configures the frontend's target API endpoint for asynchronous requests.
