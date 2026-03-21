# Project Analysis and Development Guide

This document provides baseline guidance for contributors and AI assistants.

## General rules

- Keep code clean and consistent.
- Do not manually edit generated API bindings.
- Keep backend logging centralized (no ad-hoc `console.log` in server code).
- Use shared helpers for HTTP responses and error handling.
- Follow naming conventions and existing project patterns.

## Tech stack

- Frontend: Nuxt, Vue 3, TypeScript
- Backend: Express, TypeScript, tsbean-orm
- Mobile: React Native, Expo
- Infrastructure: Docker, CI/CD scripts

## Repository structure

- `web-application/backend`: API, business logic, models, tests
- `web-application/frontend`: web UI and client logic
- `mobile-application`: mobile app source
- `deployment-scripts`: deployment and operations scripts

## API and codegen

- API definitions are generated from backend JSDoc.
- After endpoint changes, run `npm run update-api-bindings`.
- Keep endpoint docs synchronized with runtime behavior.

## Testing

- Backend tests: Mocha + Chai
- Frontend tests: project test runner
- Keep tests deterministic and focused on behavior

## Quality checklist

- Lint and format pass
- Tests pass in touched modules
- Docs updated for contract or behavior changes
- No secrets committed
