import { z } from 'zod';

export const ScenarioSchema = z.object({
  title: z.string().describe('A catchy, immersive title for the scenario'),
  description: z
    .string()
    .describe(
      '2-3 paragraph vivid description of the situation the player finds themselves in'
    ),
  theme: z.enum(['survival', 'mystery', 'puzzle', 'social']),
  difficulty: z.number().min(1).max(5),
  hints: z
    .array(z.string())
    .length(3)
    .describe('Three progressive hints from vague to specific'),
  winConditions: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe('What the player must achieve or say to escape'),
  imagePrompt: z
    .string()
    .describe(
      'A detailed prompt for generating the scenario image, focusing on atmosphere and setting'
    ),
  challengeType: z
    .string()
    .describe(
      'The type of challenge: logic, persuasion, observation, creativity, etc.'
    ),
  // Extended storytelling fields
  setting: z
    .string()
    .describe('Brief description of the physical location and time period'),
  antagonist: z
    .string()
    .optional()
    .describe('The main obstacle or character opposing the player, if any'),
  keyItems: z
    .array(z.string())
    .max(10)
    .describe('Important objects or clues in the scenario that the player might interact with'),
  atmosphere: z
    .string()
    .describe('One-line mood description: tense, mysterious, urgent, eerie, etc.'),
  openingNarration: z
    .string()
    .describe('A dramatic 2-3 sentence opening that the AI narrator will speak to start the game. Written in second person, present tense. Should immediately immerse the player and end with a question or call to action.'),
});

export type ScenarioOutput = z.infer<typeof ScenarioSchema>;

export const EscapeEvaluationSchema = z.object({
  playerAction: z.string().describe('Summary of what the player said or did'),
  matchesWinCondition: z
    .boolean()
    .describe(
      'Does this action satisfy any win condition? Be fair but require genuine solutions.'
    ),
  conditionMatched: z
    .string()
    .optional()
    .describe('Which win condition was matched, if any. Empty string if none.'),
  narrativeResponse: z
    .string()
    .describe('The in-character narrative response to this action'),
  progressLevel: z
    .number()
    .min(0)
    .max(100)
    .describe('How close is the player to escaping? 0-100 percentage'),
});

export type EscapeEvaluationOutput = z.infer<typeof EscapeEvaluationSchema>;
