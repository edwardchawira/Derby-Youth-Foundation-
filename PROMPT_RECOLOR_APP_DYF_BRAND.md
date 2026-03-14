# Prompt: Recolor Entire Web App to Derby Youth Foundation Brand

Use this prompt to have an agent or developer change the whole web app to the Derby Youth Foundation brand colors (from the DYF logo screenshot), with no clashing and consistent application.

---

## Copy-paste prompt

**Objective:** Recolor the entire web app to match the Derby Youth Foundation brand colors from the provided logo/screenshot. Every screen, component, and UI element must use only the palette below. Ensure nothing clashes and the result feels cohesive.

**Brand palette (use only these):**

| Role        | Hex         | Use for |
|------------|-------------|---------|
| White      | `#FFFFFF`   | Main backgrounds, text on teal/dark surfaces, card surfaces. |
| Medium Teal| `#2BC2BC`   | Primary brand color: primary buttons, key links, main accent areas, logo-style emphasis. |
| Light Teal | `#3CE6E0`   | Secondary accent: hover states, highlights, subtle fills, optional secondary buttons. |
| Dark Teal  | `#1E6B68`   | Deeper accent: shadows, footer/darker bars, borders, hover on primary, secondary emphasis. |
| Slate      | `#4C6F87`   | Body text, headings, labels, neutral UI text, icons; can also be used for subtle borders. |

**HSL equivalents for Tailwind/CSS variables (format: H S% L%):**

- White: `0 0% 100%`
- Medium Teal: `177 70% 47%`
- Light Teal: `177 78% 56%`
- Dark Teal: `177 56% 27%`
- Slate: `207 28% 42%`

**Semantic mapping:**

- **Background (page/main):** White.
- **Foreground (body text, headings):** Slate.
- **Primary (buttons, main CTAs, primary links):** Medium Teal background, White text.
- **Primary foreground (text on primary):** White.
- **Secondary / muted (secondary buttons, subtle panels, disabled feel):** Light Teal or very light gray; text in Slate or Dark Teal.
- **Accent (links, hover, focus rings):** Medium Teal or Dark Teal; hover can shift to Light Teal.
- **Borders / input borders:** Slate at low opacity or Dark Teal at low opacity.
- **Cards / popovers:** White or near-white; text in Slate.
- **Destructive actions:** Keep a clear red but ensure it doesn’t clash (e.g. desaturated red); avoid introducing new colors outside the palette.

**Where to change:**

1. **`app/globals.css`**  
   Update `:root` so all theme variables use the HSL values above (e.g. `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`). Remove or replace legacy utilities (e.g. `.text-gold`, `.bg-gold`, `.text-coral`, `.bg-teal` etc.) with equivalents that use the DYF palette (e.g. primary = medium teal, accent = light/dark teal, text = slate).

2. **Components and pages**  
   Scan `app/`, `components/` (and anywhere else with UI) for:
   - Inline hex or `hsl()` that aren’t from the design system.
   - Classes or styles using old accent colors (gold, coral, sky, or generic “teal” that isn’t the DYF teal).
   Replace them with theme-based classes (e.g. `bg-primary`, `text-foreground`, `border-border`, `accent`) or with the new utility/color tokens that map to the five colors above.

3. **Tailwind**  
   If the app uses `tailwind.config.ts` and references CSS variables (e.g. `hsl(var(--primary))`), no config change is needed beyond what’s in `globals.css`. If any extra color tokens are added, map them to the five colors above.

**Rules to avoid clashing:**

1. **Contrast:** Use **White** text only on Medium Teal, Dark Teal, or dark slate backgrounds. Use **Slate** (or Dark Teal for emphasis) for text on White or Light Teal.
2. **Primary buttons:** Medium Teal background + White text only.
3. **Avoid:** Do not use Light Teal as a large background with Medium Teal text (low contrast). Do not use Dark Teal for long body copy on white; use Slate for body text.
4. **Adjacent use:** When Light Teal and Medium Teal appear together, use one as background and the other for small accents (e.g. border, icon) or hover, not both as large text and background.
5. **Charts/badges/toasts:** Use only White, Medium Teal, Light Teal, Dark Teal, and Slate. Ensure text on each background meets WCAG AA where possible.

**Scope:** Apply the palette to the entire app: global layout (body, nav, footer), all buttons, inputs, cards, modals, dropdowns, badges, toasts, typography (headings and body in slate, links in teal), borders, dividers, charts, and all hover/active/focus states. The final result should have no remaining gold, coral, or other non-DYF accent colors, and no clashing combinations.

---

*Generated using Sequential Thinking MCP to map brand colors, semantic roles, file scope, and anti-clash rules.*
