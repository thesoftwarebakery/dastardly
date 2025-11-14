# Releasing

This project uses automated releases via [semantic-release](https://github.com/semantic-release/semantic-release) and [conventional commits](https://www.conventionalcommits.org/).

## How It Works

When you merge a PR to `main`, GitHub Actions automatically:

1. **Analyzes commits** since the last release
2. **Determines version bump** based on commit types
3. **Updates package versions** in all packages
4. **Builds and tests** all packages
5. **Publishes to npm** with provenance attestation
6. **Creates git tags** for the release
7. **Generates changelog** automatically
8. **Creates GitHub release** with notes

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature (triggers **minor** version bump)
- **fix**: Bug fix (triggers **patch** version bump)
- **docs**: Documentation changes (no version bump)
- **style**: Code style changes (no version bump)
- **refactor**: Code refactoring (no version bump)
- **perf**: Performance improvements (triggers **patch** bump)
- **test**: Test changes (no version bump)
- **chore**: Build/tooling changes (no version bump)
- **ci**: CI configuration changes (no version bump)

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or `!` after the type to trigger a **major** version bump:

```
feat!: redesign API

BREAKING CHANGE: The parse() function now returns a Promise
```

### Scopes

Use package names without the `@bakes/dastardly-` prefix:

- `core`
- `json`
- `yaml`
- `csv`
- `validation`
- `tree-sitter-runtime`
- `tree-sitter-csv`

### Examples

```
feat(json): add streaming parser support

Implements a new streamParse() function for handling large JSON files
without loading them entirely into memory.
```

```
fix(csv): handle empty fields correctly

Fixed parsing of CSV files with consecutive delimiters.

Closes #123
```

```
docs(readme): update installation instructions

Updated README with new @bakes scope.
```

## Manual Release (if needed)

If you need to manually trigger a release:

1. Ensure you have npm access to @bakes organization
2. Create an npm access token
3. Add `NPM_TOKEN` to GitHub repository secrets
4. Push/merge to `main` branch with proper commit messages

## Setup Requirements

### GitHub Repository Settings

The release workflow requires these secrets:
- `GITHUB_TOKEN` (automatically provided)
- `NPM_TOKEN` (npm access token with publish permissions)

To create an NPM token:
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type (or "Publish" for granular)
4. Copy the token
5. Add to GitHub: Settings → Secrets → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: (paste token)

### NPM Provenance

The publish workflow uses `--provenance` flag which adds:
- Cryptographic attestation linking packages to source code
- Transparency about package origins
- Enhanced security via OIDC authentication

No additional NPM configuration is required - provenance is automatically enabled.

## Version Bumping Rules

semantic-release determines the version bump based on commits since the last release:

| Commits Include | Version Bump | Example |
|----------------|--------------|---------|
| BREAKING CHANGE | Major (x.0.0) | 1.2.3 → 2.0.0 |
| `feat:` | Minor (0.x.0) | 1.2.3 → 1.3.0 |
| `fix:` or `perf:` | Patch (0.0.x) | 1.2.3 → 1.2.4 |
| `docs:`, `chore:`, etc. | No release | 1.2.3 (no change) |

## Workflow Files

- `.github/workflows/ci.yml` - Runs tests on all PRs and pushes
- `.github/workflows/release.yml` - Automated release on merge to main
- `.releaserc.json` - semantic-release configuration

## Troubleshooting

### Release didn't trigger

- Check that commits follow conventional commit format
- Verify commits include `feat:`, `fix:`, or `BREAKING CHANGE:`
- Check GitHub Actions logs for errors

### Publish failed

- Verify NPM_TOKEN is valid and has publish access to @bakes
- Check npm organization permissions
- Look for npm registry errors in Actions logs

### Wrong version bumped

- Review commit messages - they determine the version bump
- Remember: only `feat:` and `fix:` trigger releases
- Use `!` or `BREAKING CHANGE:` footer for major bumps

## Skip CI

To skip CI on a commit (not recommended for normal commits):

```
chore: update docs [skip ci]
```

This prevents both CI and release workflows from running.
