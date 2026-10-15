# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.4 application built with React 19, TypeScript, and Tailwind CSS 4. The project uses the App Router architecture with Turbopack for fast development and builds.

## Development Commands

- **Start development server**: `npm run dev` (uses Turbopack)
  - Opens at http://localhost:3000
  - Hot reload enabled - changes appear instantly
- **Build for production**: `npm run build` (uses Turbopack)
- **Start production server**: `npm start`
- **Lint code**: `npm run lint` (ESLint with Next.js config)

## Architecture

### App Router Structure
- Uses Next.js App Router (app directory)
- Root layout at `app/layout.tsx` with Geist font configuration
- Main page at `app/page.tsx`
- Path aliases configured: `@/*` maps to project root

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- JSX: preserve (handled by Next.js)

### Styling
- Tailwind CSS 4 with PostCSS
- Global styles in `app/globals.css`
- Geist Sans and Geist Mono fonts from next/font/google

### ESLint
- Extends `next/core-web-vitals` and `next/typescript`
- Ignores: node_modules, .next, out, build, next-env.d.ts
