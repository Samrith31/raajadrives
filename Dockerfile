# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files from the subfolder
COPY raajadrives/package.json raajadrives/package-lock.json* ./
RUN npm ci

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Build Arguments for Supabase (Must be present for build to succeed)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# 3. Copy the subfolder contents into /app
COPY raajadrives/ .

# 4. Copy the PostCSS config from the PARENT folder (Root)
# Even without Tailwind, Next.js often needs this for standard CSS
COPY postcss.config.js ./

# Run the build
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Standalone output requires these exact paths to serve CSS
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]