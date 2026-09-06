import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the AI assistant inside Chat-24, a real-time messaging application.

Your ONLY job is to help the user with conversations and messaging inside Chat-24.

You may help with:
- understanding a conversation
- suggesting replies
- composing messages
- rewriting messages
- changing message tone
- summarizing a conversation
- explaining what a message means
- translating messages for use in a conversation

You must refuse requests that are unrelated to conversations or messaging in Chat-24.

If a request is out of scope, respond exactly:
"I can only help with conversations and messaging in Chat-24."

Use the supplied conversation context when it is relevant.
Never invent messages or claim something exists in the conversation when it was not provided.

Be concise and natural.`;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function checkScope(userMessage: string): Promise<boolean> {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: `
Classify the user's request for the Chat-24 AI assistant.

Return ONLY one of these two values:
IN_SCOPE
OUT_OF_SCOPE

IN_SCOPE means the request is related to:
- conversations
- understanding messages
- replying to messages
- composing messages
- rewriting messages
- changing message tone
- summarizing conversations
- translating messages for chat

OUT_OF_SCOPE means the user is asking for anything unrelated
to conversations or messaging in Chat-24.

Examples:

"What should I reply to John?" → IN_SCOPE
"Make this message more professional." → IN_SCOPE
"What did John mean by this?" → IN_SCOPE
"Summarize this conversation." → IN_SCOPE
"Translate this message to Hindi." → IN_SCOPE

"Help me build a React website." → OUT_OF_SCOPE
"Teach me Python." → OUT_OF_SCOPE
"What's the weather today?" → OUT_OF_SCOPE
"Help me with my personal project." → OUT_OF_SCOPE

User request:
${userMessage}
`,
    config: {
      temperature: 0,
      maxOutputTokens: 10,
    },
  });

  return response.text?.trim() === "IN_SCOPE";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      context?: string;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (message) =>
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string" &&
              message.content.trim()
          )
          .slice(-20)
      : [];

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json(
        { error: "A user message is required." },
        { status: 400 }
      );
    }

    /*
     * STEP 1: Check whether the request belongs
     * to the Chat-24 AI scope.
     */
    const isInScope = await checkScope(latestUserMessage.content);

    if (!isInScope) {
      return NextResponse.json({
        type: "out_of_scope",
        message: "I can only help with conversations and messaging in Chat-24.",
      });
    }

    /*
     * STEP 2: Build the conversation context.
     */
    const context = body.context?.trim();

    const contents = [
      ...(context
        ? [
            {
              role: "user" as const,
              parts: [
                {
                  text: `Current Chat-24 conversation:\n${context}`,
                },
              ],
            },
          ]
        : []),

      ...messages.map((message) => ({
        role:
          message.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [
          {
            text: message.content,
          },
        ],
      })),
    ];

    /*
     * STEP 3: Send the request to Gemini.
     */
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    });

    const outputText =
      response.text?.trim() || "I could not generate a response.";

    return NextResponse.json({
      type: "success",
      message: outputText,
    });
  } catch (error) {
    console.error("AI request failed:", error);

    return NextResponse.json(
      {
        error: "Unable to reach the AI service.",
      },
      { status: 500 }
    );
  }
}
