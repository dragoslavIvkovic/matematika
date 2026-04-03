/**
 * ProblemGenerator — Dynamically generates math problems for all 6 levels.
 *
 * Rules:
 * - All parameters (a, b, c) are positive integers
 * - All solutions (x) are positive integers
 * - Division never has a remainder
 * - Level 1.1: a, b up to 100
 * - Level 1.2: a, b up to 200
 * - Levels 1.3–1.6: parameters up to 200
 */

export interface GeneratedProblem {
  equation: string;
  level: string;
  type: "+" | "-" | "*" | "/";
  a: number;
  b: number;
  c: number | null;
  answer: number;
  requiredSteps: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Level 1.1: Addition & Subtraction ───────────────────────────
function generateLevel11(type: "+" | "-"): GeneratedProblem {
  if (type === "+") {
    const a = randInt(1, 100);
    const b = randInt(1, 100);
    return {
      equation: `${a} + ${b}`,
      level: "1.1",
      type: "+",
      a,
      b,
      c: null,
      answer: a + b,
      requiredSteps: 1,
    };
  } else {
    // b > a to ensure positive result
    const a = randInt(1, 99);
    const b = randInt(a + 1, 100);
    return {
      equation: `${b} - ${a}`,
      level: "1.1",
      type: "-",
      a: b, // displayed first
      b: a, // displayed second
      c: null,
      answer: b - a,
      requiredSteps: 1,
    };
  }
}

// ─── Level 1.2: Multiplication & Division ────────────────────────
function generateLevel12(type: "*" | "/"): GeneratedProblem {
  if (type === "*") {
    const a = randInt(2, 20);
    const b = randInt(2, 10);
    return {
      equation: `${a} × ${b}`,
      level: "1.2",
      type: "*",
      a,
      b,
      c: null,
      answer: a * b,
      requiredSteps: 1,
    };
  } else {
    // Generate clean division: pick divisor and quotient, then compute dividend
    const divisor = randInt(2, 20);
    const quotient = randInt(2, 10);
    const dividend = divisor * quotient;
    return {
      equation: `${dividend} ÷ ${divisor}`,
      level: "1.2",
      type: "/",
      a: dividend,
      b: divisor,
      c: null,
      answer: quotient,
      requiredSteps: 1,
    };
  }
}

// ─── Level 1.3: Simple equations (x + a = b) or (x - a = b) ─────
function generateLevel13(type: "+" | "-"): GeneratedProblem {
  if (type === "+") {
    // x + a = b → x = b - a (must be positive)
    const x = randInt(1, 100);
    const a = randInt(1, 100);
    const b = x + a;
    return {
      equation: `x + ${a} = ${b}`,
      level: "1.3",
      type: "+",
      a,
      b,
      c: null,
      answer: x,
      requiredSteps: 2,
    };
  } else {
    // x - a = b → x = b + a
    const x = randInt(2, 150);
    const a = randInt(1, Math.min(x - 1, 100));
    const b = x - a;
    return {
      equation: `x - ${a} = ${b}`,
      level: "1.3",
      type: "-",
      a,
      b,
      c: null,
      answer: x,
      requiredSteps: 2,
    };
  }
}

// ─── Level 1.4: Simple equations (a·x = b) or (x÷a = b) ─────────
function generateLevel14(type: "*" | "/"): GeneratedProblem {
  if (type === "*") {
    // a * x = b → x = b / a (clean division)
    const a = randInt(2, 20);
    const x = randInt(1, 10);
    const b = a * x;
    return {
      equation: `${a} · x = ${b}`,
      level: "1.4",
      type: "*",
      a,
      b,
      c: null,
      answer: x,
      requiredSteps: 2,
    };
  } else {
    // x / a = b → x = a * b
    const a = randInt(2, 20);
    const b = randInt(1, 10);
    const x = a * b;
    return {
      equation: `x ÷ ${a} = ${b}`,
      level: "1.4",
      type: "/",
      a,
      b,
      c: null,
      answer: x,
      requiredSteps: 2,
    };
  }
}

// ─── Level 1.5: ax + b = c or ax - b = c ────────────────────────
function generateLevel15(type: "+" | "-"): GeneratedProblem {
  // We want ax ± b = c with positive integer x and c
  // Pick a, x first, then pick b so that c is positive
  const a = randInt(2, 12);
  const x = randInt(1, 15);
  const ax = a * x;

  if (type === "+") {
    // ax + b = c → c = ax + b
    const b = randInt(1, 50);
    const c = ax + b;
    return {
      equation: `${a}x + ${b} = ${c}`,
      level: "1.5",
      type: "+",
      a,
      b,
      c,
      answer: x,
      requiredSteps: 4,
    };
  } else {
    // ax - b = c → c = ax - b (must be positive)
    const maxB = ax - 1;
    const b = maxB > 0 ? randInt(1, Math.min(maxB, 50)) : 1;
    const c = ax - b;
    return {
      equation: `${a}x - ${b} = ${c}`,
      level: "1.5",
      type: "-",
      a,
      b,
      c,
      answer: x,
      requiredSteps: 4,
    };
  }
}

// ─── Level 1.6: x/a + b = c or x/a - b = c ─────────────────────
function generateLevel16(type: "+" | "-"): GeneratedProblem {
  // x/a ± b = c, where x is divisible by a, and x is positive
  const a = randInt(2, 12);
  const xOverA = randInt(1, 20); // this is x/a
  const x = a * xOverA;

  if (type === "+") {
    // x/a + b = c → c = xOverA + b
    const b = randInt(1, 50);
    const c = xOverA + b;
    return {
      equation: `x ÷ ${a} + ${b} = ${c}`,
      level: "1.6",
      type: "+",
      a,
      b,
      c,
      answer: x,
      requiredSteps: 4,
    };
  } else {
    // x/a - b = c → c = xOverA - b (must be positive)
    const maxB = xOverA - 1;
    const b = maxB > 0 ? randInt(1, Math.min(maxB, 50)) : 1;
    const c = xOverA - b;
    return {
      equation: `x ÷ ${a} - ${b} = ${c}`,
      level: "1.6",
      type: "-",
      a,
      b,
      c,
      answer: x,
      requiredSteps: 4,
    };
  }
}

// ─── Public API ──────────────────────────────────────────────────

export type LevelId = "1.1" | "1.2" | "1.3" | "1.4" | "1.5" | "1.6";

export interface LevelConfig {
  id: LevelId;
  name: string;
  description: string;
  requiredStreak: number;
  operations: string[];
  operationsPerType: number;
  hasTheory: boolean;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: "1.1",
    name: "Addition & Subtraction",
    description: "Basic arithmetic with whole numbers up to 100",
    requiredStreak: 10,
    operations: ["+", "-"],
    operationsPerType: 5,
    hasTheory: false,
  },
  {
    id: "1.2",
    name: "Multiplication & Division",
    description: "Basic arithmetic with whole numbers up to 200",
    requiredStreak: 10,
    operations: ["*", "/"],
    operationsPerType: 5,
    hasTheory: false,
  },
  {
    id: "1.3",
    name: "Simple Equations (+/-)",
    description: "Solve x + a = b and x - a = b step by step",
    requiredStreak: 6,
    operations: ["+", "-"],
    operationsPerType: 3,
    hasTheory: true,
  },
  {
    id: "1.4",
    name: "Simple Equations (×/÷)",
    description: "Solve a·x = b and x÷a = b step by step",
    requiredStreak: 6,
    operations: ["*", "/"],
    operationsPerType: 3,
    hasTheory: true,
  },
  {
    id: "1.5",
    name: "Two-Step Equations (×)",
    description: "Solve ax + b = c and ax - b = c",
    requiredStreak: 6,
    operations: ["+", "-"],
    operationsPerType: 3,
    hasTheory: true,
  },
  {
    id: "1.6",
    name: "Two-Step Equations (÷)",
    description: "Solve x÷a + b = c and x÷a - b = c",
    requiredStreak: 6,
    operations: ["+", "-"],
    operationsPerType: 3,
    hasTheory: true,
  },
];

export function getLevelConfig(levelId: string): LevelConfig {
  const config = LEVEL_CONFIGS.find((l) => l.id === levelId);
  if (!config) throw new Error(`Unknown level: ${levelId}`);
  return config;
}

/**
 * Generate a problem for the given level and operation type.
 */
export function generateProblem(level: LevelId, type: string): GeneratedProblem {
  switch (level) {
    case "1.1":
      return generateLevel11(type as "+" | "-");
    case "1.2":
      return generateLevel12(type as "*" | "/");
    case "1.3":
      return generateLevel13(type as "+" | "-");
    case "1.4":
      return generateLevel14(type as "*" | "/");
    case "1.5":
      return generateLevel15(type as "+" | "-");
    case "1.6":
      return generateLevel16(type as "+" | "-");
    default:
      throw new Error(`Unknown level: ${level}`);
  }
}

/**
 * Generate the next problem for a level, choosing the operation
 * type that is most needed to balance the distribution.
 */
export function generateNextProblem(
  level: LevelId,
  operationCounts: Record<string, number>
): GeneratedProblem {
  const config = getLevelConfig(level);
  const ops = config.operations;

  // Pick the operation with the fewest completed problems
  let minCount = Infinity;
  let chosenOp = ops[0];
  for (const op of ops) {
    const count = operationCounts[op] || 0;
    if (count < minCount) {
      minCount = count;
      chosenOp = op;
    }
  }

  return generateProblem(level, chosenOp);
}
