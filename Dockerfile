# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Using your raajadrives subfolder
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
# This folder is created by 'output: standalone' in your config
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 3. FIXED CSS/JS MAPPING
# Instead of using 'cp' which failed, we use two explicit COPY commands
# to ensure styling is found regardless of how the server starts.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]