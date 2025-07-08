# Contributing to AHRQ Dashboard

## Project Conventions

### Dependencies & Import Management

#### Approved UI Libraries
- **Tailwind CSS** - Primary styling framework
- **Lucide React** - Icon library
- **Recharts** - Chart library
- **D3.js** - Advanced visualizations (network graphs, sankey diagrams)

#### Before Adding New Dependencies

1. **Check if functionality exists** in current dependencies
2. **Use built-in components** whenever possible
3. **Get team approval** before adding new packages

#### Import Validation

We have automated import checking to prevent build errors:

```bash
# Check all imports are valid
npm run check-imports

# This runs automatically before build
npm run build
```

### Adding Dependencies

1. **Research the package** - Check bundle size, maintenance status, and alternatives
2. **Test locally first** - Ensure it works with our current setup
3. **Update documentation** - Add the package to the approved list if it's for common use
4. **Run import check** - `npm run check-imports` after installation

### Common Patterns

#### Creating UI Components

Instead of external UI libraries, create custom components:

```tsx
// ❌ Don't do this
import { Tooltip } from '@mui/material';

// ✅ Do this
import { Tooltip } from '../components/ui/Tooltip';
```

#### File Organization

```
src/
  components/
    ui/          # Reusable UI components
    charts/      # Chart components
    views/       # Page-level components
  utils/         # Utility functions
  types/         # TypeScript types
  styles/        # Global styles and themes
```

### Development Workflow

1. **Before starting work**
   ```bash
   npm install
   npm run check-imports
   npm run typecheck
   ```

2. **During development**
   ```bash
   npm run dev
   ```

3. **Before committing**
   ```bash
   npm run check-imports
   npm run typecheck
   npm run lint
   npm run build
   ```

### Error Prevention

#### TypeScript Configuration
- Strict mode enabled
- No unused locals/parameters
- Import resolution configured

#### ESLint Rules
- Import order enforced
- Unresolved imports caught
- Duplicate imports prevented

#### Build-time Checks
- Import validation runs before build
- TypeScript checking enforced
- ESLint validation included

### Troubleshooting

#### "Failed to resolve import" Error
1. Check if the package is installed: `npm list <package-name>`
2. Run import validation: `npm run check-imports`
3. Install missing package: `npm install <package-name>`

#### ESLint Import Errors
1. Ensure file extensions are correct
2. Check import paths are relative or from node_modules
3. Verify TypeScript paths in tsconfig.json

### Code Style

- Use TypeScript for all new files
- Follow existing patterns in the codebase
- Keep components focused and reusable
- Document complex logic with comments

### Testing Changes

1. **Visual Testing** - Check all views render correctly
2. **Build Testing** - Ensure `npm run build` succeeds
3. **Import Testing** - Run `npm run check-imports`
4. **Type Testing** - Run `npm run typecheck`

### Pull Request Checklist

- [ ] All imports are valid (`npm run check-imports`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No new dependencies without discussion
- [ ] Documentation updated if needed