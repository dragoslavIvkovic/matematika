/**
 * TheoryContent — Theory explanations for levels 1.3–1.6.
 *
 * Shown:
 * 1. Before first attempt at a new equation level
 * 2. After Step 1 errors (conceptual misunderstanding)
 */

export interface TheorySection {
  title: string;
  subtitle: string;
  concept: string;
  rules: TheoryRule[];
  examples: TheoryExample[];
  tip: string;
}

export interface TheoryRule {
  icon: string; // Ionicons name
  text: string;
  highlight?: boolean;
}

export interface TheoryExample {
  equation: string;
  steps: string[];
  explanation: string;
}

const THEORY: Record<string, TheorySection> = {
  "1.3": {
    title: "Solving Simple Equations",
    subtitle: "Addition & Subtraction",
    concept:
      "When you move a number to the other side of the = sign, its operation flips! Addition becomes subtraction, and subtraction becomes addition.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "When a number crosses the = sign, its sign flips",
        highlight: true,
      },
      {
        icon: "add-circle",
        text: "+ becomes − when moved to the other side",
      },
      {
        icon: "remove-circle",
        text: "− becomes + when moved to the other side",
      },
      {
        icon: "checkmark-circle",
        text: "Always check: plug your answer back in!",
      },
    ],
    examples: [
      {
        equation: "x + 3 = 10",
        steps: ["x = 10 - 3", "x = 7"],
        explanation: "The +3 moves to the other side and becomes -3. So x = 10 - 3 = 7.",
      },
      {
        equation: "x - 5 = 8",
        steps: ["x = 8 + 5", "x = 13"],
        explanation: "The -5 moves to the other side and becomes +5. So x = 8 + 5 = 13.",
      },
    ],
    tip: "Think of the = sign as a mirror. When numbers cross it, they become their opposite!",
  },

  "1.4": {
    title: "Solving Simple Equations",
    subtitle: "Multiplication & Division",
    concept:
      "When you move a multiplication to the other side, it becomes division. When you move division, it becomes multiplication.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "Multiplication and division are inverses of each other",
        highlight: true,
      },
      {
        icon: "close-circle",
        text: "× becomes ÷ when moved to the other side",
      },
      {
        icon: "ellipse",
        text: "÷ becomes × when moved to the other side",
      },
      {
        icon: "checkmark-circle",
        text: "The answer should always divide evenly — no decimals!",
      },
    ],
    examples: [
      {
        equation: "4 · x = 20",
        steps: ["x = 20 ÷ 4", "x = 5"],
        explanation: "4 multiplies x, so divide both sides by 4. x = 20 ÷ 4 = 5.",
      },
      {
        equation: "x ÷ 3 = 6",
        steps: ["x = 6 × 3", "x = 18"],
        explanation: "x is divided by 3, so multiply both sides by 3. x = 6 × 3 = 18.",
      },
    ],
    tip: "If something multiplies x, divide to undo it. If something divides x, multiply to undo it!",
  },

  "1.5": {
    title: "Two-Step Equations",
    subtitle: "With Multiplication",
    concept:
      "These equations have TWO operations. First, move the addition/subtraction. Then, handle the multiplication. Work from outside in!",
    rules: [
      {
        icon: "layers",
        text: "Step 1: Move the constant (+ or -) to the other side",
        highlight: true,
      },
      {
        icon: "calculator",
        text: "Step 2: Calculate the result of the right side",
      },
      {
        icon: "git-branch",
        text: "Step 3: Divide both sides by the coefficient of x",
        highlight: true,
      },
      {
        icon: "checkmark-done",
        text: "Step 4: Calculate the final answer",
      },
    ],
    examples: [
      {
        equation: "3x + 5 = 20",
        steps: ["3x = 20 - 5", "3x = 15", "x = 15 ÷ 3", "x = 5"],
        explanation: "First, move +5 → becomes -5. Then 20-5=15. Then divide 15 by 3. x = 5!",
      },
      {
        equation: "2x - 4 = 10",
        steps: ["2x = 10 + 4", "2x = 14", "x = 14 ÷ 2", "x = 7"],
        explanation: "First, move -4 → becomes +4. Then 10+4=14. Then divide 14 by 2. x = 7!",
      },
    ],
    tip: "Always handle + and - BEFORE × and ÷. Think: undo the last operation first!",
  },

  "1.6": {
    title: "Two-Step Equations",
    subtitle: "With Division",
    concept:
      "Like Level 1.5, but now x is divided by a number. First move the constant, then multiply to undo the division.",
    rules: [
      {
        icon: "layers",
        text: "Step 1: Move the constant (+ or -) to the other side",
        highlight: true,
      },
      {
        icon: "calculator",
        text: "Step 2: Calculate the result of the right side",
      },
      {
        icon: "git-branch",
        text: "Step 3: Multiply both sides by the divisor",
        highlight: true,
      },
      {
        icon: "checkmark-done",
        text: "Step 4: Calculate the final answer",
      },
    ],
    examples: [
      {
        equation: "x ÷ 4 + 3 = 8",
        steps: ["x ÷ 4 = 8 - 3", "x ÷ 4 = 5", "x = 5 × 4", "x = 20"],
        explanation: "First, move +3 → becomes -3. Then 8-3=5. Then multiply 5 by 4. x = 20!",
      },
      {
        equation: "x ÷ 2 - 6 = 3",
        steps: ["x ÷ 2 = 3 + 6", "x ÷ 2 = 9", "x = 9 × 2", "x = 18"],
        explanation: "First, move -6 → becomes +6. Then 3+6=9. Then multiply 9 by 2. x = 18!",
      },
    ],
    tip: "Division is the opposite of multiplication. If x is divided, multiply to set it free!",
  },
};

export function getTheoryContent(levelId: string): TheorySection | null {
  return THEORY[levelId] || null;
}

export function hasTheory(levelId: string): boolean {
  return levelId in THEORY;
}
