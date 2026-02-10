# Security Verification Checklist (React SDK Core)

Run this checklist after any changes to the core client, auth flow, or request logic.

## Before Running Tests

- [ ] Backend server is running locally
- [ ] Test user exists in the database
- [ ] CORS is configured for the origin you are testing from

## CORS & Origin

- [ ] OPTIONS preflight request succeeds (where applicable)
- [ ] `Origin` header is preserved by the client
- [ ] CORS headers are present on responses from the API
- [ ] Credentials (cookies) are sent only when intended by the backend

## Authentication

- [ ] Login returns a valid token (if using bearer tokens)
- [ ] Token is stored only via the configured storage callbacks
- [ ] Token is sent in subsequent requests (e.g. `Authorization: Bearer <token>`)
- [ ] Protected endpoints reject requests without a valid token
- [ ] Logout invalidates the session/token on the server

## CSRF Protection (if applicable)

- [ ] CSRF token is obtained as required (cookie, header, or endpoint)
- [ ] CSRF token is sent in headers/body as configured by the backend
- [ ] Requests fail without a valid CSRF token when protection is enabled

## Error Handling

- [ ] 401 responses propagate as `AgentChatError` with code `UNAUTHORIZED`
- [ ] 403 responses propagate as `AgentChatError` with code `FORBIDDEN`
- [ ] 404 responses propagate as `AgentChatError` with code `NOT_FOUND`
- [ ] 5xx responses propagate as `AgentChatError` with code `SERVER_ERROR`
- [ ] Network/timeout failures propagate as `AgentChatError` with code `NETWORK_ERROR`
- [ ] Error messages and `details` do not leak sensitive information

## Comparison with curl

- [ ] Node.js client makes equivalent requests to a known-working `curl` command
- [ ] Browser client (via the React SDK) makes equivalent requests to curl
- [ ] Headers match expectations (apart from browser-managed headers)
- [ ] Responses match status codes and payloads observed via curl

## Recent Security Fixes Preserved

Document recent security-related changes here and verify they still behave as intended:

- [ ] Origin validation still enforced
- [ ] Rate limiting still works
- [ ] Permission checks are still applied at the API layer

