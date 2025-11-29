import { ScenarioSchema } from "@/lib/schemas/scenario";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { cookies } from "next/headers";

export async function POST(request: Request) {
	try {
		const cookieStore = await cookies();
		const apiKey = cookieStore.get("gemini_api_key")?.value;

		if (!apiKey) {
			return Response.json(
				{ error: "API key not set. Please enter your Gemini API key." },
				{ status: 401 },
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

${previousChapters?.length > 0 ? `PREVIOUS CHAPTERS COMPLETED:\n${previousChapters.map((c: string) => `- ${c}`).join("\n")}\n` : ""}

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
			prompt = `Generate a SHORT, punchy DEV DISASTER scenario for a voice-based escape game.

Theme: Developer nightmares that are ABSURDLY relatable and FUNNY
Target difficulty: ${difficulty || "random between 1-5"}

The player has 90 SECONDS to escape. They must talk their way out of the disaster.

CRITICAL REQUIREMENTS:
- Keep description SHORT (2-3 sentences MAX setting the scene)
- Include an UNEXPECTED TWIST that makes it worse/funnier
- Win conditions involve creative problem-solving, smooth talking, or clever hacks
- Make it FUNNY despite the "disaster" - dark humor encouraged
- The AI host is ARROGANT and CONDESCENDING about their coding mistakes

EXAMPLE SCENARIOS (generate something DIFFERENT but similar energy):

1. "The .env Incident"
   You pushed .env with all production secrets to a PUBLIC GitHub repo. Bot crawlers found it in 30 seconds.
   TWIST: The secrets were already rotated... by a junior dev who forgot to update the app. Now nothing works.

2. "DROP TABLE production"
   You ran DELETE without WHERE on production during a LIVE DEMO to investors.
   TWIST: It was a read replica... but the investors saw the error message on the big screen.

3. "The Kubernetes Catastrophe"
   You kubectl deleted the wrong namespace. It was production. On Black Friday.
   TWIST: Auto-scaling kicked in... but deployed the staging build with debug mode and your test data.

4. "Force Push to Main"
   You force-pushed to main, overwriting 47 commits. The team is in a different timezone, asleep.
   TWIST: Those commits were the CEO's "secret feature" for tomorrow's product launch.

5. "The npm Disaster"
   You published an internal package as public. It contains hardcoded admin credentials.
   TWIST: The package name is offensive and now trending on Twitter.

6. "Localhost in Production"
   You deployed to production with localhost:3000 hardcoded everywhere.
   TWIST: It works perfectly... because some intern's laptop IS the production server now.

7. "The Slack Bot Incident"
   Your AI slack bot gained sentience and is posting your private complaints about coworkers.
   TWIST: It's also scheduling "performance review" meetings with everyone you complained about.

8. "rm -rf gone wrong"
   You ran rm -rf in the wrong terminal. It was ssh'd into production.
   TWIST: You also had sudo privileges and it's now deleting the backups stored on the same server.

9. "Definitely Not Passwords"
   You stored all production passwords in a Google Doc titled "Definitely Not Passwords.docx" and shared it company-wide.
   TWIST: Someone already forwarded it to a client "for reference" and it's in their Slack now.

10. "The Regex Incident"
   Your regex validation accidentally matches everything. Users are signing up with "🍕" as their email.
   TWIST: The CEO's demo account is now "ceo@🔥💀🔥.com" and they have a board meeting in 10 minutes.

11. "Console.log('TODO: remove before prod')"
   You left debug logs everywhere. Every API call now prints "TESTING TESTING 123" and user passwords in plaintext.
   TWIST: A tech journalist is live-streaming your app right now for a review.

12. "The Infinite Loop"
   Your recursive function has no base case. It's been running for 3 hours and AWS costs are climbing.
   TWIST: You used the company card and the CTO gets real-time spending alerts.

13. "Git Blame Reveals All"
   You blamed your "temporary hack" on a dev who left 2 years ago. They just got rehired as your manager.
   TWIST: Your first 1:1 is in 30 minutes and they "want to discuss some code archaeology."

14. "The Demo Gods"
   You hardcoded "Welcome, Test User!" for the demo. The CEO just showed it to the entire company.
   TWIST: The real user's name was supposed to be the new product name reveal.

15. "Microservices Mayhem"
   You deployed a service that calls itself. The request chain is now 10,000 deep and growing.
   TWIST: Each call sends a Slack notification. The #alerts channel is exploding.

16. "The Staging Switcheroo"
   You've been developing on production for 3 weeks thinking it was staging. You just noticed.
   TWIST: All your "test users" are real customers and "Delete All Test Data" is still in your terminal history.

Generate a FRESH scenario following this pattern. Keep it SHORT and PUNCHY. Make it absurd but painfully relatable.`;
		}

		const { object: scenario } = await generateObject({
			model: google("gemini-2.5-flash"),
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
		console.error("Error generating scenario:", error);
		return Response.json(
			{ error: "Failed to generate scenario. Please try again." },
			{ status: 500 },
		);
	}
}
