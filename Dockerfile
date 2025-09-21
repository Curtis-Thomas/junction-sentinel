# Stage 1: Builder
# Use a Debian-based image for compatibility with sharp
FROM node:18 AS builder

WORKDIR /app

# Install dependencies, including optional ones like sharp
COPY package.json package-lock.json ./
RUN npm install --include=optional

# Copy the rest of your application files
COPY . .

# Run the build command
RUN npm run build

# Stage 2: Runner
# Use a slimmed-down Debian-based image for the final container
FROM node:18-slim AS runner

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set environment variables for Next.js to run in a container
ENV HOST 0.0.0.0
ENV PORT 3000

# Next.js telemetry is annoying in a Docker build environment
ENV NEXT_TELEMETRY_DISABLED 1

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]