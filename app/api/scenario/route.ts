import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { cookies } from 'next/headers';
import { ScenarioSchema } from '@/lib/schemas/scenario';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get('gemini_api_key')?.value;

    if (!apiKey) {
      return Response.json(
        { error: 'API key not set. Please enter your Gemini API key.' },
        { status: 401 }
      );
    }

    const {
      previousThemes,
      difficulty,
      forcedTheme,
      // Campaign-specific parameters
      campaignContext,
    } = await request.json();

    const google = createGoogleGenerativeAI({ apiKey });

    // Build the prompt based on whether this is a campaign chapter or random scenario
    let prompt: string;

    if (campaignContext) {
      const { campaignTitle, chapter, previousChapters } = campaignContext;
      prompt = `Generate a scenario for a campaign chapter in an escape game.

CAMPAIGN: ${campaignTitle}
CHAPTER: ${chapter.title}
SETTING: ${chapter.setting}
OBJECTIVE: ${chapter.objective}
STORY CONTEXT: ${chapter.storyContext}
THEME: ${chapter.theme}
DIFFICULTY: ${chapter.difficulty}/5

${previousChapters?.length > 0 ? `PREVIOUS CHAPTERS COMPLETED:\n${previousChapters.map((c: string) => `- ${c}`).join('\n')}\n` : ''}

Create an immersive scenario that:
1. Fits within the campaign narrative and setting
2. Has the player working toward the chapter's objective
3. Contains clever puzzles or challenges appropriate to the theme
4. Feels connected to the overall story
5. Has 2-3 paragraphs of atmospheric description

The player will interact via voice/text to solve the scenario.

Requirements:
- Win conditions should relate to the chapter objective
- Hints should guide without giving away the answer
- Make it dramatic and engaging
- The description should immerse the player in the setting`;
    } else {
      prompt = `Generate an escape scenario game challenge.

Theme variety: Avoid these recent themes: ${previousThemes?.join(', ') || 'none'}
${forcedTheme ? `Required theme: ${forcedTheme}` : 'Pick a random theme from: survival, mystery, puzzle, social'}
Target difficulty: ${difficulty || 'random between 1-5'}

Create an immersive, solvable scenario that requires creative thinking.
The player will interact via voice/text to figure out how to escape.

Requirements:
- The scenario should be escapable through clever dialogue or actions
- Win conditions should be logical but not immediately obvious
- Hints should guide without giving away the answer
- Make it engaging and dramatic
- Description should be 2-3 paragraphs setting the scene vividly

Examples of good scenarios:
- Trapped in a room with a riddle-loving AI that will only open the door if you solve its puzzle
- Stranded on a desert island with a talking parrot who knows the location of a rescue boat
- Locked in a museum after hours with a night guard you need to convince you're supposed to be there
- In a spaceship with a malfunctioning AI that you need to calm down
- Caught in a time loop at a dinner party where you need to figure out who the imposter is
- Stuck in an elevator with a celebrity who holds the key to your escape`;
    }

    const { object: scenario } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: ScenarioSchema,
      prompt,
    });

    return Response.json({
      scenario: {
        ...scenario,
        id: crypto.randomUUID(),
        imageUrl: null,
        // Include campaign chapter info if applicable
        ...(campaignContext && {
          chapterId: campaignContext.chapter.id,
          campaignId: campaignContext.campaignId,
        }),
      },
    });
  } catch (error) {
    console.error('Error generating scenario:', error);
    return Response.json(
      { error: 'Failed to generate scenario. Please try again.' },
      { status: 500 }
    );
  }
}
