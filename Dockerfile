##
# Railway backend (API-only) Dockerfile
#
# - Builds only the backend bundle (`npm run build:backend`)
# - Runs `npm start` (which executes `node dist/index.cjs`)
#
# Note: Frontend is deployed separately to Vercel.
##

FROM node:20-bookworm AS build

WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build backend
COPY . .
RUN npm run build:backend

# Production image
FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install only production deps (bcrypt needs runtime libs; bookworm-slim is fine)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy built server bundle
COPY --from=build /app/dist /app/dist

EXPOSE 5000
CMD ["npm", "start"]


