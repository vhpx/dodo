// Extract factual claims from player responses

export function extractClaims(response: string): string[] {
  const claims: string[] = [];
  const lowerResponse = response.toLowerCase();

  // Location claims
  const locationPatterns = [
    /(?:i was|i went|stayed) (?:at |in |to )?(?:the )?(\w+(?:\s+\w+)?)/gi,
    /(?:home|office|work|bar|restaurant|party|gallery|lab)/gi,
  ];
  
  // Time claims
  const timePatterns = [
    /(?:at |around |about )?(\d{1,2}(?::\d{2})?\s*(?:am|pm|o'clock)?)/gi,
    /(?:all night|all evening|until midnight|before midnight|after midnight)/gi,
  ];
  
  // Relationship/emotion claims
  const relationshipPatterns = [
    /(?:i (?:didn't|did not|never) (?:know|meet|see|talk to|speak with))/gi,
    /(?:good (?:terms|relationship)|(?:got|get) along|friends|enemies|colleagues)/gi,
    /(?:happy|satisfied|frustrated|angry|upset) (?:with|at|about)/gi,
  ];

  // Action denial/confirmation
  const actionPatterns = [
    /(?:i (?:didn't|did not|never|haven't|have not) (?:\w+))/gi,
    /(?:i (?:did|was|went|took|made|called|touched|saw))/gi,
  ];

  // Financial claims
  const financialPatterns = [
    /(?:no (?:debt|money problems|financial issues))/gi,
    /(?:doing (?:well|fine|okay) financially)/gi,
    /(?:in debt|owe|borrowed)/gi,
  ];

  // Extract key phrases
  const allPatterns = [
    ...locationPatterns,
    ...timePatterns,
    ...relationshipPatterns,
    ...actionPatterns,
    ...financialPatterns,
  ];

  for (const pattern of allPatterns) {
    const matches = lowerResponse.match(pattern);
    if (matches) {
      claims.push(...matches.map(m => m.trim()));
    }
  }

  // Also extract simple factual statements
  const sentences = response.split(/[.!?]+/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    if (trimmed.length > 5 && trimmed.length < 100) {
      // Look for declarative statements
      if (
        trimmed.startsWith('i was') ||
        trimmed.startsWith('i did') ||
        trimmed.startsWith("i didn't") ||
        trimmed.startsWith('i never') ||
        trimmed.startsWith('i have') ||
        trimmed.startsWith("i haven't") ||
        trimmed.includes('my alibi') ||
        trimmed.includes('the truth is')
      ) {
        claims.push(trimmed);
      }
    }
  }

  // Remove duplicates and empty strings
  return [...new Set(claims.filter(c => c.length > 2))];
}

export function detectContradiction(
  newClaims: string[],
  previousClaims: string[]
): string | null {
  const contradictionPairs = [
    ['was home', 'went to office'],
    ['was home', 'was at the lab'],
    ['was home', 'went to the gallery'],
    ["didn't go", 'went to'],
    ['never touched', 'touched'],
    ['never saw', 'saw'],
    ["didn't know", 'knew'],
    ["didn't call", 'called'],
    ['phone was dead', 'made a call'],
    ['no debt', 'in debt'],
    ['good relationship', 'threatened'],
    ['happy with', 'frustrated with'],
    ['stayed in main hall', 'went to east wing'],
    ['all night', 'left at'],
    ['never left', 'went to'],
  ];

  const newLower = newClaims.map(c => c.toLowerCase());
  const prevLower = previousClaims.map(c => c.toLowerCase());

  for (const [a, b] of contradictionPairs) {
    // Check for contradictions across claims
    
    // Check if contradiction exists across new and previous claims
    const newHasA = newLower.some(c => c.includes(a));
    const prevHasB = prevLower.some(c => c.includes(b));
    const newHasB = newLower.some(c => c.includes(b));
    const prevHasA = prevLower.some(c => c.includes(a));

    if ((newHasA && prevHasB) || (newHasB && prevHasA)) {
      return `Suspect previously said something about "${a}" but now claims "${b}"`;
    }
  }

  return null;
}

// Analyze speech patterns for suspicion indicators
export interface SpeechAnalysis {
  fillerWordCount: number;
  hesitationIndicators: number;
  overExplanation: boolean;
  defensiveLanguage: boolean;
}

export function analyzeSpeechPatterns(response: string): SpeechAnalysis {
  const lowerResponse = response.toLowerCase();
  
  // Count filler words
  const fillerWords = ['um', 'uh', 'like', 'you know', 'i mean', 'well', 'so', 'basically', 'actually', 'honestly'];
  let fillerWordCount = 0;
  for (const filler of fillerWords) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerResponse.match(regex);
    if (matches) fillerWordCount += matches.length;
  }

  // Hesitation indicators
  const hesitationPatterns = ['...', 'i think', 'i believe', 'maybe', 'perhaps', 'possibly', 'i guess', "i'm not sure"];
  let hesitationIndicators = 0;
  for (const pattern of hesitationPatterns) {
    if (lowerResponse.includes(pattern)) hesitationIndicators++;
  }

  // Over-explanation (very long response or excessive detail)
  const overExplanation = response.length > 300 || response.split(',').length > 5;

  // Defensive language
  const defensivePatterns = ["i didn't do", "i would never", "why would i", "that's ridiculous", "you can't prove", "i swear"];
  const defensiveLanguage = defensivePatterns.some(p => lowerResponse.includes(p));

  return {
    fillerWordCount,
    hesitationIndicators,
    overExplanation,
    defensiveLanguage,
  };
}
