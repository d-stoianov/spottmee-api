# Spottmee API

This project is a **REST API** backend service powering the [Spottmee App](https://github.com/d-stoianov/spottmee-app) frontend. The service is responsible for handling authorization, user management, albums, photo uploads and queueing face recognition jobs.

Service integrates with the [Spottmee Face Embeddings Worker](https://github.com/d-stoianov/spottmee-face-embeddings-worker) through a [Redis Queue](https://redis.io/glossary/redis-queue) to process photos (generate vector embeddings) and later matching those photos with selfies.

---

## Tech Stack

-   **Nest.js**
-   **TypeScript**
-   **PostgreSQL**
-   **Prisma**
-   **Redis**
-   **Firebase**
-   **Zod**

## Prerequisites

Make sure you have the following installed:

- Node.js
- npm or pnpm / yarn
- PostgreSQL database
- Redis
- Firebase project

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/d-stoianov/spottmee-api.git
    cd spottmee-api
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Setup .env file:

    Create file in the root of the project called `.env`, with the following content:
    ```bash
    DATABASE_URL=
    PORT=
    REDIS_URL=
    FIREBASE_STORAGE_BUCKET=
    FIREBASE_SERVICE_ACCOUNT_B64=
    ```
    
5.  Start the development server:

    ```bash
    pnpm start:dev
    ```

## ESLint

The project uses ESLint and Prettier for code quality and consistency. You can run the linter with:

```bash
pnpm run lint
```

## Building project

For deploying the project, first we have to build it and then run compiled JavaScript. You can use the following commands:

```bash
pnpm run build
pnpm start:prod
```

## Running with Docker

If you don’t want to install Node.js, pnpm, or dependencies locally, you can use Docker instead.
The repository includes a ready-to-use Dockerfile.

```bash
# Build the Docker image
docker build -t spottmee-api .

# Run the container
docker run -p 3000:3000 --env-file .env spottmee-api
```

Ensure your .env file is properly configured before running the container.  
You can also use docker-compose if you want to run PostgreSQL and Redis services together.
