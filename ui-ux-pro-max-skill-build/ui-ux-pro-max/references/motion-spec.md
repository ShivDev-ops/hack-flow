# Motion Specification

## Easing Curves
- **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)` - Used for elements that remain within the screen.
- **Decelerate**: `cubic-bezier(0.0, 0, 0.2, 1)` - Used for elements entering the screen.
- **Accelerate**: `cubic-bezier(0.4, 0, 1, 1)` - Used for elements exiting the screen.

## Durations
- **Small (e.g., hover)**: 100ms–150ms
- **Medium (e.g., transitions)**: 200ms–300ms
- **Large (e.g., page entry)**: 300ms–500ms
