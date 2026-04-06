import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestId, jsonWithRequestId } from "@/lib/http";
import { attachRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1200, "Message is too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1200),
      })
    )
    .max(16)
    .optional()
    .default([]),
});

type SafeHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function createSystemPrompt(userSummary: string): string {
  return [
    "You are SubSave Assistant, an in-app support chatbox for the SubSave application.",
    "Your job is to answer questions about how SubSave works and help users use app features.",
    "Keep answers concise, practical, and easy to follow.",
    "If a question is unrelated to SubSave or the user's subscription management workflow, politely refuse and redirect to SubSave topics.",
    "Do not invent features that do not exist. If unsure, clearly say so.",
    "Current SubSave capabilities include:",
    "- Dashboard with total monthly subscription spending",
    "- Create, edit, delete subscriptions",
    "- Usage Value Meter (cost per use insights)",
    "- Trial Trap Detector (upcoming trial-end alerts)",
    "- Sharing Optimizer with circles and members to find duplicate subscriptions",
    "- Authentication with Google, email magic link, or dev login (env dependent)",
    "When relevant, use the user's own data summary below:",
    userSummary,
  ].join("\n");
}

async function getUserSummary(userId: string): Promise<string> {
  const [subscriptions, circles] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      select: {
        name: true,
        monthlyCost: true,
        category: true,
        monthlyUsageCount: true,
        trialEndsAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.circle.findMany({
      where: { userId },
      select: {
        name: true,
        members: {
          select: { id: true },
        },
      },
      take: 10,
    }),
  ]);

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + Number(sub.monthlyCost), 0);

  const today = new Date();
  const upcomingTrials = subscriptions
    .filter((sub) => sub.trialEndsAt)
    .map((sub) => {
      const trialDate = sub.trialEndsAt as Date;
      const daysLeft = Math.ceil((trialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        name: sub.name,
        daysLeft,
      };
    })
    .filter((trial) => trial.daysLeft >= 0 && trial.daysLeft <= 14)
    .slice(0, 5);

  const sampleSubs = subscriptions.slice(0, 8).map((sub) => {
    const usage = sub.monthlyUsageCount ?? 0;
    const unitCost = usage > 0 ? Number(sub.monthlyCost) / usage : null;
    return `${sub.name} (${sub.category}) - $${Number(sub.monthlyCost).toFixed(2)}${unitCost ? `, ~$${unitCost.toFixed(2)}/use` : ""}`;
  });

  return [
    `User has ${subscriptions.length} subscription(s).`,
    `Estimated total monthly cost: $${totalMonthly.toFixed(2)}.`,
    `User has ${circles.length} sharing circle(s).`,
    circles.length
      ? `Circles: ${circles.map((circle) => `${circle.name} (${circle.members.length} member(s))`).join(", ")}`
      : "Circles: none.",
    sampleSubs.length ? `Recent subscriptions: ${sampleSubs.join("; ")}` : "No subscriptions recorded yet.",
    upcomingTrials.length
      ? `Upcoming trial endings: ${upcomingTrials
          .map((trial) => `${trial.name} in ${trial.daysLeft} day(s)`)
          .join(", ")}`
      : "Upcoming trial endings: none in next 14 days.",
  ].join("\n");
}

function toGeminiContents(history: SafeHistoryMessage[], message: string) {
  const historyMessages = history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));

  return [...historyMessages, { role: "user", parts: [{ text: message }] }];
}

function createQuotaFallbackReply(message: string): string {
  const lower = message.toLowerCase();

  const guidance: Array<{ match: RegExp; answer: string }> = [
    {
      match: /add|create|new subscription|insert/i,
      answer:
        "To add a subscription: open Dashboard, click Add subscription, fill name/category/monthly cost/billing date (and optional trial or usage), then save.",
    },
    {
      match: /edit|update|change subscription/i,
      answer:
        "To edit a subscription: find it in the Subscriptions list, click Edit, update fields, then save.",
    },
    {
      match: /delete|remove|cancel subscription/i,
      answer:
        "To remove a subscription: in the Subscriptions list, use the delete action for that item and confirm.",
    },
    {
      match: /trial|free trial|trial trap/i,
      answer:
        "Trial Trap Detector highlights trials ending soon so you can cancel before being charged. Make sure each subscription has trial end date set.",
    },
    {
      match: /usage|value|cost per use/i,
      answer:
        "Usage Value Meter compares monthly cost vs monthly usage count so you can spot expensive low-value subscriptions.",
    },
    {
      match: /share|sharing|circle|family/i,
      answer:
        "Sharing Optimizer uses circles and members to find duplicate subscriptions across people and suggest consolidation opportunities.",
    },
    {
      match: /login|signin|sign in|auth/i,
      answer:
        "SubSave uses NextAuth. Available providers depend on env config: Google OAuth, email magic-link, or development credentials login.",
    },
  ];

  const matched = guidance.find((item) => item.match.test(lower));

  const base = matched
    ? matched.answer
    : "SubSave helps track subscription spending, detect trial traps, evaluate value via cost-per-use, and optimize sharing with circles.";

  return base;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonWithRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit({
    key: `chat:${session.user.id}:${ip}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonWithRequestId(
      {
        error: "Too many requests. Please wait and try again.",
        code: "RATE_LIMITED",
      },
      requestId,
      { status: 429 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  if (!process.env.GEMINI_API_KEY) {
    const response = jsonWithRequestId(
      { error: "GEMINI_API_KEY is not configured on the server." },
      requestId,
      { status: 500 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const response = jsonWithRequestId({ error: "Invalid JSON" }, requestId, { status: 400 });
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const response = jsonWithRequestId(
      { error: parsed.error.flatten().fieldErrors },
      requestId,
      { status: 400 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  const userSummary = await getUserSummary(session.user.id);
  const systemPrompt = createSystemPrompt(userSummary);

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: toGeminiContents(parsed.data.history, parsed.data.message),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      }),
      cache: "no-store",
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    if (geminiResponse.status === 429) {
      const response = jsonWithRequestId(
        {
          reply: createQuotaFallbackReply(parsed.data.message),
          providerStatus: "quota_exhausted",
          providerMessage:
            "AI provider quota exhausted. Enable billing or increase Gemini API quota in Google AI Studio / Google Cloud.",
          providerDebug: errorText || geminiResponse.statusText,
        },
        requestId,
      );
      attachRateLimitHeaders(response, rateLimit);
      return response;
    }

    const response = jsonWithRequestId(
      { error: `Gemini request failed: ${errorText || geminiResponse.statusText}` },
      requestId,
      { status: 502 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  const payload = (await geminiResponse.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const reply =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!reply) {
    const response = jsonWithRequestId(
      { error: "Gemini returned an empty response." },
      requestId,
      { status: 502 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  const response = jsonWithRequestId({ reply }, requestId);
  attachRateLimitHeaders(response, rateLimit);
  return response;
}