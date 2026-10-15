# =========================================
# 1) Dependencies image
# =========================================
FROM node:20-alpine AS deps

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# =========================================
# 2) Build image
# =========================================
FROM node:20-alpine AS builder

# Accept build arguments for NEXT_PUBLIC_* variables
# These are safe to include in build args because they're public anyway
# (they end up in the client-side JavaScript bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set as environment variables for the build
ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# "build": "next build --turbopack"
RUN npm run build

# =========================================
# 3) Runtime image
# =========================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=deps    /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
