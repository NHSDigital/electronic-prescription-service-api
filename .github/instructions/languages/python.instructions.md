---
description: 'Guidelines for writing high-quality, maintainable python code with best practices for logging, error handling, code organization, naming, formatting, and style.'
applyTo: '**/*.py'
---

This file is mastered in https://github.com/NHSDigital/eps-copilot-instructions and is automatically synced to all EPS repositories. To suggest changes, please open an issue or pull request in the eps-copilot-instructions repository.

# Python Copilot Instructions

These instructions are designed to guide GitHub Copilot in generating effective, maintainable, and domain-appropriate Python code. They are intended to be generic and applicable to a wide range of Python projects.

## 1. Code Organization & Structure
- Organize code into logical modules and packages. Use directories such as `core/`, `services/`, `utils/` for separation of concerns.
- Place entry points (e.g., `handler.py`) at the top level of the main package.
- Use `__init__.py` files to define package boundaries and expose public APIs.
- Group related functions and classes together. Avoid large monolithic files.
- Store tests in a dedicated `tests/` directory, mirroring the structure of the main codebase.

## 2. Naming Conventions
- Use `snake_case` for function and variable names.
- Use `PascalCase` for class names.
- Prefix private functions and variables with a single underscore (`_`).
- Name modules and packages using short, descriptive, lowercase names.
- Use clear, descriptive names for all symbols. Avoid abbreviations unless they are widely understood.

## 3. Formatting & Style
- Follow [PEP 8](https://peps.python.org/pep-0008/) for code style and formatting.
- Use 4 spaces per indentation level. Do not use tabs.
- Limit lines to 120 characters.
- Use blank lines to separate functions, classes, and logical sections.
- Place imports at the top of each file, grouped by standard library, third-party, and local imports.
- Use single quotes for strings unless double quotes are required.
- Add docstrings to all public modules, classes, and functions. Use triple double quotes for docstrings.

## 4. Logging Best Practices
- Use the standard `logging` library for all logging.
- Configure logging in the main entry point or via a dedicated utility module.
- Use appropriate log levels: `debug`, `info`, `warning`, `error`, `critical`.
- Avoid logging sensitive information.
- Include contextual information in log messages (e.g., function names, parameters, error details).
- Example:
  ```python
  import logging
  logger = logging.getLogger(__name__)
  logger.info('Processing event: %s', event)
  ```

## 5. Error Handling Best Practices
- Use `try`/`except` blocks to handle exceptions gracefully.
- Catch specific exceptions rather than using bare `except`.
- Log exceptions with stack traces using `logger.exception()`.
- Raise custom exceptions for domain-specific errors.
- Validate inputs and fail fast with clear error messages.
- Example:
  ```python
  try:
      result = process_event(event)
  except ValueError as e:
      logger.error('Invalid event: %s', e)
      raise
  ```

## 6. Testing Guidelines
- Write unit tests for all public functions and classes.
- Use `pytest` as the preferred testing framework.
- Name test files and functions using `test_` prefix.
- Use fixtures for setup and teardown.
- Mock external dependencies in tests.
- Ensure tests are isolated and repeatable.

## 7. Dependency Management
- Use `pyproject.toml` to specify dependencies.
- Never use `requirements.txt` to specify dependencies.
- Pin versions for critical dependencies.
- Avoid unnecessary dependencies.

## 8. Documentation
- Document all public APIs with clear docstrings.
- Use [Google](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings) or [NumPy](https://numpydoc.readthedocs.io/en/latest/format.html) style for docstrings.
- Provide usage examples in README files.

## 9. Security & Privacy
- Do not log or expose secrets, credentials, or sensitive data.
- Validate and sanitize all external inputs.
- Use environment variables for configuration secrets.

## 10. General Guidelines
- Prefer readability and simplicity over cleverness.
- Refactor duplicated code into reusable functions or classes.
- Use type hints for function signatures and variables where appropriate.
- Avoid global variables; use function arguments or class attributes.

---
