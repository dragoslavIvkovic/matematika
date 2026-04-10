/**
 * TheoryContent — Theory explanations for all levels.
 *
 * Shown:
 * 1. Before first attempt at a new equation level (when hasTheory)
 * 2. After repeated errors (ERRORS_BEFORE_FALLBACK consecutive mistakes)
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
  "1.1": {
    title: "Addition and subtraction",
    subtitle: "Whole numbers up to 100",
    concept:
      "Addition combines two amounts into one; subtraction finds the difference — how much is left when you take the smaller part from the larger.",
    rules: [
      {
        icon: "add",
        text: "Addition: add ones, then tens, then hundreds — in your head or written below.",
        highlight: true,
      },
      {
        icon: "remove",
        text: "Subtraction: subtract the smaller number from the larger when you want to know how much is “left”.",
      },
      {
        icon: "checkmark-circle",
        text: "Check: after subtraction, the result should be less than the larger starting number.",
      },
    ],
    examples: [
      {
        equation: "37 + 28",
        steps: ["37 + 20 = 57", "57 + 8 = 65"],
        explanation: "You can add tens first (20), then ones (8). Result: 65.",
      },
      {
        equation: "84 − 29",
        steps: ["84 − 30 = 54", "54 + 1 = 55"],
        explanation:
          "Subtract 30, then add 1 back because you subtracted one too much — or directly: 84 − 29 = 55.",
      },
    ],
    tip: "Count calmly: tens first, then ones — fewer mistakes than rushing.",
  },
  "1.2": {
    title: "Multiplication and division",
    subtitle: "Whole numbers up to 200",
    concept:
      "Multiplication is repeated addition of the same number. Division is the inverse: how many times one number “fits” into another.",
    rules: [
      {
        icon: "close",
        text: "Times tables: drill small factors (2–9) from memory — it speeds up everything else.",
        highlight: true,
      },
      {
        icon: "git-branch",
        text: "Division with no remainder: multiply the quotient to check (quotient × divisor = dividend).",
      },
    ],
    examples: [
      {
        equation: "7 × 8",
        steps: ["7 × 8 = 56"],
        explanation: "From the table: seven times eight is 56.",
      },
      {
        equation: "72 ÷ 9",
        steps: ["9 × 8 = 72", "so 72 ÷ 9 = 8"],
        explanation: "Ask: what times 9 gives 72? Answer: 8.",
      },
    ],
    tip: "Always verify with multiplication: quotient × divisor must equal the dividend.",
  },
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
    title: "Solving Equations ax = b and x / a = b",
    subtitle: "Moving multiplication and division",
    concept:
      "When solving equations of the form ax = b and x / a = b, we can move terms from one side of the equation to the other side.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "When a term moves to the opposite side, we use the opposite operation.",
        highlight: true,
      },
      {
        icon: "close-circle",
        text: "Multiplication (*) becomes division (/)",
      },
      {
        icon: "ellipse",
        text: "Division (/) becomes multiplication (*)",
      },
    ],
    examples: [
      {
        equation: "3x = 18",
        steps: ["x = 18 / 3", "x = 6"],
        explanation:
          "Move 3 (multiplication) to the right side. It was multiplication, so we change it to division: x = 18 / 3 = 6.",
      },
      {
        equation: "x / 4 = 7",
        steps: ["x = 7 * 4", "x = 28"],
        explanation:
          "Move 4 (division) to the right side. It was division, so we change it to multiplication: x = 7 * 4 = 28.",
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
        steps: ["3x = 17 - 5", "3x = 12", "x = 12 / 3", "x = 4"],
        explanation:
          "First, move 5 to the right side (+5 becomes -5). Then move 3 (multiplies x) to the right side (becomes division). x = 12 / 3 = 4.",
      },
      {
        equation: "4x - 6 = 14",
        steps: ["4x = 14 + 6", "4x = 20", "x = 20 / 4", "x = 5"],
        explanation:
          "First, move 6 to the right side (-6 becomes +6). Then move 4 (multiplies x) to the right side (becomes division). x = 20 / 4 = 5.",
      },
    ],
    tip: "Always handle addition/subtraction BEFORE handling multiplication/division.",
  },

  "1.6": {
    title: "Two-Step Equations x / a ± b = c",
    subtitle: "Move constant first, then divisor",
    concept:
      "When solving equations of the form x / a ± b = c, we first move the constant term b, then the coefficient a, using the opposite operations.",
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
        equation: "x / 3 + 4 = 10",
        steps: ["x / 3 = 10 - 4", "x / 3 = 6", "x = 6 * 3", "x = 18"],
        explanation:
          "Move 4 to the right side (+4 becomes -4). Then move 3 (divides x) to the right side (becomes multiplication). x = 6 * 3 = 18.",
      },
      {
        equation: "x / 5 - 2 = 7",
        steps: ["x / 5 = 7 + 2", "x / 5 = 9", "x = 9 * 5", "x = 45"],
        explanation:
          "Move 2 to the right side (-2 becomes +2). Then move 5 (divides x) to the right side (becomes multiplication). x = 9 * 5 = 45.",
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
