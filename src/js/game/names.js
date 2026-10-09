// Telegram-style display names and @usernames for customers ("jess 🌻", "Tom K.", "mike (work)").
// Deterministic per character. The full name stays in the profile and in what the AI sees.
const NICK = {
  margaret: 'Maggie', william: 'Will', robert: 'Rob', elizabeth: 'Liz', katherine: 'Kate', jennifer: 'Jen', michael: 'Mike',
  thomas: 'Tom', daniel: 'Dan', christopher: 'Chris', alexander: 'Alex', samantha: 'Sam', benjamin: 'Ben', nicholas: 'Nick',
  jessica: 'Jess', patricia: 'Pat', rebecca: 'Becca', victoria: 'Vicky', jonathan: 'Jon', matthew: 'Matt', joseph: 'Joe',
  anthony: 'Tony', timothy: 'Tim', frederick: 'Fred', theodore: 'Theo', eleanor: 'Ellie', samuel: 'Sam', isabelle: 'Izzy',
  penelope: 'Penny', beatrice: 'Bea', gwendolyn: 'Gwen', bernard: 'Bernie', howard: 'Howie', gerald: 'Gerry', nathan: 'Nate',
  spencer: 'Spence', amelia: 'Millie', dylan: 'Dyl', rupert: 'Rupe', graham: 'Gray', brenda: 'Bren', zoe: 'Zo', felix: 'Fee',
};
const EMOJI = {
  student: ['📚', '☕', '🎧', '😴', '🍜', '✨'],
  retired: ['🌷', '🐈', '🧶', '⛳', '🌻'],
  night: ['🌙', '🦉', '🎮'],
  early: ['🌅', '🏃', '☀️'],
  executive: ['📈', '✈️'],
  regular: ['🌻', '🐶', '⚽', '🍕', '🌿', '🎸', '🏔️'],
};
const TITLE = /^(sir|dr\.?|mrs\.?|ms\.?|mr\.?|lord|lady|captain|professor|senator|governor|count|madame|sheikh|sister|detective|grandmaster|grandma|grandpa)$/i;

function hash(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

// Only ordinary "First Last" people get a casual name; characters ("Overthinker Olga", "Big Mike") keep theirs.
const FIRST = new Set('agnes ahmed aisha akira alex amelia arthur beatrice ben bernard brenda charlie chloe clara dana derek dylan elena ellie fatima felix fiona gerald gloria graham gwen hannah hassan howard ingrid isabelle ivan jake jasmine jordan karen kate kenji lena leo linda lucy marcus margaret martha mia moses nathan nora omar oscar paulette penelope pete priya raj rico rosa ruby rupert sam samuel sofia spencer theo tom tyler victoria viktor william yusuf zoe'.split(' '));

function isPlainName(p) {
  const parts = p.name.trim().split(/\s+/);
  return parts.length === 2 && FIRST.has(parts[0].toLowerCase()) && !TITLE.test(parts[0]) && /^[A-Z][a-z'-]+$/.test(parts[1]) && !p.transform && !p.emoji;
}

export function displayFor(p) {
  const h = hash(p.id);
  const parts = p.name.trim().split(/\s+/);
  const slug = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const username = '@' + (h % 3 === 0 ? slug : h % 3 === 1 ? slug.replace(/_/g, '') + (h % 90 + 10) : slug.replace(/^(\w)\w*_/, '$1.'));
  if (!isPlainName(p) || p.vip) return { display: p.name, username };
  const [first, last] = parts;
  const nick = NICK[first.toLowerCase()];
  const emo = (EMOJI[p.schedule] || EMOJI.regular)[h % (EMOJI[p.schedule] || EMOJI.regular).length];
  const casual = p.schedule === 'student' || /lowercase|casual|lol/i.test(p.style || '');
  const formal = p.schedule === 'retired' || p.schedule === 'executive' || /formal|polite/i.test(p.style || '');
  const options = formal
    ? [p.name, p.name, `${first} ${last[0]}.`, `${nick || first} ${last}`]
    : casual
      ? [first.toLowerCase(), `${(nick || first).toLowerCase()} ${emo}`, `${first.toLowerCase()}.${last[0].toLowerCase()}`, `${first} ${emo}`]
      : [p.name, `${first} ${last[0]}.`, `${nick || first} ${emo}`, `${first.toLowerCase()} ${last.toLowerCase()}`, `${first} (work)`, `${nick || first} ${last}`];
  return { display: options[h % options.length], username };
}
