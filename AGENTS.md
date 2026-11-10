<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo. 

# Al-Manhal School Compass — Agent Engineering Rules

## 1. Tech Stack & Architecture
- **Framework**: TanStack Start (React 18 + TypeScript + Vite) + Capacitor (Android APK target).
- **Styling**: Tailwind CSS + shadcn/ui (Radix Primitives) + Lucide Icons.
- **Direction & Locale**: Strict Arabic RTL (`dir="rtl"`). Always use CSS Logical Properties (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`). Never use physical `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`.
- **Theme Tokens**: Use semantic HSL design tokens only (`primary`, `gold`, `navy`, `background`, `foreground`, `muted`, `destructive`). Never hardcode hex/RGB colors in components.
- **Modularity**: Any file exceeding 300 lines must be split into focused feature components under `src/features/<domain>/`.
- **Strict Typing**: Zero `any` usage. All domain contracts must live in `src/lib/school/types.ts`.

## 2. Domain & Data Layer Constraints
- **Active Roles**: Exactly 3 roles: `"student" | "teacher" | "admin"`. The `"parent"` role is permanently removed from auth, navigation, dashboards, and schema. Parent contact info (`parentName`, `parentPhone`) remains strictly as metadata fields on the `Student` entity.
- **Educational Stages**: Exactly 3 stages (`StageId`):
  1. `basic` -> `"مرحلة الأساس"` (replaces `"المرحلة الابتدائية"`)
  2. `middle` -> `"المرحلة المتوسطة"`
  3. `high` -> `"المرحلة الثانوية"`
- **Stage Scoping (`Session.stageId`)**: Login requires selecting a stage. Admin views, KPIs, directories, and filters are scoped to `session.stageId` (switchable in-app without logout). Students and teachers logging in must belong to the selected stage (`student.stageId === selectedStage` or `teacher.stageIds.includes(selectedStage)`), otherwise reject login with `"هذا الحساب لا يتبع المرحلة المختارة"`.
- **Data Access Abstraction**: UI components must NEVER read/write `localStorage` directly. All reads/mutations must go through `src/lib/school/store.ts` functions so the transition from `DATA_MODE: "local"` to Supabase/Postgres requires zero UI rewrites.
- **Schema Migration Guard**: Whenever `src/lib/school/types.ts` or `src/lib/school/seed.ts` changes structure, increment `SEED_VERSION` so stale local storage states auto-migrate cleanly.
- **Data Integrity & Validation**:
  - Never save silent fallback dummy values (no default phone `0912 000 000`, no default fee `850000`, no auto-assigned classes `c1a`/`c1b`). Reject incomplete required fields explicitly.
  - Enforce uniqueness on `student.academicNo` and `teacher.employeeId` across both manual forms and bulk imports.
  - Never hard-delete students or teachers; implement soft-archiving (`status: "active" | "archived"`) with confirmation dialogs.
- **Bankak Receipts Removed**: Remove all Bankak receipt upload UI, review queues, `Receipt` types, `submitReceipt`, `reviewReceipt`, and `updateReceiptAudit`. Keep manual admin fee recording (`recordPayment`) and bulk CSV/XLSX fee importing (`importFees`). Keep the top notification bell strictly for school announcements/notices.
- **Safe File Parsing**: Never install the vulnerable `xlsx` npm package. Use `papaparse` for CSV and `read-excel-file` for `.xlsx` files.
- **Four UI States**: Every data view must implement Ideal, Loading (Skeleton), Empty (with direct CTA buttons), and Error states.
- **Verification Gate**: Run `tsc --noEmit`, linter, and Vitest suites after every implementation phase and fix all errors before completion.

<!-- LOVABLE:END -->
