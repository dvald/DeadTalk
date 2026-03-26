# Agents.md - Repository Guide

Single source of truth for AI agents working on this repository.

## 1) Mission

Build and maintain high quality backend, frontend, and mobile features.

## 2) Repository map

```text
.
|- web-application/
|  |- backend/
|  `- frontend/
|- mobile-application/
`- deployment-scripts/
```

## 3) Core rules

- Keep changes small and focused.
- Do not edit generated files manually.
- Regenerate bindings when API docs change.
- Avoid hardcoded secrets and sensitive data.
- Add or update tests for behavior changes.

## 4) Common commands

### Backend

- `npm install`
- `npm run build`
- `npm run dev`
- `npm test`

### Frontend

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`

### Mobile

- `npm install`
- `npm run start`
- `npm test`

## 5) Change workflow

1. Read relevant docs and target files.
2. Implement the minimum required change.
3. Run format/lint/tests for touched modules.
4. Update docs when behavior or contracts change.
