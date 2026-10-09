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
      return JSON.stringify({ messages: ['Ahh that makes sense now', 'thank you so much!'], status: 'satisfied', mood: 2 });
    }
    return JSON.stringify({ reply: "Hmm, I don't get it.", status: 'continue', mood: 0, pushback: true });
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

  if (req.category === 'boss') {
    if (/UNPROMPTED/.test(text)) return JSON.stringify({ reply: 'Hey, just checking in. How is your week going?' });
    const said = text.split('[NEW MESSAGES FROM THE AGENT]')[1] || '';
    const can = (a) => text.includes(`- "${a}"`);
    const warmth = /thank|haha|how are you|weekend|ledger/i.test(said) ? 2 : /stupid|idiot|useless/i.test(said) ? -2 : 0;
    const pickAct = () => {
      if (/rush|more customers|busy/i.test(said) && can('rush')) return { action: 'rush' };
      if (/lighter|fewer/i.test(said) && can('lighter_day')) return { action: 'lighter_day' };
      if (/heavier/i.test(said) && can('heavier_day')) return { action: 'heavier_day' };
      if (/back|return/i.test(said) && can('end_time_off')) return { action: 'end_time_off' };
      if (/time off|day off|vacation|holiday/i.test(said) && can('time_off')) return { action: 'time_off', hours: 24 };
      const m = /@chat\d+/.exec(said);
      if (/transfer|hand/i.test(said) && m && can('transfer')) return { action: 'transfer', chat: m[0] };
      if (/raise/i.test(said) && can('raise')) return { action: 'raise' };
      return { action: 'none' };
    };
    const a = pickAct();
    return JSON.stringify({ reply: a.action === 'none' ? 'Noted. Keep up the good work.' : 'Sure, done.', ...a, warmth });
  }

  if (req.category === 'team') {
    const sys = req.messages[0]?.content || '';
    const ids = [...sys.matchAll(/id "(\w+)"/g)].map((m) => m[1]);
    if (/next 12 hours/.test(sys)) {
      const must = (text.split('MUST include these events:')[1] || '').split('\n').filter((l) => l.startsWith('- '));
      const msgs = must.map((l, i) => ({ who: (/id "(\w+)"/.exec(l) || [])[1] || ids[0], minute: 5 + i, text: /thanks/i.test(l) ? 'thanks for the heads-up about that customer, you were right!' : /warns/i.test(l) ? 'heads up team, just had a really difficult customer' : 'mock team chatter' }));
      if (!msgs.length && ids.length) msgs.push({ who: ids[0], minute: 3, text: 'morning all, coffee number two already' });
      return JSON.stringify({ messages: msgs });
    }
    const said = text.split('\nNew from ').pop() || '';
    const warned = /difficult|careful|watch out|heads up/i.test(said) ? [...said.matchAll(/@chat\d+/g)].map((m) => ({ customer: m[0], why: 'difficult' })) : [];
    return JSON.stringify({ replies: ids.length ? [{ who: ids[0], delaySec: 5, text: warned.length ? 'noted, thanks for the warning!' : 'ha, fair enough' }] : [], diane: /diane/i.test(said), warnedAbout: warned });
  }

  if (req.category === 'concept') {
    return '**The idea** — mock concept explainer.\n\n**How to work it out** — step 1, step 2.\n\n**Mini example** — 2 × 3 = 6.\n\n**Watch out** — units.';
  }

  if (req.category === 'mentor' && /Write your nudge/.test(text)) {
    return 'Think about what one unit of the task costs in terms of the other task. You are close!';
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
