# Backend Template

> 🚀 A production-ready Express.js backend template with TypeScript, PostgreSQL (Sequelize), authentication, and best practices.

This is a GitHub template repository. Click "Use this template" to create a new repository from this template.

## 📋 What's Included

- ✅ Express.js with TypeScript
- ✅ PostgreSQL with Sequelize ORM
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Password hashing with bcryptjs
- ✅ Request validation with Zod
- ✅ Structured logging with Pino
- ✅ CORS configuration
- ✅ Error handling middleware
- ✅ Request logging middleware
- ✅ Conventional commits with commitlint
- ✅ Git hooks with Husky
- ✅ ESLint + Prettier for code quality

## 🚀 Quick Start

### Prerequisites

- **Node.js 22.x** or higher
- **npm 10.x** or higher

You can use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions:
```bash
nvm install 22
nvm use 22
```

Or if you have `.nvmrc` file, simply run:
```bash
nvm use
```

### Installation Steps

1. **Create a new repository** from this template by clicking "Use this template" on GitHub
2. **Clone your new repository**:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration (PostgreSQL `DATABASE_URL`, JWT secrets, etc.)
5. **Start developing**:
   ```bash
   npm run dev
   ```

For more detailed information, see [TEMPLATE.md](./TEMPLATE.md).

## Installation

### Requirements

- **Node.js 22.x** or higher
- **npm 10.x** or higher

### Install Dependencies

```bash
npm install
```

> **Note:** If you're using [nvm](https://github.com/nvm-sh/nvm), you can run `nvm use` to automatically switch to the correct Node.js version (specified in `.nvmrc`).

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your PostgreSQL connection string (`DATABASE_URL`) and JWT secrets.
   - You can also configure `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, and `REFRESH_TOKEN_SECRET` for more granular control over token lifetimes.

## Running the Server

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

## API Endpoints

### Public Routes

#### Register
- **POST** `/api/auth/register`
- Body: `{ "email": "user@example.com", "password": "password123" }`
- Response:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "token": "<access-token>",
      "accessToken": "<access-token>",
      "refreshToken": "<refresh-token>",
      "user": {
        "id": "...",
        "email": "user@example.com"
      }
    }
  }
  ```

#### Login
- **POST** `/api/auth/login`
- Body: `{ "email": "user@example.com", "password": "password123" }`
- Response:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "<access-token>",
      "accessToken": "<access-token>",
      "refreshToken": "<refresh-token>",
      "user": {
        "id": "...",
        "email": "user@example.com"
      }
    }
  }
  ```

#### Refresh tokens
- **POST** `/api/auth/refresh`
- Body: `{ "refreshToken": "<refresh-token>" }`
- Response:
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "token": "<new-access-token>",
      "accessToken": "<new-access-token>",
      "refreshToken": "<new-refresh-token>",
      "user": {
        "id": "...",
        "email": "user@example.com"
      }
    }
  }
  ```

### Protected Routes

#### Get Current User
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`
- Response: `{ "success": true, "user": { "id": "...", "email": "..." } }`

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure consistent commit messages. Commit messages are automatically validated using commitlint and husky.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, missing semi-colons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```bash
feat(auth): add password reset functionality
fix(validator): remove password min length from login schema
docs(readme): update API endpoint documentation
style(errorHandler): switch to single quotes
refactor(mapper): replace any types with proper TypeScript types
```

### Validation

Commit messages are automatically validated when you commit. If your commit message doesn't follow the conventional commit format, the commit will be rejected with an error message explaining what needs to be fixed.

## 📚 Technologies

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL + Sequelize** - Relational database + ORM
- **Zod** - Schema validation
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Pino** - Structured logging
- **Commitlint** - Commit message validation
- **Husky** - Git hooks

## 📝 Next Steps After Creating Your Repository

1. Update `package.json` with your project name and description
2. Configure your environment variables in `.env`
3. Customize the authentication logic if needed
4. Add your domain-specific models, services, and routes
5. Set up your CI/CD pipeline
6. Configure your production deployment

## 📖 Documentation

- See [TEMPLATE.md](./TEMPLATE.md) for detailed template information
- See [.github/ISSUE_TEMPLATE](./.github/ISSUE_TEMPLATE/) for issue templates
- See [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) for PR template

