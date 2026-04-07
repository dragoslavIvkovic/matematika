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
    title: "Solving Equations x ± a = b",
    subtitle: "Moving terms and changing operations",
    concept:
      "When solving equations of the form x ± a = b, we can move terms from one side of the equation to the other side.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "When a term moves to the opposite side, we change the operation.",
        highlight: true,
      },
      {
        icon: "add-circle",
        text: "Addition (+) becomes subtraction (-)",
      },
      {
        icon: "remove-circle",
        text: "Subtraction (-) becomes addition (+)",
      },
    ],
    examples: [
      {
        equation: "x + 7 = 19",
        steps: ["x = 19 - 7", "x = 12"],
        explanation:
          "Move 7 to the right side. It was addition, so we change it to subtraction: x = 19 - 7 = 12.",
      },
      {
        equation: "x - 5 = 23",
        steps: ["x = 23 + 5", "x = 28"],
        explanation:
          "Move 5 to the right side. It was subtraction, so we change it to addition: x = 23 + 5 = 28.",
      },
    ],
    tip: "Think of the = sign as a gate. When numbers pass through it, their operation flips to its opposite!",
  },

  "1.4": {
    title: "Solving Equations ax = b and x ÷ a = b",
    subtitle: "Moving multiplication and division",
    concept:
      "When solving equations of the form ax = b and x ÷ a = b, we can move terms from one side of the equation to the other side.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "When a term moves to the opposite side, we use the opposite operation.",
        highlight: true,
      },
      {
        icon: "close-circle",
        text: "Multiplication (·) becomes division (÷)",
      },
      {
        icon: "ellipse",
        text: "Division (÷) becomes multiplication (·)",
      },
    ],
    examples: [
      {
        equation: "3x = 18",
        steps: ["x = 18 ÷ 3", "x = 6"],
        explanation:
          "Move 3 (multiplication) to the right side. It was multiplication, so we change it to division: x = 18 ÷ 3 = 6.",
      },
      {
        equation: "x ÷ 4 = 7",
        steps: ["x = 7 · 4", "x = 28"],
        explanation:
          "Move 4 (division) to the right side. It was division, so we change it to multiplication: x = 7 · 4 = 28.",
      },
    ],
    tip: "If something multiplies x, divide to undo it. If something divides x, multiply to undo it!",
  },

  "1.5": {
    title: "Two-Step Equations ax ± b = c",
    subtitle: "Move constant first, then coefficient",
    concept:
      "When solving equations of the form ax ± b = c, we first move the constant term b, then the coefficient a, using the opposite operations.",
    rules: [
      {
        icon: "layers",
        text: "Step 1: Move the constant b to the opposite side using the opposite operation.",
        highlight: true,
      },
      {
        icon: "git-branch",
        text: "Step 2: Move the coefficient a to the opposite side (multiplication becomes division).",
        highlight: true,
      },
    ],
    examples: [
      {
        equation: "3x + 5 = 17",
        steps: ["3x = 17 - 5", "3x = 12", "x = 12 ÷ 3", "x = 4"],
        explanation:
          "First, move 5 to the right side (+5 becomes -5). Then move 3 (multiplies x) to the right side (becomes division). x = 12 ÷ 3 = 4.",
      },
      {
        equation: "4x - 6 = 14",
        steps: ["4x = 14 + 6", "4x = 20", "x = 20 ÷ 4", "x = 5"],
        explanation:
          "First, move 6 to the right side (-6 becomes +6). Then move 4 (multiplies x) to the right side (becomes division). x = 20 ÷ 4 = 5.",
      },
    ],
    tip: "Always handle addition/subtraction BEFORE handling multiplication/division.",
  },

  "1.6": {
    title: "Two-Step Equations x ÷ a ± b = c",
    subtitle: "Move constant first, then divisor",
    concept:
      "When solving equations of the form x ÷ a ± b = c, we first move the constant term b, then the coefficient a, using the opposite operations.",
    rules: [
      {
        icon: "layers",
        text: "Step 1: Move the constant b to the opposite side using the opposite operation.",
        highlight: true,
      },
      {
        icon: "git-branch",
        text: "Step 2: Move the coefficient a to the opposite side (division becomes multiplication).",
        highlight: true,
      },
    ],
    examples: [
      {
        equation: "x ÷ 3 + 4 = 10",
        steps: ["x ÷ 3 = 10 - 4", "x ÷ 3 = 6", "x = 6 · 3", "x = 18"],
        explanation:
          "Move 4 to the right side (+4 becomes -4). Then move 3 (divides x) to the right side (becomes multiplication). x = 6 · 3 = 18.",
      },
      {
        equation: "x ÷ 5 - 2 = 7",
        steps: ["x ÷ 5 = 7 + 2", "x ÷ 5 = 9", "x = 9 · 5", "x = 45"],
        explanation:
          "Move 2 to the right side (-2 becomes +2). Then move 5 (divides x) to the right side (becomes multiplication). x = 9 · 5 = 45.",
      },
    ],
    tip: "Follow the reverse order of operations when solving: move what's furthest from x first!",
  },
};

export function getTheoryContent(levelId: string): TheorySection | null {
  return THEORY[levelId] || null;
}

export function hasTheory(levelId: string): boolean {
  return levelId in THEORY;
}
