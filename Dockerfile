# Base stage - install dependencies
FROM node:22-slim AS base
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Build stage - compile TypeScript
FROM base AS build
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm prune --omit=dev

# Production stage - minimal image with only compiled code
FROM node:22-slim AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000 \
    CI=true \
    HUSKY=0

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled code from build stage
COPY --from=build /usr/src/app/dist ./dist

# Expose port
EXPOSE 3000

# Run production server
CMD ["npm", "run", "start"]
