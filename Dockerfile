# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY raajadrives/package.json raajadrives/package-lock.json ./
RUN npm ci

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY raajadrives/ . 

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 1. Copy Public assets
COPY --from=builder /app/public ./public

# 2. Copy the standalone server logic
# IMPORTANT: This copies into the root /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 3. THE CSS FIX FOR SUBFOLDERS
# Next.js standalone expects static files to be at ./static 
# AND sometimes inside ./.next/static depending on the server.js start point.
# We map them to both to ensure 100% styling coverage.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./static

USER nextjs
EXPOSE 3000
ENV PORT 3000

# Start the standalone server
CMD ["node", "server.js"]