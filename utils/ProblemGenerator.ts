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
  variable: string;
  requiredSteps: number;
}

export const ALLOWED_VARIABLES = ["x", "y", "a", "b", "c", "d", "z", "w", "m", "n", "p", "q"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomVariable(): string {
  return ALLOWED_VARIABLES[Math.floor(Math.random() * ALLOWED_VARIABLES.length)];
}

// ─── Level 1.1: Add/subtract ───────────────────────────
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
      variable: "",
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
      variable: "",
      requiredSteps: 1,
    };
  }
}

// ─── Level 1.2: Multiply/divide ────────────────────────
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
      variable: "",
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
      variable: "",
      requiredSteps: 1,
    };
  }
}

// ─── Level 1.3: x ± a = b ─────
function generateLevel13(type: "+" | "-"): GeneratedProblem {
  const variable = getRandomVariable();
  if (type === "+") {
    // x + a = b → x = b - a (must be positive)
    const x = randInt(1, 100);
    const a = randInt(1, 100);
    const b = x + a;
    return {
      equation: `${variable} + ${a} = ${b}`,
      level: "1.3",
      type: "+",
      a,
      b,
      c: null,
      answer: x,
      variable,
      requiredSteps: 2,
    };
  } else {
    // x - a = b → x = b + a
    const x = randInt(2, 150);
    const a = randInt(1, Math.min(x - 1, 100));
    const b = x - a;
    return {
      equation: `${variable} - ${a} = ${b}`,
      level: "1.3",
      type: "-",
      a,
      b,
      c: null,
      answer: x,
      variable,
      requiredSteps: 2,
    };
  }
}

// ─── Level 1.4: ax = b ─────────
function generateLevel14(type: "*" | "/"): GeneratedProblem {
  const variable = getRandomVariable();
  if (type === "*") {
    // a * x = b → x = b / a (clean division)
    const a = randInt(2, 20);
    const x = randInt(1, 10);
    const b = a * x;
    return {
      equation: `${a} · ${variable} = ${b}`,
      level: "1.4",
      type: "*",
      a,
      b,
      c: null,
      answer: x,
      variable,
      requiredSteps: 2,
    };
  } else {
    // x / a = b → x = a * b
    const a = randInt(2, 20);
    const b = randInt(1, 10);
    const x = a * b;
    return {
      equation: `${variable} ÷ ${a} = ${b}`,
      level: "1.4",
      type: "/",
      a,
      b,
      c: null,
      answer: x,
      variable,
      requiredSteps: 2,
    };
  }
}

// ─── Level 1.5: ax ± b = c ────────────────────────
function generateLevel15(type: "+" | "-"): GeneratedProblem {
  const variable = getRandomVariable();
  const a = randInt(2, 12);
  const x = randInt(1, 15);
  const ax = a * x;

  if (type === "+") {
    const b = randInt(1, 50);
    const c = ax + b;
    return {
      equation: `${a}${variable} + ${b} = ${c}`,
      level: "1.5",
      type: "+",
      a,
      b,
      c,
      answer: x,
      variable,
      requiredSteps: 4,
    };
  } else {
    const maxB = ax - 1;
    const b = maxB > 0 ? randInt(1, Math.min(maxB, 50)) : 1;
    const c = ax - b;
    return {
      equation: `${a}${variable} - ${b} = ${c}`,
      level: "1.5",
      type: "-",
      a,
      b,
      c,
      answer: x,
      variable,
      requiredSteps: 4,
    };
  }
}

// ─── Level 1.6: ± b = c (x ÷ a ± b = c) ─────────────────────
function generateLevel16(type: "+" | "-"): GeneratedProblem {
  const variable = getRandomVariable();
  const a = randInt(2, 12);
  const xOverA = randInt(1, 20); // this is x/a
  const x = a * xOverA;

  if (type === "+") {
    const b = randInt(1, 50);
    const c = xOverA + b;
    return {
      equation: `${variable} ÷ ${a} + ${b} = ${c}`,
      level: "1.6",
      type: "+",
      a,
      b,
      c,
      answer: x,
      variable,
      requiredSteps: 4,
    };
  } else {
    const maxB = xOverA - 1;
    const b = maxB > 0 ? randInt(1, Math.min(maxB, 50)) : 1;
    const c = xOverA - b;
    return {
      equation: `${variable} ÷ ${a} - ${b} = ${c}`,
      level: "1.6",
      type: "-",
      a,
      b,
      c,
      answer: x,
      variable,
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
    name: "Add/subtract",
    description: "Basic arithmetic with whole numbers up to 100",
    requiredStreak: 10,
    operations: ["+", "-"],
    operationsPerType: 5,
    hasTheory: false,
  },
  {
    id: "1.2",
    name: "Multiply/divide",
    description: "Basic arithmetic with whole numbers up to 200",
    requiredStreak: 10,
    operations: ["*", "/"],
    operationsPerType: 5,
    hasTheory: false,
  },
  {
    id: "1.3",
    name: "x ± a = b",
    description: "Solve x + a = b and x - a = b step by step",
    requiredStreak: 6,
    operations: ["+", "-"],
    operationsPerType: 3,
    hasTheory: true,
  },
  {
    id: "1.4",
    name: "ax = b",
    description: "Solve a·x = b and x÷a = b step by step",
    requiredStreak: 6,
    operations: ["*", "/"],
    operationsPerType: 3,
    hasTheory: true,
  },
  {
    id: "1.5",
    name: "ax ± b = c",
    description: "Solve ax + b = c and ax - b = c",
    requiredStreak: 6,
    operations: ["+", "-"],
    operationsPerType: 3,
    hasTheory: true,
  },
  {
    id: "1.6",
    name: "± b = c (x ÷ a ± b = c)",
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

export function generateNextProblem(
  level: LevelId,
  operationCounts: Record<string, number>,
): GeneratedProblem {
  const config = getLevelConfig(level);
  const ops = config.operations;

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
