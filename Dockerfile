# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Pointing to your subfolder specifically
COPY raajadrives/package.json raajadrives/package-lock.json ./
RUN npm ci

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy everything from your project subfolder into the builder
COPY raajadrives/ . 

# Environment Variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the project
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# --- CRITICAL PATH ADJUSTMENTS FOR YOUR STRUCTURE ---
# Next.js standalone mode with subfolders creates a specific nested path
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# This is often needed if styling is still missing:
# It ensures the CSS is available at the root level the server expects
RUN mkdir -p .next && cp -r static .next/

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]