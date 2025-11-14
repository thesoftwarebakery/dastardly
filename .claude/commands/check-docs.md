---
description: Check if documentation is consistent with code
---

Verify that documentation is up-to-date and consistent with the current codebase:

1. **Check package structure**:
   - List all packages in `packages/`
   - Verify they're documented in CLAUDE.md, ARCHITECTURE.md

2. **Check version consistency**:
   - Verify all package.json files have consistent dependencies
   - Check that @bakes/dastardly-* dependencies use `workspace:*`

3. **Check for outdated information**:
   - Compare AST node types in code vs ARCHITECTURE.md
   - Verify implementation phases in CLAUDE.md match reality
   - Check if any TODOs in code should be in documentation

4. **Check cross-references**:
   - Verify all mentioned files exist
   - Check that commands referenced in docs exist

5. **Report findings**:
   - List any inconsistencies found
   - Suggest specific updates needed
   - Highlight critical vs minor issues
