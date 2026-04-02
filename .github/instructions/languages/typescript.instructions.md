---
description: 'Guidelines for writing high-quality, maintainable TypeScript code with best practices for logging, error handling, code organization, naming, formatting, and style.'
applyTo: '**/*.{ts,tsx}'
---

This file is mastered in https://github.com/NHSDigital/eps-copilot-instructions and is automatically synced to all EPS repositories. To suggest changes, please open an issue or pull request in the eps-copilot-instructions repository.

# TypeScript Development Guidelines

This document provides instructions for generating, reviewing, and maintaining TypeScript code. It is designed to guide Copilot and developers in producing domain-specific, robust, and maintainable code across a variety of TypeScript projects.

## General Instructions

- Use modern TypeScript features and syntax.
- Prefer explicit types and interfaces for clarity and safety.
- Organize code into logical modules and folders.
- Write code that is easy to read, test, and maintain.

## Best Practices

- Use `const` and `let` appropriately; avoid `var`.
- Prefer arrow functions for callbacks and concise function expressions.
- Use destructuring for objects and arrays to improve readability.
- Avoid magic numbers and hardcoded values; use named constants.
- Keep functions pure and side-effect free when possible.

## Code Standards

### Naming Conventions

- Use `camelCase` for variables, functions, and object properties.
- Use `PascalCase` for types, interfaces, classes, and enums.
- Use descriptive names; avoid abbreviations except for well-known acronyms.
- Prefix boolean variables with `is`, `has`, or `should` (e.g., `isActive`).

### File Organization

- Group related code in folders (e.g., `src/`, `tests/`, `lib/`).
- Place one class, interface, or component per file when possible.
- Name files using `kebab-case` (e.g., `user-service.ts`).
- Keep test files close to the code they test (e.g., `src/foo.ts` and `tests/foo.test.ts`).

### Formatting and Style

- Use 2 spaces for indentation.
- Limit lines to 120 characters.
- Use single quotes for strings.
- Never use semicolons for line termination.
- Avoid trailing commas in multiline objects and arrays.
- Avoid spaces at start and end of single line braces.
- Use ESLint and Prettier for consistent formatting.

## Architecture/Structure

- Separate business logic from API handlers and utility functions.
- Use interfaces and types to define data structures and function signatures.
- Organize code by feature or domain when scaling projects.
- Use dependency injection for testability and flexibility.

## Common Patterns

### Logging

- Use a centralized logging utility or library.
- Log errors, warnings, and important events with context.
- Avoid logging sensitive information.
- Example:

    ```typescript
    import {logger} from './utils/logger';

    logger.info('Fetching user data', {userId});
    logger.error('Failed to fetch user', {error});
    ```

### Error Handling

- Use `try/catch` for asynchronous code and error-prone operations.
- Throw custom error types for domain-specific errors.
- Always handle errors gracefully and provide meaningful messages.
- Example:

    ```typescript
    try {
      const result = await fetchData();
    } catch (error) {
      logger.error('Data fetch failed', {error});
      throw new DataFetchError('Unable to fetch data');
    }
    ```

### Type Safety

- Prefer interfaces and types. You MUST NOT use `any`.
- Use type guards and assertions when necessary.
- Example:

    ```typescript
    interface User {
      id: string;
      name: string;
    }

    function isUser(obj: object): obj is User {
      return typeof obj.id === 'string' && typeof obj.name === 'string';
    }
    ```

## Security

- Validate and sanitize all external input.
- Avoid exposing sensitive data in logs or error messages.
- Use environment variables for secrets and configuration.
- Keep dependencies up to date and audit regularly.

## Performance

- Minimize synchronous blocking operations.
- Use async/await for asynchronous code.
- Avoid unnecessary computations inside render or handler functions.

## Testing

- Write unit tests for all business logic.
- Use the existing framework for testing and vitest for new packages.
- Mock external dependencies in tests.
- Example test file structure:

    ```
    src/
      handler.ts
    tests/
      handler.test.ts
    ```

## JSDoc

- Write concise JSDoc for exported interfaces, types, functions, classes, and exported constants.
- Prefer short phrase-style summaries; avoid long narrative prose.
- Avoid stating information that is obvious from function signatures.
- Consider @param and @returns for every exported function, then include them only when they add meaning not obvious from the signature.
- Skip @param when it only repeats parameter name/type; keep it when documenting constraints, defaults, units, side effects, or domain context.
- It is acceptable to use only @returns in a JSDoc block when that tag carries all useful context.
- Omit a free-text summary line when it only restates the @returns content.
- Provide @example on constructors of exported types/classes and on non-trivial exported types.
- Use @default only when the property is optional in the type and is defaulted in implementation.
- Keep JSDoc defaults aligned with both type signatures and runtime behaviour.
- For construct props interfaces, include a top-level summary and property docs only when intent is non-obvious.

## Examples and Code Snippets

### Good Example

    ```typescript
    interface Prescription {
      id: string;
      medication: string;
      issuedDate: Date;
    }

    function getPrescription(id: string): Prescription | null {
      // Implementation
    }
    ```

### Bad Example

    ```typescript
    function getPrescription(id) {
      // No type safety, unclear return type
    }
    ```

## Validation and Verification

- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`

## Maintenance

- Review and update instructions as dependencies or frameworks change.
- Update examples to reflect current best practices.
- Remove deprecated patterns and add new ones as needed.
- Ensure glob patterns match the intended files.

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [ESLint TypeScript Plugin](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/docs/en/options.html)
