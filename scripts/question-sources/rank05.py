from qlib import *
qs = []
# ---------------- Chapter 16 ----------------
qs.append(Q('c16-e01', 16, 'OLS by hand', '''
Can you run a regression by hand for me? x = (0, 1, 2, 3) and y = (1, 3, 2, 6). What are the OLS intercept and slope,
the residuals, and R²?''', '''
x̄ = 1.5, ȳ = 3. Σ(x − x̄)(y − ȳ) = 7; Σ(x − x̄)² = 5. Slope b₁ = 1.4; intercept b₀ = 3 − 1.4 × 1.5 = 0.9. Fitted 0.9, 2.3,
3.7, 5.1; residuals 0.1, 0.7, −1.7, 0.9 (sum zero). SSR = 4.2; SST = 14; R² = 1 − 4.2/14 = 0.7.''', kind='calc'))
qs.append(Q('c16-e02', 16, 'Regression slope from correlation', '''
The correlation between household income and restaurant spending is {r}; the standard deviation of income is {sx}
and of restaurant spending {sy}. What's the OLS slope of spending on income, and how do I interpret it?''', '''
b₁ = r × s_y/s_x = {r} × {sy}/{sx} = {=r*sy/sx:4}: each extra unit of income is associated with {=r*sy/sx:4} more units of restaurant
spending on average ({=r*sy/sx*100:2} cents per euro) — an association, not necessarily a causal effect.''',
kind='calc', vars={'r': R(0.2, 0.6, 0.1), 'sx': R(10000, 30000, 5000), 'sy': R(1000, 3000, 500)}, compute={'b': 'r*sy/sx'},
check=({'r': 0.4, 'sx': 20000, 'sy': 1500}, {'b': 0.03})))
qs.append(Q('c16-e03', 16, 'Standard error of a slope', '''
With x = (0, 1, 2, 3) and y = (1, 3, 2, 6), the OLS slope is 1.4 with SSR = 4.2 and Σ(x − x̄)² = 5. What's the standard
error of the slope, and is it significantly different from zero at 5%? (t critical value with 2 df is 4.30.)''', '''
s² = 4.2/2 = 2.1; SE(b₁) = √(2.1/5) = 0.648; t = 1.4/0.648 = 2.16 < 4.30: not significant at 5% with so few observations.''', kind='calc', diff=2))
qs.append(Q('c16-e04', 16, 'Interpreting log-level regressions', '''
A regression gives ln(wage) = 1.2 + {b} × years of education. How do I interpret the coefficient, approximately and
exactly? Why might it not be the causal effect of education?''', '''
Approximately, each extra year of education is associated with {=b*100:1}% higher wages; exactly e^{b} − 1 = {=(exp(b)-1)*100:2}%.
It may not be causal because of omitted variables (ability, family background) correlated with both education and wages.''',
kind='calc', vars={'b': C(0.05, 0.06, 0.07, 0.08, 0.1)}, compute={'x': '(exp(b)-1)*100'}, check=({'b': 0.07}, {'x': 7.25})))
qs.append(Q('c16-e05', 16, 'Elasticities from log-log regressions', '''
Regressing log fuel consumption on log fuel price and log income gives coefficients −{e} and {y}. What does each mean?
By how much should consumption fall after a {p}% price rise — using the elasticity, and exactly?''', '''
A 1% price rise is associated with a {e}% fall in consumption holding income fixed; a 1% income rise with a {y}% rise
holding price fixed. After a {p}% price rise: approximately −{e} × {p} = {=-e*p:2}%; exactly {=1+p/100:2}^−{e} − 1 = {=((1+p/100)^(-e)-1)*100:2}%.''',
kind='calc', vars={'e': C(0.15, 0.25, 0.4), 'y': C(0.6, 0.9, 1.1), 'p': C(10, 20, 30)}, compute={'x': '((1+p/100)^(-e)-1)*100'},
check=({'e': 0.25, 'y': 0.9, 'p': 20}, {'x': -4.46})))
qs.append(Q('c16-e06', 16, 'Dummy variables and interactions', '''
Our regression of monthly sales (thousands) on a city-centre indicator, advertising spend (thousands) and their
interaction gives: sales = 40 + {a}·centre + {b}·adv + {c}·(centre × adv). What's the effect of an extra thousand of
advertising for a city-centre shop and for other shops? What's the predicted gap between a city-centre shop and
another shop when both spend {k} on advertising?''', '''
City centre: {b} + {c} = {=b+c} thousand per thousand of advertising; elsewhere {b}. At advertising {k}: difference =
{a} + {c} × {k} = {=a+c*k} thousand.''',
kind='calc', vars={'a': R(10, 20), 'b': R(1.5, 3, 0.5), 'c': R(0.5, 2, 0.5), 'k': R(2, 6)}, compute={}, check=({'a': 15, 'b': 2.0, 'c': 1.5, 'k': 4}, {})))
qs.append(Q('c16-e07', 16, 'Quadratic terms', '''
A wage equation: ln w = 1.5 + 0.08S + {b}X − {c}X², where X is years of experience. At what experience level are
predicted earnings highest? What's the marginal effect of experience at 5 and at 20 years?''', '''
∂ln w/∂X = {b} − {=2*c}X = 0 at X = {=b/(2*c):1} years. At 5 years: {b} − {=10*c:4} = {=(b-10*c)*100:2}% a year; at 20: {=(b-40*c)*100:2}%.''',
kind='calc', vars={'b': C(0.03, 0.04, 0.05), 'c': C(0.0006, 0.0008, 0.001)}, compute={'x': 'b/(2*c)'}, constraints=['b-40*c>0'], check=({'b': 0.04, 'c': 0.0008}, {'x': 25})))
qs.append(Q('c16-e08', 16, 'F test for joint significance', '''
A regression with 4 regressors and an intercept on 105 observations has SSR = {u}. Dropping two regressors raises SSR to
{r}. What's the F statistic? Are the two jointly significant at 5% (critical value about 3.09)?''', '''
n − k − 1 = 100. F = [({r} − {u})/2]/({u}/100) = {F:2} → {?F>3.09|jointly significant at 5%|not jointly significant at 5%}.''',
kind='calc', vars={'u': R(300, 500, 20), 'd': R(10, 60, 5)}, compute={'r': 'u+d', 'F': '(d/2)/(u/100)'}, constraints=['abs((d/2)/(u/100)-3.09)>0.2'],
check=({'u': 400, 'd': 40}, {'F': 5})))
qs.append(Q('c16-e09', 16, 'Perfect collinearity', '''
A researcher regresses house prices on floor area in square metres AND floor area in square feet. What happens, and why?''', '''
One regressor is an exact multiple of the other (1 m² = 10.764 ft²), so the X columns are perfectly collinear, X′X is
singular and OLS has no unique solution; software drops one variable or reports an error.'''))
qs.append(Q('c16-e10', 16, 'Overfitting', '''
Our default-prediction model fits the estimation sample with R² = 0.9 using 60 variables on 100 firms, but it
predicted terribly the next year. What probably happened, and how should we have checked?''', '''
It overfitted: with 60 variables and 100 observations it fitted noise specific to the sample, so in-sample R² is
meaningless for prediction. Hold out a test sample (ideally a later period), use cross-validation, and prefer a simpler
or penalised model (e.g. lasso/ridge).''', diff=2))
# ---------------- Chapter 17 ----------------
qs.append(Q('c17-e01', 17, 'Selection bias', '''
Hospital patients have worse health on average than people who aren't in hospital. Using potential outcomes, why
doesn't that show hospitals harm health?''', '''
Naive difference = effect of hospital on patients + selection bias E[Y(0) | hospital] − E[Y(0) | not], and that bias is
strongly negative — people go to hospital because they're ill. A negative naive difference is fully consistent with
hospitals improving health.''', diff=2))
qs.append(Q('c17-e02', 17, 'Confounders, mediators and colliders', '''
Studying the effect of a firm's R&D spending on its profits: is each of these a confounder, mediator or collider, and
should I control for it? (a) the firm's industry; (b) the number of patents it gets; (c) whether the firm still exists
at the end of the sample.''', '''
(a) Confounder — affects both R&D and profitability: include it. (b) Mediator — R&D raises profits partly through
patents; controlling for it removes that channel, so exclude it for the total effect. (c) Collider (selection) —
survival depends on both R&D and profits; conditioning on it creates bias: avoid it or model attrition.''', diff=2))
qs.append(Q('c17-e03', 17, 'Omitted-variable bias', '''
Regressing house prices on distance from the city centre gives −{b} (thousand per km). Houses farther out are bigger,
and size raises prices. Is the true effect of distance, holding size fixed, more or less negative than −{b}?''', '''
More negative. Distance is positively correlated with size and size raises prices, so the short regression is biased
upward: −{b} = β₁ + β₂δ with β₂δ > 0, hence β₁ < −{b}.''', vars={'b': R(1, 5)}, compute={}, check=({'b': 2}, {}), diff=2))
qs.append(Q('c17-e04', 17, 'Measurement error and attenuation', '''
Self-reported schooling has a reliability ratio of {rr}. A regression of log wages on reported schooling gives {b}. If
that's the only source of bias, what's the true coefficient?''', '''
Classical measurement error attenuates the slope by the reliability ratio: true ≈ {b}/{rr} = {=b/rr:4}.''',
kind='calc', vars={'rr': C(0.8, 0.85, 0.9), 'b': C(0.06, 0.068, 0.072, 0.08)}, compute={'t': 'b/rr'}, check=({'rr': 0.9, 'b': 0.072}, {'t': 0.08})))
qs.append(Q('c17-e05', 17, 'Intention-to-treat and non-compliance', '''
A randomised job-search programme is offered to half of 10,000 unemployed workers; {c}% of those offered take part, and
nobody else can. Six months later {e1}% of those offered are employed versus {e0}% of those not offered. What's the ITT
and the effect on participants?''', '''
ITT = {e1} − {e0} = {=e1-e0} percentage points. Effect on participants (Wald/LATE) = {=e1-e0}/{=c/100} = {=(e1-e0)/(c/100):2} points.''',
kind='calc', vars={'c': R(30, 70, 10), 'e0': R(40, 55), 'd': R(2, 6)}, compute={'e1': 'e0+d'}, check=({'c': 40, 'e0': 48, 'd': 4}, {'e1': 52})))
qs.append(Q('c17-e06', 17, 'Instrumental variables', '''
A new bridge randomly cuts travel time to a university for some villages. Villages near the bridge have {a1}%
university attendance against {a0}% elsewhere, and average adult earnings {g}% higher. What's the effect of attending
university on earnings, and what assumptions do I need?''', '''
Wald estimate = {g}/({=(a1-a0)/100:2}) = {=g/((a1-a0)/100):1}% higher earnings from attending. Assumptions: the bridge is as good
as randomly placed; it affects earnings only through attendance (not e.g. via access to jobs); and the estimate applies to
villagers whose attendance was changed by the bridge.''',
kind='calc', diff=2, vars={'a0': R(15, 25), 'a1': R(25, 40), 'g': R(2, 5)}, constraints=['a1-a0>=5'], compute={'w': 'g/((a1-a0)/100)'},
check=({'a0': 20, 'a1': 30, 'g': 3}, {'w': 30})))
qs.append(Q('c17-e07', 17, 'Difference-in-differences', '''
Our country cut corporate tax for manufacturing only. Investment rose from {m0}% to {m1}% of assets in manufacturing
and from {s0}% to {s1}% in services. What's the estimated effect? What would make it invalid, and how could we check?''', '''
DiD = ({m1} − {m0}) − ({s1} − {s0}) = {=(m1-m0)-(s1-s0)} percentage points. It's invalid if manufacturing investment would have
grown faster anyway (e.g. a sector-specific boom). Check that pre-period trends were parallel (event study) and whether
other policies changed at the same time.''',
kind='calc', vars={'m0': R(8, 12), 'dm': R(2, 5), 's0': R(7, 11), 'ds': R(0, 2)}, compute={'m1': 'm0+dm', 's1': 's0+ds'}, constraints=['dm>ds'],
check=({'m0': 10, 'dm': 3, 's0': 9, 'ds': 1}, {'m1': 13, 's1': 10})))
qs.append(Q('c17-e08', 17, 'Regression discontinuity', '''
Our bank automatically approves loans for applicants with a credit score of at least 650. Default rates are {b}% just
below 650 (approved manually) and {a}% just above. What does this comparison estimate, and what could undermine it?''', '''
It compares otherwise similar applicants either side of the threshold, estimating the effect of automatic approval on
default: {=a-b} percentage points. It's undermined if applicants can manipulate scores to cross 650 (bunching), or if
manual approvals below the line involve extra screening, so the groups differ in more than the approval method.''',
vars={'b': R(3, 5), 'a': R(5, 8)}, constraints=['a>b'], compute={}, check=({'b': 4, 'a': 6}, {}), diff=2))
qs.append(Q('c17-e09', 17, 'Reverse causality', '''
Cities with more police officers per resident have higher crime rates. Does that mean police cause crime? How could
we estimate the causal effect of police on crime?''', '''
No — causation may run from crime to police (high-crime cities hire more), and common causes (city size) drive both.
Designs: an instrument that shifts police numbers for reasons unrelated to crime (electoral cycles, federal hiring
grants), or sudden redeployments (e.g. after a terror alert) analysed with difference-in-differences.''', diff=2))
qs.append(Q('c17-e10', 17, 'Choosing a research design', '''
What research design would you propose, and its key assumption, for: (a) the effect of class size on test scores;
(b) the effect of a central bank's surprise rate rise on share prices; (c) the effect of a large country's tariff on
its exports?''', '''
(a) Randomised class assignment, or regression discontinuity at class-size caps (assumption: enrolment near the cap
isn't manipulated). (b) High-frequency event study around the announcement using the futures-implied surprise
(assumption: nothing else moves prices in the window). (c) Synthetic control or DiD comparing affected and unaffected
products (assumption: the comparison tracks counterfactual exports).''', diff=3))
# ---------------- Chapter 18 ----------------
qs.append(Q('c18-e01', 18, 'Fixed effects', '''
Why might regressing countries' growth rates on their levels of democracy in a pooled cross-section give a different
answer from a regression with country fixed effects? What variation does each use?''', '''
Countries differ in geography, history, culture and institutions that affect both democracy and growth — these
confound the pooled comparison across countries. Fixed effects remove all time-invariant differences and use only
within-country changes over time: less confounding, but they may pick up only short-run effects and are sensitive to
measurement error in a slowly changing democracy index.''', diff=2))
qs.append(Q('c18-e02', 18, 'AR(1) forecasting', '''
Unemployment follows u(t) = {c} + {a}·u(t−1) + ε(t), with shock standard deviation {s}. What's the mean and the
unconditional standard deviation? If unemployment is {u0}% now, what are the forecasts one, two and five years ahead?''', '''
Mean = {c}/(1 − {a}) = {mu:2}%; s.d. = {s}/√(1 − {a}²) = {=s/sqrt(1-a^2):2}. Forecast = mean + {a}^h × ({u0} − {mu:2}):
1 year {=mu+a*(u0-mu):2}; 2 years {=mu+a^2*(u0-mu):2}; 5 years {=mu+a^5*(u0-mu):2}.''',
kind='calc', vars={'a': C(0.6, 0.7, 0.8, 0.9), 'mu0': R(4, 7), 's': C(0.3, 0.5, 0.7), 'u0': R(7, 10)}, compute={'c': 'mu0*(1-a)', 'mu': 'mu0'},
check=({'a': 0.8, 'mu0': 6, 's': 0.5, 'u0': 8}, {'c': 1.2}), tol=0.001))
qs.append(Q('c18-e03', 18, 'Impulse responses and half-life', '''
If unemployment follows an AR(1) with coefficient {a}, and a shock raises it by 1 point, how much higher is it expected
to be after three years? What's the half-life of the shock?''', '''
{a}³ = {=a^3:3} points after three years. Half-life = ln 0.5/ln {a} = {=ln(0.5)/ln(a):1} years.''',
kind='calc', vars={'a': C(0.5, 0.6, 0.7, 0.8, 0.9)}, compute={'h': 'ln(0.5)/ln(a)'}, check=({'a': 0.8}, {'h': 3.106})))
qs.append(Q('c18-e04', 18, 'Random walks', '''
A share price follows a random walk with daily shocks of standard deviation {s}%. What's the standard deviation of the
price change over {d} trading days? What's the best forecast of the price in {d} days?''', '''
{s}% × √{d} = {=s*sqrt(d):2}%. The best forecast is today's price (plus any drift, which is small over {d} days).''',
kind='calc', vars={'s': R(1, 2.5, 0.5), 'd': C(4, 9, 16, 25, 36)}, compute={}, check=({'s': 1.5, 'd': 25}, {})))
qs.append(Q('c18-e05', 18, 'Spurious regression', '''
An analyst regresses the level of a country's GDP on the number of mobile phones over 25 years and gets R² = 0.97.
What's wrong, and what should she do instead?''', '''
Both series trend upward, so a levels regression shows a high R² whether or not they're related (spurious regression).
Regress growth rates on growth rates, test for cointegration, or — for a causal question — find a proper research design.'''))
qs.append(Q('c18-e06', 18, 'Granger causality', '''
Weather forecasts Granger-cause umbrella sales — but they also Granger-cause rain. Does that mean forecasts cause rain?
What does it actually show?''', '''
No. Forecasts predict rain because forecasters use information that anticipates it; predictability reflects
information, not causation. It shows forecasts contain information about future rain beyond past rain.'''))
qs.append(Q('c18-e07', 18, 'Backtest overfitting', '''
A fund manager shows me a trading model that would have earned 25% a year since 2000. It was designed in 2024 after
testing many variants on the full data. Give me three reasons the performance overstates what I could expect.''', '''
(i) Multiple testing/selection: it's the best of many models tried on the same data. (ii) Look-ahead bias: variables and
parameters were chosen knowing the whole period. (iii) Omitted costs (transaction costs, market impact, taxes) and
possibly survivorship bias in the data. Only genuine out-of-sample performance after 2024 is a fair test.''', diff=2))
qs.append(Q('c18-e08', 18, 'Forecast accuracy: RMSE and MAE', '''
Outturns were 3, 5, 4, 6. Model A forecast 4, 4, 4, 5; model B forecast 3, 4, 5, 5. What are the RMSE and mean absolute
error of each? Which model is better?''', '''
A: errors −1, 1, 0, 1 → RMSE √(3/4) = 0.866, MAE 0.75. B: errors 0, 1, −1, 1 → RMSE 0.866, MAE 0.75. They tie on both —
small samples rarely discriminate between models.''', kind='calc'))
qs.append(Q('c18-e09', 18, 'GARCH volatility', '''
In a GARCH(1,1) with ω = {w}, α = {al} and β = {be}, what's the long-run daily variance and volatility? Yesterday's
variance was {v0} and yesterday's return shock was {e}%. What's today's variance?''', '''
Long-run variance = ω/(1 − α − β) = {=w/(1-al-be):s3}; volatility {=sqrt(w/(1-al-be))*100:2}% a day. Today: ω + α × {=(e/100)^2:s3} + β × {v0}
= {v1:s3}, a volatility of {=sqrt(v1)*100:2}%.''',
kind='calc', diff=2, vars={'w': C(0.000002, 0.000003), 'al': C(0.08, 0.1), 'be': C(0.85, 0.88), 'v0': C(0.0002, 0.0004), 'e': R(1, 4)},
compute={'v1': 'w+al*(e/100)^2+be*v0'}, check=({'w': 0.000002, 'al': 0.1, 'be': 0.88, 'v0': 0.0004, 'e': 3}, {'v1': 0.000444})))
# ---------------- Chapter 19 ----------------
qs.append(Q('c19-e01', 19, 'Value of information', '''
Our bank can lend 1 million to a firm at a profit of 80,000 if it repays, or lose 400,000 if it defaults; the default
probability is 0.1. (a) Should we lend? (b) What's the expected value of perfect information about default? (c) An
audit costs 20,000 and flags defaulters with probability 0.9 and good borrowers with probability 0.2. Is it worth buying?''', '''
(a) 0.9 × 80,000 − 0.1 × 400,000 = 32,000 > 0: lend. (b) With perfect information, lend only to repayers: 72,000; EVPI =
40,000. (c) P(flag) = 0.27; P(D | flag) = 1/3 → reject flagged; P(D | no flag) = 0.0137 → lend, earning 73,425. Value with
audit = 0.73 × 73,425 ≈ 53,600; gain 21,600 > 20,000 cost: buy the audit (narrowly).''', kind='calc', diff=3))
qs.append(Q('c19-e02', 19, 'Monte Carlo simulation error', '''
A simulation of a project's NPV with {N} draws gives a mean of {m} and a standard deviation of {s}. What's the standard
error of the estimated mean? How many draws would cut it to {t}? Would that make the estimate reliable?''', '''
SE = {s}/√{N} = {=s/sqrt(N):3}. For {t}: √N = {s}/{t} = {=s/t}, N = {=(s/t)^2}. That only reduces simulation error; if the input
distributions or correlations are wrong, the estimate is still unreliable.''',
kind='calc', vars={'N': C(500, 1000, 2000), 'm': R(5, 20), 's': R(20, 60, 10), 't': C(0.2, 0.5)}, compute={}, check=({'N': 1000, 'm': 12, 's': 40, 't': 0.2}, {})))
qs.append(Q('c19-e03', 19, 'Maximum likelihood', '''
Waiting times until {n} customers' first purchases are exponential with rate λ, and the mean observed time is {m} days.
What's the log-likelihood and the maximum-likelihood estimate of λ?''', '''
ℓ(λ) = {n} ln λ − λ Σtᵢ = {n} ln λ − {=n*m}λ. Setting the derivative {n}/λ − {=n*m} = 0 gives λ̂ = {=1/m:3} per day — the reciprocal of
the mean waiting time.''', kind='calc', diff=2, vars={'n': R(5, 12), 'm': R(2, 10)}, compute={}, check=({'n': 8, 'm': 5}, {})))
qs.append(Q('c19-e04', 19, 'Logit model', '''
A default model has log-odds = −{a} + {b} × leverage. What's the default probability and the marginal effect at leverage
{l1} and at {l2}?''', '''
At {l1}: log-odds {=-a+b*l1:2}, p = {p1:3}, marginal effect = {b} × p(1 − p) = {=b*p1*(1-p1):3}. At {l2}: log-odds {=-a+b*l2:2}, p = {p2:3},
marginal effect {=b*p2*(1-p2):3}.''',
kind='calc', vars={'a': R(3, 5), 'b': C(0.6, 0.8, 1), 'l1': R(2, 3), 'l2': R(5, 7)}, compute={'p1': '1/(1+exp(a-b*l1))', 'p2': '1/(1+exp(a-b*l2))'},
check=({'a': 4, 'b': 0.8, 'l1': 3, 'l2': 6}, {'p1': 0.168, 'p2': 0.690}), tol=0.005))
qs.append(Q('c19-e05', 19, 'Classification costs', '''
Our default model is applied to 1,000 loans (100 of which default). At the current threshold it flags 150 loans,
catching 70 defaulters, so it misses 30 and wrongly flags 80 good borrowers. Each missed defaulter costs {fn} and each
rejected good borrower costs {fp}. What's the total cost of errors? A lower threshold flags 250 loans and catches 90
defaulters — what's its confusion matrix and cost? Which is better?''', '''
Current: 30 × {fn} + 80 × {fp} = {c1}. Lower threshold: TP 90, FP 160, FN 10, TN 740 → 10 × {fn} + 160 × {fp} = {c2}.
{?c2<c1|The lower threshold is better given these costs.|The current threshold is better given these costs.}''',
kind='calc', diff=2, vars={'fn': R(20, 60, 10), 'fp': R(3, 8)}, compute={'c1': '30*fn+80*fp', 'c2': '10*fn+160*fp'}, constraints=['30*fn+80*fp!=10*fn+160*fp'],
check=({'fn': 50, 'fp': 5}, {'c1': 1900, 'c2': 1300})))
qs.append(Q('c19-e06', 19, 'Bayesian updating with a Beta prior', '''
A fund manager's skill is the probability p of beating the market in a month, with prior Beta({a}, {a}). She beats the
market in {k} of {n} months. What's the posterior mean, compared with the raw proportion? How would a sceptical prior
Beta(50, 50) change things?''', '''
Posterior Beta({=a+k}, {=a+n-k}): mean {=(a+k)/(2*a+n):4}, versus the raw {=k/n:3}. With Beta(50, 50): posterior Beta({=50+k}, {=50+n-k}), mean
{=(50+k)/(100+n):3} — a strong prior that most managers lack skill barely moves.''',
kind='calc', diff=2, vars={'a': C(5, 10, 20), 'n': C(12, 24), 'k': R(7, 18)}, constraints=['k<n'], compute={'m': '(a+k)/(2*a+n)'},
check=({'a': 10, 'n': 12, 'k': 8}, {'m': 0.5625})))
qs.append(Q('c19-e07', 19, 'Lasso regression', '''
Why might a lasso regression with lots of candidate predictors of GDP growth pick only a few variables? And why
shouldn't I read its coefficients as causal effects?''', '''
The |β| penalty makes it optimal to set weak predictors' coefficients exactly to zero, keeping those that add most
predictive power. Coefficients are shrunk toward zero by design, depend on which correlated variables happen to be
selected, and reflect predictive association, not the effect of intervening on a variable.''', diff=2))
qs.append(Q('c19-e08', 19, "The winner's curse", '''
An algorithm estimates house values without bias, ±5%. A company offers the estimated value on every house, and sellers
accept only when the offer exceeds the true value. Why does the company lose money on average if its estimates are unbiased?''', '''
Sellers accept exactly when the estimate is too high, so among accepted offers the average error is positive — the
company systematically overpays. Unbiased across all houses doesn't mean unbiased among the houses selected by informed
counterparties (adverse selection).''', diff=2))
write(5, 'Analyst II', 'rank05_analyst_ii.json', qs)
