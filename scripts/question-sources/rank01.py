from qlib import *
qs = []
# ---------------- Chapter 1 ----------------
qs.append(Q('c01-e01', 1, 'Opportunity cost', '''
I'm a student. I could work {h} hours a week in a shop at ${w} an hour, or spend those same hours on an unpaid
internship that should raise my starting salary after I graduate. My tuition is ${T} a year and I pay it either way.
What's the weekly opportunity cost of doing the internship? And does the tuition matter for this decision?''', '''
The opportunity cost is the best alternative given up: the shop wage, {h} × {w} = {oc} per week (plus any
non-monetary pros and cons of each option). Tuition is paid under both options, so it does not differ between
them and is irrelevant to this choice; it only matters for the separate decision of whether to study at all.''',
kind='calc', vars={'h': R(10, 25), 'w': R(12, 22), 'T': R(6000, 14000, 500)}, compute={'oc': 'h*w'},
check=({'h': 20, 'w': 15, 'T': 9000}, {'oc': 300})))
qs.append(Q('c01-e02', 1, 'Accounting vs economic profit', '''
I quit a job paying ${S} a year to start my own software firm. In year one the firm had revenue of ${Rv} and paid
${Cst} in salaries, rent and cloud services. I also put ${I} of my own savings into it, which could have earned {r}%
a year elsewhere. What was my accounting profit, and what was my economic profit?''', '''
Accounting profit = revenue − explicit costs = {Rv} − {Cst} = {acct}. Implicit costs = forgone salary {S} +
forgone interest {r}% × {I} = {=r/100*I} → total {imp}. Economic profit = {acct} − {imp} = {econ}.
{?econ>=0|The founder is better off than in the best alternative (ignoring risk and non-money factors).|Negative economic profit: the founder would have been better off staying in the job and investing the savings.}''',
kind='calc', vars={'S': R(60000, 120000, 5000), 'Rv': R(200000, 340000, 10000), 'Cst': R(100000, 200000, 10000), 'I': R(100000, 300000, 25000), 'r': R(3, 7)},
compute={'acct': 'Rv-Cst', 'imp': 'S+r/100*I', 'econ': 'Rv-Cst-S-r/100*I'}, constraints=['Rv-Cst>0'],
check=({'S': 90000, 'Rv': 260000, 'Cst': 150000, 'I': 200000, 'r': 5}, {'acct': 110000, 'econ': 10000})))
qs.append(Q('c01-e03', 1, 'Sunk costs', '''
Our pharma company has already spent {X} million developing a drug. Finishing the trials will cost another {K}
million. If it's approved (probability {p}) the future cash flows are worth {V} million; if not, nothing. Another
company offers to buy the project right now for {s} million. Treat everything as values today and assume we just
maximise expected value. Should we finish the trials or sell? And what role does the {X} million we already spent play?''', '''
Expected value of completing = {p} × {V} − {K} = {ev:1} million, versus {s} million from selling, so the firm should
{?ev>s|complete the trials (better by {=ev-s:1} million)|sell (completing is worse by {=s-ev:1} million)}.
The {X} million already spent is a sunk cost: it is the same whichever option is chosen, so it plays no role in the decision.''',
kind='calc', diff=1, vars={'X': R(200, 500, 50), 'K': R(80, 150, 10), 'p': R(0.4, 0.8, 0.05), 'V': R(200, 350, 10), 's': R(10, 40, 5)},
compute={'ev': 'p*V-K'}, constraints=['abs(p*V-K-s)>=3'],
check=({'X': 300, 'K': 120, 'p': 0.6, 'V': 250, 's': 20}, {'ev': 30})))
qs.append(Q('c01-e04', 1, 'Production possibilities frontier', '''
My econ homework says an economy's production possibilities frontier is F²/100 + M²/25 = 100, where F is food
and M is machines. (a) What's the maximum food output if {M} machines are produced? (b) What's the marginal rate
of transformation at that point?''', '''
(a) F²/100 = 100 − {M}²/25 = {=100-M^2/25:2}, so F² = {=100*(100-M^2/25):0} and F = {F:2}.
(b) Differentiating, dF/dM = −4M/F = −{=4*M}/{F:2} ≈ −{mrt:2}: the MRT is about {mrt:2} units of food per machine,
and it rises as more machines are produced (the frontier is bowed out).''',
kind='calc', diff=2, vars={'M': C(10, 20, 30, 40, 45)}, compute={'F': 'sqrt(100*(100-M^2/25))', 'mrt': '4*M/sqrt(100*(100-M^2/25))'},
check=({'M': 40}, {'F': 60, 'mrt': 2.6667})))
qs.append(Q('c01-e05', 1, 'Comparative advantage', '''
Two of my employees: in one day Anna can write 4 reports or code 2 programs; Ben can write 3 reports or code 3
programs. Output is proportional to time spent. (a) Who has the absolute advantage in each task? (b) What's each
person's opportunity cost of a program? (c) Who should specialise in what, and within what range must the "price"
of a program (in reports) lie for both to gain from trading?''', '''
(a) Anna has the absolute advantage in reports (4 > 3); Ben in programs (3 > 2).
(b) Anna: a program takes half a day, which could produce 2 reports → 2 reports per program. Ben: a program takes a
third of a day, which could produce 1 report → 1 report per program.
(c) Ben has the lower opportunity cost of programs, so he specialises in programs; Anna (whose cost of a report is
1/2 program vs Ben's 1) specialises in reports. Both gain if the price of a program lies strictly between 1 and 2 reports.'''))
qs.append(Q('c01-e07', 1, 'Marginal reasoning', '''
I'm a farmer deciding how much fertiliser to use. Each 10 kg bag costs ${c}. The extra revenue from each successive
bag is 120, 90, 65, 45, 28 and 15. How many bags should I apply, and what's my maximum net gain? And if the price of
a bag went up to ${c2}, how many then?''', '''
Apply bags while marginal benefit exceeds marginal cost. At {c} per bag: {n1} bags, net gain {g1}
(sum of the marginal revenues of those bags minus {n1} × {c}). At {c2} per bag: {n2} bags, net gain {g2}.''',
kind='calc', vars={'c': C(20, 25, 30, 35, 40), 'c2': C(50, 55, 60, 70)},
compute={'n1': '(120>c)+(90>c)+(65>c)+(45>c)+(28>c)+(15>c)', 'g1': '(120>c)*(120-c)+(90>c)*(90-c)+(65>c)*(65-c)+(45>c)*(45-c)+(28>c)*(28-c)+(15>c)*(15-c)',
         'n2': '(120>c2)+(90>c2)+(65>c2)+(45>c2)+(28>c2)+(15>c2)', 'g2': '(120>c2)*(120-c2)+(90>c2)*(90-c2)+(65>c2)*(65-c2)+(45>c2)*(45-c2)+(28>c2)*(28-c2)+(15>c2)*(15-c2)'},
check=({'c': 30, 'c2': 50}, {'n1': 4, 'g1': 200, 'n2': 3, 'g2': 125})))
qs.append(Q('c01-e08', 1, 'Average vs marginal', '''
My grade average after {n} courses is {a}. I just got {g} in my next course. What's my new average, and can you
explain in terms of "marginal vs average" why it moved the way it did?''', '''
Total points before: {n} × {a} = {=n*a:2}. After: {=n*a+g:2} over {=n+1} courses, so the new average is {avg:2}.
The marginal grade ({g}) is {?g>a|above|below} the old average ({a}), so the average {?g>a|rises|falls}: a marginal
value above (below) the average pulls the average up (down).''',
kind='calc', vars={'n': R(3, 7), 'a': R(2.6, 3.6, 0.1), 'g': R(2.0, 4.0, 0.1)}, compute={'avg': '(n*a+g)/(n+1)'}, constraints=['abs(g-a)>=0.3'],
check=({'n': 4, 'a': 3.2, 'g': 3.7}, {'avg': 3.3})))
qs.append(Q('c01-e09', 1, 'Positive vs normative statements', '''
For a debate class: which of these are positive and which are normative? For the positive ones, what evidence
could test them? (a) Raising the minimum wage reduces employment among teenagers. (b) The minimum wage should be
raised because full-time workers deserve a living income. (c) Inflation in the euro area was higher in 2022 than in
2019. (d) Central banks should target 2% inflation. (e) A 1 percentage-point rise in the policy rate reduces
inflation by about 0.3 points after two years.''', '''
(a) Positive — test with employment data before/after minimum-wage changes, ideally with comparison regions.
(b) Normative — rests on a value judgement about what workers deserve. (c) Positive — check official statistics
(Eurostat HICP). (d) Normative, though it can be informed by evidence on the effects of different targets.
(e) Positive — a claim about magnitudes, testable with time-series or quasi-experimental methods.'''))
qs.append(Q('c01-e10', 1, 'Identities, behaviour, equilibrium', '''
Is each of these an accounting identity, a behavioural relationship or an equilibrium condition, and why?
(a) Assets = Liabilities + Equity. (b) C = 200 + 0.8(Y − T). (c) Quantity supplied = quantity demanded.
(d) MV = PY. (e) End-of-year cash = start-of-year cash + inflows − outflows.''', '''
(a) Identity: equity is defined as assets minus liabilities. (b) Behavioural relationship: a consumption function
that may or may not describe how households act. (c) Equilibrium condition: holds only at the market-clearing
price. (d) An identity if V is defined as PY/M; it becomes a theory (quantity theory) only with extra assumptions
such as stable V. (e) Identity: the stock–flow identity applied to cash.''', diff=2))
qs.append(Q('c01-e11', 1, 'Stocks and flows', '''
I always mix these up. Which of these are stocks and which are flows, and what unit fits each? (a) a firm's
inventory; (b) a country's exports; (c) household wealth; (d) a bank's deposits; (e) depreciation; (f) the
unemployment rate; (g) interest paid on a loan.''', '''
(a) Stock (units or currency at a date). (b) Flow (currency per year/quarter). (c) Stock (currency at a date).
(d) Stock (currency at a date). (e) Flow (currency per year). (f) Neither a pure stock nor flow: a ratio of two
stocks (unemployed ÷ labour force) measured at a point in time. (g) Flow (currency per period).'''))
qs.append(Q('c01-e12', 1, 'Stock–flow accounting', '''
A country's capital stock at the end of 2025 is {K} billion (constant prices). In 2026 gross investment is {I}
billion and depreciation is {d}% of the end-2025 stock. What's the capital stock at the end of 2026? And how much
gross investment would have been needed just to keep the stock constant?''', '''
Depreciation = {d}% × {K} = {dep}. End-2026 stock = {K} + {I} − {dep} = {end}. To keep the stock constant, gross
investment must just equal depreciation: {dep}.''',
kind='calc', vars={'K': R(300, 700, 20), 'I': R(30, 90, 5), 'd': R(3, 8)}, compute={'dep': 'd/100*K', 'end': 'K+I-d/100*K'},
check=({'K': 400, 'I': 60, 'd': 5}, {'dep': 20, 'end': 440})))
qs.append(Q('c01-e13', 1, 'Equilibrium vs efficiency', '''
Two fishing companies share a lake and each can send 1 or 2 boats. Both would earn more if each sent just 1, yet
somehow they both end up sending 2. How can that be an equilibrium? And what kind of arrangement could fix it?''', '''
Whatever the other firm does, sending 2 boats gives a firm a bigger share of the catch while the lake is depleted
almost as much, so each prefers 2. Both send 2 and overfish, earning less than if both sent 1: an equilibrium
(no one gains by deviating alone) that is not efficient — a prisoner's-dilemma / tragedy-of-the-commons situation.
Remedies: property rights (a single owner), enforceable quotas, a tax per boat, or an agreement sustained by
repeated interaction and reputation.''', diff=2))
qs.append(Q('c01-e14', 1, 'One event, four lenses', '''
Our country imports all its natural gas and the world gas price just jumped. Can you give me one consequence at
each level: micro (households/firms), accounting, macro, and monetary policy?''', '''
Many answers work, e.g. Micro: higher opportunity cost of heating, households cut use; gas-intensive firms face
higher marginal costs and raise prices or cut output. Accounting: gas users report higher cost of sales and lower
profit; distributors on fixed-price contracts may book losses. Macro: the import bill rises, the trade balance
worsens, measured inflation rises and real incomes fall. Monetary: the central bank must weigh raising rates to
stop inflation expectations rising against weaker output.''', diff=2))
# ---------------- Chapter 2 ----------------
qs.append(Q('c02-e01', 2, 'Units and ratios', '''
A bank has loans of {L} million euros and annual net interest income of {N} million. (a) What's net interest
income as a percentage of loans, and in what units? (b) An analyst says the bank's "loans are {=round(L/N,1)} times its
income". What are the units of that number and how should it be read?''', '''
(a) {N}/{L} = {=N/L*100:2}% per year — a flow divided by a stock, so the unit is "per year".
(b) {L}/{N} = {=L/N:1} years: a stock divided by an annual flow is a number of years — it would take about {=L/N:1}
years of net interest income to equal the loan book. It isn't a meaningful "multiple" without that interpretation.''',
kind='calc', vars={'L': R(400, 1200, 50), 'N': R(12, 40, 2)},
check=({'L': 800, 'N': 24}, {}), compute={}))
qs.append(Q('c02-e02', 2, 'Summation notation', '''
Quick stats-class check. With x = (3, 5, 10) and y = (2, 4, 1), what are Σxᵢyᵢ, (Σxᵢ)(Σyᵢ), Σ(xᵢ − x̄) and Σ(xᵢ − x̄)²?''', '''
Σxᵢyᵢ = 6 + 20 + 10 = 36. (Σxᵢ)(Σyᵢ) = 18 × 7 = 126 (not the same thing!). x̄ = 6, deviations −3, −1, 4: their sum is
always 0, and Σ(xᵢ − x̄)² = 9 + 1 + 16 = 26.'''))
qs.append(Q('c02-e03', 2, 'Successive percentage changes', '''
My share price went up {a}% and then fell {b}%. I started at {p}. Where am I now? And if it had fallen {b}% first and
then risen {a}%, would I end up somewhere different?''', '''
{p} × {=1+a/100:2} × {=1-b/100:2} = {final:2}. The order doesn't matter: multiplication is commutative, so falling
first then rising gives the same {final:2}. Successive changes multiply — the net factor is {=(1+a/100)*(1-b/100):4},
not 1 + ({a} − {b})/100.''',
kind='calc', vars={'a': R(10, 40, 5), 'b': R(10, 40, 5), 'p': R(50, 200, 10)}, compute={'final': 'p*(1+a/100)*(1-b/100)'},
check=({'a': 25, 'b': 20, 'p': 80}, {'final': 80})))
qs.append(Q('c02-e04', 2, 'Percentage points vs per cent', '''
The unemployment rate rose from {u1}% to {u2}%. By how many percentage points did it rise, and by what percentage?
Also, a bank's non-performing loan ratio fell from {n1}% to {n2}% — what's that in basis points and in per cent?''', '''
Unemployment: {=u2-u1:1} percentage point(s); a rise of {=(u2-u1)/u1*100:1}% of the original rate.
NPL ratio: falls by {=(n1-n2)*100:0} basis points, i.e. by {=(n1-n2)/n1*100:1}%.''',
kind='calc', vars={'u1': R(3, 6, 0.5), 'u2': R(4, 8, 0.5), 'n1': R(2.0, 4.0, 0.25), 'n2': R(1.0, 2.5, 0.25)}, constraints=['u2>u1', 'n1>n2'], compute={},
check=({'u1': 4, 'u2': 5, 'n1': 2.5, 'n2': 2.0}, {})))
qs.append(Q('c02-e05', 2, 'Error propagation', '''
We estimate revenue as price × volume. Price is known to within {ep}% and volume to within {ev}%. What's the
worst-case relative error in revenue? And if costs are {cp}% of revenue and known exactly, what's the worst-case
relative error in profit?''', '''
Revenue: up to about {ep} + {ev} = {=ep+ev}% (exactly {=((1+ep/100)*(1+ev/100)-1)*100:2}%). Profit is {=100-cp}% of
revenue, so an error of {=ep+ev}% of revenue is {=(ep+ev)/(100-cp)*100:0}% of profit — small errors in big numbers
become big errors in small differences.''',
kind='calc', vars={'ep': R(1, 3), 'ev': R(2, 5), 'cp': C(80, 85, 90, 95)}, compute={}, check=({'ep': 1, 'ev': 3, 'cp': 90}, {})))
qs.append(Q('c02-e06', 2, 'Weighted and geometric means', '''
Two questions. (a) My portfolio is {wa}% in asset A, which returned {ra}%, and the rest in asset B, which returned {rb}%.
What was my portfolio return? (b) Another investment returned 30%, −20% and 10% in three successive years. What are
the arithmetic mean return, the cumulative return and the geometric mean return?''', '''
(a) {=wa/100:2} × {ra} + {=1-wa/100:2} × ({rb}) = {=wa/100*ra+(1-wa/100)*rb:2}%.
(b) Arithmetic mean (30 − 20 + 10)/3 = 6.67%. Cumulative factor 1.3 × 0.8 × 1.1 = 1.144, i.e. a 14.4% gain.
Geometric mean = 1.144^(1/3) − 1 = 4.59% a year — the true compound rate, lower than the arithmetic mean.''',
kind='calc', vars={'wa': R(20, 80, 10), 'ra': R(5, 15), 'rb': R(-6, 4)}, compute={}, check=({'wa': 30, 'ra': 12, 'rb': -2}, {})))
qs.append(Q('c02-e07', 2, 'Harmonic mean', '''
Our firm buys €50,000 of fuel every quarter. Over four quarters the prices per litre were 1.60, 2.00, 1.80 and 1.60.
What average price per litre did we actually pay? Is it the same as the simple average of the prices?''', '''
Litres bought: 31,250 + 25,000 + 27,778 + 31,250 = 115,278 for €200,000 → €1.735 per litre (the harmonic mean of
the prices). The arithmetic mean is €1.75; the firm pays less on average because a fixed spend buys more litres when
prices are low.''', kind='calc', diff=2))
qs.append(Q('c02-e08', 2, 'Contributions to growth', '''
Our country's exports are electronics ({we}% of exports), palm oil ({wp}%) and other goods (the rest). This year
electronics grew {ge}%, palm oil fell {gp}% and other goods grew {go}%. What's total export growth, and how much did
each category contribute?''', '''
Contributions = share × growth: electronics {=we/100:2} × {ge} = {=we/100*ge:2} points; palm oil {=wp/100:2} × (−{gp})
= {=-wp/100*gp:2}; other {=(100-we-wp)/100:2} × {go} = {=(100-we-wp)/100*go:2}. Total growth = {tot:2}%.''',
kind='calc', vars={'we': R(40, 70, 5), 'wp': R(10, 25, 5), 'ge': R(3, 12), 'gp': R(4, 15), 'go': R(0, 5)}, constraints=['we+wp<=90'],
compute={'tot': 'we/100*ge - wp/100*gp + (100-we-wp)/100*go'}, check=({'we': 60, 'wp': 15, 'ge': 8, 'gp': 12, 'go': 2}, {'tot': 3.5})))
qs.append(Q('c02-e09', 2, 'Splicing and rebasing indexes', '''
An old index reads 250 in 2019 (base 2005 = 100). A new series starts at 2019 = 100 and reads 104 in 2020 and 110 in
2021. (a) Splice the new series onto the old base. (b) Rebase the spliced series to 2020 = 100. (c) What was the
percentage change from 2020 to 2021?''', '''
(a) 2020: 250 × 1.04 = 260; 2021: 250 × 1.10 = 275. (b) Divide by 260: 2019 = 96.15, 2020 = 100, 2021 = 105.77.
(c) 275/260 − 1 = 5.77% (equivalently 110/104 − 1).''', kind='calc', diff=2))
qs.append(Q('c02-e10', 2, 'Weighted price index', '''
Our household budget is {wf}% food, {wh}% housing and the rest transport. Over the year food prices rose {pf}%,
housing costs {ph}% and transport prices fell {pt}%. By how much did the cost of our basket go up?''', '''
Weighted average of the price changes: {=wf/100:2} × {pf} + {=wh/100:2} × {ph} + {=(100-wf-wh)/100:2} × (−{pt}) = {tot:2}%.''',
kind='calc', vars={'wf': R(30, 50, 5), 'wh': R(20, 40, 5), 'pf': R(1, 8), 'ph': R(1, 6), 'pt': R(1, 8)}, constraints=['wf+wh<=85'],
compute={'tot': 'wf/100*pf + wh/100*ph - (100-wf-wh)/100*pt'}, check=({'wf': 50, 'wh': 30, 'pf': 4, 'ph': 2, 'pt': 5}, {'tot': 1.6})))
qs.append(Q('c02-e11', 2, 'Percentage pitfalls', '''
My CEO wrote this in our investor letter: "Our return on equity rose from {r1}% to {r2}%, a {=r2-r1}% improvement, and
because we averaged returns of {g1}% and −{g2}% in the last two years, our investors earned {=(g1-g2)/2}% a year." I
think there are two errors. What are they?''', '''
1) ROE rose by {=r2-r1} percentage points, which is a {=(r2-r1)/r1*100:1}% improvement — not "{=r2-r1}%".
2) The investors' compound return is √({=1+g1/100:2} × {=1-g2/100:2}) − 1 = {=(sqrt((1+g1/100)*(1-g2/100))-1)*100:2}% a year,
not {=(g1-g2)/2}%: the arithmetic mean overstates compound growth when returns vary.''',
kind='calc', diff=2, vars={'r1': R(8, 14), 'r2': R(10, 18), 'g1': R(10, 25), 'g2': R(3, 10)}, constraints=['r2>r1'], compute={},
check=({'r1': 10, 'r2': 12, 'g1': 15, 'g2': 5}, {})))
# ---------------- Chapter 3 ----------------
qs.append(Q('c03-e01', 3, 'Solving equations', '''
Helping my kid with homework and want to double-check. Solve: (a) 5(x − 4) = 2x + 7; (b) x/3 + x/6 = 9;
(c) 3(2x + 1) = 6x + 5.''', '''
(a) 5x − 20 = 2x + 7 → 3x = 27 → x = 9. (b) Multiply by 6: 2x + x = 54 → x = 18. (c) 6x + 3 = 6x + 5 gives 3 = 5:
no solution.'''))
qs.append(Q('c03-e02', 3, 'Rearranging a bond formula', '''
A bond pays {F} in one year and its price is P = F/(1 + y). How do I solve for the yield y? What's y if the price is {P}?''', '''
1 + y = F/P, so y = F/P − 1. Here y = {F}/{P} − 1 = {y:2}%.''',
kind='calc', vars={'F': C(100, 1000), 'pct': R(92, 99, 0.5)}, compute={'P': 'F*pct/100', 'y': '(F/(F*pct/100)-1)*100'},
check=({'F': 1000, 'pct': 96}, {'P': 960, 'y': 4.1667})))
qs.append(Q('c03-e03', 3, 'Inverse demand', '''
Demand for my product is Q = {a} − {b}P. (a) What's the inverse demand function and the choke price? (b) What's the
economically meaningful domain? (c) Write revenue as a function of P.''', '''
(a) P = {a}/{b} − Q/{b} = {=a/b:2} − {=1/b:4}Q; the choke price (where Q = 0) is {=a/b:2}.
(b) 0 ≤ P ≤ {=a/b:2}, so that 0 ≤ Q ≤ {a}. (c) R(P) = P({a} − {b}P) = {a}P − {b}P².''',
kind='calc', vars={'a': R(200, 800, 50), 'b': C(10, 20, 25, 40, 50)}, compute={}, check=({'a': 500, 'b': 25}, {})))
qs.append(Q('c03-e04', 3, 'Break-even', '''
My product sells for ${p}, costs ${v} per unit to make, and I have fixed costs of ${FC}. (a) What's my break-even
output? (b) If capacity is {cap} units, what's the most profit I can make? (c) What price would I need to break
even at an output of {q}?''', '''
(a) Break-even = FC/(p − v) = {FC}/{=p-v} = {be:1} units. (b) At capacity: {=p-v} × {cap} − {FC} = {=(p-v)*cap-FC}.
(c) Need (p − {v}) × {q} = {FC}, so p = {v} + {FC}/{q} = {=v+FC/q:2}.''',
kind='calc', vars={'p': R(20, 40), 'v': R(10, 18), 'FC': R(10000, 30000, 1000), 'cap': R(2000, 4000, 250), 'q': R(1000, 1800, 100)},
compute={'be': 'FC/(p-v)'}, constraints=['p-v>=5', 'cap>FC/(p-v)', 'q<FC/(p-v)'],
check=({'p': 24, 'v': 15, 'FC': 18000, 'cap': 2500, 'q': 1500}, {'be': 2000})))
qs.append(Q('c03-e05', 3, 'Quadratic revenue and profit', '''
Inverse demand for our product is p = {a} − {b}q and our only cost is a fixed {FC}. What output and price maximise
revenue? What are the break-even outputs, and what's the maximum profit?''', '''
R = {a}q − {b}q², maximised at q = {a}/(2 × {b}) = {qs}, price p = {=a/2}, revenue {Rm}. Break-even where
{b}q² − {a}q + {FC} = 0: q = ({a} ± √({=a*a} − {=4*b*FC}))/(2 × {b}) = {q1:2} or {q2:2}. Maximum profit = {Rm} − {FC} = {=Rm-FC}
at q = {qs} (with only fixed costs, maximising revenue = maximising profit).''',
kind='calc', diff=2, vars={'a': C(40, 60, 80, 100), 'b': C(0.5, 1, 2), 'FC': R(200, 1500, 100)},
compute={'qs': 'a/(2*b)', 'Rm': 'a*a/(4*b)', 'q1': '(a-sqrt(a*a-4*b*FC))/(2*b)', 'q2': '(a+sqrt(a*a-4*b*FC))/(2*b)'}, constraints=['a*a-4*b*FC>0'],
check=({'a': 60, 'b': 0.5, 'FC': 1000}, {'qs': 60, 'Rm': 1800, 'q1': 20, 'q2': 100})))
qs.append(Q('c03-e06', 3, 'Market equilibrium with a tax', '''
Demand is Qd = {a} − {b}P and supply is Qs = {c} + {d}P. What's the equilibrium? Then a tax shifts supply to
Qs = {c2} + {d}P (in terms of the price buyers pay). What's the new equilibrium?''', '''
{a} − {b}P = {c} + {d}P → P = {P0:2}, Q = {Q0:2}. With the tax: {a} − {b}P = {c2} + {d}P → P = {P1:2}, Q = {Q1:2}.
Buyers pay {=P1-P0:2} more and quantity falls by {=Q0-Q1:2}.''',
kind='calc', vars={'a': R(200, 300, 10), 'b': R(2, 4), 'c': R(40, 80, 10), 'd': R(2, 4), 'k': R(20, 40, 10)},
compute={'c2': 'c-k', 'P0': '(a-c)/(b+d)', 'Q0': 'a-b*(a-c)/(b+d)', 'P1': '(a-c+k)/(b+d)', 'Q1': 'a-b*(a-c+k)/(b+d)'},
check=({'a': 240, 'b': 3, 'c': 60, 'd': 3, 'k': 30}, {'c2': 30, 'P0': 30, 'Q0': 150, 'P1': 35, 'Q1': 135})))
qs.append(Q('c03-e07', 3, 'Systems of linear equations', '''
Classify each system (one solution, none, infinitely many) and solve where possible: (a) x + 2y = 10, 3x − y = 2;
(b) 2x + 4y = 8, x + 2y = 5; (c) 2x + 4y = 8, x + 2y = 4.''', '''
(a) From the second, y = 3x − 2; substituting, x + 6x − 4 = 10 → x = 2, y = 4: unique solution.
(b) Halving the first gives x + 2y = 4, contradicting x + 2y = 5: parallel lines, no solution.
(c) Same line twice: infinitely many solutions (x, 2 − x/2).'''))
qs.append(Q('c03-e08', 3, 'Inequalities', '''
Solve 7 − 2x > 3x − 8. Also, our production spec says |q − {T}| ≤ {tol}. What does that mean in plain English?''', '''
15 > 5x, so x < 3. |q − {T}| ≤ {tol} means {=T-tol} ≤ q ≤ {=T+tol}: output must be within {tol} units of the {T} target.''',
kind='calc', vars={'T': R(500, 2000, 100), 'tol': R(20, 80, 10)}, compute={}, check=({'T': 1000, 'tol': 50}, {})))
qs.append(Q('c03-e09', 3, 'Feasible sets and corner solutions', '''
We make two products on a machine available {Mh} hours and with a workforce available {Lh} hours. Each unit of A
needs 2 machine hours and 1 labour hour; each unit of B needs 1 machine hour and 3 labour hours. What are the
constraints, the corners of the feasible set, and which corner maximises profit {pa}A + {pb}B?''', '''
Machine: 2A + B ≤ {Mh}; labour: A + 3B ≤ {Lh}; A, B ≥ 0. Corners: (0, 0), ({=Mh/2:2}, 0), (0, {=Lh/3:2}) and the
intersection A = {Ai:2}, B = {Bi:2}. Profits: 0; {=pa*Mh/2:2}; {=pb*Lh/3:2}; {=pa*Ai+pb*Bi:2}. The best corner is
{?pa*Ai+pb*Bi>=max(pa*Mh/2,pb*Lh/3)|the intersection ({Ai:2}, {Bi:2})|{?pa*Mh/2>pb*Lh/3|all A ({=Mh/2:2}, 0)|all B (0, {=Lh/3:2})}}.''',
kind='calc', diff=2, vars={'Mh': R(100, 160, 10), 'Lh': R(120, 200, 10), 'pa': R(30, 60, 5), 'pb': R(40, 70, 5)},
compute={'Ai': '(3*Mh-Lh)/5', 'Bi': '(2*Lh-Mh)/5'}, constraints=['3*Mh-Lh>0', '2*Lh-Mh>0', 'pa*(3*Mh-Lh)/5+pb*(2*Lh-Mh)/5>=max(pa*Mh/2,pb*Lh/3)'],
check=({'Mh': 120, 'Lh': 150, 'pa': 40, 'pb': 50}, {'Ai': 42, 'Bi': 36})))
qs.append(Q('c03-e10', 3, 'Average vs marginal tax rates', '''
Using the 2024 U.S. federal schedule for single filers — 10% up to $11,600, 12% from $11,600 to $47,150, 22% up to
$100,525, 24% up to $191,950 — what's the tax, the average rate and the marginal rate on taxable incomes of
$40,000 and $150,000?''', '''
$40,000: 1,160 + 0.12 × 28,400 = 4,568; average 11.4%, marginal 12%.
$150,000: 1,160 + 4,266 + 0.22 × 53,375 + 0.24 × 49,475 = 1,160 + 4,266 + 11,742.50 + 11,874 = 29,042.50;
average 19.4%, marginal 24%. Only income above each threshold is taxed at the higher rate.''', kind='calc', diff=2))
qs.append(Q('c03-e11', 3, 'Price cut with a capacity constraint', '''
I sell 1,000 units at $40 each. Variable cost is $24 per unit and fixed cost this period is $8,000. I'm thinking of
cutting the price to $39, which I forecast would raise sales to 1,100 units. But capacity is 1,050 units unless I
spend $1,000 on expansion this period. What's operating profit under each option, and what would you want to know
before acting?''', '''
Current: (40 − 24) × 1,000 − 8,000 = 8,000. Price 39 without expansion: sales capped at 1,050, profit
15 × 1,050 − 8,000 = 7,750. Price 39 with expansion: 15 × 1,100 − 8,000 − 1,000 = 7,500. Both new options raise
revenue but lower profit. Before acting: is the 1,100 forecast a credible causal estimate of the price response?
Does the expansion bring benefits in later periods? Does variable cost stay at 24 near capacity?''', kind='calc', diff=2))
# ---------------- Chapter 4 ----------------
qs.append(Q('c04-e01', 4, 'Exponents', '''
Can you simplify these? (a) x³·x⁻⁵; (b) (a²b)³/(ab²); (c) 27^(2/3); (d) what happens to K^0.3·L^0.7 when K and L are
both multiplied by 4?''', '''
(a) x⁻² = 1/x². (b) a⁶b³/(ab²) = a⁵b. (c) (∛27)² = 9. (d) (4K)^0.3(4L)^0.7 = 4^(0.3+0.7)K^0.3L^0.7 = 4K^0.3L^0.7:
output quadruples (constant returns to scale).'''))
qs.append(Q('c04-e02', 4, 'Effective annual rates', '''
My savings account pays {r}% a year. What's the effective annual rate if it's compounded (a) quarterly,
(b) daily (365 days), (c) continuously?''', '''
(a) (1 + {r}/400)⁴ − 1 = {=((1+r/400)^4-1)*100:3}%. (b) (1 + {r}/36500)^365 − 1 = {=((1+r/36500)^365-1)*100:3}%.
(c) e^{=r/100:2} − 1 = {=(exp(r/100)-1)*100:3}%. More frequent compounding raises the effective rate, with continuous
compounding as the limit.''',
kind='calc', vars={'r': R(2, 12, 0.5)}, compute={'q': '((1+r/400)^4-1)*100'}, check=({'r': 8}, {'q': 8.243})))
qs.append(Q('c04-e03', 4, 'Logarithms and growth', '''
Three quick ones: (a) solve {g1}^t = {m} for t; (b) solve e^({k}t) = 2; (c) what constant annual growth rate turns
{A} into {B} in {n} years?''', '''
(a) t = ln {m}/ln {g1} = {=ln(m)/ln(g1):2}. (b) t = ln 2/{k} = {=ln(2)/k:2}. (c) g = ({B}/{A})^(1/{n}) − 1 = {=((B/A)^(1/n)-1)*100:2}%.''',
kind='calc', vars={'g1': C(1.03, 1.04, 1.05, 1.06, 1.08), 'm': C(2, 3, 4), 'k': C(0.02, 0.03, 0.04, 0.05), 'A': R(50, 100, 10), 'B': R(150, 300, 10), 'n': R(8, 20)},
compute={'t': 'ln(m)/ln(g1)'}, check=({'g1': 1.05, 'm': 3, 'k': 0.04, 'A': 80, 'B': 200, 'n': 12}, {'t': 22.517})))
qs.append(Q('c04-e04', 4, 'Rule of 70', '''
Using the rule of 70 and the exact formula, what are the doubling times at growth rates of 1%, 3% and 10%? When is
the rule least accurate, and why?''', '''
Rule of 70: 70, 23.3 and 7 years. Exact (ln 2/ln(1 + g)): 69.7, 23.4 and 7.27 years. The rule is least accurate at
high growth rates, because the approximation ln(1 + g) ≈ g deteriorates as g gets larger.'''))
qs.append(Q('c04-e05', 4, 'Growth rate rules', '''
Labour productivity (output per hour) grows at {gp}% and hours worked at {gh}%. The GDP deflator rises {gd}%.
Approximately how fast do real GDP and nominal GDP grow?''', '''
Real GDP = (Y/L) × L, so its growth ≈ {gp} + {gh} = {=gp+gh:1}%. Nominal GDP = deflator × real GDP, so ≈ {=gp+gh:1} + {gd}
= {=gp+gh+gd:1}%. (Growth rates of products add, approximately.)''',
kind='calc', vars={'gp': R(0.5, 3, 0.1), 'gh': R(-0.5, 1.5, 0.1), 'gd': R(1, 5, 0.5)}, compute={}, check=({'gp': 1.5, 'gh': 0.8, 'gd': 2.5}, {})))
qs.append(Q('c04-e06', 4, 'Compound annual growth rate', '''
A country's GDP per person was ${A} in {y0} and ${B} in {y1}. What's the compound annual growth rate? And how
many years would it take to double again at that rate?''', '''
CAGR = ({B}/{A})^(1/{=y1-y0}) − 1 = {g:2}% a year. Doubling time = ln 2/ln(1 + g) = {=ln(2)/ln(1+g/100):1} years.''',
kind='calc', vars={'A': R(2000, 8000, 500), 'B': R(9000, 20000, 1000), 'y0': C(1995, 2000, 2004), 'y1': C(2020, 2024)},
compute={'g': '((B/A)^(1/(y1-y0))-1)*100'}, check=({'A': 4000, 'B': 11000, 'y0': 2000, 'y1': 2024}, {'g': 4.30})))
qs.append(Q('c04-e07', 4, 'Annualising quarterly growth', '''
Real GDP fell {a}% in one quarter and rose {b}% in the next. What are those rates annualised, and what's the
change over the half-year?''', '''
Annualised: (1 − {=a/100:3})⁴ − 1 = {=((1-a/100)^4-1)*100:2}%; (1 + {=b/100:3})⁴ − 1 = {=((1+b/100)^4-1)*100:2}%.
Over the half-year: (1 − {=a/100:3})(1 + {=b/100:3}) − 1 = {=((1-a/100)*(1+b/100)-1)*100:2}%.''',
kind='calc', vars={'a': R(0.5, 3, 0.1), 'b': R(0.3, 2.5, 0.1)}, compute={'x': '((1-a/100)^4-1)*100'}, constraints=['abs(b-a)>=0.3'], check=({'a': 2.1, 'b': 1.4}, {'x': -8.14})))
qs.append(Q('c04-e08', 4, 'Arithmetic and geometric series', '''
Compute: (a) the sum of (3 + 2t) for t = 1 to 20; (b) the sum of 0.9^t for t = 0 to 9; (c) the sum of 0.8^t from
t = 1 to infinity.''', '''
(a) Terms run from 5 to 43: 20 × (5 + 43)/2 = 480. (b) (1 − 0.9¹⁰)/(1 − 0.9) = (1 − 0.3487)/0.1 = 6.513.
(c) 0.8/(1 − 0.8) = 4 (the series starts at t = 1).'''))
qs.append(Q('c04-e09', 4, 'The spending multiplier', '''
Households spend {m}% of any extra income. Using a geometric series, what's the total rise in spending that follows
an initial rise of {s}? How much of that happens in the first five rounds, including the initial one?''', '''
Total = {s}/(1 − {=m/100:2}) = {tot:2}. First five rounds: {s}(1 − {=m/100:2}⁵)/(1 − {=m/100:2}) = {five:2}, about
{=five/tot*100:0}% of the total.''',
kind='calc', vars={'m': R(40, 80, 5), 's': R(20, 100, 10)}, compute={'tot': 's/(1-m/100)', 'five': 's*(1-(m/100)^5)/(1-m/100)'},
check=({'m': 60, 's': 50}, {'tot': 125, 'five': 115.28})))
qs.append(Q('c04-e10', 4, 'Difference equations', '''
I have x(t+1) = {a}·x(t) + {b} with x(0) = {x0}. What's the steady state, what's x(5), and what's the half-life of
deviations from the steady state?''', '''
Steady state x̄ = {b}/(1 − {a}) = {ss:2}. x(t) = x̄ + {a}^t (x0 − x̄), so x(5) = {ss:2} + {=a^5:5} × ({=x0-ss:2}) = {x5:2}.
Half-life = ln 0.5/ln {a} ≈ {=ln(0.5)/ln(a):1} periods.''',
kind='calc', diff=2, vars={'a': C(0.5, 0.6, 0.7, 0.8, 0.9), 'b': R(2, 10), 'x0': R(30, 60, 5)},
compute={'ss': 'b/(1-a)', 'x5': 'b/(1-a)+a^5*(x0-b/(1-a))'}, constraints=['abs(x0-b/(1-a))>=2'], check=({'a': 0.8, 'b': 4, 'x0': 40}, {'ss': 20, 'x5': 26.55})))
qs.append(Q('c04-e11', 4, 'Stability of difference equations', '''
For each equation, what's the steady state, is it stable, and is the path monotonic or oscillating?
(a) x(t+1) = 1.1·x(t) − 5; (b) x(t+1) = −0.5·x(t) + 6.''', '''
(a) x̄ = −5/(1 − 1.1) = 50; |a| = 1.1 > 1, so unstable — any deviation from 50 grows (monotonically, since a > 0).
(b) x̄ = 6/1.5 = 4; |a| = 0.5 < 1, so stable, and oscillating because a < 0.''', diff=2))
write(1, 'Trainee', 'rank01_trainee.json', qs)
