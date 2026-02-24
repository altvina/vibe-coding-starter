import { NextResponse } from 'next/server';

function buildAnswer(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      answer: 'Ask me something and I’ll suggest the fastest next step.',
      suggestions: ['Summarize priorities', 'Draft a client update', 'Plan next week'],
    };
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes('status') || lower.includes('update')) {
    return {
      answer:
        'Here’s a quick status pattern: 1) Outcome this week, 2) blockers, 3) next actions, 4) owner + date. Want me to draft one for a specific client?',
      suggestions: ['Draft update for Acme', 'Draft update for Horizon', 'Create weekly template'],
    };
  }

  if (lower.includes('autom') || lower.includes('process')) {
    return {
      answer:
        'Pick one workflow first. I recommend: intake → triage → assignment. If you share the current tool stack, I can outline a minimal automation in steps.',
      suggestions: ['Automate intake form', 'Triage rules', 'Assign owners'],
    };
  }

  if (lower.includes('schedule') || lower.includes('calendar')) {
    return {
      answer:
        'We can reduce meetings by batching updates into a weekly snapshot + async check-in. Want a suggested cadence for clients vs internal?',
      suggestions: ['Client cadence', 'Internal cadence', 'Weekly snapshot format'],
    };
  }

  return {
    answer:
      'Got it. If the goal is speed + clarity: define the outcome, the metric, and the smallest deliverable for this week. What outcome are you targeting?',
    suggestions: ['Define outcome', 'Define metric', 'Define smallest deliverable'],
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const prompt = (body as { prompt?: unknown })?.prompt;
  if (typeof prompt !== 'string') {
    return NextResponse.json(
      { error: 'Missing `prompt`.' },
      { status: 400 },
    );
  }

  const result = buildAnswer(prompt);
  return NextResponse.json(result);
}

