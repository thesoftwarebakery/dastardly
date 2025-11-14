---
description: Create a new package in the monorepo
---

Create a new package in the dastardly monorepo. Ask the user for:
1. Package name (e.g., "json", "yaml")
2. Package description

Then:
1. Create the package structure in `packages/<name>/`
2. Set up package.json with correct naming (@bakes/dastardly-<name>)
3. Create src/ directory with index.ts
4. Create tsconfig.json extending the root config
5. Add appropriate dependencies (tree-sitter, @bakes/dastardly-core)
