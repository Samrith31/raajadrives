# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Pull package files from the subfolder
COPY raajadrives/package.json raajadrives/package-lock.json ./
RUN npm ci

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy all project files from the raajadrives subfolder into the builder workdir
COPY raajadrives/ . 

# Set environment variables for build time (Required for Next.js build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# This generates the .next/standalone and .next/static folders
RUN npm run build

# Stage 3: Runner (The final slim production image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 1. Copy public assets (Logos, icons, images)
COPY --from=builder /app/public ./public

# 2. Copy the standalone server logic (Next.js server)
# The standalone folder contains the compiled code for your server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 3. CRITICAL: Copy static files (CSS, JS, Fonts)
# Standalone mode expects these to be in .next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

# Start the standalone server
CMD ["node", "server.js"]