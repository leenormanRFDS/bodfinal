# Skill: Premium Interaction

Use for:
- before/after sliders
- scrollytelling
- WebGL image transitions
- premium navigation transitions
- GLB storytelling
- non-standard UI

Lead:
DESIGN for component interaction.

Lead:
EXPERIENCE for narrative scrollytelling.

## Workflow

1. State the interaction's purpose.
2. Inspect existing implementation and preserve approved content.
3. Read:
   - `docs/COMPONENT_STANDARD.md`
   - `config/motion-tokens.json`
4. Define pointer, touch, keyboard and reduced-motion behaviour before implementation.
5. Keep narrative content semantic HTML.
6. Use WebGL/WebGPU only for perceptible narrative/material advantage.
7. Keep non-WebGL state complete.
8. Use progressive enhancement.
9. Test mobile scroll conflicts, focus, resize and asset loading.
10. Remove effects that communicate nothing.
11. Verify performance.
12. Stop at requested outcome.

Quality bar:

The visitor notices the comparison/story, not the library, shader or framework.
