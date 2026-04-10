# Math learning app — product specification (Level 1 track)

This document describes core behavior: how tasks are generated, how step-by-step solving is evaluated, and how the learner is moved between levels and theory. Aligned with “Level 1” content in the codebase.

## 1. What the app must do

The app is an interactive environment for learning math with progressive levels (from basic operations to first-degree linear equations). Main capabilities:

- **Task generation and validation:** Problems are generated with random integers under strict rules per level (no remainder in division, positive integer solutions where required, etc.).
- **Progress (streak):** Advancing depends on a required number of **consecutive correct** answers; per level this is 6 or 10, with balanced operation types as configured.
- **Step-by-step evaluation:** For equations, the learner enters intermediate steps (moving terms, inverse operations) and the final answer.
- **Theory and guidance:** Theory screens can appear before a new level and when the learner repeatedly applies rules incorrectly.
- **Error handling and fallback:** After enough consecutive mistakes, theory is shown; after enough total mistakes on a level, the learner may be moved to a lower prerequisite level (see `AppConfig` and `LevelManager`).

## 2. Global conventions (Level 1)

- Parameters \(a\), \(b\), \(c\) are **integers**.
- Solutions \(x\) are **positive integers** where the level requires it.
- Addition and subtraction stay in the intended integer range for that level.
- Division must have **no remainder** (exact division).

---

## 3. Level structure (summary)

The app evaluates **which step** failed. Correct streaks unlock the next level; errors trigger theory or fallback levels per `LevelManager` and `AppConfig`.

### Level 1.1: Addition and subtraction (whole numbers)

- **Pass requirement:** 10 correct in a row (e.g. 5 additions + 5 subtractions as configured).
- **Operands:** up to 100.
- **Forms:** \(a + b\), and \(b - a\) with \(b > a\) so results stay positive.

### Level 1.2: Multiplication and division (whole numbers)

- **Pass requirement:** 10 correct in a row (e.g. 5 × and 5 ÷).
- **Operands:** up to 200.
- **Forms:** \(a \cdot b\), and \(b \div a\) with exact division.

### Level 1.3: Simple equations with + and −

- **Theory** before practice when configured.
- **Pass requirement:** 6 correct in a row (balanced +/− types). Parameters up to 200.
- **Forms:** \(x + a = b\) (with \(b > a\) where needed), \(x - a = b\).
- **Typical steps:** isolate \(x\) with inverse operations, then compute.
- **Fallback ideas:** wrong “move term” step → theory; wrong arithmetic after correct setup → fallback to level 1.1 skills.

### Level 1.4: Simple equations with × and ÷

- Same pattern as 1.3 with multiplication/division equations; parameters up to 200.
- **Fallback ideas:** wrong inverse-operation step → theory; wrong basic ×/÷ → fallback to level 1.2.

### Level 1.5: Two-step equations \(ax \pm b = c\)

- **Pass requirement:** 6 correct streaks; parameters up to 200; divisibility constraints so intermediate values divide cleanly by \(a\).
- **Forms:** e.g. \(ax + b = c\), \(ax - b = c\) with steps: move constant, then divide by \(a\).

### Level 1.6: Two-step equations with \(x/a\)

- Similar pass count and constraints; forms like \(\frac{x}{a} + b = c\) and \(\frac{x}{a} - b = c\), isolating \(\frac{x}{a}\) then multiplying by \(a\).

---

## 4. Assessment and level pick (UX goals)

- At the start, the learner may **run an assessment** per domain or **pick a starting level** if they skip assessment.
- The app should report **which step was wrong** and show that step again with explanation.
- If **step 1** is wrong, return to step 1 with explanation; repeated failure patterns tie into theory and level fallback rules (see `ERRORS_BEFORE_FALLBACK`, `ERRORS_BEFORE_LEVEL_DROP` in `AppConfig`).

---

## 5. Implementation note

The live app implements generation, validation, and progression in `utils/ProblemGenerator.ts`, `utils/EquationStepValidator.ts`, and `utils/LevelManager.ts`. This document is the product-level mirror of those rules.
