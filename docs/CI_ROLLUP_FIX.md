# CI Rollup Error Fix

## Problem

GitHub Actions CI was failing with:

```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

This error occurs because `npm ci` doesn't properly install Rollup's optional platform-specific dependencies on Linux runners.

## Root Cause

Rollup uses platform-specific native binaries as **optional dependencies**:

- `@rollup/rollup-linux-x64-gnu` (for Linux x64)
- `@rollup/rollup-darwin-x64` (for macOS Intel)
- `@rollup/rollup-darwin-arm64` (for macOS ARM)
- etc.

When `npm ci` runs, it sometimes skips optional dependencies due to a known npm bug ([npm/cli#4828](https://github.com/npm/cli/issues/4828)), causing Vitest (which uses Rollup) to fail.

## Solution

Add `--include=optional` flag to all `npm ci` commands in GitHub Actions workflows.

### Files Modified

**`.github/workflows/ci.yml`** (3 occurrences)

```yaml
- name: Install dependencies
  run: npm ci --include=optional # ← Added flag
```

**`.github/workflows/pr-checks.yml`** (1 occurrence)

```yaml
- name: Install dependencies
  run: npm ci --include=optional # ← Added flag
```

**`.github/workflows/security.yml`** (1 occurrence)

```yaml
- name: Install dependencies
  run: npm ci --include=optional # ← Added flag
```

## What This Does

The `--include=optional` flag ensures that npm installs optional dependencies even if they would normally be skipped, guaranteeing that the correct Rollup binary for the Linux runner is installed.

## Alternative Solutions (Not Used)

### 1. Use `npm install` instead of `npm ci`

```yaml
- name: Install dependencies
  run: npm install
```

❌ **Cons**: Slower, doesn't use lockfile strictly, less reproducible

### 2. Remove and reinstall dependencies

```yaml
- name: Install dependencies
  run: |
    rm -rf node_modules package-lock.json
    npm install
```

❌ **Cons**: Much slower, defeats purpose of npm cache

### 3. Manually install Rollup binary

```yaml
- name: Install Rollup binary
  run: npm install --no-save @rollup/rollup-linux-x64-gnu
```

❌ **Cons**: Brittle, doesn't scale to other optional deps

## Testing

After this fix, all CI jobs should pass:

- ✅ Code formatting check
- ✅ Lint code
- ✅ TypeScript type check
- ✅ Run unit tests
- ✅ Build application
- ✅ Test coverage report

## Verification

To verify locally (on Linux or in Docker):

```bash
# Simulate CI environment
rm -rf node_modules
npm ci --include=optional

# Run tests
npm run test:run
npm run test:coverage
```

## Related Issues

- [npm/cli#4828](https://github.com/npm/cli/issues/4828) - npm bug with optional dependencies
- [Rollup Issue](https://github.com/rollup/rollup/issues/4699) - Discussion about optional deps
- [Vitest uses Rollup](https://vitest.dev/) - Vitest depends on Rollup

## Commit

```
fix: add --include=optional flag to npm ci for Rollup dependencies in CI

- Updates all GitHub Actions workflows to use npm ci --include=optional
- Fixes Error: Cannot find module @rollup/rollup-linux-x64-gnu
- Ensures Rollup platform-specific binaries are installed in CI

Fixes the npm optional dependencies bug that causes CI failures
when running Vitest tests.
```
