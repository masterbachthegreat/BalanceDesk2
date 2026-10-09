import json, re, textwrap, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'questions')

def t(s):
    s = textwrap.dedent(s).strip('\n')
    paras = re.split(r'\n\s*\n', s)
    return '\n'.join(re.sub(r'\s*\n\s*', ' ', p).strip() for p in paras)

def R(lo, hi, step=1):
    return {'min': lo, 'max': hi, 'step': step}

def C(*vals):
    return {'choices': list(vals)}

def Q(id, ch, topic, text, solution, kind='theory', diff=1, vars=None, compute=None, constraints=None, check=None, tol=None):
    d = {'id': id, 'chapter': ch, 'topic': topic, 'kind': kind, 'difficulty': diff, 'text': t(text), 'solution': t(solution)}
    if vars:
        d['vars'] = vars
        d['compute'] = compute or {}
        if constraints:
            d['constraints'] = constraints
        if check:
            d['check'] = {'vars': check[0], 'expect': check[1]}
            if tol:
                d['check']['tol'] = tol
    return d

def write(rank, title, fname, qs):
    ids = [q['id'] for q in qs]
    assert len(ids) == len(set(ids)), 'dup ids'
    for q in qs:
        q['rank'] = rank
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, fname), 'w') as f:
        json.dump({'rank': rank, 'title': title, 'source': 'Exercises and worked solutions from "Economies, Accounts and Money" (Integrated Edition), rewritten as customer questions.', 'questions': [{k: v for k, v in q.items() if k != 'rank'} for q in qs]}, f, indent=1, ensure_ascii=False)
    print(fname, len(qs), 'questions,', sum(1 for q in qs if 'vars' in q), 'templated')
