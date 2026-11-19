# Sage Field landing site

- Public-facing pages use the **Garden design system**: read `.claude/skills/sagefield-garden/SKILL.md` (the `sagefield-garden` skill) before building or restyling one. The reusable kit is in `app/_garden/`, and the home page (`app/_home/`) is the reference build.
- Parent-facing screens in the Expo app (`apps/mobile`) use the **mobile Garden design system**: read `.claude/skills/sagefield-garden-mobile/SKILL.md` (the `sagefield-garden-mobile` skill) first. The kit is in `apps/mobile/src/components/garden/`, and the parent Home (`apps/mobile/src/app/(tabs)/home.tsx` + `apps/mobile/src/features/parent-home/garden/`) is the reference build.
- Staff and super-admin screens in the Expo app (`apps/mobile/src/app/(staff)`) use the same mobile Garden skill plus its staff companion `.claude/skills/sagefield-garden-mobile/staff.md`. The staff Home (`apps/mobile/src/app/(staff)/home.tsx` + `apps/mobile/src/features/staff-home/`) is the staff reference build.
