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
    subtitle: "Moving terms — addition and subtraction",
    concept:
      "When solving equations of the form x ± a = b, we can move terms from one side of the equation to the other side.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "Rule: When a term moves to the opposite side, we change the operation: addition becomes subtraction, and subtraction becomes addition.",
        highlight: true,
      },
    ],
    examples: [
      {
        equation: "1. Addition case: x + a = b",
        steps: [
          "Equation: x + a = b",
          "We move a to the right side. It was addition, so we change it to subtraction:",
          "x = b − a",
          "Example:",
          "x + 7 = 19",
          "Move 7 to the right side. It was addition, so we change it to subtraction:",
          "x = 19 − 7",
          "x = 12",
        ],
        explanation: "The unknown x is 12.",
      },
      {
        equation: "2. Subtraction case: x − a = b",
        steps: [
          "Equation: x − a = b",
          "We move a to the right side. It was subtraction, so we change it to addition:",
          "x = b + a",
          "Example:",
          "x − 5 = 23",
          "Move 5 to the right side. It was subtraction, so we change it to addition:",
          "x = 23 + 5",
          "x = 28",
        ],
        explanation: "The unknown x is 28.",
      },
    ],
    tip: "When a number crosses the equals sign, flip the operation: + becomes −, and − becomes +.",
  },

  "1.4": {
    title: "Solving Equations ax = b and x ÷ a = b",
    subtitle: "Moving multiplication and division",
    concept:
      "When solving equations of the form ax = b and x ÷ a = b, we can move terms from one side of the equation to the other side.",
    rules: [
      {
        icon: "swap-horizontal",
        text: "Rule: When a term moves to the opposite side, we use the opposite mathematical operation (multiplication becomes division, and division becomes multiplication).",
        highlight: true,
      },
    ],
    examples: [
      {
        equation: "1. Multiplication case: ax = b",
        steps: [
          "Equation: ax = b",
          "We move a (which is multiplying x) to the right side. It was multiplication, so we change it to division:",
          "x = b ÷ a",
          "Example:",
          "3x = 18",
          "Move 3 (which is multiplying x) to the right side. It was multiplication, so we change it to division:",
          "x = 18 ÷ 3",
          "x = 6",
        ],
        explanation: "The unknown x is 6.",
      },
      {
        equation: "2. Division case: x ÷ a = b",
        steps: [
          "Equation: x ÷ a = b",
          "We move a (which is dividing x) to the right side. It was division, so we change it to multiplication:",
          "x = b × a",
          "Example:",
          "x ÷ 4 = 7",
          "Move 4 (division) to the right side. It was division, so we change it to multiplication:",
          "x = 7 × 4",
          "x = 28",
        ],
        explanation: "The unknown x is 28.",
      },
    ],
    tip: "Multiply to undo division; divide to undo multiplication when you move a across the equals sign.",
  },

  "1.5": {
    title: "Solving Equations ax ± b = c",
    subtitle: "Move the constant, then the coefficient",
    concept:
      "When solving equations of the form ax ± b = c, we first move the constant term b, then coefficient a, using the opposite operations.",
    rules: [
      {
        icon: "layers",
        text: "Move the constant b to the opposite side (use the opposite operation, addition becomes subtraction and subtraction becomes addition).",
        highlight: true,
      },
      {
        icon: "git-branch",
        text: "Then move the coefficient a to the opposite side (multiplication becomes division).",
        highlight: true,
      },
    ],
    examples: [
      {
        equation: "1. Addition case: ax + b = c",
        steps: [
          "Equation: ax + b = c",
          "First, move b to the right side. It was addition, so it becomes subtraction:",
          "ax = c − b",
          "Then, move a (which is multiplying x) to the right side. It was multiplication, so it becomes division:",
          "x = (c − b) ÷ a",
          "Example:",
          "3x + 5 = 17",
          "Move 5 to the right side. It was addition, so it becomes subtraction.",
          "3x = 17 − 5",
          "3x = 12",
          "Then move 3 (which is multiplying x) to the right side. It was multiplication, so it becomes division.",
          "x = 12 ÷ 3",
          "x = 4",
        ],
        explanation: "The solution is x = 4.",
      },
      {
        equation: "2. Subtraction case: ax − b = c",
        steps: [
          "Equation: ax − b = c",
          "First, move b to the right side. It was subtraction, so it becomes addition:",
          "ax = c + b",
          "Then, move a (which is multiplying x) to the right side. It was multiplication, so it becomes division:",
          "x = (c + b) ÷ a",
          "Example:",
          "4x − 6 = 14",
          "First, move 6 to the right side. It was subtraction, so it becomes addition:",
          "4x = 14 + 6",
          "4x = 20",
          "Then, move 4 (which is multiplying x) to the right side. It was multiplication, so it becomes division.",
          "x = 20 ÷ 4",
          "x = 5",
        ],
        explanation: "The solution is x = 5.",
      },
    ],
    tip: "Always move the constant (±) first, then divide by the coefficient a.",
  },

  "1.6": {
    title: "Solving Equations x ÷ a ± b = c",
    subtitle: "Move the constant, then the divisor",
    concept:
      "When solving equations of the form x ÷ a ± b = c, we first move the constant term b, then the divisor a, using the opposite operations.",
    rules: [
      {
        icon: "layers",
        text: "Move the constant b to the opposite side (use the opposite operation: addition becomes subtraction, and subtraction becomes addition).",
        highlight: true,
      },
      {
        icon: "git-branch",
        text: "Then move the divisor a to the opposite side (division becomes multiplication).",
        highlight: true,
      },
    ],
    examples: [
      {
        equation: "1. Addition case: x ÷ a + b = c",
        steps: [
          "Equation: x ÷ a + b = c",
          "First, move b to the right side. It was addition, so it becomes subtraction:",
          "x ÷ a = c − b",
          "Then, move a (which is dividing x) to the right side. It was division, so it becomes multiplication:",
          "x = (c − b) × a",
          "Example:",
          "x ÷ 3 + 4 = 10",
          "Move 4 to the right side. It was addition, so it becomes subtraction:",
          "x ÷ 3 = 10 − 4",
          "x ÷ 3 = 6",
          "Then, move 3 (which is dividing x) to the right side. It was division, so it becomes multiplication:",
          "x = 6 × 3",
          "x = 18",
        ],
        explanation: "The solution is x = 18.",
      },
      {
        equation: "2. Subtraction case: x ÷ a − b = c",
        steps: [
          "Equation: x ÷ a − b = c",
          "First, move b to the right side. It was subtraction, so it becomes addition:",
          "x ÷ a = c + b",
          "Then, move a (which is dividing x) to the right side. It was division, so it becomes multiplication:",
          "x = (c + b) × a",
          "Example:",
          "x ÷ 5 − 2 = 7",
          "Move 2 to the right side. It was subtraction, so it becomes addition:",
          "x ÷ 5 = 7 + 2",
          "x ÷ 5 = 9",
          "Then, move 5 (which is dividing x) to the right side. It was division, so it becomes multiplication.",
          "x = 9 × 5",
          "x = 45",
        ],
        explanation: "The solution is x = 45.",
      },
    ],
    tip: "First isolate x ÷ a, then multiply by a to get x by itself.",
  },
};

export function getTheoryContent(levelId: string): TheorySection | null {
  return THEORY[levelId] || null;
}

export function hasTheory(levelId: string): boolean {
  return levelId in THEORY;
}
