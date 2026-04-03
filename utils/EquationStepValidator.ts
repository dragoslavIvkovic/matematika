export type ErrorType = "SKIPPED_STEP" | "CALCULATION_ERROR";

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  message?: string;
  errorType?: ErrorType;
  failedAtStep?: number;
  expectedProcedure?: string[];
  modalMessage?: string;
  fallbackLevel?: string;
}

interface ExpectedStep {
  display: string;
  variations: string[];
}

export class EquationStepValidator {
  /**
   * 1. Input Normalization
   */
  static normalize(str: string | undefined | null): string {
    if (!str) return '';
    return str
      .toString()
      .replace(/\s+/g, '')       // Remove spaces
      .toLowerCase()             // Lowercase
      .replace(/:/g, '/')        // Treat : as /
      .replace(/·/g, '*')        // Treat middle dot as *
      .replace(/×/g, '*')        // Treat × as *
      .replace(/÷/g, '/')        // Treat ÷ as /
      .replace(/[,.]$/g, '')     // Strip trailing comma/period (iOS keyboard quirk)
      .replace(/^[,.]|[,.]$/g, ''); // Strip leading/trailing punctuation
  }

  /**
   * Extract just the numeric value from a string (strips everything non-numeric)
   */
  static extractNumber(str: string): number | null {
    if (!str) return null;
    const cleaned = str.replace(/[^0-9.-]/g, '').replace(/\.$/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * POMOĆNA METODA ZA UI
   * Vraća tačan broj <TextInput> polja koji ti je potreban za ekran
   */
  static getRequiredLines(level: string): number {
    if (level === '1.1' || level === '1.2') return 1;
    if (level === '1.3' || level === '1.4') return 2;
    if (level === '1.5' || level === '1.6') return 4;
    return 1; // fallback
  }

  /**
   * 2. Dynamic Expected Steps Generation
   */
  static getExpectedSteps(level: string, type: string, a: number, b: number, c: number | null = null): ExpectedStep[] {
    const steps: ExpectedStep[] = [];
    let val1: number;

    switch (level) {
      case '1.1':
      case '1.2':
        if (type === '+') { val1 = a + b; } 
        else if (type === '-') { val1 = a - b; } 
        else if (type === '*') { val1 = a * b; } 
        else if (type === '/') { val1 = a / b; }
        else { val1 = 0; }
        // Only the numeric result is needed
        steps.push({ display: `${val1}`, variations: [`${val1}`, `${val1}.0`, `${val1},0`] });
        break;

      case '1.3':
        if (type === '+') {
          val1 = b - a;
          steps.push({ display: `x = ${b} - ${a}`, variations: [`x=${b}-${a}`] });
          steps.push({ display: `x = ${val1}`,     variations: [`x=${val1}`] });
        } else if (type === '-') {
          val1 = b + a;
          steps.push({ display: `x = ${b} + ${a}`, variations: [`x=${b}+${a}`, `x=${a}+${b}`] });
          steps.push({ display: `x = ${val1}`,     variations: [`x=${val1}`] });
        }
        break;

      case '1.4':
        if (type === '*') {
          val1 = b / a;
          steps.push({ display: `x = ${b} / ${a}`, variations: [`x=${b}/${a}`] });
          steps.push({ display: `x = ${val1}`,     variations: [`x=${val1}`] });
        } else if (type === '/') {
          val1 = b * a;
          steps.push({ display: `x = ${b} * ${a}`, variations: [`x=${b}*${a}`, `x=${a}*${b}`] });
          steps.push({ display: `x = ${val1}`,     variations: [`x=${val1}`] });
        }
        break;

      case '1.5':
        if (c === null) throw new Error("Missing 'c' parameter for level 1.5");
        if (type === '+') {
          val1 = c - b;
          steps.push({ display: `${a}x = ${c} - ${b}`, variations: [`${a}x=${c}-${b}`] });
          steps.push({ display: `${a}x = ${val1}`,     variations: [`${a}x=${val1}`] });
          steps.push({ display: `x = ${val1} / ${a}`,  variations: [`x=${val1}/${a}`] });
          steps.push({ display: `x = ${val1 / a}`,     variations: [`x=${val1 / a}`] });
        } else if (type === '-') {
          val1 = c + b;
          steps.push({ display: `${a}x = ${c} + ${b}`, variations: [`${a}x=${c}+${b}`, `${a}x=${b}+${c}`] });
          steps.push({ display: `${a}x = ${val1}`,     variations: [`${a}x=${val1}`] });
          steps.push({ display: `x = ${val1} / ${a}`,  variations: [`x=${val1}/${a}`] });
          steps.push({ display: `x = ${val1 / a}`,     variations: [`x=${val1 / a}`] });
        }
        break;

      case '1.6':
        if (c === null) throw new Error("Missing 'c' parameter for level 1.6");
        if (type === '+') {
          val1 = c - b;
          steps.push({ display: `x/${a} = ${c} - ${b}`, variations: [`x/${a}=${c}-${b}`] });
          steps.push({ display: `x/${a} = ${val1}`,     variations: [`x/${a}=${val1}`] });
          steps.push({ display: `x = ${val1} * ${a}`,   variations: [`x=${val1}*${a}`, `x=${a}*${val1}`] });
          steps.push({ display: `x = ${val1 * a}`,      variations: [`x=${val1 * a}`] });
        } else if (type === '-') {
          val1 = c + b;
          steps.push({ display: `x/${a} = ${c} + ${b}`, variations: [`x/${a}=${c}+${b}`, `x/${a}=${b}+${c}`] });
          steps.push({ display: `x/${a} = ${val1}`,     variations: [`x/${a}=${val1}`] });
          steps.push({ display: `x = ${val1} * ${a}`,   variations: [`x=${val1}*${a}`, `x=${a}*${val1}`] });
          steps.push({ display: `x = ${val1 * a}`,      variations: [`x=${val1 * a}`] });
        }
        break;

      default:
        throw new Error("Unknown equation level: " + level);
    }

    return steps;
  }

  /**
   * 3. The Validation Loop
   */
  static validate(
    userInputs: string[], 
    level: string, 
    type: string, 
    a: number, 
    b: number, 
    c: number | null = null
  ): ValidationResult {
    const expectedSteps = this.getExpectedSteps(level, type, a, b, c);
    const expectedProcedure = expectedSteps.map(step => step.display);

    // Filter out blank rows that user didn't fill yet
    const activeInputs = userInputs.filter(input => input && input.trim() !== "");

    for (let i = 0; i < activeInputs.length; i++) {
      const normalizedInput = this.normalize(activeInputs[i]);
      
      // If user typed more lines than strictly required
      if (!expectedSteps[i]) {
        return {
          isValid: false,
          isComplete: false,
          errorType: "CALCULATION_ERROR",
          failedAtStep: i + 1,
          expectedProcedure,
          modalMessage: "You added too many steps. Please follow the correct procedure."
        };
      }

      const currentValidVariations = expectedSteps[i].variations.map(v => this.normalize(v));

      if (currentValidVariations.includes(normalizedInput)) {
        continue;
      }

      // For basic arithmetic (1.1/1.2), also try numeric comparison
      if (level === '1.1' || level === '1.2') {
        const userNum = this.extractNumber(activeInputs[i]);
        const expectedNum = this.extractNumber(expectedSteps[i].variations[0]);
        if (userNum !== null && expectedNum !== null && userNum === expectedNum) {
          continue;
        }
      }

      let isSkipped = false;
      for (let j = i + 1; j < expectedSteps.length; j++) {
        const futureValidVariations = expectedSteps[j].variations.map(v => this.normalize(v));
        if (futureValidVariations.includes(normalizedInput)) {
          isSkipped = true;
          break;
        }
      }

      if (isSkipped) {
        return {
          isValid: false,
          isComplete: false,
          errorType: "SKIPPED_STEP",
          failedAtStep: i + 1,
          expectedProcedure,
          modalMessage: `You skipped a step at step ${i + 1}. Please write down all the steps.`
        };
      }

      return {
        isValid: false,
        isComplete: false,
        errorType: "CALCULATION_ERROR",
        failedAtStep: i + 1,
        expectedProcedure,
        modalMessage: `You made a mistake in step ${i + 1}. Here is the correct way to solve it.`
      };
    }

    const isComplete = activeInputs.length === expectedSteps.length;

    return {
      isValid: true,
      isComplete: isComplete,
      message: isComplete ? "Correct! You completed the equation." : "Correct so far!"
    };
  }
}
