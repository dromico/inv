# Dependency Update Plan for Invoice Application

This document outlines a step-by-step plan to safely update deprecated dependencies without breaking the production application. The plan is organized into phases to minimize risk and ensure a smooth transition.

## Phase 1: Setup Safety Measures (Week 1)

1. **Create a Staging Environment**
   - Create a staging branch in your repository
   - Set up a separate Vercel deployment for this branch
   ```bash
   git checkout -b staging
   git push origin staging
   ```
   - Configure Vercel to automatically deploy from this branch to a staging URL

2. **Improve Testing Coverage**
   - Add end-to-end tests for critical flows:
     - Invoice PDF generation
     - Admin functions
     - Authentication flows
   - Create a GitHub Actions workflow to run tests on PRs:
   ```yml
   # Add this to .github/workflows/test.yml
   name: Run Tests
   on: [pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm ci
         - run: npm test
   ```

3. **Create Package Lock Backup**
   ```bash
   cp package-lock.json package-lock.backup.json
   ```

## Phase 2: Update Critical Dependencies (Week 2)

1. **Update Supabase Auth Helpers** (Highest Priority)
   ```bash
   git checkout -b update-supabase
   npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-shared
   npm install @supabase/ssr @supabase/supabase-js
   ```

   Update your auth code with this pattern:

   ```tsx
   // Before
   import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
   
   // After
   import { createClientComponentClient } from '@supabase/ssr'
   ```

   For server components, update:
   ```tsx
   // Before
   import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
   
   // After
   import { createServerClient } from '@supabase/ssr'
   ```

   For middleware:
   ```tsx
   // Before
   import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
   
   // After
   import { createServerClient } from '@supabase/ssr'
   ```

   Test thoroughly, then merge to staging:
   ```bash
   git commit -am "Update Supabase auth helpers to SSR package"
   git push origin update-supabase
   # Create PR from update-supabase to staging
   # After approving and testing on staging deployment
   git checkout staging
   git pull
   ```

2. **Update ESLint** (Medium Priority)
   ```bash
   git checkout -b update-eslint
   npm install eslint@latest @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest
   ```

   Update your ESLint config:
   ```bash
   npx eslint --init
   # Follow prompts to update your ESLint config
   ```

   Fix any new linting errors:
   ```bash
   npx eslint --fix .
   ```

   Test and merge as before.

## Phase 3: Update Build Dependencies (Week 3)

1. **Update rimraf and glob** (Low Priority)
   ```bash
   git checkout -b update-build-deps
   npm install rimraf@latest glob@latest
   ```

   Test your build process:
   ```bash
   npm run build
   ```

2. **Update humanwhocodes packages**
   ```bash
   git checkout -b update-eslint-deps
   npm install @eslint/object-schema @eslint/config-array
   ```

   Test and merge as before.

3. **Test PDF Generation Specifically**
   - Test downloading invoices from both admin and user perspectives
   - Verify that PDF content matches expectations
   - Check PDF rendering in different browsers

## Phase 4: Production Release (Week 4)

1. **Final Testing on Staging**
   - Do a complete run-through of all application features:
     - Invoice generation and download
     - Admin job management
     - Subcontractor functionalities
     - Settings and profile management
   - Check browser compatibility (Chrome, Firefox, Safari, Edge)
   - Verify mobile responsiveness on different device sizes

2. **Deploy to Production**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

3. **Monitor Production**
   - Watch error monitoring tools after deployment
   - Check application logs for any new errors
   - Test critical features immediately after deployment
   - Monitor user feedback and reports

## Rollback Plan

If issues arise during any phase:

1. **For Minor Issues**:
   - Create a fix PR against the current branch
   - Test and merge the fix

2. **For Major Issues**:
   - Revert the problematic dependency update:
     ```bash
     git revert <commit-hash-of-update>
     git push
     ```

3. **Worst Case Scenario**:
   - Roll back to the last known good deployment in Vercel dashboard
   - Restore the backup package-lock.json:
     ```bash
     cp package-lock.backup.json package-lock.json
     npm ci
     ```

## Long-Term Maintenance Strategy

1. **Automated Dependency Updates**
   - Set up Dependabot or Renovate for automated updates:
     - Add this configuration to `.github/dependabot.yml`:
     ```yml
     version: 2
     updates:
       - package-ecosystem: "npm"
         directory: "/"
         schedule:
           interval: "weekly"
         open-pull-requests-limit: 10
     ```

2. **Regular Update Schedule**
   - Schedule bi-weekly or monthly time for reviewing and merging dependency PRs
   - Focus on security updates first, feature updates second
   - Document changes in a changelog

3. **Update Next.js Config**
   Once you've fixed most type and lint errors, update your Next.js config:
   ```tsx
   const nextConfig = {
     // ...other config
     typescript: {
       ignoreBuildErrors: false, // Enable type checking
     },
     eslint: {
       ignoreDuringBuilds: false, // Enable linting
     },
     telemetry: { 
       anonymous: false // Opt out of telemetry if desired
     }
   }
   ```

4. **Documentation**
   - Maintain an updated list of dependencies and their versions
   - Document known issues and workarounds
   - Keep track of upcoming major updates for critical dependencies

## Current Deprecated Dependencies

| Package | Current Version | Recommended Version | Priority |
|---------|----------------|---------------------|----------|
| @supabase/auth-helpers-nextjs | 0.10.0 | @supabase/ssr (latest) | High |
| @supabase/auth-helpers-shared | 0.7.0 | @supabase/ssr (latest) | High |
| eslint | 8.57.1 | 9.x (latest) | Medium |
| rimraf | 3.0.2 | 5.x (latest) | Low |
| glob | 7.2.3 | 10.x (latest) | Low |
| @humanwhocodes/object-schema | 2.0.3 | @eslint/object-schema (latest) | Low |
| @humanwhocodes/config-array | 0.13.0 | @eslint/config-array (latest) | Low |
| inflight | 1.0.6 | Consider alternative packages | Low |

## Resources

- [Supabase Auth Migration Guide](https://supabase.com/docs/guides/auth/auth-helpers/migrating-to-ssr)
- [ESLint Upgrading Guide](https://eslint.org/docs/latest/use/migrating-to-9.0.0)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)