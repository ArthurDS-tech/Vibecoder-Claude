import {
  FileDiff,
  LoopFixStrategy,
  ParsedError,
} from '../../shared/types/loop.types';

export interface FixProposal {
  strategy: LoopFixStrategy;
  diffs: FileDiff[];
  rationale: string;
}

export class FixGenerator {
  generate(error: ParsedError): FixProposal {
    const strategy = this.selectStrategy(error);
    const diff = this.buildDiff(error, strategy);

    return {
      strategy,
      diffs: diff ? [diff] : [],
      rationale: this.buildRationale(error, strategy),
    };
  }

  generateMany(errors: ParsedError[]): FixProposal[] {
    return errors.map((error) => this.generate(error));
  }

  private selectStrategy(error: ParsedError): LoopFixStrategy {
    const message = error.message.toLowerCase();

    if (message.includes('cannot find name') || message.includes('no overload matches')) {
      return 'import_repair';
    }

    if (message.includes('is not assignable to type') || message.includes('type')) {
      return 'type_adjustment';
    }

    if (message.includes('possibly') || message.includes('undefined') || message.includes('null')) {
      return 'guard_clause';
    }

    if (error.file && error.line) {
      return 'targeted_edit';
    }

    return 'fallback';
  }

  private buildDiff(error: ParsedError, strategy: LoopFixStrategy): FileDiff | null {
    if (!error.file) {
      return null;
    }

    const targetLine = error.line || 1;
    const targetColumn = error.column || 1;
    const summary = `[${strategy}] ${error.message}`;
    const patch = [
      `--- a/${error.file}`,
      `+++ b/${error.file}`,
      `@@ -${targetLine},1 +${targetLine},1 @@`,
      `- // TODO: inspect failing code near column ${targetColumn}`,
      `+ // Suggested ${strategy} fix for: ${this.escapePatchText(error.message)}`,
    ].join('\n');

    return {
      file: error.file,
      patch,
      summary,
    };
  }

  private buildRationale(error: ParsedError, strategy: LoopFixStrategy): string {
    switch (strategy) {
      case 'import_repair':
        return `The error in ${error.file || 'unknown file'} suggests a missing symbol or signature mismatch, so the first fix should check imports and the referenced API shape.`;
      case 'type_adjustment':
        return 'The validator output points to a type incompatibility, so the safest first move is a narrow type correction near the failing expression.';
      case 'guard_clause':
        return 'The message indicates a nullable or undefined path, so adding a focused guard is the least disruptive first fix.';
      case 'targeted_edit':
        return 'The error has a concrete file and location, so the loop engine should patch only the failing section instead of rewriting the whole file.';
      default:
        return 'The error could not be classified precisely, so the loop engine should inspect the local context before applying a minimal diff.';
    }
  }

  private escapePatchText(value: string): string {
    return value.replace(/\r?\n/g, ' ').replace(/\*/g, '\\*');
  }
}
