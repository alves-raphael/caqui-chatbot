# apps/web

Vite + React + TypeScript (strict) + shadcn/ui. Global rules, commands and the environment runbook are in the root `CLAUDE.md`.

## API access

All requests go through `src/lib/api.ts` (typed fetch, `credentials: 'include'`, base URL from `VITE_API_URL`). The contract is `apps/api/openapi.json`. Do not hardcode URLs or shapes that the contract already defines. Schemas shared with the API come from `@caqui-chatbot/shared`.

## Conventions

- Components with shadcn/ui; add new ones through the shadcn CLI, not by copy-pasting.
- Every interactive element needs an accessible name/role (`jsx-a11y` is enforced). These are also the locators Playwright uses.
- Only `VITE_*` variables reach the browser.
- Hooks follow the rules of hooks (`react-hooks` lint is an error); keep effects minimal and with correct dependencies.

## Tests

- Component/unit: Vitest + Testing Library next to the component.
- **Any change to a user flow must be validated with Playwright** (`apps/web/e2e`). Create or update the test and run `yarn e2e <file>` before finishing. Playwright runs against the already-running environment and fails with a clear message if it is down: run `yarn status`, then `yarn setup` if needed. It logs in once with the seed user (`storageState`).
- Use role/label locators; no `waitForTimeout`.

## Visual check

Functional tests pass even when the layout is broken, so after any UI change (new page, new component, CSS) run `yarn e2e layout`, then **open the screenshots** in `apps/web/screenshots/` (mobile and desktop, overwritten on each run) and look at them. Fix overlapping or clipped elements, blank areas, anything off-screen and unstyled-looking controls. The spec fails automatically only on horizontal overflow: a page that lost its CSS still passes, so the image is the real check. If the whole app fails to load, the symptom is a login timeout; read `docker compose logs web` for the Vite error. Add every new page to the `PAGES` list in `e2e/layout.spec.ts` (`auth: false` for public pages). The check is coarse: say in your report which images you inspected, and do not claim the layout is correct beyond what you saw.
