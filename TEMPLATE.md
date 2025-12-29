# Backend Template

This is a GitHub template repository for creating production-ready Express.js backends with TypeScript and PostgreSQL (via Sequelize).

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

1. Click "Use this template" on GitHub to create a new repository
2. Clone your new repository
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure your environment variables
5. Start developing: `npm run dev`

## 📋 What's Included

### Core Features
- ✅ Express.js with TypeScript
- ✅ PostgreSQL database powered by Sequelize ORM
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Password hashing with bcryptjs
- ✅ Request validation with Zod
- ✅ Structured logging with Pino
- ✅ CORS configuration
- ✅ Error handling middleware
- ✅ Request logging middleware

### Project Structure
```
src/
├── config/          # Configuration management
├── constants/       # Application constants
├── controllers/     # Request handlers
├── db/             # Database connection (Sequelize)
├── errors/         # Custom error classes
├── helpers/        # Utility functions
├── middleware/     # Express middleware
├── models/         # Data models
├── repositories/   # Data access layer
├── routes/         # Route definitions
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utilities/      # Utility modules
└── validators/     # Request validators
```

### Development Tools
- Node.js 22.x (required)
- TypeScript for type safety
- ESLint + Prettier for code quality
- Husky for git hooks
- Commitlint for conventional commits
- tsx for fast TypeScript execution

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string (or set `POSTGRES_*` vars)
- `POSTGRES_SSL`: Enable SSL for PostgreSQL connections (`true`/`false`)
- `JWT_SECRET`: Secret key for JWT tokens
- `ACCESS_TOKEN_EXPIRES_IN`: Access token expiration (default: 1h)
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration (default: 7d)
- `REFRESH_TOKEN_SECRET`: Secret key for refresh tokens
- `LOG_LEVEL`: Logging level (default: debug in dev, info in prod)
- `FRONTEND_ORIGIN`: Allowed CORS origins (comma-separated)

## 📝 Commit Convention

This template uses [Conventional Commits](https://www.conventionalcommits.org/).

Format: `<type>(<scope>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `build`: Build system
- `ci`: CI configuration
- `chore`: Other changes

## 🛠️ Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint errors
- `npm run format`: Format code with Prettier
- `npm run format:check`: Check code formatting

## 📚 Next Steps

After creating your repository from this template:

1. Update `package.json` with your project name and description
2. Configure your environment variables in `.env`
3. Update the README.md with your project-specific information
4. Customize the authentication logic if needed
5. Add your domain-specific models, services, and routes
6. Set up your CI/CD pipeline
7. Configure your production deployment

## 🤝 Contributing

When using this template, you can:
- Customize the authentication flow
- Add new models and repositories
- Extend the middleware
- Add new API endpoints
- Integrate additional services

## 📄 License

This template is provided as-is. Update the license in `package.json` to match your project's license.

## 🙏 Acknowledgments

Built with:
- Express.js
- TypeScript
- PostgreSQL + Sequelize
- Zod
- JWT
- Pino
- And many other great open-source tools

