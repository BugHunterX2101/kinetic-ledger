# Design System Specification: The Kinetic Ledger

## 1. Overview & Creative North Star
**Creative North Star: The Quantum Observer**
This design system is built for the high-stakes environment of financial data processing and security backends. It rejects the static, flat nature of traditional enterprise software in favor of a "living" digital environment. The interface does not sit on a screen; it floats in a void. 

By leveraging intentional asymmetry, high-contrast typography, and a "glass-first" layering philosophy, we create an experience that feels like a high-end command center. Every element is designed to feel like a holographic projection—precise, ethereal, yet authoritative. We break the "template" look by using exaggerated vertical rhythm and overlapping surfaces that suggest a multi-dimensional data space.

---

## 2. Colors & Tonal Architecture
The palette is rooted in the "Obsidian" range, providing a deep, low-energy background that allows the vibrant "Electric" accents to pop with functional intent.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for structural sectioning. Boundaries must be defined through **Background Contrast Shifts** or **Tonal Transitions**. To separate a sidebar from a main feed, transition from `surface` (#131314) to `surface-container-low` (#1C1B1C). 

### Surface Hierarchy & Nesting
Depth is built through a "Nesting" logic rather than lines:
- **Level 0 (The Void):** `background` (#131314) – Use for the base canvas.
- **Level 1 (Sub-surface):** `surface-container-low` (#1C1B1C) – Use for large structural blocks.
- **Level 2 (Active Layer):** `surface-container-high` (#2A2A2B) – Use for interactive cards.
- **Level 3 (Focus Layer):** `surface-bright` (#3A393A) – Use for modals or popped-out elements.

### The "Glass & Gradient" Rule
To achieve the "Holographic" feel, any floating element (Modals, Tooltips, Flyouts) must utilize Glassmorphism:
- **Background:** `surface-variant` (#353436) at 60% opacity.
- **Backdrop Blur:** 12px to 20px.
- **Signature Texture:** Primary CTAs should utilize a linear gradient from `primary` (#DBFCFF) to `primary-container` (#00F0FF) at a 135-degree angle to create a sense of internal illumination.

---

## 3. Typography
We utilize a dual-font strategy to balance editorial elegance with engineering precision.

- **The Voice (Space Grotesk):** Used for `display`, `headline`, and `label` roles. Its geometric quirks provide a futuristic, bespoke character.
- **The Engine (Inter):** Used for `body` and `title` roles. It provides maximum legibility for complex financial figures.
- **The Signature (Monospaced Accents):** All financial data, hashes, and timestamps must be rendered in a monospaced variant (e.g., Space Mono or JetBrains Mono) to emphasize the backend engineering context.

**Hierarchy Goal:** Use `display-lg` (3.5rem) paired with `label-sm` (0.6875rem) in all-caps to create high-contrast, editorial layouts that feel like a financial dossier rather than a spreadsheet.

---

## 4. Elevation & Depth
In this system, light is the architect. We do not use "shadows" in the traditional sense; we use **Ambient Glows** and **Tonal Stacking**.

### The Layering Principle
Stacking follows a logical progression of luminance. A card (`surface-container-highest`) placed on a section (`surface-container-low`) creates a natural, soft lift.

### Ambient Shadows
For floating elements, shadows must be tinted:
- **Shadow Color:** `surface-tint` (#00DBE9) at 8% opacity.
- **Blur:** 40px - 60px.
- **Spread:** -5px.
- This creates a "glow" effect rather than a "drop shadow," simulating light emanating from the data itself.

### The "Ghost Border"
When accessibility requires a container edge, use a **Ghost Border**:
- **Stroke:** 1px.
- **Color:** `outline-variant` (#3B494B) at 20% opacity.
- **Treatment:** Use a gradient stroke that fades out in the corners to prevent a "boxed-in" feeling.

---

## 5. Components

### High-Contrast Buttons
- **Primary:** `primary` background with `on-primary` text. On hover, apply an outer glow using `surface-tint` at 40% opacity.
- **Secondary:** Transparent background with a `primary` Ghost Border.
- **Tertiary (Neon):** For critical security alerts, use `secondary_container` (#FE00FE) with `on_secondary` text.

### Glass Cards
Cards must never have solid backgrounds. Use `surface-container-low` at 70% opacity with a 12px backdrop blur. 
- **Constraint:** Forbid the use of divider lines within cards. Use **Vertical Spacing Scale 8** (1.75rem) to separate header from content.

### Holographic Data Viz
Charts should avoid solid fills. Use "wireframe" aesthetics:
- **Lines:** `primary` (#DBFCFF) at 2px thickness.
- **Area Fills:** Linear gradients from `primary` (20% opacity) to `transparent`.
- **Points:** Use `secondary` (#FFABF3) for data nodes to create a "Neon Pulse" against the cyan lines.

### Inputs & Terminals
Text fields should mimic terminal prompts.
- **State:** Active fields gain a `primary` bottom-border glow.
- **Font:** Use `body-sm` (Inter) for labels but `label-md` (Monospace) for the actual user input.

---

## 6. Do's and Don'ts

### Do
- **Do** use intentional asymmetry. Align a large `display-lg` header to the left and a tiny `label-sm` metadata point to the extreme right.
- **Do** use `secondary` (#FFABF3) sparingly as a "Security Breach" or "High Priority" accent.
- **Do** allow elements to overlap. A glass card should slightly obscure a background data visualization to prove its transparency.

### Don'ts
- **Don't** use pure white (#FFFFFF). Always use `tertiary` (#F5F5F5) or `primary` (#DBFCFF) to maintain the dark-mode atmosphere.
- **Don't** use rounded corners larger than `xl` (0.75rem) for functional containers. High-tech feels precise; too much "roundness" feels consumer-grade and soft.
- **Don't** use 100% opaque borders. They kill the "floating in space" illusion.