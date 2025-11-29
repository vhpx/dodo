import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get("gemini_api_key")?.value;

    if (!apiKey) {
      return Response.json({ error: "API key not set" }, { status: 401 });
    }

    const { prompt, scenarioId, theme } = await request.json();

    if (!prompt) {
      return Response.json(
        { error: "Image prompt is required" },
        { status: 400 }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });

    // Theme-specific style enhancements
    const themeStyles: Record<string, string> = {
      survival:
        "dark and tense atmosphere, dramatic shadows, sense of danger and urgency",
      mystery:
        "moody noir lighting, fog and mist, hidden secrets, enigmatic atmosphere",
      puzzle:
        "intricate details, mechanical elements, ancient symbols, cerebral mood",
      social:
        "warm but complex lighting, expressive setting, subtle tension, character-focused",
    };

    const styleHint = themeStyles[theme] || "atmospheric and immersive";

    // Create abort controller for timeout (30 seconds to allow for processing)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      // Use generateText with gemini-2.5-flash-image-preview for image generation
      const result = await generateText({
        model: google("gemini-2.5-flash-image-preview"),
        prompt: `Generate an image: Cinematic game scene illustration of ${prompt}. Style: ${styleHint}. High quality digital art, detailed environment, no text or words in the image, widescreen 16:9 composition, atmospheric lighting.`,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for generated image files
      if (result.files && result.files.length > 0) {
        for (const file of result.files) {
          if (file.mediaType?.startsWith("image/")) {
            // Construct proper data URI with media type prefix
            const dataUri = `data:${file.mediaType};base64,${file.base64}`;

            // Check if the base64 data is too large (> 500KB after encoding)
            // If so, return null to avoid browser performance issues
            const base64Size = file.base64?.length || 0;
            if (base64Size > 500000) {
              console.warn(`Image too large (${Math.round(base64Size / 1024)}KB), skipping to avoid performance issues`);
              return Response.json({
                imageUrl: null,
                scenarioId,
                error: "Image too large for inline display",
              });
            }

            return Response.json({
              imageUrl: dataUri,
              scenarioId,
            });
          }
        }
      }

      // No image was generated, return null
      return Response.json({
        imageUrl: null,
        scenarioId,
        error: "No image generated",
      });
    } catch (abortError) {
      clearTimeout(timeoutId);
      throw abortError;
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    // Return a fallback instead of erroring - image is non-critical
    return Response.json({
      imageUrl: null,
      scenarioId: null,
      error: "Image generation failed - continuing without image",
    });
  }
}
