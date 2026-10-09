from qlib import *
qs = []
# ---------------- Chapter 11 ----------------
qs.append(Q('c11-e01', 11, 'Types of data sets', '''
Is each of these cross-sectional, time series or panel data, and what are the units? (a) Germany's monthly
unemployment rate since 1991; (b) the 2023 annual reports of all firms in Malaysia's KLCI index; (c) the credit scores
of the same 5,000 borrowers measured every quarter for three years.''', '''
(a) Time series — the unit is Germany, observed monthly. (b) Cross-section — units are firms. (c) Panel — units are
borrowers, observed quarterly.'''))
qs.append(Q('c11-e02', 11, 'Estimands and representativeness', '''
Our bank wants to know how likely it is that loans to small restaurants will default. We have records of every
restaurant loan we made in the past five years. What exactly should we be estimating, and why might our records not
represent the loans we'll make next year?''', '''
Estimand: the probability that a loan of the kind the bank will make to small restaurants next year defaults within a
stated horizon (e.g. two years). The records may not be representative because (i) lending standards or the
applicant pool may change; (ii) the past five years had particular conditions (pandemic, boom) that may not recur;
(iii) recent loans haven't had time to default, so default rates computed from them are too low.''', diff=2))
qs.append(Q('c11-e03', 11, 'Survivorship bias', '''
A fund database shows the ten-year returns of the 200 equity funds that exist today: they averaged {a}% a year.
Fifty other funds closed during the period, averaging {b}% while open. Why does {a}% overstate what I could have
expected from picking a fund ten years ago?''', '''
Ten years ago you could have picked any of the 250 funds, including those that later closed (usually for poor
performance). Including them — crudely, 0.8 × {a} + 0.2 × {b} = {=0.8*a+0.2*b:2}% — shows the size of the survivorship
bias: the database only shows the winners that survived.''',
kind='calc', vars={'a': R(6, 10, 0.5), 'b': R(-2, 3, 0.5)}, compute={}, check=({'a': 7.5, 'b': 2}, {})))
qs.append(Q('c11-e04', 11, 'Survey weights', '''
A survey sampled {ns} small firms and {nl} large firms, but large firms are only {pl}% of all firms. Mean employment
growth was {gs}% among small firms and {gl}% among large ones. What's the unweighted mean growth and the properly
weighted mean across firms? What would I weight by to get employment growth for the whole economy?''', '''
Unweighted: ({ns} × {gs} + {nl} × {gl})/{=ns+nl} = {=(ns*gs+nl*gl)/(ns+nl):2}%. Weighted by population shares:
{=1-pl/100:2} × {gs} + {=pl/100:2} × {gl} = {=(1-pl/100)*gs+pl/100*gl:2}%. For aggregate employment growth, weight each firm by its
initial employment — large firms employ many workers, so that figure would be much closer to {gl}%.''',
kind='calc', vars={'ns': R(300, 500, 50), 'nl': R(80, 150, 10), 'pl': R(3, 10), 'gs': R(0, 2, 0.5), 'gl': R(3, 7)}, compute={},
check=({'ns': 400, 'nl': 100, 'pl': 5, 'gs': 1, 'gl': 6}, {})))
qs.append(Q('c11-e05', 11, 'Mean, median, quartiles and outliers', '''
For the data 4, 7, 7, 9, 12, 15, 30: what are the mean, median, mode, quartiles (halves rule, excluding the median),
IQR and sample standard deviation? Is anything an outlier by the 1.5 × IQR rule?''', '''
Mean 84/7 = 12; median 9; mode 7. Q1 = median of (4, 7, 7) = 7; Q3 = median of (12, 15, 30) = 15; IQR = 8. Squared
deviations sum to 456, s² = 456/6 = 76, s = 8.72. Upper fence 15 + 12 = 27, so 30 is an outlier.''', kind='calc'))
qs.append(Q('c11-e06', 11, 'z-scores', '''
Firm A has a return on assets of {a}% in an industry with mean {ma}% and standard deviation {sa}%. Firm B has ROA of
{b}% in an industry with mean {mb}% and standard deviation {sb}%. Which is more exceptional relative to its industry?''', '''
z_A = ({a} − {ma})/{sa} = {za:2}; z_B = ({b} − {mb})/{sb} = {zb:2}. Firm {?za>zb|A|B} is more exceptional relative to its industry
(raw ROA isn't comparable across industries with different spreads).''',
kind='calc', vars={'a': R(7, 12), 'ma': R(4, 6), 'sa': R(1, 3), 'b': R(12, 18), 'mb': R(9, 11), 'sb': R(2, 5)}, compute={'za': '(a-ma)/sa', 'zb': '(b-mb)/sb'},
constraints=['abs((a-ma)/sa-(b-mb)/sb)>0.2'], check=({'a': 9, 'ma': 5, 'sa': 2, 'b': 14, 'mb': 10, 'sb': 4}, {'za': 2, 'zb': 1})))
qs.append(Q('c11-e07', 11, 'Mean or median?', '''
Should I use the mean or the median for each of these, and why? (a) the typical house price in a city; (b) total
household spending in a country; (c) the typical time to find a job after a layoff.''', '''
(a) Median — house prices are right-skewed. (b) Mean (or the total itself) — the total equals the mean times the number
of households. (c) Median — durations are right-skewed, with a few very long spells.'''))
qs.append(Q('c11-e08', 11, 'Income shares and percentile ratios', '''
In a group of ten people, incomes are 5, 8, 10, 12, 15, 18, 20, 25, 37 and 50. What share of total income goes to the
top 10% and the top 20%, and what's the 90/10 ratio (using the ninth and first values)?''', '''
Total income 200. Top 10% (one person): 50/200 = 25%. Top 20%: 87/200 = 43.5%. P90/P10 = 37/5 = 7.4.''', kind='calc'))
qs.append(Q('c11-e09', 11, 'Missing data (MCAR, MAR, MNAR)', '''
In our household finance survey, 30% of households refuse to report their wealth. Can you give an example of MCAR,
MAR and MNAR here, and how each would affect a mean-wealth estimate computed from respondents only?''', '''
MCAR: a random batch of forms was lost — no bias, just less precision. MAR: older households decline more often and
age is observed — the respondents-only mean is biased if wealth varies with age, but reweighting by age fixes it.
MNAR: the wealthiest decline because of their wealth — the mean is understated, and correcting it needs assumptions or
outside data (e.g. tax records).''', diff=2))
qs.append(Q('c11-e10', 11, 'Misleading charts', '''
Two charts in our annual report: one shows our share price rising from 98 to 102 over a month, with the vertical axis
running from 97 to 103. The other shows our cumulative number of customers since founding. What impression might
each give, and how should we redraw them honestly?''', '''
The truncated axis makes a 4% rise look like a surge — use a meaningful baseline or show percentage changes. A
cumulative chart can only rise, hiding any slowdown or customer losses — plot customers at each date (a stock) or new
customers per period (a flow) instead.'''))
# ---------------- Chapter 12 ----------------
qs.append(Q('c12-e01', 12, 'Addition rule', '''
In our region {e}% of firms export, {i}% import and {b}% do both. What share export or import? What share do neither?''', '''
P(E ∪ I) = {e} + {i} − {b} = {=e+i-b}%; neither: {=100-e-i+b}%.''',
kind='calc', vars={'e': R(20, 40), 'i': R(15, 35), 'b': R(5, 15)}, constraints=['b<min(e,i)'], compute={}, check=({'e': 30, 'i': 20, 'b': 12}, {})))
qs.append(Q('c12-e02', 12, 'Counting: permutations and combinations', '''
(a) How many ways can an analyst rank {k} of {n} funds in order? (b) How many committees of {c} can be chosen from {d}
directors? (c) What's the probability that a random committee of {c} includes both of two particular directors?''', '''
(a) P({n}, {k}) = {=perm(n,k)}. (b) C({d}, {c}) = {=comb(d,c)}. (c) Committees with both: choose the other {=c-2} from {=d-2}:
C({=d-2}, {=c-2}) = {=comb(d-2,c-2)}; probability {=comb(d-2,c-2)}/{=comb(d,c)} = {=comb(d-2,c-2)/comb(d,c):4}.''',
kind='calc', vars={'n': R(8, 15), 'k': R(3, 5), 'd': R(7, 12), 'c': R(3, 5)}, constraints=['c<d'], compute={'pr': 'comb(d-2,c-2)/comb(d,c)'},
check=({'n': 12, 'k': 5, 'd': 9, 'c': 4}, {'pr': 0.16667})))
qs.append(Q('c12-e03', 12, 'Conditional probability from a two-way table', '''
Of {N} small-business loans, {c} were to firms with collateral and {dc} of those defaulted. Of the rest (no
collateral), {dn} defaulted. What are P(default), P(default | collateral) and P(collateral | default)? Are default and
collateral independent?''', '''
P(D) = {=dc+dn}/{N} = {=(dc+dn)/N:3}; P(D | C) = {dc}/{c} = {=dc/c:3}; P(C | D) = {dc}/{=dc+dn} = {=dc/(dc+dn):3}. Not independent:
P(D | C) ≠ P(D).''',
kind='calc', vars={'N': C(400, 500, 600), 'c': R(150, 250, 50), 'dc': R(5, 15), 'dn': R(30, 60, 5)}, compute={}, constraints=['dc/c<(dc+dn)/N-0.01'],
check=({'N': 500, 'c': 200, 'dc': 10, 'dn': 45}, {})))
qs.append(Q('c12-e04', 12, 'Independence and redundancy', '''
Our payment system has {k} independent servers, each available {a}% of the time, and it works if at least one is up.
What's the probability the whole system is down? And what if the servers share a building, so that whenever one fails
they all fail together with probability 0.5%?''', '''
Independent: ({=1-a/100:3})^{k} = {=(1-a/100)^k:s3}. With a common failure mode, simultaneous failure has probability of at least
0.005 × P(one fails) ≈ {=1-a/100:3} × 0.005 = {=(1-a/100)*0.005:s3} — vastly larger. Redundancy only protects against
independent failures.''',
kind='calc', vars={'k': R(3, 6), 'a': C(98, 99, 99.5)}, compute={}, check=({'k': 5, 'a': 99}, {})))
qs.append(Q('c12-e05', 12, 'Law of total probability', '''
Next year the economy is in recession with probability {p}. Our sales fall with probability {a} in a recession and {b}
otherwise. What's the probability our sales fall?''', '''
P(fall) = {a} × {p} + {b} × {=1-p:2} = {=a*p+b*(1-p):4}.''',
kind='calc', vars={'p': R(0.1, 0.3, 0.05), 'a': R(0.5, 0.9, 0.1), 'b': R(0.1, 0.3, 0.05)}, compute={'r': 'a*p+b*(1-p)'}, check=({'p': 0.15, 'a': 0.7, 'b': 0.2}, {'r': 0.275})))
qs.append(Q('c12-e06', 12, "Bayes' rule", '''
A leading indicator signals "recession" in {h}% of the years that precede a recession and in {f}% of the years that
don't. Recessions follow {p}% of years. If the indicator signals, what's the probability of a recession?''', '''
P(R | S) = {=h/100} × {=p/100}/({=h/100} × {=p/100} + {=f/100} × {=1-p/100}) = {post:3}.''',
kind='calc', vars={'h': R(60, 90, 5), 'f': R(5, 20, 5), 'p': R(10, 30, 5)}, compute={'post': '(h/100*p/100)/(h/100*p/100+f/100*(1-p/100))'},
check=({'h': 70, 'f': 10, 'p': 20}, {'post': 0.636})))
qs.append(Q('c12-e07', 12, 'Base rates: fraud detection', '''
One card transaction in {n} is fraudulent. Our detection system flags {s}% of fraudulent transactions and {fp}% of
legitimate ones. What proportion of flagged transactions are actually fraudulent? What would we need to change to get
that up to one half?''', '''
P(fraud | flag) = {=s/100} × (1/{n})/({=s/100} × (1/{n}) + {=fp/100} × (1 − 1/{n})) = {=s/100/n/(s/100/n+fp/100*(1-1/n))*100:1}%. To reach one half the
false-positive rate must fall to about {=s/100/n*100:3}% (roughly the true-positive mass), or the system must be applied only to
transactions with a much higher base rate of fraud.''',
kind='calc', diff=2, vars={'n': C(500, 1000, 2000), 's': R(90, 99), 'fp': R(1, 5)}, compute={'pp': 's/100/n/(s/100/n+fp/100*(1-1/n))'},
check=({'n': 1000, 's': 95, 'fp': 2}, {'pp': 0.0454})))
qs.append(Q('c12-e08', 12, 'Bayesian updating with odds', '''
I think there's a {p}% chance a company will cut its dividend. It just announced a delay in its results, which happens
with probability {a} before dividend cuts and {b} otherwise. Using odds, what's the updated probability? Then a second,
independent warning sign with likelihood ratio 2 appears. What's the probability now?''', '''
Prior odds {=p/(100-p):3}; likelihood ratio {a}/{b} = {=a/b:2}; posterior odds {=p/(100-p)*a/b:3} → probability {=p/(100-p)*a/b/(1+p/(100-p)*a/b)*100:1}%.
Second sign: odds {=2*p/(100-p)*a/b:3} → probability {=2*p/(100-p)*a/b/(1+2*p/(100-p)*a/b)*100:1}%.''',
kind='calc', diff=2, vars={'p': R(15, 40, 5), 'a': R(0.4, 0.8, 0.1), 'b': R(0.1, 0.25, 0.05)}, compute={'o': 'p/(100-p)*a/b'},
check=({'p': 25, 'a': 0.6, 'b': 0.15}, {'o': 1.3333})))
qs.append(Q('c12-e09', 12, 'The prosecutor\'s fallacy', '''
Our auditor says: "Only 1% of honest firms have revenue patterns like this one's, so there's a 99% chance this firm is
committing fraud." What's wrong with that, and what extra information would we need?''', '''
It confuses P(pattern | honest) = 0.01 with P(honest | pattern). You need the base rate of fraud and the probability
of the pattern among fraudulent firms. E.g. if 1 firm in 500 commits fraud and 50% of frauds show the pattern,
P(fraud | pattern) = 0.001/(0.001 + 0.01 × 0.998) ≈ 9%.''', diff=2))
qs.append(Q('c12-e10', 12, 'Correlated defaults', '''
A structured bond pays off unless both of two loans default. Each loan defaults with probability {p}. What's the
probability of loss if defaults are independent? If instead the probability the second defaults given that the first
does is {q}, what's the probability of loss? How many times riskier is that?''', '''
Independent: {p}² = {=p^2:5}. Correlated: {p} × {q} = {=p*q:4} — {=q/p:1} times riskier. Ratings that assumed independence would
badly understate the risk.''',
kind='calc', vars={'p': C(0.02, 0.05, 0.1), 'q': C(0.3, 0.5, 0.7)}, compute={}, check=({'p': 0.05, 'q': 0.5}, {})))
# ---------------- Chapter 13 ----------------
qs.append(Q('c13-e01', 13, 'Expectation and variance', '''
A payoff X is 0 with probability {p0}, {a} with probability {pa}, and {b} with the remaining probability. What are E[X],
Var(X) and the standard deviation?''', '''
E[X] = {pa} × {a} + {=1-p0-pa:2} × {b} = {m:2}. E[X²] = {=pa*a^2+(1-p0-pa)*b^2:2}. Var = E[X²] − E[X]² = {v:2}; σ = {=sqrt(v):2}.''',
kind='calc', vars={'p0': C(0.4, 0.5, 0.6), 'pa': C(0.2, 0.3), 'a': R(50, 150, 50), 'b': R(200, 300, 50)}, constraints=['1-p0-pa>0'],
compute={'m': 'pa*a+(1-p0-pa)*b', 'v': 'pa*a^2+(1-p0-pa)*b^2-(pa*a+(1-p0-pa)*b)^2'}, check=({'p0': 0.5, 'pa': 0.3, 'a': 100, 'b': 200}, {'m': 70, 'v': 6100})))
qs.append(Q('c13-e02', 13, 'Linear transformations of random variables', '''
Our profit is Π = {a}Q − {b}, where Q is random with mean {m} and standard deviation {s}. What are the mean and
standard deviation of profit?''', '''
E[Π] = {a} × {m} − {b} = {=a*m-b}; σ_Π = {a} × {s} = {=a*s} (the constant shifts the mean but not the spread).''',
kind='calc', vars={'a': R(2, 6), 'b': R(20, 100, 10), 'm': R(30, 60, 5), 's': R(5, 15)}, compute={}, check=({'a': 3, 'b': 50, 'm': 40, 's': 10}, {})))
qs.append(Q('c13-e03', 13, "Jensen's inequality and certainty equivalents", '''
I have wealth of {w} and log utility. I'm offered a bet that raises my wealth to {hi} or lowers it to {lo} with equal
probability. What's my expected wealth, expected utility and certainty equivalent? Should I take it?''', '''
Expected wealth = {=(hi+lo)/2}. Expected utility = 0.5 ln {hi} + 0.5 ln {lo} = {eu:4}. Certainty equivalent = e^{eu:4} = {ce:2}.
{?ce<w|It's below current wealth {w}, so decline — even though the bet has a positive expected value, risk aversion outweighs it.|It's above current wealth {w}, so accept.}''',
kind='calc', vars={'w': C(100), 'hi': R(130, 170, 10), 'lo': R(55, 80, 5)}, compute={'eu': '0.5*ln(hi)+0.5*ln(lo)', 'ce': 'exp(0.5*ln(hi)+0.5*ln(lo))'},
constraints=['(hi+lo)/2>w', 'abs(exp(0.5*ln(hi)+0.5*ln(lo))-w)>1'], check=({'w': 100, 'hi': 150, 'lo': 60}, {'ce': 94.87})))
qs.append(Q('c13-e04', 13, 'Volatility drag', '''
Two funds both have an expected annual return of {m}%, but their volatilities are {s1}% and {s2}%. Roughly what's the
long-run compound return of each? What does that mean for comparing funds by their average returns?''', '''
Compound ≈ μ − σ²/2: {m}% − {=s1^2/200:2}% = {=m-s1^2/200:2}% and {m}% − {=s2^2/200:2}% = {=m-s2^2/200:2}%. Arithmetic averages overstate
long-run growth, more so for volatile funds — compare compound returns.''',
kind='calc', vars={'m': R(6, 10), 's1': R(5, 15, 5), 's2': R(25, 40, 5)}, compute={}, check=({'m': 8, 's1': 10, 's2': 30}, {})))
qs.append(Q('c13-e05', 13, 'Iterated expectations', '''
Our loan losses are {n}% of loans in a normal year and {r}% in a recession year. The probability of a recession is
{p}. What's the expected loss rate?''', '''
E[loss] = {=1-p:2} × {n} + {p} × {r} = {=(1-p)*n+p*r:3}%.''',
kind='calc', vars={'n': R(0.5, 2, 0.5), 'r': R(4, 8), 'p': R(0.1, 0.25, 0.05)}, compute={'e': '(1-p)*n+p*r'}, check=({'n': 1, 'r': 6, 'p': 0.15}, {'e': 1.75})))
qs.append(Q('c13-e06', 13, 'Binomial distribution', '''
I make {n} independent sales calls, each ending in a sale with probability {p}. What are the probabilities of no sales,
exactly {k} sales, and at least one sale? And the mean and variance of sales?''', '''
P(0) = {=1-p:2}^{n} = {p0:s3}. P({k}) = C({n},{k}) × {p}^{k} × {=1-p:2}^{=n-k} = {pk:s3}. P(≥ 1) = 1 − {p0:s3} = {=1-p0:4}.
Mean = np = {=n*p:2}; variance = np(1 − p) = {=n*p*(1-p):2}.''',
kind='calc', vars={'n': R(6, 15), 'p': R(0.1, 0.5, 0.05), 'k': R(2, 4)}, compute={'p0': '(1-p)^n', 'pk': 'comb(n,k)*p^k*(1-p)^(n-k)'},
check=({'n': 10, 'p': 0.3, 'k': 3}, {'p0': 0.0282, 'pk': 0.2668})))
qs.append(Q('c13-e07', 13, 'Poisson distribution', '''
Claims on our small insurance book arrive at an average of {l} per month. What's the probability of no claims in a
month, and of more than {k} claims?''', '''
P(0) = e^−{l} = {=exp(-l):4}. P(≤ {k}) = e^−{l} × Σ {l}^j/j! for j = 0…{k} = {cdf:4}, so P(> {k}) = {=1-cdf:4}.''',
kind='calc', vars={'l': R(2, 5), 'k': R(4, 7)}, compute={'cdf': 'exp(-l)*(1+l+l^2/2+l^3/6+l^4/24+(k>=5)*l^5/120+(k>=6)*l^6/720+(k>=7)*l^7/5040)'},
check=({'l': 3, 'k': 5}, {'cdf': 0.9161})))
qs.append(Q('c13-e08', 13, 'Normal distribution', '''
Monthly household spending is normal with mean {m} and standard deviation {s}. What proportion of households spend more
than {x}? Below what amount do {q}% of households spend?''', '''
z = ({x} − {m})/{s} = {=(x-m)/s:3}; P(X > {x}) = 1 − Φ({=(x-m)/s:3}) = {=(1-ncdf((x-m)/s))*100:1}%. {q}th percentile =
{m} + z_{=q/100:2} × {s} = {m} + {=ninv(q/100):3} × {s} = {=m+ninv(q/100)*s:0}.''',
kind='calc', vars={'m': R(2000, 4000, 250), 's': R(400, 800, 100), 'd': C(800, 1000, 1200), 'q': C(75, 90, 95)}, compute={'x': 'm+d', 'pc': 'm+ninv(q/100)*s'},
check=({'m': 3000, 's': 600, 'd': 1000, 'q': 90}, {'x': 4000, 'pc': 3769}), tol=0.001))
qs.append(Q('c13-e09', 13, 'Value at risk', '''
Our trading portfolio is worth {V} million and its daily returns are normal with mean 0 and standard deviation {s}%.
What's the {a}% one-day VaR in currency? Why might the true {a}% loss be bigger?''', '''
z for {a}% = {=-ninv(a/100):3}. VaR = {=-ninv(a/100):3} × {s}% = {=-ninv(a/100)*s:2}% of {V} million = {var:2} million. Fat tails and volatility
clustering make extreme losses more likely than the normal model predicts, especially in turbulent periods.''',
kind='calc', vars={'V': R(20, 100, 10), 's': R(0.8, 2.0, 0.1), 'a': C(1, 5)}, compute={'var': '-ninv(a/100)*s/100*V'},
check=({'V': 50, 's': 1.2, 'a': 1}, {'var': 1.40}), tol=0.01))
qs.append(Q('c13-e10', 13, 'Lognormal prices', '''
The log of a share's price in a year is normal with mean ln {P} + {m} and standard deviation {s}. What are the median
and mean of the price in a year?''', '''
Median = e^(ln {P} + {m}) = {P}e^{m} = {=P*exp(m):2}. Mean = {P}e^({m} + {s}²/2) = {P}e^{=m+s^2/2:4} = {=P*exp(m+s^2/2):2} — above the median
because the lognormal is right-skewed.''',
kind='calc', vars={'P': R(50, 200, 10), 'm': C(0.03, 0.05, 0.08), 's': C(0.2, 0.3, 0.4)}, compute={'mean': 'P*exp(m+s^2/2)'},
check=({'P': 100, 'm': 0.05, 's': 0.3}, {'mean': 109.97})))
# ---------------- Chapter 14 ----------------
qs.append(Q('c14-e01', 14, 'Covariance and correlation', '''
Two assets return (−5, 8, 15)% and (2, 4, 12)% in three equally likely states. What are the means, variances,
covariance and correlation?''', '''
Means 6 and 6. Deviations (−11, 2, 9) and (−4, −2, 6). Variances 206/3 = 68.67 and 56/3 = 18.67. Covariance
(44 − 4 + 54)/3 = 31.33. Correlation 31.33/√(68.67 × 18.67) = 31.33/35.80 = 0.875.''', kind='calc'))
qs.append(Q('c14-e02', 14, 'Sample correlation', '''
What's the sample correlation between x = (1, 2, 3, 4, 5) and y = (2, 4, 5, 4, 5)?''', '''
x̄ = 3, ȳ = 4; Σ(x − x̄)(y − ȳ) = 6; Σ(x − x̄)² = 10; Σ(y − ȳ)² = 6. r = 6/√60 = 0.775.''', kind='calc'))
qs.append(Q('c14-e03', 14, 'Two-asset portfolio risk', '''
Two assets have standard deviations {s1}% and {s2}% and correlation {r}. What's the standard deviation of an
equal-weighted portfolio? What would it be if the correlation were −1?''', '''
Cov = {r} × {s1} × {s2} = {=r*s1*s2}. Variance = 0.25 × {=s1^2} + 0.25 × {=s2^2} + 2 × 0.25 × {=r*s1*s2} = {v:2}; σ = {=sqrt(v):2}%.
With ρ = −1: variance = 0.25({s1} − {s2})² = {=0.25*(s1-s2)^2:2}, σ = {=abs(s1-s2)/2:2}%.''',
kind='calc', vars={'s1': R(15, 30, 5), 's2': R(5, 15, 5), 'r': C(0.2, 0.3, 0.5, 0.7)}, compute={'v': '0.25*s1^2+0.25*s2^2+0.5*r*s1*s2'},
check=({'s1': 20, 's2': 10, 'r': 0.5}, {'v': 175})))
qs.append(Q('c14-e04', 14, 'Minimum-variance portfolio', '''
Two assets have volatilities {s1}% and {s2}% and correlation {r}. What weight in the first asset minimises portfolio
variance, and what's the resulting volatility?''', '''
σ₁₂ = {r} × {=s1/100} × {=s2/100} = {c:5}. w* = (σ₂² − σ₁₂)/(σ₁² + σ₂² − 2σ₁₂) = {w:4}. Variance = w²σ₁² + (1 − w)²σ₂² + 2w(1 − w)σ₁₂
= {v:5}; volatility = {=sqrt(v)*100:2}%{?sqrt(v)*100<min(s1,s2)| — below both assets'|}.''',
kind='calc', diff=2, vars={'s1': R(20, 30, 5), 's2': R(10, 20, 5), 'r': C(-0.3, -0.2, 0, 0.2)},
compute={'c': 'r*s1/100*s2/100', 'w': '((s2/100)^2-r*s1/100*s2/100)/((s1/100)^2+(s2/100)^2-2*r*s1/100*s2/100)',
         'v': '(((s2/100)^2-r*s1/100*s2/100)/((s1/100)^2+(s2/100)^2-2*r*s1/100*s2/100))^2*(s1/100)^2+(1-((s2/100)^2-r*s1/100*s2/100)/((s1/100)^2+(s2/100)^2-2*r*s1/100*s2/100))^2*(s2/100)^2+2*((s2/100)^2-r*s1/100*s2/100)/((s1/100)^2+(s2/100)^2-2*r*s1/100*s2/100)*(1-((s2/100)^2-r*s1/100*s2/100)/((s1/100)^2+(s2/100)^2-2*r*s1/100*s2/100))*r*s1/100*s2/100'},
check=({'s1': 25, 's2': 15, 'r': -0.2}, {'w': 0.30, 'v': 0.0135})))
qs.append(Q('c14-e05', 14, 'Limits of diversification', '''
Shares each have volatility {s}% and pairwise correlation {r}. What's the volatility of equally weighted portfolios of
1, 5, 25 and infinitely many shares?''', '''
σ_p² = σ²/n + (1 − 1/n)ρσ². n = 1: {s}%. n = 5: {=sqrt((s/100)^2/5+0.8*r*(s/100)^2)*100:1}%. n = 25: {=sqrt((s/100)^2/25+0.96*r*(s/100)^2)*100:1}%.
Limit: √(ρσ²) = {=sqrt(r)*s:1}% — correlated (systematic) risk can't be diversified away.''',
kind='calc', vars={'s': R(25, 45, 5), 'r': C(0.16, 0.25, 0.36)}, compute={'n5': 'sqrt((s/100)^2/5+0.8*r*(s/100)^2)*100'},
check=({'s': 40, 'r': 0.25}, {'n5': 25.3}), tol=0.002))
qs.append(Q('c14-e06', 14, 'Correlated loan losses and capital', '''
Our bank holds {n} equal-sized loans. Each loan's loss rate has standard deviation {s}%. What's the standard deviation
of the portfolio loss rate if losses are (a) independent, (b) correlated with pairwise correlation {r}? What does this
mean for how much capital we need?''', '''
(a) {s}/√{n} = {=s/sqrt(n):2}%. (b) √(σ²/n + (1 − 1/n)ρσ²) = {=sqrt((s/100)^2/n+(1-1/n)*r*(s/100)^2)*100:2}%. Correlation multiplies the risk
(about {=sqrt((s/100)^2/n+(1-1/n)*r*(s/100)^2)*100/(s/sqrt(n)):1}×); capital set assuming independence would be far too small.''',
kind='calc', vars={'n': C(100, 200, 400), 's': R(5, 15, 5), 'r': C(0.1, 0.2, 0.3)}, compute={'b': 'sqrt((s/100)^2/n+(1-1/n)*r*(s/100)^2)*100'},
check=({'n': 100, 's': 10, 'r': 0.2}, {'b': 4.56}), tol=0.002))
qs.append(Q('c14-e07', 14, 'Portfolio variance in matrix form', '''
Weights (0.5, 0.3, 0.2), expected returns (8, 6, 4)%, volatilities (20, 15, 5)%, correlation 0.5 between assets 1 and
2 and zero otherwise. What are the portfolio's expected return and volatility?''', '''
Expected return 0.5 × 8 + 0.3 × 6 + 0.2 × 4 = 6.6%. Variance = 0.25 × 0.04 + 0.09 × 0.0225 + 0.04 × 0.0025 +
2 × 0.5 × 0.3 × 0.5 × 0.2 × 0.15 = 0.016625; volatility 12.9%.''', kind='calc', diff=2))
qs.append(Q('c14-e08', 14, 'Mean–variance allocation', '''
A safe asset returns {rf}% and an equity fund has expected return {m}% and volatility {s}%. With mean–variance
preferences and risk aversion λ, the optimal equity share is (μ − r_f)/(λσ²). What's the optimal fraction in equities
for λ = 2 and λ = 6? If I can't borrow, what do I hold when λ = 1?''', '''
σ² = {=(s/100)^2:4}. λ = 2: w = {=(m-rf)/100:3}/{=2*(s/100)^2:4} = {=(m-rf)/100/(2*(s/100)^2):2}. λ = 6: {=(m-rf)/100/(6*(s/100)^2):2}.
λ = 1: unconstrained w = {=(m-rf)/100/((s/100)^2):2}{?(m-rf)/100/((s/100)^2)>1|; without borrowing, w = 1 (all in equities)|}.''',
kind='calc', vars={'rf': R(1, 4), 'm': R(6, 10), 's': R(15, 22)}, compute={'w2': '(m-rf)/100/(2*(s/100)^2)'}, check=({'rf': 3, 'm': 8, 's': 18}, {'w2': 0.77}), tol=0.01))
qs.append(Q('c14-e09', 14, 'Leverage and capital', '''
A fund has assets of 100 and capital of {k}. Its assets fall in value by {d}%. What happens to its capital and
leverage? Why does leverage make the accuracy of covariance estimates so important?''', '''
Assets fall to {=100-d}; debt is still {=100-k}, so capital falls to {=k-d} — a {=d/k*100:0}% loss — and leverage rises from
{=100/k:1}× to {=(100-d)/(k-d):1}×. With high leverage small losses destroy capital, so underestimated risk (especially
correlations that make positions lose together) is fatal rather than merely costly.''',
kind='calc', vars={'k': R(4, 10), 'd': R(1, 3)}, constraints=['d<k'], compute={}, check=({'k': 4, 'd': 3}, {})))
# ---------------- Chapter 15 ----------------
qs.append(Q('c15-e01', 15, 'Standard errors and sample size', '''
Household monthly spending has standard deviation {s}. What's the standard error of the sample mean with samples of
100, 400 and 1,600? How large a sample do I need for a standard error of {t}?''', '''
SE = σ/√n: {=s/10}, {=s/20}, {=s/40}. For SE = {t}: √n = {s}/{t} = {=s/t}, so n = {=(s/t)^2}.''',
kind='calc', vars={'s': R(400, 1200, 100), 't': C(5, 10, 20)}, compute={}, check=({'s': 800, 't': 10}, {})))
qs.append(Q('c15-e02', 15, 'Confidence interval and t-test', '''
A sample of {n} households has a mean saving rate of {m}% with standard deviation {s} percentage points. What's the
95% confidence interval? Can we reject that the population mean is {h}%?''', '''
SE = {s}/√{n} = {se:3}. CI: {m} ± 1.96 × {se:3} = [{=m-1.96*se:3}, {=m+1.96*se:3}]. t = ({m} − {h})/{se:3} = {=(m-h)/se:2}
→ {?abs((m-h)/se)>1.96|reject {h}% at the 5% level|cannot reject {h}% at the 5% level}.''',
kind='calc', vars={'n': C(100, 400, 900), 'm': R(2.5, 4, 0.1), 's': R(1, 3, 0.5), 'h': C(3)}, compute={'se': 's/sqrt(n)'},
constraints=['abs(abs((m-h)/(s/sqrt(n)))-1.96)>0.1'], check=({'n': 400, 'm': 3.2, 's': 2, 'h': 3}, {'se': 0.1})))
qs.append(Q('c15-e03', 15, 'Confidence interval for a proportion', '''
In a poll of {n} voters, {p}% support a policy. What's the 95% confidence interval? Can we reject that support is 50%?''', '''
SE = √({=p/100:2} × {=1-p/100:2}/{n}) = {se:4}. CI = {p}% ± {=196*se:2} points = [{=p-196*se:1}%, {=p+196*se:1}%].
{?abs(p/100-0.5)/se>1.96|50% lies outside the interval: reject it at 5%.|50% lies inside the interval (t = {=(p/100-0.5)/se:2}): cannot reject it at 5%.}''',
kind='calc', vars={'n': C(600, 1000, 1200, 2000), 'p': R(48, 56)}, constraints=['p!=50', 'abs(abs(p/100-0.5)/sqrt(p/100*(1-p/100)/n)-1.96)>0.15'], compute={'se': 'sqrt(p/100*(1-p/100)/n)'},
check=({'n': 1200, 'p': 52}, {'se': 0.0144}), tol=0.01))
qs.append(Q('c15-e04', 15, 'Small-sample t interval', '''
Nine bank branches cut waiting times after a reorganisation by an average of {m} minutes, with standard deviation {s}
minutes. The t critical value with 8 degrees of freedom is 2.306. What's the 95% confidence interval for the mean
reduction? Is it significantly different from zero?''', '''
SE = {s}/√9 = {=s/3:3}. CI = {m} ± 2.306 × {=s/3:3} = [{=m-2.306*s/3:2}, {=m+2.306*s/3:2}] minutes. t = {=m/(s/3):2}:
{?m-2.306*s/3>0|zero lies outside, so it's significant at 5%|zero lies inside, so it's not significant at 5%}.''',
kind='calc', vars={'m': R(1, 6), 's': R(2, 6)}, constraints=['abs(m-2.306*s/3)>0.1'], compute={}, check=({'m': 4, 's': 3}, {})))
qs.append(Q('c15-e05', 15, 'Difference in means test', '''
In one region, {n1} randomly sampled firms report mean investment growth of {m1}% (s.d. {s1}); in another, {n2} firms
report {m2}% (s.d. {s2}). Is mean growth different between the regions?''', '''
SE = √({=s1^2}/{n1} + {=s2^2}/{n2}) = {se:3}. t = ({m1} − {m2})/{se:3} = {=(m1-m2)/se:2} → {?abs((m1-m2)/se)>1.96|reject equality at the 5% level|cannot reject equality at the 5% level}.''',
kind='calc', vars={'n1': C(300, 500), 'n2': C(300, 400), 'm1': R(3.5, 5, 0.1), 'm2': R(2.5, 4, 0.1), 's1': R(5, 7), 's2': R(4, 6)},
compute={'se': 'sqrt(s1^2/n1+s2^2/n2)'}, constraints=['m1>m2', 'abs(abs((m1-m2)/sqrt(s1^2/n1+s2^2/n2))-1.96)>0.15'],
check=({'n1': 500, 'n2': 400, 'm1': 4.0, 'm2': 3.1, 's1': 6, 's2': 5}, {'se': 0.367}), tol=0.002))
qs.append(Q('c15-e06', 15, 'Mean squared error', '''
Estimator A is unbiased with standard error {a}. Estimator B has bias {b} and standard error {c}. Which has the lower
mean squared error?''', '''
MSE = bias² + variance. A: 0 + {=a^2} = {=a^2}. B: {=b^2} + {=c^2} = {=b^2+c^2}. {?b^2+c^2<a^2|B is more accurate on average despite its bias.|A has the lower MSE.}''',
kind='calc', vars={'a': R(3, 5), 'b': R(1, 3), 'c': R(1, 3)}, constraints=['b^2+c^2!=a^2'], compute={}, check=({'a': 4, 'b': 1, 'c': 2}, {})))
qs.append(Q('c15-e07', 15, 'The delta method', '''
A demand elasticity is estimated at −0.5 with standard error 0.1. I need g(ε) = 1/|ε| — the percentage price rise that
reduces quantity by 1%. What's g, and roughly what's its standard error?''', '''
g(−0.5) = 2. For ε < 0, g(ε) = −1/ε, so |g′(ε)| = 1/ε² = 4; SE ≈ 4 × 0.1 = 0.4. The function is steep near −0.5, so a
0.1 standard error on the elasticity becomes 0.4 on its reciprocal.''', kind='calc', diff=3))
qs.append(Q('c15-e08', 15, 'Sample size and statistical power', '''
How many observations per group would we need to detect a rise in a conversion rate from {p1}% to {p2}% with 80% power
at the 5% level? (Use n ≈ 7.84 × [p₁(1 − p₁) + p₂(1 − p₂)]/(p₂ − p₁)².)''', '''
n ≈ 7.84 × ({=p1/100:2} × {=1-p1/100:2} + {=p2/100:2} × {=1-p2/100:2})/{=((p2-p1)/100)^2:5} = {n:0} per group. Small effects need big samples.''',
kind='calc', diff=2, vars={'p1': R(10, 30, 5), 'd': C(2, 3, 5)}, compute={'p2': 'p1+d', 'n': '7.84*(p1/100*(1-p1/100)+(p1+d)/100*(1-(p1+d)/100))/((d/100)^2)'},
check=({'p1': 20, 'd': 2}, {'n': 6499}), tol=0.002))
qs.append(Q('c15-e09', 15, 'Multiple testing', '''
An analyst backtests {k} trading rules, none of which truly predicts returns, each at the 5% level. How many should
she expect to look significant? What's the probability that at least one does? What threshold would a Bonferroni
correction require?''', '''
Expected false positives {k} × 0.05 = {=k*0.05}. P(at least one) = 1 − 0.95^{k} = {=1-0.95^k:3}. Bonferroni: 0.05/{k} = {=0.05/k:5}
per test (roughly |t| > {=-ninv(0.025/k):1}).''',
kind='calc', vars={'k': C(20, 50, 100)}, compute={'p': '1-0.95^k'}, check=({'k': 50}, {'p': 0.923})))
qs.append(Q('c15-e10', 15, 'Interpreting "not significant"', '''
A study finds a training programme raises earnings by 1.5%, with a 95% confidence interval from −0.5% to 3.5%, and
reports "no significant effect". What can and can't we conclude?''', '''
The data are consistent with anything from a small loss to a 3.5% gain. The study can't rule out zero — but it also
can't rule out an economically meaningful gain. "No significant effect" isn't "no effect"; the study is imprecise.
A larger sample or pooling with other studies is needed.''', diff=2))
write(4, 'Analyst I', 'rank04_analyst_i.json', qs)
