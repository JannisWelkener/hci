import OpenAI from "openai";
import type { CreateUserStoryInput } from "@/lib/validations/user-story";
import { NextResponse } from "next/server";

/**
 * OpenAI Story Generator Service
 *
 * This service uses OpenAI's GPT-4 to generate structured user stories from natural language descriptions.
 * The AI is prompted to follow best practices for user story writing in the "As a [role], I want [action],
 * so that [benefit]" format, and provides acceptance criteria following Agile/Scrum standards.
 */

interface GenerateStoryOptions {
  description: string;
  projectId?: string;
  apiKey: string;
}

interface GeneratedStory {
  title: string;
  user_role: string;
  action: string;
  benefit: string;
  acceptance_criteria: string[];
  priority: "low" | "medium" | "high" | "critical";
  story_points: number;
}

function getOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
  });
}

/**
 * Generate a user story from a description using OpenAI GPT-4
 *
 * @param options - Generation options including description and apiKey
 * @returns Generated user story data
 *
 * @example
 * ```typescript
 * const story = await generateUserStory({
 *   description: "Users need to be able to filter projects by status",
 *   apiKey: "sk-..."
 * })
 * ```
 */
export async function generateUserStory(
  options: GenerateStoryOptions,
): Promise<GeneratedStory> {
  const { description, apiKey } = options;

  if (!apiKey) {
    throw new Error("API key is required");
  }

  // Get OpenAI client with the provided API key
  const openai = getOpenAIClient(apiKey);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Agile coach and product owner who specializes in writing high-quality user stories.
Your task is to convert natural language feature descriptions into well-structured user stories following the format:
"As a [user_role], I want [action], so that [benefit]"

Follow these guidelines:
1. user_role: Should be specific and relevant (e.g., "student", "admin", "project manager", not just "user")
2. action: Should be clear, actionable, and describe what the user wants to do
3. benefit: Should explain the value or reason why the user wants this feature
4. title: Create a concise, descriptive title (3-8 words)
5. acceptance_criteria: Provide 3-6 specific, testable acceptance criteria using Given-When-Then or bullet format
6. priority: Assess urgency/importance (low, medium, high, critical)
7. story_points: Estimate complexity using Fibonacci (1, 2, 3, 5, 8, 13)

Respond ONLY with valid JSON in this exact structure:
{
  "title": "string",
  "user_role": "string",
  "action": "string",
  "benefit": "string",
  "acceptance_criteria": ["string", "string", ...],
  "priority": "low" | "medium" | "high" | "critical",
  "story_points": number
}`,
        },
        {
          role: "user",
          content: `Generate a user story for this feature description:\n\n${description}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsedStory = JSON.parse(content) as GeneratedStory;

    // Validate the response structure
    if (!validateGeneratedStory(parsedStory)) {
      throw new Error("Invalid story structure from OpenAI");
    }

    return parsedStory;
  } catch (error) {
    console.error("OpenAI API error:", error);

    // Handle OpenAI SDK errors with proper error extraction
    if (error instanceof OpenAI.APIError) {
      // Extract error details from OpenAI API error
      const errorCode = error.code || "unknown";
      const errorMessage = error.message || "Unknown OpenAI error";
      console.log(`OpenAI error (${errorCode}): ${errorMessage}`);
      throw new Error(`OpenAI error (${errorCode}): ${errorMessage}`);
    }

    // If OpenAI fails, throw a meaningful error
    if (error instanceof Error) {
      console.log(`Failed to generate story: ${error.message}`);
      throw new Error(`Failed to generate story: ${error.message}`);
    }
    console.log("Failed to generate story with AI Fallback");
    throw new Error("Failed to generate story with AI");
  }
}

/**
 * Validate generated story meets minimum requirements
 */
export function validateGeneratedStory(story: GeneratedStory): boolean {
  return !!(
    story.title &&
    story.user_role &&
    story.action &&
    story.benefit &&
    story.acceptance_criteria.length > 0 &&
    story.priority &&
    story.story_points > 0
  );
}

/**
 * Convert generated story to CreateUserStoryInput format
 */
export function storyToInput(
  story: GeneratedStory,
  description: string,
): CreateUserStoryInput {
  return {
    title: story.title,
    user_role: story.user_role,
    action: story.action,
    benefit: story.benefit,
    description: description,
    acceptance_criteria: story.acceptance_criteria,
    priority: story.priority,
    story_points: story.story_points,
    generation_method: "ai_generated" as const,
    dependencies: [],
    status: "backlog" as const,
  };
}
