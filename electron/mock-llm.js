// Fake LLM used for automated tests and offline demos.
// Enabled by setting the environment variable BD_MOCK_LLM=1. Never used otherwise.
'use strict';

function enabled() { return process.env.BD_MOCK_LLM === '1'; }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function respond(req) {
  await sleep(200 + Math.random() * 400);
  const last = req.messages[req.messages.length - 1]?.content || '';
  const text = typeof last === 'string' ? last : last.map((p) => p.text || '').join('\n');

  if (req.category === 'customer') {
    const agentLines = text.split('\n').filter((l) => l.startsWith('AGENT:'));
    const lastAgent = agentLines[agentLines.length - 1] || '';
    if (/rude|stupid|idiot/i.test(lastAgent)) {
      return JSON.stringify({ reply: 'Wow, okay. I am done here.', status: 'leaving', mood: -2 });
    }
    if (lastAgent.length > 90) {
      return JSON.stringify({ reply: 'Ahh that makes sense now, thank you so much!', status: 'satisfied', mood: 2 });
    }
    return JSON.stringify({ reply: 'Hmm, could you explain that in a bit more detail?', status: 'continue', mood: 0 });
  }

  if (req.category === 'grading') {
    const long = text.length > 1500;
    return JSON.stringify({
      score: long ? 84 : 61,
      stars: long ? 5 : 3,
      summary: 'Mock grade: the agent addressed the question.',
      strengths: ['Polite tone'],
      issues: long ? [] : ['Explanation was thin'],
      correctAnswer: 'See the reference solution.',
    });
  }

  if (req.category === 'mentor') {
    let out = 'Mock mentor here. You asked: "' + text.slice(-120).replace(/\s+/g, ' ') + '"';
    if (/graph|chart|plot|curve/i.test(text)) {
      out += '\n\nHere is a quick illustration:\n\n```chart\n' + JSON.stringify({
        type: 'line', title: 'Compound growth at 5%', xLabel: 'Year', yLabel: 'Value',
        labels: [0, 1, 2, 3, 4, 5],
        datasets: [{ label: '100 invested', data: [100, 105, 110.25, 115.76, 121.55, 127.63] }],
      }) + '\n```\n\nAnd a function plot:\n\n```chart\n' + JSON.stringify({
        type: 'function', title: 'Demand and supply', xLabel: 'Quantity', yLabel: 'Price', xMin: 0, xMax: 50,
        functions: [{ label: 'Demand', expr: '100 - 2*x' }, { label: 'Supply', expr: '10 + 1.6*x' }],
      }) + '\n```';
    }
    if (/CHAT TRANSCRIPT/.test(JSON.stringify(req.messages))) out += '\n\n(I can see the chat transcript you mentioned.)';
    return out;
  }

  return 'pong';
}

module.exports = { enabled, respond };
