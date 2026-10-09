from qlib import *
qs = []
# ---------------- Chapter 32 ----------------
qs.append(Q('c32-e01', 32, 'Relevant cash flows', '''
We're considering launching a new drink. Which of these are relevant to the decision? (a) 2 million already spent on
market research; (b) sales of our existing drinks expected to fall by 1 million a year; (c) a share of head-office costs of
0.5 million a year that won't change; (d) an unused bottling line we could sell for 3 million; (e) interest on a loan taken
to finance the launch.''', '''
(a) Sunk — exclude. (b) Cannibalisation — include as a cost of 1 million a year. (c) Unchanged overhead — exclude. (d)
Opportunity cost — include the forgone 3 million (after tax) at the start. (e) Financing flow — exclude; financing enters
through the discount rate.'''))
qs.append(Q('c32-e02', 32, 'Operating cash flow', '''
A project has revenue {R}, cash costs {C} and depreciation {D} a year; tax rate {t}%. What's the operating cash flow? Can you
show it two ways?''', '''
(R − C − D)(1 − t) + D = {=(R-C-D)*(1-t/100)} + {D} = {ocf}. Or (R − C)(1 − t) + t·D = {=(R-C)*(1-t/100)} + {=t/100*D} = {ocf} (the depreciation tax shield).''',
kind='calc', vars={'R': R(1500, 3000, 100), 'C': R(800, 1400, 100), 'D': R(200, 400, 50), 't': C(20, 25, 30)}, compute={'ocf': '(R-C)*(1-t/100)+t/100*D'},
constraints=['R-C-D>0'], check=({'R': 2000, 'C': 1200, 'D': 300, 't': 30}, {'ocf': 650})))
qs.append(Q('c32-x01', 32, 'Project NPV with working capital and salvage', '''
A machine costs {M}, depreciated straight-line to zero over 5 years. It generates revenue of {R} and cash costs of {C} a year,
needs working capital of {W} at the start (recovered at the end), and can be sold for {S} at the end of year 5 (taxed at
25%). We already spent 50 on a feasibility study. Discount rate 10%. What's the NPV?''', '''
OCF = ({R} − {C}) × 0.75 + 0.25 × {=M/5} = {ocf}. Year 0: −{=M+W}. Years 1–4: {ocf}. Year 5: {ocf} + {W} + {=S*0.75} (after-tax salvage).
NPV = −{=M+W} + {ocf} × 3.7908 + ({W} + {=S*0.75})/1.1⁵ = {npv:1}. The 50 study cost is sunk and excluded.''',
kind='calc', diff=2, vars={'M': R(800, 1400, 100), 'R': R(700, 1000, 50), 'C': R(300, 500, 50), 'W': R(50, 150, 50), 'S': R(0, 150, 50)},
compute={'ocf': '(R-C)*0.75+0.25*M/5', 'npv': '-(M+W)+pv(0.1,5,(R-C)*0.75+0.25*M/5)+(W+S*0.75)/1.1^5'},
check=({'M': 1000, 'R': 800, 'C': 400, 'W': 100, 'S': 100}, {'ocf': 350, 'npv': 335.4}), tol=0.001))
qs.append(Q('c32-e03', 32, 'Sensitivity to salvage value', '''
A machine costs 100 now, yields 55 at the end of each of two years, and has a salvage value of 10 at the end of year 2
(ignore taxes). What's its NPV at 10%? What if salvage is zero? Which assumption should I check first?''', '''
−100 + 55/1.1 + 65/1.21 = 3.72. Without salvage: −100 + 50 + 45.45 = −4.55. The decision flips on salvage value, so verify
whether it's realistic first.''', kind='calc'))
qs.append(Q('c32-e04', 32, 'Multiple IRRs', '''
A project has cash flows −100, +{a}, −{b}. What are its IRRs, and over what range of discount rates is NPV positive?''', '''
With x = 1 + r: 100x² − {a}x + {b} = 0 → x = ({a} ± √({=a*a} − {=400*b}))/200 = {x1:3} or {x2:3}. IRRs {=(x1-1)*100:1}% and {=(x2-1)*100:1}%; NPV is positive for
discount rates between them. With multiple sign changes, IRR is unreliable — use NPV.''',
kind='calc', diff=2, vars={'r1': C(5, 10, 15), 'r2': C(30, 40, 50)}, compute={'a': '100*((1+r1/100)+(1+r2/100))', 'b': '100*(1+r1/100)*(1+r2/100)', 'x1': '1+r1/100', 'x2': '1+r2/100'},
check=({'r1': 10, 'r2': 40}, {'a': 250, 'b': 154})))
qs.append(Q('c32-e05', 32, 'NPV vs IRR for mutually exclusive projects', '''
Project X: −1,000 now, +{x} in three years. Project Y: −1,000 now, +{y} in each of years 1 and 2. What's each project's IRR
and NPV at {r}%? Which should we pick if they're mutually exclusive?''', '''
X: IRR = ({x}/1,000)^(1/3) − 1 = {=((x/1000)^(1/3)-1)*100:1}%; NPV = −1,000 + {x}/{=1+r/100:2}³ = {nx:1}. Y: IRR = {=100*irr(-1000,y,y):1}%; NPV = −1,000 + {y} × annuity factor = {ny:1}.
Choose {?nx>ny|X|Y} — the higher NPV (IRR can mislead when timing or scale differs).''',
kind='calc', diff=2, vars={'x': R(1300, 1600, 50), 'y': R(550, 650, 10), 'r': C(6, 8, 10)}, compute={'nx': '-1000+x/(1+r/100)^3', 'ny': '-1000+pv(r/100,2,y)'}, constraints=['abs(-1000+x/(1+r/100)^3-(-1000+pv(r/100,2,y)))>5'],
check=({'x': 1500, 'y': 600, 'r': 8}, {'nx': 190.7, 'ny': 70.0}), tol=0.002))
qs.append(Q('c32-e06', 32, 'Capital rationing', '''
With a budget of 700, which projects should we choose? A (cost 300, NPV 60), B (cost 400, NPV 90), C (cost 350, NPV 80),
D (cost 250, NPV 45). Projects can't be split.''', '''
Feasible combinations within 700: A+B (NPV 150), A+C (140), A+D (105), B+D (135), C+D (125); B+C costs 750; no triple fits.
Best: A and B, NPV 150. (Ranking by NPV per unit of cost alone can mislead with indivisible projects.)''', kind='calc'))
qs.append(Q('c32-e07', 32, 'Equivalent annual cost', '''
A diesel van costs {c1}, lasts four years and costs {r1} a year to run; an electric van costs {c2}, lasts six years and costs
{r2} a year to run. At {i}%, which is cheaper per year?''', '''
Annuity factors: 4 years {=pv(i/100,4,1):4}, 6 years {=pv(i/100,6,1):4}. Diesel: {c1}/{=pv(i/100,4,1):4} + {r1} = {d:0} a year. Electric: {c2}/{=pv(i/100,6,1):4} + {r2} = {e:0}.
The {?d<e|diesel|electric} van is cheaper per year.''',
kind='calc', vars={'c1': R(30000, 45000, 5000), 'r1': R(5000, 8000, 500), 'c2': R(45000, 65000, 5000), 'r2': R(2000, 4000, 500), 'i': C(6, 8, 10)},
compute={'d': 'c1/pv(i/100,4,1)+r1', 'e': 'c2/pv(i/100,6,1)+r2'}, constraints=['abs(c1/pv(i/100,4,1)+r1-c2/pv(i/100,6,1)-r2)>100'],
check=({'c1': 40000, 'r1': 6000, 'c2': 55000, 'r2': 3000, 'i': 8}, {'d': 18077, 'e': 14897}), tol=0.001))
qs.append(Q('c32-e08', 32, 'Break-even analysis for a project', '''
A project has NPV 335.4 at 10% with annual revenue 800 and cash costs 400 for 5 years (tax 25%; 5-year annuity factor
3.7908). What break-even annual revenue makes NPV zero, holding costs fixed? And what level of cash costs, holding revenue at 800?''', '''
Each 1 fall in annual revenue cuts NPV by 0.75 × 3.7908 = 2.843. 335.4/2.843 ≈ 118, so break-even revenue ≈ 682. Likewise
costs could rise by 118, to about 518 a year.''', kind='calc', diff=2))
qs.append(Q('c32-e09', 32, 'Option to abandon', '''
A project costs {I} and in one year will be worth either {hi} or {lo} with equal probability; the discount rate is 10%. The
equipment can be sold for {s} at the end of year 1. What's the NPV without and with the option to abandon, and what's the
option worth?''', '''
Without: −{I} + (0.5 × {hi} + 0.5 × {lo})/1.1 = {n0:1}. With abandonment the bad outcome becomes {s}: −{I} + (0.5 × {hi} + 0.5 × {s})/1.1 = {n1:1}.
Option value = {=n1-n0:1}.''',
kind='calc', vars={'I': R(400, 600, 50), 'hi': R(700, 900, 50), 'lo': R(200, 350, 50), 'd': R(50, 150, 50)}, compute={'s': 'lo+d', 'n0': '-I+(0.5*hi+0.5*lo)/1.1', 'n1': '-I+(0.5*hi+0.5*(lo+d))/1.1'},
check=({'I': 500, 'hi': 800, 'lo': 300, 'd': 100}, {'n0': 0, 'n1': 45.45})))
qs.append(Q('c32-e10', 32, 'Project risk vs financing mix', '''
A project needs {I} now and produces free cash flows of {f1} and {f2} at the end of years 1 and 2; its appropriate discount rate
is 10%. What's the NPV? Someone proposes funding it with 60% equity at 12% and 40% debt at 6% (25% tax) and using that
weighted average instead. Should it replace 10%?''', '''
NPV = −{I} + {f1}/1.1 + {f2}/1.21 = {=-I+f1/1.1+f2/1.21:2}. The proposal's weighted average is 0.6 × 12 + 0.4 × 6 × 0.75 = 9.0%. It shouldn't automatically
replace 10%: the discount rate should reflect the project's risk, not how it happens to be financed.''',
kind='calc', vars={'I': R(60, 100, 10), 'f1': R(40, 60, 5), 'f2': R(50, 70, 5)}, compute={'n': '-I+f1/1.1+f2/1.21'}, check=({'I': 80, 'f1': 50, 'f2': 60}, {'n': 15.04})))
# ---------------- Chapter 33 ----------------
qs.append(Q('c33-e01', 33, 'Accrued interest and dirty price', '''
A bond with face value 100 pays a {c}% coupon semi-annually. I'm buying it {m} months after the last coupon at a clean price
of {p}. What's the accrued interest and the dirty price (months as day count)?''', '''
Semi-annual coupon {=c/2}; {m} of 6 months elapsed → accrued {=c/2*m/6:4}. Dirty price = {p} + {=c/2*m/6:4} = {=p+c/2*m/6:4}.''',
kind='calc', vars={'c': R(3, 7, 0.5), 'm': R(1, 5), 'p': R(95, 103, 0.2)}, compute={'a': 'c/2*m/6'}, check=({'c': 4.5, 'm': 2, 'p': 98.4}, {'a': 0.75})))
qs.append(Q('c33-e02', 33, 'Bootstrapping spot and forward rates', '''
One- and two-year zero-coupon bonds trade at 96.15 and 91.57 per 100 face. A three-year bond with a 6% annual coupon trades
at 102.30. What are the three spot rates and the forward rates for years 2 and 3?''', '''
d₁ = 0.9615 → s₁ = 4.00%; d₂ = 0.9157 → s₂ = 4.50%. 102.30 = 6(0.9615 + 0.9157) + 106d₃ → d₃ = 0.85884, s₃ = 5.20%.
Forwards: f₁,₂ = 0.9615/0.9157 − 1 = 5.00%; f₂,₃ = 0.9157/0.85884 − 1 = 6.62%.''', kind='calc', diff=3))
qs.append(Q('c33-e03', 33, 'Pricing off the spot curve', '''
Spot rates are 3.00%, 3.75% and 4.62% for 1, 2 and 3 years (discount factors 0.970874, 0.929005, 0.873339). What's the price of
a three-year bond with a {c}% annual coupon? Is its yield to maturity above or below that of a 5% coupon bond, and why?''', '''
Price = {c}(0.970874 + 0.929005) + {=100+c} × 0.873339 = {P:2}. A lower coupon puts more weight on the final payment, discounted at
the highest (3-year) spot rate, so its YTM is {?c<5|slightly higher than|slightly lower than} the 5% bond's.''',
kind='calc', diff=3, vars={'c': C(2, 3, 4, 6)}, compute={'P': 'c*(0.970874+0.929005)+(100+c)*0.873339'}, check=({'c': 3}, {'P': 95.65})))
qs.append(Q('c33-e04', 33, 'Duration', '''
What are the Macaulay and modified duration of a two-year bond with a {c}% annual coupon at a yield of {y}% (per 1,000 face)?
Estimate the price change for a yield fall of 50 basis points.''', '''
PVs: {=10*c/(1+y/100):2} and {=(1000+10*c)/(1+y/100)^2:2}; price {P:2}. D_Mac = ({=10*c/(1+y/100):2} + 2 × {=(1000+10*c)/(1+y/100)^2:2})/{P:2} = {dm:3};
D_mod = {dm:3}/{=1+y/100:2} = {=dm/(1+y/100):3}. ΔP ≈ +{=dm/(1+y/100):3} × 0.5% = +{=dm/(1+y/100)*0.5:3}%, about +{=dm/(1+y/100)*0.005*P:2}.''',
kind='calc', diff=2, vars={'c': R(4, 10), 'y': R(4, 10)}, compute={'P': 'pv(y/100,2,10*c,1000)', 'dm': '(10*c/(1+y/100)+2*(1000+10*c)/(1+y/100)^2)/pv(y/100,2,10*c,1000)'},
check=({'c': 8, 'y': 10}, {'P': 965.29, 'dm': 1.925}), tol=0.001))
qs.append(Q('c33-e05', 33, 'Interest-rate risk of long bonds', '''
Compare the price change of a 2-year and a {n}-year zero-coupon bond, each yielding {y}%, when yields rise to {y2}%. Use exact prices.''', '''
2-year: 100/{=1+y/100:2}² = {=100/(1+y/100)^2:2} → {=100/(1+y2/100)^2:2}: {=((1+y/100)^2/(1+y2/100)^2-1)*100:1}%. {n}-year: {=100/(1+y/100)^n:2} → {=100/(1+y2/100)^n:2}:
{=(((1+y/100)/(1+y2/100))^n-1)*100:1}%. Long bonds are far more sensitive to rates.''',
kind='calc', vars={'n': C(10, 20, 30), 'y': R(2, 5), 'dy': C(1)}, compute={'y2': 'y+dy'}, check=({'n': 30, 'y': 4, 'dy': 1}, {'y2': 5})))
qs.append(Q('c33-e06', 33, 'Leveraged duration risk (LDI)', '''
A fund holds {A} million of long gilts with modified duration {D}, financed with {R} million of repo and {K} million of its own
capital. Yields rise by {dy} percentage points. Roughly what's the loss and the fall in capital? What if repo lenders demand
collateral equal to the loss within a day?''', '''
Loss ≈ {D} × {=dy/100:3} × {A} = {L:1} million (convexity trims it slightly). Capital falls from {K} to {=K-L:1} — a {=L/K*100:0}% loss. Meeting a {L:1} million
collateral call in a day means selling gilts fast; if many funds sell at once, prices fall further — the 2022 UK LDI spiral.''',
kind='calc', diff=3, vars={'A': R(300, 800, 100), 'D': R(12, 20), 'kf': C(0.2, 0.3), 'dy': R(0.5, 1.5, 0.1)}, compute={'K': 'A*kf', 'R': 'A*(1-kf)', 'L': 'D*dy/100*A'},
constraints=['D*dy/100*A<A*kf'], check=({'A': 500, 'D': 18, 'kf': 0.3, 'dy': 1.2}, {'L': 108})))
qs.append(Q('c33-e07', 33, 'Immunisation', '''
Our insurer must pay {L} million in {T} years, and the yield curve is flat at {y}%. We can buy a {t1}-year zero and a {t2}-year
zero. How much present value should go into each to match the liability's present value and duration?''', '''
PV of liability = {L}/{=1+y/100:2}^{T} = {pv:3} million, duration {T}. Weights: {t1}w + {t2}(1 − w) = {T} → w = {w:3}. Put {=w*pv:3} million in the {t1}-year
zero (face {=w*pv*(1+y/100)^t1:3}) and {=(1-w)*pv:3} million in the {t2}-year zero (face {=(1-w)*pv*(1+y/100)^t2:3}).''',
kind='calc', diff=3, vars={'L': R(5, 20), 'T': R(4, 8), 'y': R(3, 6), 't1': C(2), 't2': C(10)}, compute={'pv': 'L/(1+y/100)^T', 'w': '(t2-T)/(t2-t1)'},
check=({'L': 10, 'T': 6, 'y': 5, 't1': 2, 't2': 10}, {'pv': 7.462, 'w': 0.5})))
qs.append(Q('c33-e08', 33, 'Credit spreads and implied default probability', '''
A four-year BBB bond yields {b}% and the government bond yields {g}%. With a recovery rate of {rr}%, what annual default
probability would a risk-neutral investor infer? Why might the true expected default probability be lower?''', '''
Spread {=b-g:2}%; loss given default {=100-rr}% → p ≈ {=(b-g)/100:4}/{=1-rr/100:2} = {=(b-g)/(100-rr)*100:2}% a year. The true probability is likely lower: the
spread also pays for bearing default risk that peaks in recessions, for illiquidity and for taxes.''',
kind='calc', vars={'b': R(5, 8, 0.5), 'g': R(3, 4.5, 0.5), 'rr': C(30, 40, 50)}, compute={'p': '(b-g)/(100-rr)*100'}, constraints=['b-g>=1'],
check=({'b': 6.5, 'g': 4, 'rr': 40}, {'p': 4.167})))
qs.append(Q('c33-e09', 33, 'Forward rates and the expectations hypothesis', '''
The one-year rate is {s1}% and the two-year spot rate is {s2}%. What forward rate is implied for year two? Under the
expectations hypothesis, what is the market forecasting? With a term premium of 0.5 points in the two-year yield, what's
the expected one-year rate in a year?''', '''
f = {=1+s2/100:3}²/{=1+s1/100:2} − 1 = {f:2}%. Under the expectations hypothesis the market expects the one-year rate to be {f:2}% next year. With a
0.5-point premium, the expected average short rate is {=s2-0.5:2}%, so next year's expected one-year rate ≈ 2 × {=s2-0.5:2} − {s1} = {=2*(s2-0.5)-s1:2}%.''',
kind='calc', diff=2, vars={'s1': R(2, 5, 0.25), 'd': R(0.2, 1.2, 0.2)}, compute={'s2': 's1+d', 'f': '((1+(s1+d)/100)^2/(1+s1/100)-1)*100'},
check=({'s1': 3, 'd': 0.8}, {'f': 4.60})))
# ---------------- Chapter 34 ----------------
qs.append(Q('c34-e01', 34, 'Holding-period returns', '''
I bought a share at {P0}; it paid a dividend of {d} and I sold it a year later at {P1}. The one-year safe rate is {rf}%. What were
the dividend yield, capital gain, holding-period return and excess return?''', '''
Dividend yield {d}/{P0} = {=d/P0*100:2}%; capital gain {=P1-P0}/{P0} = {=(P1-P0)/P0*100:2}%; HPR {=(d+P1-P0)/P0*100:2}%; excess return {=(d+P1-P0)/P0*100-rf:2}%.''',
kind='calc', vars={'P0': R(40, 80, 5), 'd': R(1, 3, 0.5), 'g': R(-5, 10), 'rf': R(2, 5)}, compute={'P1': 'P0+g'}, check=({'P0': 50, 'd': 1.5, 'g': 4, 'rf': 3}, {'P1': 54})))
qs.append(Q('c34-e02', 34, 'The tangency portfolio', '''
Asset A has expected return 4% and s.d. 10%; asset B has 10% and 20%; they're uncorrelated; r_f = 2%. What are the tangency
portfolio's weights, expected return, standard deviation and Sharpe ratio? How does its Sharpe ratio compare with A's and B's?''', '''
Weights ∝ excess return/variance: 0.02/0.01 = 2 and 0.08/0.04 = 2 → (0.5, 0.5). μ = 7%; σ = √(0.25 × 0.01 + 0.25 × 0.04) = 11.18%;
Sharpe = 5/11.18 = 0.447, above A's 0.2 and B's 0.4 — diversification raises reward per unit of risk.''', kind='calc', diff=3))
qs.append(Q('c34-e03', 34, 'CAPM and alpha', '''
A share's covariance with the market is {cov} and the market's s.d. is {sm}%. The safe rate is {rf}% and the market risk
premium {mrp}%. What are its beta and required return? Analysts expect it to return {er}%. What's its alpha, and what does the
CAPM suggest?''', '''
β = {cov}/{=(sm/100)^2:4} = {b:2}; required return = {rf} + {b:2} × {mrp} = {req:2}%. Alpha = {er} − {req:2} = {=er-req:2}%:
{?er>req|above the SML — underpriced if the forecast is right, so buy (until the alpha disappears).|below the SML — overpriced if the forecast is right, so avoid/sell.} The alpha is only as good as the forecast.''',
kind='calc', vars={'cov': C(0.024, 0.032, 0.048, 0.06), 'sm': C(16, 20), 'rf': R(2, 5), 'mrp': R(4.5, 6.5, 0.5), 'er': R(8, 14)},
compute={'b': 'cov/(sm/100)^2', 'req': 'rf+cov/(sm/100)^2*mrp'}, constraints=['abs(er-(rf+cov/(sm/100)^2*mrp))>0.2'],
check=({'cov': 0.048, 'sm': 20, 'rf': 4, 'mrp': 5.5, 'er': 12}, {'b': 1.2, 'req': 10.6})))
qs.append(Q('c34-e04', 34, 'Portfolio beta', '''
My portfolio is {w1}% in a share with beta {b1}, {w2}% in a share with beta {b2}, and the rest in Treasury bills. With r_f = {rf}%
and a market premium of {mrp}%, what's the portfolio's beta and required return?''', '''
β_p = {=w1/100} × {b1} + {=w2/100} × {b2} + 0 = {bp:3}; required return = {rf} + {bp:3} × {mrp} = {=rf+bp*mrp:2}%.''',
kind='calc', vars={'w1': R(30, 50, 5), 'b1': C(0.6, 0.8, 1.0), 'w2': R(25, 45, 5), 'b2': C(1.2, 1.3, 1.5), 'rf': R(2, 4), 'mrp': R(5, 7)},
constraints=['w1+w2<=90'], compute={'bp': 'w1/100*b1+w2/100*b2'}, check=({'w1': 40, 'b1': 0.8, 'w2': 35, 'b2': 1.3, 'rf': 3, 'mrp': 6}, {'bp': 0.775})))
qs.append(Q('c34-e05', 34, 'Precision of beta estimates', '''
A beta regression on 36 monthly returns gives β̂ = {b}. The residual s.d. is {se}% a month and the market's s.d. 4.5% a month.
What's the approximate standard error and 95% confidence interval for beta, and the adjusted beta (2/3)β̂ + 1/3?''', '''
SE ≈ {=se/100:2}/(0.045 × √36) = {s:2}. 95% CI = {b} ± 1.96 × {s:2} ≈ {=b-1.96*s:2} to {=b+1.96*s:2}. Adjusted beta = {=2/3*b+1/3:2}.''',
kind='calc', vars={'b': R(0.6, 1.6, 0.1), 'se': R(5, 10)}, compute={'s': '(se/100)/(0.045*6)'}, check=({'b': 1.4, 'se': 8}, {'s': 0.296})))
qs.append(Q('c34-e06', 34, 'Multi-factor models', '''
A share has loadings {m} on the market, {s} on SMB and {h} on HML. With factor premia of 6, 2 and 3.5% and r_f = 3%, what's its
required return? What kind of firm is it likely to be?''', '''
3 + {m} × 6 + ({s}) × 2 + {h} × 3.5 = {=3+6*m+2*s+3.5*h:2}%. {?s<0|Negative SMB → a large firm|Positive SMB → a small firm}; {?h>0|positive HML → a value (high book-to-market) firm, e.g. a mature bank or utility|negative HML → a growth firm}.''',
kind='calc', vars={'m': C(0.8, 0.9, 1.1, 1.2), 's': C(-0.3, -0.2, 0.3, 0.5), 'h': C(-0.4, 0.6, 0.8)}, compute={'r': '3+6*m+2*s+3.5*h'}, check=({'m': 0.9, 's': -0.3, 'h': 0.6}, {'r': 9.9})))
qs.append(Q('c34-e07', 34, 'Event studies', '''
On the day we announced a profit warning our shares fell {f}% while the market fell {mk}%. Our market model is R = 0.02 + 0.9R_M
(% per day), residual s.d. 1.8%. What's the abnormal return and its t-statistic? What would semi-strong efficiency predict for
the following days?''', '''
Expected return 0.02 + 0.9 × (−{mk}) = {=0.02-0.9*mk:2}%; abnormal = −{f} − ({=0.02-0.9*mk:2}) = {ar:2}%; t = {ar:2}/1.8 = {=ar/1.8:2}. Semi-strong efficiency: no predictable
abnormal returns afterwards — the price should adjust fully on the day (continued drift would mean underreaction).''',
kind='calc', vars={'f': R(4, 12), 'mk': R(0, 2, 0.5)}, compute={'ar': '-f-(0.02-0.9*mk)'}, check=({'f': 8, 'mk': 1}, {'ar': -7.12})))
qs.append(Q('c34-e08', 34, 'Sharpe, Treynor and Jensen\'s alpha', '''
The market returned 10% (s.d. 16%) and r_f = 3%. Fund X returned 12% with s.d. 20% and beta 1.4; fund Y returned 9% with s.d. 12%
and beta 0.7. What are each fund's Sharpe ratio, alpha and Treynor ratio? Which would you prefer as your only investment, and
which as a small addition to a diversified portfolio?''', '''
Sharpe: X 0.45, Y 0.50, market 0.44. Alpha: X 12 − (3 + 1.4 × 7) = −0.8%; Y 9 − (3 + 0.7 × 7) = +1.1%. Treynor: X 6.4, Y 8.6, market 7.
Only investment → compare Sharpe: Y. Small addition → alpha/Treynor: Y again; X's high return is more than explained by its beta.''', kind='calc', diff=2))
qs.append(Q('c34-e09', 34, 'VaR and expected shortfall', '''
A {V} million portfolio has normal daily returns with mean zero and s.d. {s}%. What are its one-day 1% VaR and expected
shortfall? (z = 2.326, φ(2.326) = 0.0267.) Why might both understate the true risk?''', '''
VaR = 2.326 × {s}% = {=2.326*s:3}% → {=2.326*s/100*V:3} million. ES = {s}% × 0.0267/0.01 = {=s*2.67:3}% → {=s*2.67/100*V:3} million. Both assume normality and stable
volatility; real returns have fat tails and volatility clustering, and correlations jump in crises.''',
kind='calc', vars={'V': R(5, 50, 5), 's': R(0.8, 2.0, 0.1)}, compute={'v': '2.326*s/100*V'}, check=({'V': 10, 's': 1.2}, {'v': 0.279}), tol=0.002))
qs.append(Q('c34-e10', 34, 'The arithmetic of active management', '''
Active investors hold {a}% of a market that returns {m}% this year. Passive funds charge 0.05% and active funds 1% a year. What
are the average net returns of passive and active investors? If half of the active money earned {h}% before fees, what must the
other half have earned?''', '''
Passive: {m} − 0.05 = {=m-0.05:2}%. Active before fees must average the market, {m}%; after fees {=m-1}%. Other half: 0.5 × {h} + 0.5r = {m} → r = {=2*m-h}%
before fees, {=2*m-h-1}% after.''',
kind='calc', vars={'a': R(40, 70, 10), 'm': R(5, 12), 'h': R(9, 14)}, constraints=['h>m'], compute={}, check=({'a': 60, 'm': 8, 'h': 10}, {})))
# ---------------- Chapter 35 ----------------
qs.append(Q('c35-e01', 35, 'Weighted average cost of capital', '''
We have {n} million shares at {p}. Our bonds have face value {F} million, trade at {q}% of face and yield {y}%. Equity beta is {b},
the government yield {rf}%, the market premium {mrp}% and the tax rate 25%. What's our WACC?''', '''
E = {=n*p}, D = {=F*q/100}, V = {=n*p+F*q/100}. r_E = {rf} + {b} × {mrp} = {re:2}%; after-tax r_D = {y} × 0.75 = {=y*0.75:3}%.
WACC = {=n*p/(n*p+F*q/100):3} × {re:2} + {=F*q/100/(n*p+F*q/100):3} × {=y*0.75:3} = {w:2}%.''',
kind='calc', vars={'n': R(10, 30, 5), 'p': R(10, 25), 'F': R(100, 300, 50), 'q': R(90, 105), 'y': R(5, 8, 0.5), 'b': R(0.8, 1.4, 0.1), 'rf': R(3, 5), 'mrp': R(5, 7)},
compute={'re': 'rf+b*mrp', 'w': '(n*p*(rf+b*mrp)+F*q/100*y*0.75)/(n*p+F*q/100)'},
check=({'n': 20, 'p': 15, 'F': 200, 'q': 95, 'y': 7, 'b': 1.1, 'rf': 4, 'mrp': 6}, {'w': 8.53}), tol=0.002))
qs.append(Q('c35-e02', 35, 'Market vs book weights in WACC', '''
Our cost of equity is 10.6% and after-tax cost of debt 5.25%. At market values, equity is 300 and debt 190 (WACC 8.53%). The
book value of equity is only 90 and book debt 200. What's the WACC with book weights, and which should we use?''', '''
Book weights 0.310 and 0.690 → WACC = 0.310 × 10.6 + 0.690 × 5.25 = 6.91%. Use market weights: the costs are returns required on
current market values, the prices at which investors could buy the claims today.''', kind='calc'))
qs.append(Q('c35-e03', 35, 'Unlevering and relevering beta', '''
A comparable firm has an equity beta of {be} and a debt-to-equity ratio of {de}. We plan a debt-to-equity ratio of {d2}. Assuming
zero debt betas and a constant debt ratio, what are the asset beta, our equity beta and our cost of equity (r_f 4%, premium 5%)?''', '''
β_A = {be}/(1 + {de}) = {ba:3}; β_E = {ba:3} × (1 + {d2}) = {=ba*(1+d2):3}; r_E = 4 + {=ba*(1+d2):3} × 5 = {=4+5*ba*(1+d2):2}%.''',
kind='calc', vars={'be': R(1.0, 1.8, 0.1), 'de': C(0.5, 0.75, 1.0), 'd2': C(0.25, 0.4, 0.6)}, compute={'ba': 'be/(1+de)'}, check=({'be': 1.4, 'de': 0.75, 'd2': 0.25}, {'ba': 0.8})))
qs.append(Q('c35-e04', 35, 'Hamada formula', '''
Same comparable: equity beta 1.4, D/E 0.75; we plan D/E 0.25. Using Hamada's formula with a 25% tax rate, what are the asset beta,
our equity beta and cost of equity (r_f 4%, premium 5%)? Why does this differ from the no-tax relevering (which gave 1.00 and 9%)?''', '''
β_A = 1.4/(1 + 0.75 × 0.75) = 0.896; β_E = 0.896 × (1 + 0.75 × 0.25) = 1.064; r_E = 9.32%. Hamada assumes fixed debt, so tax shields are
riskless; all risk then sits in the business assets, which are only part of value, so their beta is higher.''', kind='calc', diff=3))
qs.append(Q('c35-e05', 35, 'Expected cost of debt', '''
Our bonds yield {y}%. Our annual probability of default is about {p}%, with recovery of {r}%. What's the expected return on the
debt, and its after-tax cost at a 25% tax rate?''', '''
Expected loss ≈ {p}% × {=100-r}% = {=p*(100-r)/100:2}%; expected return ≈ {y} − {=p*(100-r)/100:2} = {=y-p*(100-r)/100:2}%; after tax {=(y-p*(100-r)/100)*0.75:2}%. Promised yield overstates
the cost of risky debt.''',
kind='calc', vars={'y': R(6, 10, 0.5), 'p': R(1, 5), 'r': C(30, 40, 50)}, compute={'e': 'y-p*(100-r)/100'}, check=({'y': 8.5, 'p': 3, 'r': 40}, {'e': 6.7})))
qs.append(Q('c35-e06', 35, 'Adjusted present value', '''
A project costs {I} and generates unlevered after-tax free cash flow of {F} a year forever; r_A = {ra}%. It can support {D} of
permanent debt at 5%; tax rate {t}%; issuing the debt costs 2% of the amount raised. What are the base NPV and the APV?''', '''
Base value {F}/{=ra/100:2} = {=F/(ra/100):1}; base NPV {=F/(ra/100)-I:1}. Tax shield τD = {=t/100*D:1}; issue costs {=0.02*D:1}. APV = {=F/(ra/100)-I+t/100*D-0.02*D:1}
{?F/(ra/100)-I+t/100*D-0.02*D>0|— accept, on the strength of the financing side effects.|— reject.}''',
kind='calc', vars={'I': R(400, 600, 50), 'F': R(40, 60, 2), 'ra': C(10), 'D': R(200, 400, 50), 't': C(25, 30)}, compute={'apv': 'F/(ra/100)-I+t/100*D-0.02*D'},
check=({'I': 500, 'F': 48, 'ra': 10, 'D': 300, 't': 30}, {'apv': 64})))
qs.append(Q('c35-e07', 35, 'Cost of equity and WACC with leverage', '''
A firm has r_A = {ra}% and keeps D/V = {dv}, borrowing at {rd}%; the tax rate is 25%. What's r_E, and can you get the WACC two ways?''', '''
D/E = {dv}/{=1-dv:2}; r_E = {ra} + ({ra} − {rd}) × {=dv/(1-dv):4} = {re:2}%. WACC = {=1-dv:2} × {re:2} + {dv} × {rd} × 0.75 = {=(1-dv)*re+dv*rd*0.75:2}%; check:
r_A − τ × r_D × D/V = {ra} − 0.25 × {rd} × {dv} = {=ra-0.25*rd*dv:2}%.''',
kind='calc', vars={'ra': R(8, 12), 'dv': C(0.2, 0.3, 0.4), 'rd': R(4, 7)}, compute={'re': 'ra+(ra-rd)*dv/(1-dv)'}, check=({'ra': 10, 'dv': 0.3, 'rd': 6}, {'re': 11.714})))
qs.append(Q('c35-e08', 35, 'One hurdle rate for all divisions', '''
Our conglomerate uses a 9% hurdle rate everywhere. Projects: P in food (appropriate rate 7%) with IRR 8%; Q in biotech
(appropriate rate 13%) with IRR 11%; R in logistics (appropriate rate 9%) with IRR 10%. Which decisions does the single rate get wrong?''', '''
P is rejected at 9% though its 8% IRR beats its 7% cost — a good project lost. Q is accepted though its 11% IRR is below its 13%
cost — a bad project taken. R is correctly accepted. A single rate starves safe divisions and overfunds risky ones.''', diff=2))
qs.append(Q('c35-e09', 35, 'Implied equity risk premium', '''
A share index is at {P}; expected dividends and buybacks next year are {D}, and long-run growth is {g}%. The 10-year government
yield is {y}%. What's the implied market return and risk premium? What if the index falls {f}% with unchanged payouts and growth?''', '''
Yield {D}/{P} = {=D/P*100:2}%; implied return {=D/P*100+g:2}%; premium {=D/P*100+g-y:2}%. After a {f}% fall: yield {=D/(P*(1-f/100))*100:2}%, return {=D/(P*(1-f/100))*100+g:2}%, premium
{=D/(P*(1-f/100))*100+g-y:2}% — implied premia rise when prices fall.''',
kind='calc', vars={'P': R(3000, 6000, 500), 'D': R(100, 250, 10), 'g': R(3, 5, 0.5), 'y': R(2.5, 4.5, 0.5), 'f': C(10, 20, 30)}, compute={'r': 'D/P*100+g'},
check=({'P': 4000, 'D': 150, 'g': 4, 'y': 3.5, 'f': 20}, {'r': 7.75})))
qs.append(Q('c35-e10', 35, 'Debt-financed buybacks and EPS', '''
Our firm earns {E} after tax, has 100 shares priced at {p} and no debt. We borrow {B} at 5% (tax 25%) to buy back {=B/p:0} shares.
What's EPS before and after? Does the EPS rise show shareholders are better off?''', '''
Before: {E}/100 = {=E/100:2}. After-tax interest {=B*0.05*0.75:2}; after: ({=E-B*0.0375:2})/{=100-B/p:0} = {=(E-B*0.0375)/(100-B/p):2}. The rise doesn't show shareholders gain:
equity is now riskier, so its required return rises and P/E falls. Real gains come only from frictions — the PV of the interest
tax shield (up to τD = {=0.25*B}) minus expected distress costs, and any signal the buyback sends.''',
kind='calc', vars={'E': R(300, 700, 50), 'p': R(40, 80, 10), 'n': R(5, 15, 5)}, compute={'B': 'n*p'}, check=({'E': 500, 'p': 60, 'n': 10}, {'B': 600})))
# ---------------- Chapter 36 ----------------
qs.append(Q('c36-e01', 36, 'Units discipline in models', '''
A source reports revenue of 125,000 "in thousands of euros". Our model works in millions of dollars at 1.08 dollars per euro.
What figure should we enter and what should we record with it? What happens if the analyst multiplies 125,000 by 1.08 and
enters it in a sheet labelled "millions"?''', '''
125,000 thousand euros = 125 million euros = 135 million dollars. Record the source, date, original units and currency, and
the exchange rate. Entering 135,000 in a "millions" sheet overstates revenue a thousandfold while every formula still "works".'''))
qs.append(Q('c36-e02', 36, 'Interest calculation conventions', '''
A loan of {a} is outstanding for the first half of the year and {b} for the second half, at {r}% a year. What's the year's
interest? What would opening-balance and closing-balance conventions give?''', '''
Time-weighted: {a} × {=r/100:2} × 0.5 + {b} × {=r/100:2} × 0.5 = {=(a+b)*r/200:2}. Opening balance: {=a*r/100:2} (overstated); closing: {=b*r/100:2} (understated).''',
kind='calc', vars={'a': R(80, 200, 10), 'b': R(30, 80, 10), 'r': R(4, 10)}, compute={'i': '(a+b)*r/200'}, check=({'a': 100, 'b': 60, 'r': 8}, {'i': 6.4})))
qs.append(Q('c36-e03', 36, 'Forecasting working capital', '''
Revenue is forecast at {R} and cost of sales at {C} (365-day year). DSO is {dso} days, DIO {dio} and DPO {dpo}. Opening
receivables, inventory and payables are {r0}, {i0} and {p0}. What are the closing balances, the change in operating working
capital, and its effect on operating cash flow?''', '''
Receivables {R} × {dso}/365 = {=R*dso/365:2}; inventory {C} × {dio}/365 = {=C*dio/365:2}; payables {C} × {dpo}/365 = {=C*dpo/365:2}.
ΔWC = ({=R*dso/365:2} − {r0}) + ({=C*dio/365:2} − {i0}) − ({=C*dpo/365:2} − {p0}) = {dw:2}, which {?dw>0|reduces|increases} operating cash flow by {=abs(dw):2}.''',
kind='calc', vars={'R': C(730, 1095, 1460), 'cr': C(0.5, 0.6, 0.7), 'dso': R(30, 60, 5), 'dio': R(30, 70, 5), 'dpo': R(25, 50, 5), 'r0': R(50, 100, 5), 'i0': R(40, 80, 5), 'p0': R(30, 60, 5)},
compute={'C': 'R*cr', 'dw': '(R*dso/365-r0)+(R*cr*dio/365-i0)-(R*cr*dpo/365-p0)'}, constraints=['abs((R*dso/365-r0)+(R*cr*dio/365-i0)-(R*cr*dpo/365-p0))>0.5'],
check=({'R': 730, 'cr': 0.6, 'dso': 40, 'dio': 50, 'dpo': 35, 'r0': 70, 'i0': 55, 'p0': 40}, {'C': 438, 'dw': 13})))
qs.append(Q('c36-e04', 36, 'PP&E roll-forward', '''
Opening PP&E is {o}; capex {k}; depreciation {d}; an asset with net book value {nbv} is sold for {s}. What's closing PP&E and the
gain on disposal? Where does each figure show up in the three statements?''', '''
Closing PP&E = {o} + {k} − {d} − {nbv} = {=o+k-d-nbv}; gain = {s} − {nbv} = {=s-nbv}. Capex (−{k}) and proceeds (+{s}) are investing cash flows; depreciation is an
expense added back in operating cash flow; the gain raises net income but is deducted in operating cash flow (its cash sits in
investing); PP&E is on the balance sheet.''',
kind='calc', vars={'o': R(300, 800, 50), 'k': R(50, 150, 10), 'd': R(40, 100, 10), 'nbv': R(10, 30, 5), 's': R(12, 40, 2)}, constraints=['s!=nbv'], compute={},
check=({'o': 500, 'k': 80, 'd': 60, 'nbv': 15, 's': 20}, {})))
qs.append(Q('c36-e05', 36, 'Revolving credit in a model', '''
Cash before revolver flows is {c}, minimum cash is {m}, and the revolver has {cap} of undrawn capacity. What's the draw and
closing cash? What should the model show if only {lim} were available?''', '''
Draw = {m} − ({c}) = {=m-c}, within {cap}; closing cash {m}. With only {lim} available: draw {lim}, closing cash {=c+lim} — below the minimum; the model should
flag a funding shortfall of {=m-c-lim} rather than force cash to {m}.''',
kind='calc', vars={'c': R(-20, -2), 'm': R(8, 15), 'cap': C(30, 40), 'lim': R(5, 15)}, constraints=['m-c<=cap', 'lim<m-c'], compute={},
check=({'c': -8, 'm': 12, 'cap': 30, 'lim': 15}, {})))
qs.append(Q('c36-e07', 36, 'Circular references', '''
Our closing debt D satisfies D = 200 + 0.5 × (1 − τ) × r × (D₀ + D)/2, with opening debt D₀ = 150, r = {r}% and τ = 25% (half of
every unit of after-tax interest must be borrowed). Solve for D algebraically and by two rounds of iteration from D = 200.''', '''
Coefficient on D: 0.5 × 0.75 × {=r/100:2}/2 = {k:5}; constant 200 + {k:5} × 150 = {=200+150*k:4}. D = {=200+150*k:4}/(1 − {k:5}) = {=(200+150*k)/(1-k):3}.
Iteration: D₁ = {=200+150*k+200*k:3}; D₂ = {=200+150*k+k*(200+150*k+200*k):3} — converging quickly.''',
kind='calc', diff=2, vars={'r': C(6, 8, 10)}, compute={'k': '0.5*0.75*r/100/2'}, check=({'r': 8}, {'k': 0.015})))
qs.append(Q('c36-e08', 36, 'Sanity-checking a forecast', '''
A model forecasts revenue growth of {g}% a year for ten years, an EBIT margin rising from 8% to 30%, and capex equal to 60% of
depreciation throughout. Give me three reasons for scepticism and the checks you'd run.''', '''
(i) {g}% for ten years multiplies revenue by {=(1+g/100)^10:1}× — compare with base rates of firms that sustained that and with market size.
(ii) A 30% margin attracts competition — compare with the industry's best. (iii) Capex below depreciation while revenue grows
implies a shrinking asset base supporting a far bigger business — check implied asset turnover and ROIC, which would rise implausibly.''',
vars={'g': C(25, 30, 40)}, compute={}, check=({'g': 30}, {}), diff=2))
qs.append(Q('c36-e09', 36, 'Balance check errors', '''
A model shows total assets of 512.4 and liabilities plus equity of 512.3. The author says it's rounding. What would you check
before accepting that? And why isn't a zero balance check proof the model is right?''', '''
Check whether the difference is stable when inputs change (rounding doesn't grow; link errors do), whether sub-totals reconcile,
and whether the cash-flow statement explains the change in cash. A zero check only shows double entry is respected — an error
affecting both sides equally, or a wrong assumption, leaves it at zero.''', diff=2))
# ---------------- Chapter 37 ----------------
qs.append(Q('c37-e01', 37, 'Enterprise value bridge', '''
A company has {n} million shares at {p}, debt of {d} million, cash {c} million, preferred shares {pf} million, non-controlling
interests {nci} million and a stake in an associate worth {a} million. What's its enterprise value, and its EV/EBITDA if EBITDA is {e} million?''', '''
Equity {=n*p}; EV = {=n*p} + {d} − {c} + {pf} + {nci} − {a} = {ev}. EV/EBITDA = {ev}/{e} = {=ev/e:2}×.''',
kind='calc', vars={'n': R(100, 300, 50), 'p': R(8, 20), 'd': R(500, 1200, 100), 'c': R(100, 400, 50), 'pf': R(0, 150, 50), 'nci': R(20, 100, 20), 'a': R(50, 150, 20), 'e': R(300, 600, 50)},
compute={'ev': 'n*p+d-c+pf+nci-a'}, check=({'n': 200, 'p': 12, 'd': 900, 'c': 250, 'pf': 100, 'nci': 60, 'a': 90, 'e': 450}, {'ev': 3120})))
qs.append(Q('c37-e02', 37, 'DCF valuation', '''
Free cash flow to the firm is forecast at {f1}, {f2} and {f3} in years 1–3, then growing at {g}% a year. WACC is {w}%, net debt {nd},
and there are {n} shares. What's the terminal value, enterprise value, equity value per share, and the share of EV from the
terminal value?''', '''
TV₃ = {f3} × {=1+g/100:2}/({=w/100:2} − {=g/100:2}) = {tv:2}. EV = {f1}/{=1+w/100:2} + {f2}/{=1+w/100:2}² + ({f3} + {tv:2})/{=1+w/100:2}³ = {ev:2}. Equity {=ev-nd:2} → {=(ev-nd)/n:2} per share.
The terminal value contributes {=tv/(1+w/100)^3:2}, {=tv/(1+w/100)^3/ev*100:0}% of EV — most of the value sits in the assumptions about the far future.''',
kind='calc', diff=2, vars={'f1': R(15, 30), 'df': R(1, 3), 'g': C(2, 2.5, 3), 'w': C(8, 9, 10), 'nd': R(50, 150, 10), 'n': R(30, 80, 10)},
compute={'f2': 'f1+df', 'f3': 'f1+2*df', 'tv': '(f1+2*df)*(1+g/100)/((w-g)/100)', 'ev': 'f1/(1+w/100)+(f1+df)/(1+w/100)^2+(f1+2*df+(f1+2*df)*(1+g/100)/((w-g)/100))/(1+w/100)^3'},
check=({'f1': 20, 'df': 2, 'g': 3, 'w': 9, 'nd': 100, 'n': 50}, {'tv': 412, 'ev': 373.54})))
qs.append(Q('c37-e03', 37, 'Terminal value sensitivity', '''
With a WACC of {w}%, what's the terminal-value multiple (1 + g)/(WACC − g) for g = 1, 2, 3 and 4%? By what percentage does the
terminal value rise when g moves from 3% to 4%?''', '''
g = 1%: {=1.01/((w-1)/100):1}; 2%: {=1.02/((w-2)/100):1}; 3%: {=1.03/((w-3)/100):1}; 4%: {=1.04/((w-4)/100):1}. From 3% to 4% it rises {=(1.04/((w-4)/100))/(1.03/((w-3)/100))*100-100:0}% —
terminal values are extremely sensitive to g.''',
kind='calc', vars={'w': C(7, 8, 9, 10)}, compute={'m3': '1.03/((w-3)/100)'}, check=({'w': 8}, {'m3': 20.6}), tol=0.002))
qs.append(Q('c37-e04', 37, 'Value drivers: growth and return on new capital', '''
A firm has next-year NOPAT of {N}, a WACC of {w}% and grows at {g}%. What's its enterprise value if its return on new invested
capital (RONIC) is 20%, {w}% and 5%? Explain the pattern.''', '''
Reinvestment = g/RONIC; FCF = NOPAT × (1 − g/RONIC). RONIC 20%: FCF {=N*(1-g/20):2}, EV {=N*(1-g/20)/((w-g)/100):1}. RONIC = WACC: EV = {N}/{=w/100:2} = {=N/(w/100):1} (the no-growth value).
RONIC 5%: FCF {=N*(1-g/5):2}, EV {=N*(1-g/5)/((w-g)/100):1}. Growth adds value only when RONIC exceeds WACC; below it, growth destroys value.''',
kind='calc', diff=2, vars={'N': R(30, 80, 10), 'w': C(8, 10), 'g': C(2, 3, 4)}, constraints=['g<5'], compute={'e1': 'N*(1-g/20)/((w-g)/100)'},
check=({'N': 50, 'w': 10, 'g': 4}, {'e1': 666.67})))
qs.append(Q('c37-e05', 37, 'Justified price-to-book', '''
A bank has ROE of {roe}%, a cost of equity of {r}% and long-run growth of {g}%. What's its justified P/B? What if ROE falls to {roe2}%?''', '''
P/B = (ROE − g)/(r − g) = ({roe} − {g})/({r} − {g}) = {=(roe-g)/(r-g):2}. At ROE {roe2}%: {=(roe2-g)/(r-g):2}{?roe2<r| — below 1: the bank earns less than its cost of equity, so retaining earnings to grow destroys value|}.''',
kind='calc', vars={'roe': R(12, 18), 'r': R(9, 11), 'g': R(3, 5), 'roe2': R(6, 9)}, compute={'pb': '(roe-g)/(r-g)'}, check=({'roe': 15, 'r': 10, 'g': 5, 'roe2': 8}, {'pb': 2})))
qs.append(Q('c37-e06', 37, 'Valuation by comparables', '''
Five peers trade at EV/EBITDA of 6.5, 7.5, 8, 9 and 15. Our target has EBITDA of {e} and net debt of {nd}. What's its equity value
using the median and the mean? Which would you use, and what would you investigate?''', '''
Median 8: EV {=8*e}, equity {=8*e-nd}. Mean 9.2: EV {=9.2*e:0}, equity {=9.2*e-nd:0}. Use the median, but investigate the peer at 15 (different mix, a bid in its
price, depressed EBITDA?) and whether the target resembles it.''',
kind='calc', vars={'e': R(30, 60, 5), 'nd': R(50, 150, 10)}, compute={}, check=({'e': 40, 'nd': 90}, {})))
qs.append(Q('c37-e07', 37, 'Leases and multiples', '''
Before IFRS 16 a retailer had EBITDA of 80 and enterprise value 640 (excluding leases). It now recognises lease liabilities of
150, and EBITDA rises by its annual lease payments of 20. What's EV/EBITDA before and after? Why does comparing with a peer
that hasn't made the same adjustment mislead?''', '''
Before 640/80 = 8.0; after (640 + 150)/(80 + 20) = 7.9. Leases enter both numerator and denominator, so the multiple barely moves —
but a peer with EBITDA before lease costs and EV excluding lease debt (or vice versa) has an inconsistent multiple, making firms
look cheap or dear for purely accounting reasons.''', kind='calc', diff=2))
qs.append(Q('c37-e08', 37, 'Sum-of-the-parts valuation', '''
A group has a consumer division (EBIT {e1}, peer EV/EBIT {m1}), an industrial division (EBIT {e2}, peer EV/EBIT {m2}) and central
costs of {cc} a year (capitalise at 10×). Net debt is {nd} and the market value of equity is {mv}. What's the sum-of-the-parts
equity value, and the discount or premium?''', '''
EV = {e1} × {m1} + {e2} × {m2} − {cc} × 10 = {ev}; equity = {=ev-nd}. Market {mv} is a {?mv>ev-nd|premium|discount} of {=abs(mv/(ev-nd)-1)*100:0}% to the sum of the parts.''',
kind='calc', vars={'e1': R(40, 80, 10), 'm1': R(12, 16), 'e2': R(30, 50, 10), 'm2': R(7, 10), 'cc': R(8, 15), 'nd': R(300, 500, 50), 'mv': R(500, 1000, 50)},
compute={'ev': 'e1*m1+e2*m2-cc*10'}, constraints=['e1*m1+e2*m2-cc*10-nd>100', 'mv!=e1*m1+e2*m2-cc*10-nd'], check=({'e1': 60, 'm1': 14, 'e2': 40, 'm2': 9, 'cc': 12, 'nd': 400, 'mv': 800}, {'ev': 1080})))
qs.append(Q('c37-e09', 37, 'Venture capital method', '''
A start-up expects to be worth {X} at exit in {n} years. An investor targets a {r}% return, will invest {I} now, and expects its
stake to be diluted by {d}% in later rounds. What's the post-money value today and the ownership share required now?''', '''
Post-money = {X}/{=1+r/100:2}^{n} = {pm:1}. Ownership needed at exit: {I}/{pm:1} = {=I/pm*100:1}%; now: {=I/pm*100:1}/{=1-d/100:2} = {=I/pm/(1-d/100)*100:1}%.''',
kind='calc', vars={'X': R(200, 800, 50), 'n': R(4, 7), 'r': C(30, 35, 40, 50), 'I': R(5, 25), 'd': C(10, 20, 30)}, compute={'pm': 'X/(1+r/100)^n'}, constraints=['I/(X/(1+r/100)^n)/(1-d/100)<0.9'],
check=({'X': 400, 'n': 6, 'r': 35, 'I': 15, 'd': 20}, {'pm': 66.1}), tol=0.002))
qs.append(Q('c37-e10', 37, 'Sustainable growth and value', '''
A firm has NOPAT of {N} next year, reinvests {b}% of it, and earns {roi}% on new investment; WACC is {w}%. What's its growth rate and
enterprise value, compared with its value if it stopped growing and paid out all NOPAT?''', '''
g = {=b/100:2} × {roi}% = {=b*roi/100:2}%; FCFF = {=N*(1-b/100):2}; EV = {=N*(1-b/100):2}/({=w/100:3} − {=b*roi/10000:4}) = {ev:1}. No growth: {N}/{=w/100:2} = {=N/(w/100):1}.
{?roi>w|Growth adds value because new investment earns more than the WACC.|Growth destroys value because new investment earns less than the WACC.}''',
kind='calc', vars={'N': R(50, 120, 10), 'b': C(30, 40, 50), 'roi': R(6, 15), 'w': R(8, 10)}, compute={'ev': 'N*(1-b/100)/(w/100-b*roi/10000)'}, constraints=['w/100-b*roi/10000>0.01', 'roi!=w'],
check=({'N': 80, 'b': 40, 'roi': 12, 'w': 9}, {'ev': 1142.86})))
write(8, 'Finance Associate', 'rank08_finance_associate.json', qs)
