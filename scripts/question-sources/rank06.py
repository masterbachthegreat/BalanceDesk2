from qlib import *
qs = []
# ---------------- Chapter 20 ----------------
qs.append(Q('c20-e01', 20, 'Marginal rate of substitution', '''
What's the MRS for (a) U = x²y; (b) U = 2 ln x + ln y; (c) U = 3x + 2y; (d) U = √x + y? Which of these represent the same preferences?''', '''
(a) MUₓ = 2xy, MU_y = x² → MRS = 2y/x. (b) 2/x ÷ 1/y = 2y/x. (c) 3/2. (d) 1/(2√x). (a) and (b) are the same preferences:
(b) is ln of (a), an increasing transformation, so the MRS is identical.''', diff=2))
qs.append(Q('c20-e02', 20, 'Optimal consumer choice (Cobb–Douglas)', '''
A consumer with U = x^{a}·y^{=1-a:1} has income {m} and faces pₓ = {px}, p_y = {py}. What's the optimal bundle? Can you verify
the tangency condition?''', '''
Cobb–Douglas spends fixed shares: x* = {a} × {m}/{px} = {=a*m/px:2}, y* = {=1-a:1} × {m}/{py} = {=(1-a)*m/py:2}. MRS = ({a}/{=1-a:1})(y/x) =
{=(a/(1-a))*((1-a)*m/py)/(a*m/px):4} = pₓ/p_y = {=px/py:4} ✓.''',
kind='calc', vars={'a': C(0.3, 0.4, 0.5, 0.6), 'm': R(100, 400, 50), 'px': R(2, 6), 'py': R(3, 8)}, compute={'x': 'a*m/px'},
check=({'a': 0.3, 'm': 200, 'px': 3, 'py': 7}, {'x': 20})))
qs.append(Q('c20-e03', 20, 'Perfect complements', '''
I always drink coffee with two sugars: U = min(x, y/2), where x is cups of coffee and y is sugar cubes. Coffee costs
{pc} per cup, sugar {ps} per cube, and my coffee budget is {m}. How many cups do I drink? What's my demand function for
coffee? Does the price of sugar affect it?''', '''
She consumes where y = 2x. Budget: {pc}x + {ps}(2x) = {m} → x = {m}/({pc} + {=2*ps}) = {=m/(pc+2*ps):2} cups and {=2*m/(pc+2*ps):2} cubes.
Demand: x = m/(pₓ + 2p_y). Yes — dearer sugar reduces coffee demand (gross complements); with perfect complements
there's no substitution effect, only an income effect on "coffee-with-sugar".''',
kind='calc', vars={'pc': R(1.5, 4, 0.5), 'ps': C(0.1, 0.2, 0.25, 0.5), 'm': R(30, 80, 10)}, compute={'x': 'm/(pc+2*ps)'},
check=({'pc': 2, 'ps': 0.25, 'm': 50}, {'x': 20})))
qs.append(Q('c20-e04', 20, 'Perfect substitutes', '''
I treat rice brands A and B as perfect substitutes, but 1 kg of A is worth 1.2 kg of B to me. A costs {pa} per kg and
B costs {pb} per kg. My rice budget is {m}. What do I buy? At what price of A would I switch?''', '''
Value per unit of money: A gives 1.2/{pa} = {=1.2/pa:4}; B gives 1/{pb} = {=1/pb:4}. {?1.2/pa>1/pb|A is better value: buy {=m/pa:2} kg of A.|B is better value: buy {=m/pb:2} kg of B.}
She is indifferent when 1.2/p_A = 1/{pb}, i.e. p_A = {=1.2*pb:2}{?1.2/pa>1/pb|; above that she'd switch to B|; below that she'd switch to A}.''',
kind='calc', vars={'pa': R(2.5, 3.5, 0.1), 'pb': R(2.0, 3.0, 0.1), 'm': R(40, 80, 10)}, constraints=['abs(1.2/pa-1/pb)>0.005'], compute={},
check=({'pa': 3, 'pb': 2.4, 'm': 60}, {})))
qs.append(Q('c20-e05', 20, 'Quasi-linear preferences', '''
U = 20 ln x + y, with p_y = 1 and income m. What's the demand for x as a function of pₓ and m (with any conditions on m)?
What happens to demand for x when income rises?''', '''
MRS = 20/x = pₓ → x* = 20/pₓ, which requires m ≥ pₓx* = 20. If m < 20, all income goes on x: x* = m/pₓ, y* = 0. Above
m = 20, extra income goes entirely to y — demand for x doesn't change with income (income elasticity zero).''', diff=2))
qs.append(Q('c20-e06', 20, 'Slutsky vs Hicks decomposition', '''
A consumer has U = √(xy), income 100, p_y = 1, and pₓ rises from 1 to 2 (x falls from 50 to 25). The Hicks
decomposition gives a substitution effect of −14.64 and income effect of −10.36. What's the Slutsky version, where the
consumer is compensated to afford her original bundle? How do the effects compare?''', '''
Affording (50, 50) at new prices needs 2 × 50 + 50 = 150. With income 150 at pₓ = 2, x = 0.5 × 150/2 = 37.5. Slutsky
substitution effect 37.5 − 50 = −12.5; income effect 25 − 37.5 = −12.5. The Slutsky compensation (50) exceeds the Hicks
one (41.42) because affording the old bundle leaves her slightly better off, so the Slutsky substitution effect is
smaller in absolute value. For small price changes they converge.''', kind='calc', diff=3))
qs.append(Q('c20-e07', 20, 'Inferior vs Giffen goods', '''
Can you explain, as if drawing the indifference-curve diagram in words, what happens when the price of an inferior
good (that isn't a Giffen good) falls? Where do the substitution and income effects point?''', '''
The budget line pivots outward. Substitution effect (along the original indifference curve to the flatter price line):
quantity rises. Income effect (parallel outward shift): quantity falls, because the good is inferior. Since it's not
Giffen, the income effect is smaller, so the net effect is still a rise — the final point lies right of the original
but left of the compensated point.''', diff=2))
qs.append(Q('c20-e08', 20, 'Elasticity and revenue', '''
Demand for our museum's tickets is Q = {a} − {b}P and we charge {P}. What's the elasticity? Should we raise or lower the
price to increase ticket revenue? What price maximises revenue?''', '''
Q = {=a-b*P}; ε = −{b} × {P}/{=a-b*P} = {e:3}. {?abs(e)>1|Demand is elastic, so lowering the price raises revenue.|Demand is inelastic, so raising the price raises revenue.}
Revenue P({a} − {b}P) is maximised at P = {=a/(2*b):2} (ε = −1), Q = {=a/2}, R = {=a*a/(4*b):2} (vs {=P*(a-b*P)} now).''',
kind='calc', vars={'a': R(3000, 8000, 500), 'b': R(100, 300, 50), 'P': R(5, 25)}, constraints=['a-b*P>0', 'abs(b*P/(a-b*P)-1)>0.05'], compute={'e': '-b*P/(a-b*P)'},
check=({'a': 5000, 'b': 200, 'P': 15}, {'e': -1.5})))
qs.append(Q('c20-e09', 20, 'Income elasticity and Engel\'s law', '''
Our household's food spending rose from {f0} to {f1} a month when our income rose from {y0} to {y1}, with prices
unchanged. What's the income elasticity of food demand? Is food a necessity or a luxury for us? What happens to its budget share?''', '''
Food spending +{=(f1/f0-1)*100:1}%, income +{=(y1/y0-1)*100:1}% → elasticity {e:2}: {?e<1|a necessity|a luxury}. Budget share goes
from {=f0/y0*100:1}% to {=f1/y1*100:1}%{?e<1| — falling, consistent with Engel's law|}.''',
kind='calc', vars={'f0': R(300, 600, 50), 'g': C(5, 10, 15), 'y0': R(2000, 4000, 500), 'gy': C(15, 20, 25)}, compute={'f1': 'f0*(1+g/100)', 'y1': 'y0*(1+gy/100)', 'e': 'g/gy'},
check=({'f0': 400, 'g': 10, 'y0': 2000, 'gy': 20}, {'f1': 440, 'y1': 2400, 'e': 0.5})))
qs.append(Q('c20-e10', 20, 'Market demand (horizontal summation)', '''
There are 100 consumers of type 1, each with demand q = 20 − 2P, and 50 of type 2, each with q = 15 − P. What's market
demand, and the quantity demanded at P = 8 and P = 12?''', '''
Type 1 total: 2,000 − 200P for P ≤ 10; type 2 total: 750 − 50P for P ≤ 15. Market: Q = 2,750 − 250P for P ≤ 10;
Q = 750 − 50P for 10 < P ≤ 15; 0 above 15 (kinked). At P = 8: Q = 750. At P = 12: Q = 150.''', kind='calc'))
qs.append(Q('c20-e11', 20, 'Revealed preference (WARP)', '''
At prices (2, 2) and income 40 a consumer chooses (12, 8). At prices (1, 3) and income 36 she chooses (15, 7). Are these
choices consistent with the weak axiom of revealed preference?''', '''
(15, 7) at the first prices costs 44 > 40: not affordable, so (12, 8) isn't revealed preferred to (15, 7). (12, 8) at the
second prices costs 36 ≤ 36: affordable, so (15, 7) is revealed preferred to (12, 8). No contradiction: consistent with WARP.''', kind='calc', diff=2))
qs.append(Q('c20-e12', 20, 'Benefit cliffs and labour supply', '''
With U = 0.5 ln c + 0.5 ln ℓ, 16 hours available and a wage of {w}, someone would work 8 hours. The government introduces
a benefit of {V} that's withdrawn completely if the person works any hours. Compare utility from working the optimal
hours (no benefit) with not working and taking the benefit. What does that say about incentives?''', '''
Working: h = 8, c = {=8*w}, ℓ = 8 → U = 0.5 ln {=8*w} + 0.5 ln 8 = {uw:3}. Not working: c = {V}, ℓ = 16 → U = 0.5 ln {V} + 0.5 ln 16 = {un:3}.
{?un>uw|Not working is better.|Working is still better here.} A benefit withdrawn in full on taking any work is an effective marginal tax
rate above 100% on the first hours — a strong disincentive; tapered withdrawal or in-work credits (EITC) reduce it.''',
kind='calc', diff=2, vars={'w': R(12, 25), 'V': R(80, 160, 10)}, compute={'uw': '0.5*ln(8*w)+0.5*ln(8)', 'un': '0.5*ln(V)+0.5*ln(16)'},
constraints=['abs(0.5*ln(V)+0.5*ln(16)-0.5*ln(8*w)-0.5*ln(8))>0.01'], check=({'w': 20, 'V': 120}, {'uw': 3.577, 'un': 3.780})))
qs.append(Q('c20-e13', 20, 'Interest rates and saving', '''
Someone earns 100 now and nothing later, has u(c) = ln c and β = 0.95. How much does she save at r = 2% and at r = 8%?
Why?''', '''
W = 100 regardless of r, and c₁ = W/(1 + β) = 100/1.95 = 51.28, so saving is 48.72 at both rates. For a pure lender with
log utility, the substitution effect of a higher r (save more) exactly offsets the income effect (richer, consume more
now). Only c₂ = β(1 + r)c₁ responds: 49.69 → 52.62.''', kind='calc', diff=2))
qs.append(Q('c20-e14', 20, 'Consumer surplus and a price rise', '''
Demand for a concert is P = 120 − 0.02Q and tickets cost {p0}. What's consumer surplus? If the promoter raises the price to
{p1}, what's the change in consumer surplus, split into the loss on tickets still bought and the loss from tickets no
longer bought?''', '''
At {p0}: Q = {=(120-p0)/0.02:0}, CS = ½ × {=(120-p0)/0.02:0} × {=120-p0} = {cs0:0}. At {p1}: Q = {=(120-p1)/0.02:0}, CS = {cs1:0}. Change −{=cs0-cs1:0}:
{=(120-p1)/0.02*(p1-p0):0} on tickets still bought + {=0.5*((p1-p0)/0.02)*(p1-p0):0} on tickets no longer bought.''',
kind='calc', vars={'p0': R(40, 70, 10), 'd': C(10, 20)}, compute={'p1': 'p0+d', 'cs0': '0.5*(120-p0)/0.02*(120-p0)', 'cs1': '0.5*(120-p0-d)/0.02*(120-p0-d)'},
check=({'p0': 60, 'd': 20}, {'cs0': 90000, 'cs1': 40000})))
# ---------------- Chapter 21 ----------------
qs.append(Q('c21-e01', 21, 'Marginal and average product', '''
With capital fixed, q = 6L² − 0.2L³. What are MP_L and AP_L, at what L is AP_L maximised, and can you verify MP_L = AP_L there?''', '''
MP_L = 12L − 0.6L²; AP_L = 6L − 0.2L². AP_L peaks where 6 − 0.4L = 0 → L = 15: AP_L = 90 − 45 = 45 and MP_L = 180 − 135 = 45 ✓.''', kind='calc'))
qs.append(Q('c21-e02', 21, 'Returns to scale', '''
What are the returns to scale of: (a) q = K^0.4·L^0.4; (b) q = 3K + 2L; (c) q = min(K, 2L); (d) q = K^0.5·L^0.6; (e) q = KL?''', '''
(a) Degree 0.8: decreasing. (b) Constant. (c) Constant. (d) Degree 1.1: increasing. (e) Degree 2: increasing.'''))
qs.append(Q('c21-e03', 21, 'Marginal rate of technical substitution', '''
For q = K^0.25·L^0.75, what's the MRTS at K = 16, L = 16 and at K = 16, L = 81? What does the difference mean?''', '''
MRTS = MP_L/MP_K = 3K/L. At (16, 16): 3. At (16, 81): 48/81 ≈ 0.59. With much more labour relative to capital, an extra
worker substitutes for much less capital — diminishing MRTS.''', kind='calc'))
qs.append(Q('c21-e04', 21, 'Cost minimisation', '''
For q = K^0.25·L^0.75 with wage {w} and rental rate {r}, what input mix minimises the cost of producing q = {q}, and what's the cost?''', '''
Tangency: MRTS = 3K/L = w/r = {=w/r:3} → K = {=w/(3*r):4}L. Then q = K^0.25 L^0.75 = L × {=(w/(3*r))^0.25:4} = {q} → L = {L:2}, K = {=L*w/(3*r):2}.
Cost = {w} × {L:2} + {r} × {=L*w/(3*r):2} = {=w*L+r*L*w/(3*r):2}.''',
kind='calc', vars={'w': C(3, 6, 9), 'r': C(1, 2, 3), 'q': R(50, 200, 50)}, compute={'L': 'q/(w/(3*r))^0.25'}, check=({'w': 6, 'r': 2, 'q': 100}, {'L': 100})))
qs.append(Q('c21-e05', 21, 'Homogeneity of cost functions', '''
For q = K^½·L^½, show that a 10% rise in both w and r raises the cost of every output by exactly 10% and leaves the
cost-minimising capital–labour ratio unchanged. What property of cost functions is this?''', '''
C = 2q√(wr). With 1.1w and 1.1r: 2q√(1.21wr) = 1.1 × 2q√(wr). K/L = w/r is unchanged by equal proportional increases.
This is homogeneity of degree 1 in input prices: only relative input prices affect the input mix.''', diff=2))
qs.append(Q('c21-e06', 21, 'Short-run cost curves', '''
Our total cost is TC = {F} + {a}q + q². What are FC, VC, AVC, ATC and MC? What output minimises ATC, and can you verify MC = ATC there?''', '''
FC = {F}; VC = {a}q + q²; AVC = {a} + q; ATC = {F}/q + {a} + q; MC = {a} + 2q. Min ATC: −{F}/q² + 1 = 0 → q = √{F} = {=sqrt(F):2}.
There ATC = {=2*sqrt(F)+a:2} = MC ✓.''',
kind='calc', vars={'F': C(25, 36, 50, 64, 100), 'a': R(2, 8)}, compute={'q': 'sqrt(F)'}, check=({'F': 50, 'a': 4}, {'q': 7.07}), tol=0.001))
qs.append(Q('c21-e07', 21, 'Supply curve and shutdown price', '''
A firm has TC = {F} + {a}q + q². What's its short-run supply curve and shutdown price? How much does it supply at P = {P},
and what's its profit?''', '''
AVC = {a} + q is lowest at q = 0, where it's {a}: shutdown price {a}. Supply: P = MC = {a} + 2q → q = (P − {a})/2 for P ≥ {a}.
At P = {P}: q = {=(P-a)/2}; revenue {=P*(P-a)/2}; cost {=F+a*(P-a)/2+((P-a)/2)^2}; profit {=P*(P-a)/2-F-a*(P-a)/2-((P-a)/2)^2}.''',
kind='calc', vars={'F': R(30, 80, 10), 'a': R(2, 8, 2), 'P': R(16, 30, 2)}, compute={'pi': 'P*(P-a)/2-F-a*(P-a)/2-((P-a)/2)^2'},
check=({'F': 50, 'a': 4, 'P': 24}, {'pi': 50})))
qs.append(Q('c21-e08', 21, 'Long-run competitive equilibrium', '''
Every firm in a competitive industry has long-run cost TC = 50 + 4q + q² (fixed cost avoidable by exit). Market demand is
Q = 1,000 − 20P. What's the long-run price, output per firm, market quantity and number of firms?''', '''
Long-run price = min ATC = 4 + 2√50 ≈ 18.14, with each firm producing √50 ≈ 7.07. Market Q = 1,000 − 20 × 18.14 = 637.2;
firms ≈ 637.2/7.07 ≈ 90 (an integer in practice, with price very slightly above min ATC).''', kind='calc', diff=2))
qs.append(Q('c21-e09', 21, 'Learning curves', '''
A battery maker's unit cost follows c = 500·Q^(−{b}), where Q is cumulative output in thousands. What's the learning
rate? By what factor does cost fall between cumulative output of 1 and 64 thousand?''', '''
Each doubling multiplies cost by 2^−{b} = {=2^(-b):3}: a learning rate of {=(1-2^(-b))*100:1}%. 1 → 64 is six doublings: factor
64^−{b} = {=64^(-b):3}, i.e. from 500 to about {=500*64^(-b):0}.''',
kind='calc', vars={'b': C(0.15, 0.23, 0.32, 0.4)}, compute={'f': '64^(-b)'}, check=({'b': 0.32}, {'f': 0.264}), tol=0.002))
qs.append(Q('c21-e10', 21, 'Economies of scope', '''
Producing q₁ and q₂ together costs C = 100 + 2q₁ + 3q₂. Producing either alone costs C₁ = 80 + 2q₁ or C₂ = 70 + 3q₂. Are
there economies of scope at q₁ = q₂ = 10? Where do they come from?''', '''
Joint: 150. Separate: 100 + 100 = 200. Joint production saves 50 — economies of scope. Source: shared fixed costs (a
building, sales force, brand): 100 together vs 80 + 70 = 150 separately.''', kind='calc'))
qs.append(Q('c21-e11', 21, 'User cost of capital', '''
A machine costs {P}, depreciates at {d}% a year, and its price is expected to be stable. The interest rate is {i}%. What's
the annual user cost? If the central bank pushes our rate to {i2}%, by what percentage does the user cost rise?''', '''
User cost = {P} × ({=i/100:2} + {=d/100:2}) = {=P*(i+d)/100:0}. At {i2}%: {=P*(i2+d)/100:0} — up {=(i2-i)/(i+d)*100:1}%. Interest is a bigger share of user
cost for slowly depreciating assets, so rate changes hit buildings harder than computers.''',
kind='calc', vars={'P': R(20000, 100000, 10000), 'd': R(5, 25), 'i': R(3, 6), 'di': C(1, 2)}, compute={'i2': 'i+di', 'u': 'P*(i+d)/100'},
check=({'P': 50000, 'd': 12, 'i': 5, 'di': 2}, {'u': 8500})))
qs.append(Q('c21-e12', 21, 'Zero economic profit vs accounting profit', '''
A competitive industry is in long-run equilibrium. A typical firm has {E} million of owners' equity, which could earn {r}%
a year elsewhere at similar risk, and no debt. What accounting profit (before tax) would you expect it to report?''', '''
Zero economic profit means owners earn exactly their opportunity cost: {r}% × {E} million = {=E*r/100:2} million. Accounting profit
doesn't deduct the cost of equity, so expect about {=E*r/100:2} million before tax (taxes complicate the comparison).''',
kind='calc', vars={'E': R(5, 50, 5), 'r': R(6, 12)}, compute={}, check=({'E': 10, 'r': 8}, {})))
# ---------------- Chapter 22 ----------------
qs.append(Q('c22-e01', 22, 'Equilibrium and surplus', '''
Demand is Qd = {a} − {b}P and supply is Qs = {d}P − {c}. What are the equilibrium price and quantity, consumer surplus
and producer surplus?''', '''
{a} − {b}P = {d}P − {c} → P* = {P:2}, Q* = {Q:2}. Choke price {=a/b:2}, supply intercept {=c/d:2}. CS = ½ × {Q:2} × ({=a/b:2} − {P:2}) = {=0.5*Q*(a/b-P):2};
PS = ½ × {Q:2} × ({P:2} − {=c/d:2}) = {=0.5*Q*(P-c/d):2}.''',
kind='calc', vars={'a': R(200, 300, 20), 'b': C(2, 4, 5), 'c': R(40, 80, 20), 'd': C(4, 6)}, compute={'P': '(a+c)/(b+d)', 'Q': 'a-b*(a+c)/(b+d)'},
check=({'a': 240, 'b': 4, 'c': 60, 'd': 6}, {'P': 30, 'Q': 120})))
qs.append(Q('c22-e03', 22, 'Tax incidence', '''
Demand is Qd = 240 − 4P and supply Qs = 6P − 60 (equilibrium P = 30, Q = 120). A tax of {t} per unit is levied on sellers.
What are the buyers' and sellers' prices, quantity, tax revenue and deadweight loss? Does the buyers' share match the
incidence formula?''', '''
240 − 4(Ps + {t}) = 6Ps − 60 → Ps = {=(300-4*t)/10:2}, Pd = {=(300-4*t)/10+t:2}, Q = {=6*(300-4*t)/10-60:2}. Revenue = {=t*(6*(300-4*t)/10-60):2};
DWL = ½ × {t} × {=120-(6*(300-4*t)/10-60):2} = {=0.5*t*(120-(6*(300-4*t)/10-60)):2}. At the original point ε_d = −1, ε_s = 1.5, so buyers bear
1.5/2.5 = 60% → {=0.6*t:2} of the {t} — Pd rose by exactly that.''',
kind='calc', diff=2, vars={'t': C(2, 4, 5, 6, 8, 10)}, compute={'Q': '6*(300-4*t)/10-60'}, check=({'t': 5}, {'Q': 108})))
qs.append(Q('c22-e04', 22, 'Doubling a tax', '''
In a market where a tax of 5 raises revenue of 540 with a deadweight loss of 30 (demand Qd = 240 − 4P, supply Qs = 6P − 60),
what happens with a tax of 10? By what factors do revenue and deadweight loss rise?''', '''
10Ps = 260 → Ps = 26, Pd = 36, Q = 96. Revenue 960 (1.78×); DWL = ½ × 10 × 24 = 120 (4×). Deadweight loss rises with the
square of the tax.''', kind='calc', diff=2))
qs.append(Q('c22-e05', 22, 'Subsidies', '''
Demand is Qd = 240 − 4P and supply Qs = 6P − 60. The government pays buyers a subsidy of 5 per unit. What are the new
prices and quantity, the cost of the subsidy, and the deadweight loss?''', '''
Pd = Ps − 5: 240 − 4(Ps − 5) = 6Ps − 60 → Ps = 32, Pd = 27, Q = 132. Cost = 5 × 132 = 660. DWL = ½ × 5 × 12 = 30 — units
121–132 cost more to produce than buyers value them.''', kind='calc', diff=2))
qs.append(Q('c22-e06', 22, 'Price ceilings', '''
Demand Qd = 240 − 4P and supply Qs = 6P − 60. A price ceiling of {c} is imposed. What's the shortage and the deadweight
loss (with efficient rationing)? Would the loss be bigger or smaller with random rationing?''', '''
At {c}: Qs = {=6*c-60}, Qd = {=240-4*c} → shortage {=300-10*c}. Demand price at Q = {=6*c-60}: {=60-(6*c-60)/4:2}. DWL = ½ × {=180-6*c} × ({=60-(6*c-60)/4:2} − {c})
= {=0.5*(180-6*c)*(60-(6*c-60)/4-c):2}. Random rationing makes it larger: some units go to buyers valuing them less while higher-value buyers go without.''',
kind='calc', diff=2, vars={'c': C(20, 22, 25, 27)}, compute={'dwl': '0.5*(180-6*c)*(60-(6*c-60)/4-c)'}, check=({'c': 25}, {'dwl': 187.5})))
qs.append(Q('c22-e07', 22, 'Minimum wage', '''
Labour demand is Ld = 1,000 − 20w and labour supply Ls = 30w − 250. What's the competitive wage and employment? With a
minimum wage of {m}, what's employment, how many want work but can't find it, and what's the deadweight loss?''', '''
Competitive: w = 25, L = 500. At w = {m}: employment Ld = {=1000-20*m}, Ls = {=30*m-250}, so {=50*m-1250} can't find work. Supply wage at
L = {=1000-20*m}: {=(1000-20*m+250)/30:2}. DWL = ½ × {=20*m-500} × ({m} − {=(1000-20*m+250)/30:2}) = {=0.5*(20*m-500)*(m-(1250-20*m)/30):1}.''',
kind='calc', diff=2, vars={'m': C(27, 28, 30, 32)}, compute={'dwl': '0.5*(20*m-500)*(m-(1250-20*m)/30)'}, check=({'m': 30}, {'dwl': 416.7}), tol=0.001))
qs.append(Q('c22-e08', 22, 'Tariffs', '''
Domestic demand is Qd = 200 − 2P and supply Qs = 3P − 50; the world price is 30. What are imports under free trade?
What does a tariff of 10 do to the domestic price, production, imports, consumer and producer surplus, revenue and
deadweight loss?''', '''
Free trade at 30: Qd = 140, Qs = 40, imports 100. With the tariff, P = 40: Qd = 120, Qs = 70, imports 50. CS falls 1,300;
PS rises 550; revenue 500; DWL = 1,300 − 550 − 500 = 250 (production distortion 150 + consumption distortion 100).''', kind='calc', diff=2))
qs.append(Q('c22-e09', 22, 'Quotas vs tariffs', '''
In a market where a tariff of 10 cuts imports from 100 to 50 and raises the domestic price to 40, what import quota gives
the same price? Who gets the rectangle that was tariff revenue if (a) import licences are auctioned, (b) licences are
given free to domestic importers, (c) it's a voluntary export restraint?''', '''
A quota of 50 units. (a) The government (each licence is worth 10 per unit). (b) The domestic importers who get
licences. (c) Foreign exporters, who sell at 40 goods they'd sell at 30 — the importing country's loss rises by 500 to 750.''', diff=2))
qs.append(Q('c22-e10', 22, 'Who bears a tax?', '''
Without calculating: who bears most of (a) a tax on land; (b) a tax on one brand of soft drink when there are many close
substitutes; (c) a payroll tax when labour supply is very inelastic?''', '''
(a) Landowners — land supply is perfectly inelastic. (b) The brand's producer and suppliers — demand for one brand is
very elastic. (c) Workers, via lower take-home pay, regardless of who legally pays: the inelastic side bears the tax.'''))
qs.append(Q('c22-e11', 22, 'General equilibrium in an exchange economy', '''
Consumer A has U = x^0.5·y^0.5 and endowment (6, 2); consumer B has U = x^0.25·y^0.75 and endowment (2, 6). With p_y = 1,
what's the equilibrium price of x and the allocation? Do both markets clear?''', '''
Incomes 6p + 2 and 2p + 6. xA = 0.5(6p + 2)/p, xB = 0.25(2p + 6)/p. Clearing x: (3.5p + 2.5)/p = 8 → p = 5/9 ≈ 0.556.
xA = 4.8, xB = 3.2; yA = 2.667, yB = 5.333. Totals 8 and 8 — both clear (Walras' law). x is cheap because B, who holds
much of the endowment value, cares little about x.''', kind='calc', diff=3))
qs.append(Q('c22-e12', 22, 'Market failures and the welfare theorem', '''
Which assumption of the first welfare theorem fails in each case? (a) a single firm supplies electricity to a region;
(b) a factory's smoke damages nearby crops; (c) used-car sellers know more about quality than buyers; (d) nobody can be
excluded from a city's fireworks display.''', '''
(a) Price-taking (market power). (b) No externalities. (c) Symmetric information. (d) Complete markets / excludability —
the display is a public good.'''))
qs.append(Q('c22-e13', 22, 'Long-run adjustment', '''
A constant-cost competitive industry is in long-run equilibrium and demand permanently increases. What happens in the
short run and long run to price, quantity, number of firms and economic profit?''', '''
Short run: price rises along short-run supply, firms expand where P = MC and earn positive economic profit. Long run:
entry shifts supply right until price returns to min LRAC. Result: same price, higher quantity, more firms, each at
minimum efficient scale, zero economic profit.'''))
# ---------------- Chapter 23 ----------------
qs.append(Q('c23-e01', 23, 'Dominance and mixed equilibria', '''
Row chooses T or B; column chooses L, M or R. Payoffs (row, column): T: L (3,1), M (2,4), R (1,2); B: L (1,3), M (4,2),
R (0,1). Find strictly dominated strategies and solve by iterated elimination if possible. Is there a pure-strategy Nash
equilibrium?''', '''
R is strictly dominated by M for the column player; eliminate it. Then nothing else is dominated. No pure equilibrium in
the reduced game (best responses cycle). Mixed: row plays T with p = 1/4 (column indifferent between L and M), column
plays L with q = 1/2 (row indifferent).''', kind='calc', diff=2))
qs.append(Q('c23-e02', 23, 'Game of chicken', '''
Two drivers head toward each other; each can Swerve or go Straight. Payoffs: (Swerve, Swerve) = (0, 0); (Swerve, Straight)
= (−1, 1); (Straight, Swerve) = (1, −1); (Straight, Straight) = (−{c}, −{c}). Find the pure-strategy Nash equilibria and the
mixed equilibrium.''', '''
Pure: (Swerve, Straight) and (Straight, Swerve). Mixed: if the other goes Straight with probability s, Swerve gives −s and
Straight gives 1 − s − {c}s; indifference gives s = 1/{c} = {=1/c:3}. Crash probability {=1/c^2:4}.''',
kind='calc', vars={'c': C(5, 10, 20)}, compute={'s': '1/c'}, check=({'c': 10}, {'s': 0.1})))
qs.append(Q('c23-e03', 23, 'Mixed strategies: penalty kicks', '''
Penalty kicks: the kicker goes Left or Right and the keeper dives Left or Right. Scoring probabilities: (Left, Left) 0.50,
(Left, Right) 0.90, (Right, Left) 1.00, (Right, Right) 0.60. What are the equilibrium mixes and scoring probability?
(Before practice, (Right, Left) scored 0.95.) Whose mix changes, and why?''', '''
Keeper dives Left with q: 0.50q + 0.90(1 − q) = 1.0q + 0.60(1 − q) → q = 0.375. Kicker kicks Left with p: 0.50p + 1.0(1 − p)
= 0.90p + 0.60(1 − p) → p = 0.5. Scoring probability 0.75. Both mixes change: the kicker now kicks Left more (0.5 vs 0.467)
— to keep the keeper willing to dive Left — and the keeper dives Left less (0.375 vs 0.4). Each mix is pinned by the
other player's payoffs.''', kind='calc', diff=3))
qs.append(Q('c23-e04', 23, 'Best responses and strategic substitutes', '''
Two firms choose advertising a₁, a₂ ≥ 0. Firm 1's profit is π₁ = a₁({k} − a₁ − 0.5a₂), and symmetrically for firm 2. What are
the best-response functions and Nash equilibrium? Are advertising levels strategic complements or substitutes?''', '''
∂π₁/∂a₁ = {k} − 2a₁ − 0.5a₂ = 0 → a₁ = {=k/2} − 0.25a₂ (and symmetrically). Symmetric equilibrium a = {=k/2} − 0.25a → a* = {=k/2.5:2}.
Best responses slope down: strategic substitutes.''', kind='calc', vars={'k': R(10, 30, 5)}, compute={'a': 'k/2.5'}, check=({'k': 20}, {'a': 8})))
qs.append(Q('c23-e05', 23, 'Backward induction and credible threats', '''
An incumbent earns 10 if no one enters. If an entrant comes in, the incumbent can accommodate (entrant 3, incumbent 5)
or fight. Payoffs if it fights are (entrant −2, incumbent {f}). What's the subgame-perfect equilibrium?''', '''
After entry the incumbent compares 5 (accommodate) with {f} (fight) and {?f>5|fights. Anticipating this, the entrant compares −2 with 0 and stays out: SPE (Out, Fight), incumbent earns 10 — the threat is credible.|accommodates. Anticipating this, the entrant compares 3 with 0 and enters: SPE (In, Accommodate). The threat to fight isn't credible.}''',
vars={'f': C(2, 3, 6, 7)}, compute={}, check=({'f': 6}, {}), diff=2))
qs.append(Q('c23-e06', 23, 'Value of commitment', '''
In an entry game, an incumbent earns 10 with no entry; if the entrant enters, accommodating gives (entrant 3, incumbent 5)
and fighting gives (−2, 2). What's the most the incumbent would pay for a commitment device that made fighting credible
and deterred entry?''', '''
Without the device the incumbent gets 5 (entry, accommodate). With a device that deters entry it gets 10 minus the cost.
It would pay up to 5.''', kind='calc'))
qs.append(Q('c23-e07', 23, 'Repeated games and grim trigger', '''
In a prisoner's dilemma with temptation T = {T}, reward R = {Rw}, punishment P = {P} and sucker S = 0, what's the minimum
discount factor for grim trigger to sustain cooperation? If each round is a year and discounting is only from an
interest rate i, what's the maximum i?''', '''
δ ≥ (T − R)/(T − P) = {=T-Rw}/{=T-P} = {d:3}. With δ = 1/(1 + i): i ≤ 1/δ − 1 = {=(1/d-1)*100:1}%. Cooperation is sustainable at
any plausible interest rate; real cartels break down because of uncertain continuation, imperfect monitoring and changing payoffs.''',
kind='calc', vars={'T': R(8, 12), 'Rw': R(5, 7), 'P': R(1, 3)}, compute={'d': '(T-Rw)/(T-P)'}, check=({'T': 10, 'Rw': 7, 'P': 2}, {'d': 0.375})))
qs.append(Q('c23-e08', 23, 'Collusion with uncertain continuation', '''
Firms discount at {i}% per period, and after each period there's a probability ρ that the market disappears. In a pricing
game with T = 5, R = 3, P = 1, collusion needs δ ≥ 0.5. What's the effective discount factor, and the largest ρ at which
collusion is sustainable?''', '''
δ = (1 − ρ)/{=1+i/100:2}. Need δ ≥ 0.5: 1 − ρ ≥ {=0.5*(1+i/100):3} → ρ ≤ {=1-0.5*(1+i/100):3}.''',
kind='calc', vars={'i': C(3, 5, 8, 10)}, compute={'r': '1-0.5*(1+i/100)'}, check=({'i': 5}, {'r': 0.475})))
qs.append(Q('c23-e09', 23, 'Finitely repeated games', '''
Why does the argument that cooperation unravels in a finitely repeated prisoner's dilemma depend on the one-shot game
having a unique Nash equilibrium?''', '''
In the last round players must play a one-shot Nash equilibrium; if it's unique, the last-round outcome is fixed whatever
happened before, so earlier behaviour can't be rewarded or punished, and the logic unravels backward. With several
equilibria, players can threaten a bad one after defection and promise a good one after cooperation.''', diff=3))
qs.append(Q('c23-e10', 23, 'Bank runs and deposit insurance', '''
Two depositors each put 100 in a bank whose project yields 240 if it matures but 160 if liquidated early. Payoffs:
both wait (120, 120); one withdraws (100 to her, 60 to the other); both withdraw (80, 80). Now deposit insurance
guarantees each depositor 100 whatever happens. What are the new payoffs? Show Wait becomes dominant. Would the
insurance ever pay out?''', '''
With insurance: (Wait, Wait) = (120, 120); any withdrawal → everyone gets 100 (the waiter is topped up). Wait weakly
dominates Withdraw (strictly if the other waits), so (Wait, Wait) results: no run, no liquidation, and the insurance
never pays — credible insurance removes the bad equilibrium (though it can encourage banks to take more risk).''', diff=2))
qs.append(Q('c23-e11', 23, 'Time inconsistency', '''
Our government announced it will never forgive student loans, so students borrow prudently. Why might that not be
credible, and what commitment device could help?''', '''
Once borrowers are heavily indebted and struggling, forgiveness becomes attractive ex post, so the promise is
time-inconsistent and students may borrow more anticipating it. Devices: laws requiring a supermajority to forgive,
contracts with private lenders the government can't alter, or a track record of not forgiving.''', diff=2))
qs.append(Q('c23-e12', 23, 'Ultimatum game', '''
A proposer splits 100. She believes the responder rejects any offer below 25 and accepts 25 or more. What does a
self-interested proposer offer? And if she believes the acceptance probability for an offer x (0–50) is x/50?''', '''
First case: offer exactly 25, keep 75. Second: maximise (100 − x)(x/50); the derivative (100 − 2x)/50 > 0 for x < 50, so
offer 50 and keep 50 for sure. Beliefs, not generosity, drive the offer.''', kind='calc', diff=2))
# ---------------- Chapter 24 ----------------
qs.append(Q('c24-e01', 24, 'Monopoly pricing', '''
A monopolist faces P = {a} − Q and has TC = {F} + {c}Q. What's the profit-maximising quantity, price and profit? Compute the
Lerner index and check it equals −1/ε. What's the deadweight loss?''', '''
MR = {a} − 2Q = {c} → Q = {Q}, P = {=a-Q}. Profit = {=(a-Q)*Q-F-c*Q}. Lerner = ({=a-Q} − {c})/{=a-Q} = {=(a-Q-c)/(a-Q):3}; ε = −(a−Q)/Q = {=-(a-Q)/Q:3},
−1/ε = {=Q/(a-Q):3} ✓. Competitive Q = {=a-c}; DWL = ½ × {Q} × {Q} = {=0.5*Q*Q}.''',
kind='calc', vars={'a': R(60, 120, 10), 'c': R(5, 20, 5), 'F': R(50, 200, 50)}, compute={'Q': '(a-c)/2'}, check=({'a': 80, 'c': 10, 'F': 100}, {'Q': 35})))
qs.append(Q('c24-e02', 24, 'Markups with constant elasticity', '''
A monopolist faces demand with constant elasticity −{e} and constant marginal cost {c}. What price does it charge? If a
per-unit tax of {t} is imposed, how much does the price rise? How does that compare with a competitive market with flat supply?''', '''
P = MC/(1 − 1/{e}) = {=e/(e-1):3} × {c} = {=c*e/(e-1):2}. With the tax, MC = {=c+t} → P = {=(c+t)*e/(e-1):2}: up {=t*e/(e-1):2}, more than the tax.
Under competition the price would rise by exactly {t}. A constant percentage markup passes on more than 100% of cost increases.''',
kind='calc', vars={'e': C(2, 3, 4, 5), 'c': R(8, 20, 2), 't': R(2, 5)}, compute={'p': 'c*e/(e-1)'}, check=({'e': 3, 'c': 12, 't': 3}, {'p': 18})))
qs.append(Q('c24-e03', 24, 'Natural monopoly regulation', '''
A water utility has TC = 1,200 + 2Q and faces demand P = 20 − 0.1Q. What's (a) the unregulated monopoly outcome; (b) the
outcome with marginal-cost pricing and the subsidy needed; (c) average-cost pricing?''', '''
(a) MR = 20 − 0.2Q = 2 → Q = 90, P = 11, profit −390: even a monopolist can't cover the fixed cost. (b) P = 2, Q = 180,
subsidy 1,200 (the fixed cost). (c) No solution: AC lies above demand everywhere. Provision needs a subsidy — and is
efficient here because surplus at P = MC (1,620) exceeds the fixed cost (1,200).''', kind='calc', diff=3))
qs.append(Q('c24-e04', 24, 'Third-degree price discrimination', '''
A theatre has adults with Q_A = 200 − 4P_A and students with Q_S = 120 − 4P_S. Marginal cost is 5 per seat and capacity
isn't binding. What are the discriminating prices? What single price maximises profit if discrimination is banned?''', '''
Adults: MR = 50 − Q/2 = 5 → Q = 90, P = 27.5. Students: MR = 30 − Q/2 = 5 → Q = 50, P = 17.5. Profit 2,650.
Single price (both served, P ≤ 30): Q = 320 − 8P → P = 22.5, Q = 140, profit 2,450 (beats adults-only 2,025).''', kind='calc', diff=2))
qs.append(Q('c24-e05', 24, 'Two-part tariffs', '''
Each of {n} identical gym customers has demand for visits q = {a} − 2p, and a visit costs us {c}. What's the
profit-maximising two-part tariff and our profit?''', '''
Set the per-visit price at marginal cost {c}: each makes {=a-2*c} visits. Consumer surplus per customer = ½ × {=a-2*c} × ({=a/2} − {c}) = {cs:2},
so the membership fee is {cs:2}. Profit = {n} × {cs:2} = {=n*cs:2} (zero margin per visit).''',
kind='calc', vars={'n': C(50, 100, 200), 'a': R(16, 30, 2), 'c': R(1, 4)}, compute={'cs': '0.5*(a-2*c)*(a/2-c)'}, check=({'n': 100, 'a': 20, 'c': 2}, {'cs': 64})))
qs.append(Q('c24-e06', 24, 'Monopsony and the minimum wage', '''
A firm's marginal revenue product of labour is MRP = {a} − L and labour supply is w = {b} + 0.5L. What's employment and
the wage under monopsony? What minimum wage maximises employment?''', '''
MFC = {b} + L. Monopsony: {a} − L = {b} + L → L = {=(a-b)/2}, w = {=b+0.25*(a-b)}. Competitive point: {a} − L = {b} + 0.5L → L = {=(a-b)/1.5:2},
w = {=b+0.5*(a-b)/1.5:2}. A minimum wage of {=b+0.5*(a-b)/1.5:2} maximises employment.''',
kind='calc', vars={'a': R(30, 60, 2), 'b': R(2, 8, 2)}, compute={'L': '(a-b)/1.5'}, check=({'a': 40, 'b': 4}, {'L': 24})))
qs.append(Q('c24-e07', 24, 'Cournot duopoly', '''
Two firms face P = 200 − 2Q with marginal costs 20 and 40. What are the Cournot quantities, price and profits?''', '''
Best responses q₁ = 45 − q₂/2 and q₂ = 40 − q₁/2 → q₁ = 33.33, q₂ = 23.33, Q = 56.67, P = 86.67. Profits 2,222 and 1,089.
Lerner index = share/|ε| for each firm (0.769 and 0.538 with ε = −0.765).''', kind='calc', diff=3))
qs.append(Q('c24-e08', 24, 'Cournot with many firms', '''
With P = 120 − Q and marginal cost 30, what are the Cournot price and total industry profit for n = 1, 2, 3, 5 and 10
firms? What's the pattern?''', '''
P = (120 + 30n)/(n + 1); Π = n[90/(n + 1)]². n = 1: 75, 2,025; n = 2: 60, 1,800; n = 3: 52.5, 1,518.75; n = 5: 45, 1,125;
n = 10: 38.18, 669.4. Price and profit fall toward the competitive values (30, 0), quickly at first then more slowly.''', kind='calc', diff=2))
qs.append(Q('c24-e09', 24, 'Stackelberg leadership', '''
Two firms face P = 200 − 2Q, both with marginal cost 20. What's the Stackelberg outcome with firm 1 leading? How does it
compare with Cournot?''', '''
Follower: q₂ = 45 − q₁/2. Leader maximises (90 − q₁)q₁ → q₁ = 45, q₂ = 22.5, P = 65; profits 2,025 and 1,012.5. Cournot:
30 each, P = 80, profits 1,800 each. The leader gains, the follower loses, price falls.''', kind='calc', diff=2))
qs.append(Q('c24-e10', 24, 'Bertrand with differentiated products', '''
Two coffee chains face q₁ = 100 − 2p₁ + p₂ and q₂ = 100 − 2p₂ + p₁. Firm 2's marginal cost is 10, but firm 1's has fallen
to {c}. What are the equilibrium prices?''', '''
Firm 1: p₁ = (100 + 2 × {c} + p₂)/4; firm 2: p₂ = (120 + p₁)/4. Solving: p₁ = {p1:2}, p₂ = {=(120+p1)/4:2}. The low-cost firm cuts
its price; prices are strategic complements, so the rival cuts slightly too.''',
kind='calc', diff=2, vars={'c': C(4, 6, 8)}, compute={'p1': '(4*(100+2*c)+120)/15'}, check=({'c': 6}, {'p1': 37.87}), tol=0.001))
qs.append(Q('c24-e11', 24, 'Concentration and merger screening', '''
A market has five firms with shares {s1}, {s2}, {s3}, {s4} and {s5}%. What are CR4 and the HHI? The two smallest firms
want to merge. How much does the HHI rise, and would the merger be presumed anti-competitive under the 2023 U.S.
guidelines (HHI > 1,800 and increase > 100)?''', '''
CR4 = {=s1+s2+s3+s4}. HHI = {h}. Merger raises HHI by 2 × {s4} × {s5} = {=2*s4*s5} to {=h+2*s4*s5}. {?h+2*s4*s5>1800 && 2*s4*s5>100|Highly concentrated with an increase above 100: presumed to lessen competition substantially.|Not presumed anti-competitive by these thresholds.}''',
kind='calc', vars={'s1': R(30, 40, 5), 's2': R(20, 25, 5), 's3': R(15, 20, 5), 's4': R(5, 10, 5)}, compute={'s5': '100-s1-s2-s3-s4', 'h': 's1^2+s2^2+s3^2+s4^2+(100-s1-s2-s3-s4)^2'},
constraints=['100-s1-s2-s3-s4>0', '100-s1-s2-s3-s4<=s4'], check=({'s1': 35, 's2': 25, 's3': 20, 's4': 10}, {'s5': 10, 'h': 2450})))
qs.append(Q('c24-e12', 24, 'Platform pricing', '''
Why might a platform rationally charge zero (or even negative) prices to one side of the market? And why does that make
the usual "small but significant price increase" test for market definition hard to apply?''', '''
Each extra user on the subsidised side raises revenue from the other side, so the effective marginal cost of attracting
them can be negative. A 5–10% rise on a zero price is meaningless, and a price rise on one side loses users on both.
Analysts instead consider quality reductions (more ads, less privacy) or analyse both sides together.''', diff=2))
# ---------------- Chapter 25 ----------------
qs.append(Q('c25-e01', 25, 'Certainty equivalent and risk premium', '''
I have wealth 100 and log utility. A gamble adds or subtracts {g} with equal probability. What's my expected wealth,
expected utility, certainty equivalent and risk premium? Would I take it for free?''', '''
Expected wealth 100. EU = 0.5 ln {=100+g} + 0.5 ln {=100-g} = {eu:3}. CE = e^{eu:3} = {ce:1}. Risk premium = {=100-ce:1}. Reject it: ln 100 = 4.605 > {eu:3}.''',
kind='calc', vars={'g': R(20, 60, 10)}, compute={'eu': '0.5*ln(100+g)+0.5*ln(100-g)', 'ce': 'exp(0.5*ln(100+g)+0.5*ln(100-g))'}, check=({'g': 50}, {'ce': 86.6}), tol=0.001))
qs.append(Q('c25-e02', 25, 'The demand for insurance', '''
A homeowner has wealth 10,000 and u(w) = √w. With probability 0.1 a fire destroys property worth 6,400 (expected utility
96 uninsured). An insurer offers full coverage for {p}. What's her utility if she buys? What's the highest premium the
insurer could charge? If the insurer's admin cost is 50 per policy, what premiums make both better off?''', '''
Insured: √{=10000-p} = {=sqrt(10000-p):2} {?sqrt(10000-p)>96|> 96, so she buys|< 96, so she doesn't buy}. Highest premium: 10,000 − 96² = 784. The insurer needs at
least the expected loss 640 + 50 = 690, so premiums between 690 and 784 make both better off.''',
kind='calc', vars={'p': C(650, 700, 750, 800)}, compute={}, check=({'p': 700}, {}), diff=2))
qs.append(Q('c25-e03', 25, 'Measures of risk aversion', '''
What are the Arrow–Pratt absolute and relative risk aversion for (a) u = ln w; (b) u = √w; (c) u = −e^(−0.01w)? Which has
constant absolute risk aversion?''', '''
(a) A = 1/w, R = 1. (b) A = 1/(2w), R = 1/2. (c) A = 0.01 (constant), R = 0.01w. Case (c) is CARA.''', diff=2))
qs.append(Q('c25-e04', 25, 'Risk pooling', '''
Each of n independent households faces a loss of 10,000 with probability {p}. What are the mean and standard deviation of
the average loss per household for n = 1, 100 and 10,000? Why does that matter for an insurer, and what if losses were
perfectly correlated?''', '''
Mean = {p} × 10,000 = {=p*10000}. One household's s.d. = 10,000√({p} × {=1-p}) = {sd:0}; average over n: {sd:0}/√n → {sd:0}, {=sd/10:1}, {=sd/100:2}.
With many policies the insurer can price accurately with modest reserves. With perfect correlation the s.d. stays {sd:0}
whatever n — pooling doesn't help.''',
kind='calc', vars={'p': C(0.01, 0.02, 0.05)}, compute={'sd': '10000*sqrt(p*(1-p))'}, check=({'p': 0.01}, {'sd': 995}), tol=0.001))
qs.append(Q('c25-e05', 25, 'Lemons market', '''
Used-car quality q is uniform between 0 and 1,000; sellers value a car at q, but buyers value it at {k}q and can't observe
quality. What's the equilibrium price and the range of qualities traded? Are all gains from trade realised?''', '''
At price p, cars offered have average quality p/2, worth {k}p/2 = {=k/2:2}p to buyers. {?k>2|Since {=k/2:2}p ≥ p, buyers will pay for all cars offered; the price rises to 1,000, all cars trade and all gains are realised.|Since {=k/2:2}p < p for every positive price, buyers never pay what sellers ask: the only equilibrium is p = 0 and no cars trade.}
Adverse selection kills trade only when the valuation gap is small relative to the dispersion of quality.''',
vars={'k': C(1.5, 1.8, 2.5, 3)}, compute={}, check=({'k': 2.5}, {}), diff=2))
qs.append(Q('c25-e06', 25, 'Adverse selection with a quality floor', '''
Used-car quality is uniform between 500 and 1,000; sellers value a car at q and buyers at 1.2q. Buyers pay the expected
value of the cars offered. What's the equilibrium, and do all cars trade?''', '''
At price p, cars with q ≤ p are offered, average quality (500 + p)/2, worth 300 + 0.6p to buyers. Equilibrium: 300 + 0.6p = p
→ p = 750. Only cars of quality 500–750 trade; better cars don't, though buyers value each at 1.2× its owner's valuation —
adverse selection halves the market.''', kind='calc', diff=3))
qs.append(Q('c25-e07', 25, 'Job-market signalling', '''
Workers are High (productivity 2) or Low (productivity 1). Education doesn't raise productivity; it costs e for Low types and
e/3 for High types. What's the range of separating education levels? Which would High types prefer, and what's the social waste?''', '''
Low mustn't mimic: 1 ≥ 2 − e* → e* ≥ 1. High must want it: 2 − e*/3 ≥ 1 → e* ≤ 3. High types prefer the cheapest separating
level, e* = 1; the waste is their education cost, 1/3 per High worker (education is unproductive).''', kind='calc', diff=3))
qs.append(Q('c25-e08', 25, 'Principal–agent incentives', '''
A shop's monthly profit is 100 or 0. With effort the manager makes 100 with probability {ph}; without effort, {pl}. Effort
costs her {c}. The owner pays a bonus b only when profit is high (limited liability, outside option 0). What's the minimum
bonus that induces effort, and does the owner want to induce it?''', '''
IC: {ph}b − {c} ≥ {pl}b → b ≥ {b:2}; expected pay {=ph*b:2}. Owner's profit with effort {=100*ph}-{=ph*b:2} = {=100*ph-ph*b:2}; without effort {=100*pl}.
{?100*ph-ph*b>100*pl|Induce effort.|Don't induce effort — the information rent makes it unprofitable even though effort raises output by more than it costs.}''',
kind='calc', diff=2, vars={'ph': C(0.8, 0.9), 'pl': C(0.4, 0.5), 'c': C(10, 15, 20)}, compute={'b': 'c/(ph-pl)'}, constraints=['abs(100*ph-ph*c/(ph-pl)-100*pl)>0.5'],
check=({'ph': 0.9, 'pl': 0.5, 'c': 20}, {'b': 50})))
qs.append(Q('c25-e09', 25, 'Moral hazard and co-payments', '''
Why might a health insurer charge a co-payment per doctor's visit even if processing claims costs nothing? What's the
downside?''', '''
Without it, a visit costs the insured nothing, so she goes whenever the benefit is positive, even below the true cost —
moral hazard. A co-payment moves her marginal cost toward the social cost, cutting low-value visits. Downside: she bears
some financial risk and may skip valuable care (hence exemptions for preventive care or low incomes).'''))
qs.append(Q('c25-e10', 25, 'Credit rationing', '''
A bank lends 100. The borrower can choose a safe project returning {s} for certain or a risky one returning {r} with
probability 0.5 and 0 otherwise, and has limited liability. At what repayment R does the borrower switch to the risky
project? Show the bank's expected return peaks there.''', '''
Safe: borrower keeps {s} − R. Risky: 0.5({r} − R). Risky preferred when R > {=2*s-r}. For R ≤ {=2*s-r} the bank gets R (up to {=2*s-r}); above it
the bank gets 0.5R ≤ {=0.5*r}. Expected return peaks at R = {=2*s-r}; charging more lowers it, so the bank rations credit rather
than raising the rate.''',
kind='calc', diff=3, vars={'s': R(120, 140, 5), 'r': R(150, 170, 10)}, compute={'R': '2*s-r'}, constraints=['2*s-r>100', '2*s-r<r', '2*s-r>0.5*r'],
check=({'s': 130, 'r': 150}, {'R': 110})))
qs.append(Q('c25-e11', 25, 'Skin in the game', '''
Why might requiring securitisers to keep 5% of the credit risk of loans they sell improve screening? Why might 5% be too little?''', '''
Retention makes the originator bear part of the loss from poor screening, aligning incentives (the incentive-compatibility
constraint). 5% may be too little if careful screening costs more than 5% of the losses it prevents, if the retained piece
can be hedged, or if limited liability means big losses aren't borne in full.''', diff=2))
# ---------------- Chapter 26 ----------------
qs.append(Q('c26-e01', 26, 'Negative externalities and Pigouvian taxes', '''
Demand is P = 60 − 0.5Q and private marginal cost MPC = 10 + 0.5Q. Production causes an external cost MEC = {k}Q. What
are the market quantity, efficient quantity, Pigouvian tax and deadweight loss of the market outcome?''', '''
Market: Q = 50, P = 35. MSC = 10 + {=0.5+k}Q; efficient: 60 − 0.5Q = 10 + {=0.5+k}Q → Q* = {Qs:2}. Tax = MEC(Q*) = {=k*Qs:2}.
DWL = ½ × (50 − {Qs:2}) × (MSC(50) − 35) = {=0.5*(50-Qs)*(10+(0.5+k)*50-35):2}.''',
kind='calc', vars={'k': C(0.1, 0.25, 0.5)}, compute={'Qs': '50/(1+k)'}, check=({'k': 0.25}, {'Qs': 40})))
qs.append(Q('c26-e02', 26, 'Positive externalities', '''
Private marginal benefit from vaccination is MPB = {a} − Q (Q in thousands) and marginal cost is {c}. Each vaccination gives
others an external benefit of {e}. What are the market quantity, efficient quantity and the subsidy that achieves it?''', '''
Market: {a} − Q = {c} → Q = {=a-c} thousand. Social benefit {=a+e} − Q; efficient Q = {=a+e-c} thousand. A subsidy of {e} per vaccination gets there.''',
kind='calc', vars={'a': R(40, 60, 5), 'c': R(10, 25, 5), 'e': R(5, 15, 5)}, compute={}, check=({'a': 50, 'c': 20, 'e': 10}, {})))
qs.append(Q('c26-e03', 26, 'The Coase theorem', '''
A rancher's cattle damage a farmer's crops: damage without a fence is 500, a fence costs {f}, and the rancher's cattle
profit is 1,000. Who builds the fence (and pays) if the farmer has the right to be free of damage? If the rancher has the
right to let cattle roam?''', '''
{?f<500|Efficiency requires the fence ({f} < 500). If the farmer has the right, the rancher builds and pays for it. If the rancher has the right, the farmer pays (or pays the rancher between {f} and 500 to build it). Either way it's built.|Efficiency requires no fence ({f} > 500). If the farmer has the right, the rancher pays 500 compensation and keeps the cattle (1,000 > 500). If the rancher has the right, the farmer bears the damage. Either way, no fence.}
The allocation is efficient either way; the rights only decide who pays.''', vars={'f': C(300, 400, 700, 800)}, compute={}, check=({'f': 300}, {}), diff=2))
qs.append(Q('c26-e04', 26, 'Cost-effective abatement', '''
Three firms have marginal abatement costs MAC₁ = a₁, MAC₂ = 2a₂, MAC₃ = 4a₃. The regulator wants total abatement of {A}.
What's the cost-effective allocation, the tax that achieves it, and the total cost? How does an equal standard compare?''', '''
Equalise MACs at λ: a₁ = λ, a₂ = λ/2, a₃ = λ/4, so 1.75λ = {A} → λ = {=A/1.75:2}. Allocation {=A/1.75:2}, {=A/3.5:2}, {=A/7:2}; tax {=A/1.75:2}.
Cost = a₁²/2 + a₂² + 2a₃² = {=(A/1.75)^2/2+(A/3.5)^2+2*(A/7)^2:1}. Equal standard ({=A/3:2} each): {=(A/3)^2*3.5:1}.''',
kind='calc', diff=2, vars={'A': R(35, 105, 35)}, compute={'cost': '(A/1.75)^2/2+(A/3.5)^2+2*(A/7)^2'}, check=({'A': 70}, {'cost': 1400})))
qs.append(Q('c26-e05', 26, 'Tradable permits', '''
Two firms each emit 50 tonnes unabated; MAC₁ = 2a₁ and MAC₂ = 4a₂. The government issues 70 permits: 50 to firm 1 and 20 to
firm 2. What trade happens, at what permit price, and what's each firm's net cost?''', '''
Total abatement 30, cost-effective where MACs are equal: a₁ = 20, a₂ = 10, price 40. Firm 1 abates 20 and sells 20 permits:
cost 400, revenue 800, net gain 400. Firm 2 abates 10 and buys 20: cost 200 + 800 = 1,000. Total abatement cost 600; the
permit allocation decides the distribution.''', kind='calc', diff=3))
qs.append(Q('c26-e06', 26, 'Public goods and free riding', '''
Two residents value a park of G hectares with MB₁ = 20 − 2G and MB₂ = 10 − G. Each hectare costs {c}. What's the efficient
size? If resident 1 alone decides, how big is the park?''', '''
ΣMB = 30 − 3G = {c} → G* = {=(30-c)/3:2}. Resident 1 alone: 20 − 2G = {c} → G = {=(20-c)/2:2}; resident 2 then values more park at
{=10-(20-c)/2:2} < {c} and contributes nothing — under-provision.''',
kind='calc', vars={'c': C(12, 15, 18)}, compute={'g': '(30-c)/3'}, check=({'c': 15}, {'g': 5})))
qs.append(Q('c26-e07', 26, 'Tragedy of the commons', '''
On a fishing ground, catch per boat is 20 − n (n = number of boats) and each boat costs 4 to run. Open access leads to too
many boats. What licence fee per boat achieves the efficient number, and how much revenue does it raise?''', '''
Efficient n maximises n(20 − n) − 4n → n = 8. Entry continues until 20 − n = 4 + f, so f = 8 gives n = 8. Revenue = 64 — the
resource rent open access dissipated.''', kind='calc', diff=2))
qs.append(Q('c26-e08', 26, 'Second-price auctions', '''
Three bidders value an object at {v1}, {v2} and {v3} in a second-price sealed-bid auction. Who wins and pays what if all bid
truthfully? Show the winner can't gain by bidding differently, and that the {v2}-bidder can't gain by overbidding.''', '''
The {v3}-bidder wins and pays {v2}. Bidding more or less (while staying top) changes nothing — price is set by the second bid.
The {v2}-bidder bidding above {v3} would win and pay {v3}: a loss of {=v3-v2}. Truthful bidding is dominant.''',
vars={'v1': R(30, 45, 5), 'v2': R(50, 60, 5), 'v3': R(65, 80, 5)}, compute={}, check=({'v1': 40, 'v2': 55, 'v3': 70}, {})))
qs.append(Q('c26-e09', 26, 'First-price auctions and revenue equivalence', '''
With three bidders whose values are independent and uniform on [0, 1], what does a bidder with value {v} bid in the
symmetric first-price equilibrium? What's the seller's expected revenue, and how does it compare with a second-price auction?''', '''
Bid = (2/3) × {v} = {=2*v/3:3}. Expected revenue in both formats = expected second-highest of three uniforms = (n − 1)/(n + 1) = 0.5
(revenue equivalence).''', kind='calc', diff=3, vars={'v': C(0.6, 0.75, 0.9)}, compute={}, check=({'v': 0.9}, {})))
qs.append(Q('c26-e10', 26, "The winner's curse in auctions", '''
Five firms bid for a drilling right truly worth 100. Each firm's estimate is the true value plus an error equally likely to
be −20, −10, 0, +10 or +20. Why does a firm that bids its estimate in a first-price auction expect to lose money if it wins?''', '''
The highest estimate wins, and with five firms it's very likely someone overestimates by 10 or 20. Conditional on winning,
your estimate is probably too high, so bidding it means overpaying on average. Rational firms shade bids below their estimates.''', diff=2))
qs.append(Q('c26-e11', 26, 'Carbon tax vs cap', '''
Why might a government unsure about abatement costs prefer a carbon tax when marginal damages are nearly constant, but a
cap when there's a threshold beyond which damages rise sharply?''', '''
With flat marginal damage, getting the quantity slightly wrong costs little, but the wrong price (forcing very costly
abatement) can be expensive — a tax at marginal damage gets the price right whatever costs turn out to be. With a threshold,
overshooting is very costly, so fixing the quantity matters more — a cap guarantees it, at the cost of uncertain spending.''', diff=2))
write(6, 'Economist', 'rank06_economist.json', qs)
