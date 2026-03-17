export interface TokenEstimate {
  characters: number;
  tokens: number;
}

export class TokenCounter {
  static estimate(text: string): TokenEstimate {
    return {
      characters: text.length,
      tokens: Math.ceil(text.length / 4),
    };
  }

  static estimateMany(values: string[]): TokenEstimate {
    const characters = values.reduce((total, value) => total + value.length, 0);

    return {
      characters,
      tokens: Math.ceil(characters / 4),
    };
  }

  static fitsBudget(text: string, budget: number): boolean {
    return this.estimate(text).tokens <= budget;
  }

  static truncateToBudget(text: string, budget: number): string {
    if (this.fitsBudget(text, budget)) {
      return text;
    }

    const maxCharacters = budget * 4;
    return `${text.slice(0, Math.max(0, maxCharacters - 24))}\n[...truncated for budget...]`;
  }
}
