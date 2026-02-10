## React SDK Boundaries

### Stable Contracts (DO NOT CHANGE)

- Backend API endpoints and response formats
- Auth token structure and lifecycle
- Security policies (CORS, origin checks, CSRF)
- CLI/TUI behavior and flags

### Safe to Refactor

- React component structure
- File organization in the React SDK package
- How the legacy web UI is implemented
- Export structure and `package.json` for the React SDK

### Change with Caution

- Hook APIs (must maintain backward compatibility or be versioned)
- Core client interface (affects all consumers)

