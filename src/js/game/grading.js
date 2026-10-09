// Sonnet grades a finished chat: answer quality (1-100) and service stars (1-5).
import { llmCall, parseJSON } from './llm.js';
import { messageLines, reasonText } from './transcript.js';
import { clamp, cfg } from '../core/state.js';
import { durationWords, waitWords } from '../core/format.js';

const SYSTEM = `You are the quality-assurance grader at Whiterock, a financial-services firm. You review finished customer-support chats in which a support agent (the player of a training game) answered a customer's question about economics, finance, accounting, statistics or mathematics.

Grade two separate things.

1. "score" (integer 1-100): the quality of the agent's ANSWER.
   - Correctness matters most (~60%), then completeness across every part of the question (~20%), then clarity and usefulness of the explanation (~20%).
   - Check the maths and reasoning yourself. The reference solution comes from a textbook answer key: usually right, but it can be incomplete or occasionally wrong. Use your own judgement; accept other valid methods, stated assumptions and reasonable rounding.
   - If the agent fixed an earlier mistake, grade the final position but deduct a little for the error.
   - Guide: never really answered 1-15; wrong core answer below 40 even if well written; correct result with little or no explanation 55-70; correct, complete and clear 85-100.
   - Judge only what the AGENT wrote. Messages sent after the chat ended do not count.

2. "stars" (1-5, halves allowed): the customer-SERVICE rating this customer would give: politeness, empathy, patience, tone, clarity, responsiveness and whether their problem got resolved. Rudeness, ignoring the customer or nonsense = 1-2. Friendly, appropriate emoji use is a small plus; emoji spam is a minus. If the agent closed the chat on an unresolved customer, rate accordingly.

Reply with ONLY a JSON object, no other text:
{"score": <int>, "stars": <number>, "summary": "<1-2 sentences addressed to the agent>", "strengths": ["<short>", ...], "issues": ["<short>", ...], "correctAnswer": "<the correct answer in 1-4 sentences with the key numbers>"}`;

export async function gradeChat(chat) {
  const q = chat.question;
  const cs = chat.cs;
  const lat = cs.latencies.length ? cs.latencies.reduce((s, x) => s + x, 0) / cs.latencies.length : null;
  const user = [
    `Customer: ${chat.customer.name}${chat.customer.vip ? ' (VIP client — high standards)' : ''}`,
    `Topic: ${q.topic}`,
    `Customer's question:\n${q.text}`,
    `Reference solution:\n${q.solution}`,
    `How the chat ended: ${reasonText(chat.endReason)}.`,
    `Agent's average reply time: ${lat === null ? 'n/a' : durationWords(lat)}; the customer had to chase the agent ${cs.nudges || 0} time(s). ${chat.rush ? 'This was a rush-shift live chat: the customer expected replies within minutes.' : `This is an asynchronous messenger: replies within ${waitWords(cfg().world.idealReplyMs)} are normal and good service, so only count slowness against "stars" if the customer had to chase the agent.`}`,
    '',
    'Transcript:',
    ...messageLines(chat),
  ].join('\n');
  const text = await llmCall({
    role: 'smart',
    category: 'grading',
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
    maxTokens: cfg().grading.maxTokens,
    temperature: 0.2,
    chatId: chat.id,
  });
  const g = parseJSON(text);
  const score = Math.round(clamp(Number(g.score) || 1, 1, 100));
  const stars = clamp(Math.round((Number(g.stars) || 1) * 2) / 2, 1, 5);
  return {
    score,
    stars,
    summary: String(g.summary || ''),
    strengths: Array.isArray(g.strengths) ? g.strengths.map(String) : [],
    issues: Array.isArray(g.issues) ? g.issues.map(String) : [],
    correctAnswer: String(g.correctAnswer || ''),
  };
}
