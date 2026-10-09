# DRAFT (rank 9, chapters 38-42): not yet validated or enabled. See CLAUDE.md.
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from qlib import *
qs = []
# ---------------- Chapter 38 ----------------
qs.append(Q('c38-e01', 38, 'Walk-away price in M&A', '''
A target has a standalone value of {V}. Synergies are worth {S} in present value; integration will cost {ic} and advisers {af}.
What's our walk-away price? If we pay {P}, how is the gain divided?''', '''
Walk-away = {V} + {S} − {ic} − {af} = {=V+S-ic-af}. At {P}: target holders get a premium of {=P-V}; the acquirer's gain is {S} − {=P-V} − {=ic+af} = {=S-(P-V)-ic-af}.''',
kind='calc', vars={'V': R(300, 600, 50), 'S': R(60, 150, 10), 'ic': R(10, 30, 5), 'af': R(5, 15, 5), 'pr': R(10, 50, 5)}, compute={'P': 'V+pr'}, constraints=['pr<S-ic-af'],
check=({'V': 400, 'S': 90, 'ic': 20, 'af': 10, 'pr': 30}, {'P': 430})))
qs.append(Q('c38-e02', 38, 'Paying with cash or shares', '''
Our company has 200 shares at 30; the target is worth 1,500 standalone and synergies are worth 500. Compare our gain from a cash
offer of 1,800 with an offer of 60 new shares.''', '''
Cash: gain = 500 − 300 premium = 200. Shares: combined value 6,000 + 1,500 + 500 = 8,000 on 260 shares = 30.77 each; the target gets
60 × 30.77 = 1,846 and our holders own 6,154 — a gain of 154. Paying in shares shares the synergies (and risks) with the target's holders.''', kind='calc', diff=2))
qs.append(Q('c38-e03', 38, 'EPS bootstrapping', '''
An acquirer earns 400 and has 100 shares at 80. It buys, with new shares, a target earning 100 and valued at 1,200, paying a 25%
premium. With no synergies, what's the new EPS and the change in value of the original shareholders' stake?''', '''
Price 1,500 = 18.75 new shares at 80. EPS rises from 4.00 to 500/118.75 = 4.21 — but combined value is 8,000 + 1,200 = 9,200 and
original holders own 100/118.75 of it = 7,747: a loss of 253. EPS accretion isn't value creation.''', kind='calc', diff=2))
qs.append(Q('c38-e04', 38, 'Merger arbitrage', '''
A target trades at {p} after a cash offer of {o}. If the deal fails the shares should fall to {f}. What completion probability does
the price imply? If I think the probability is {q}, what are the shares worth to me?''', '''
{p} = {o}π + {f}(1 − π) → π = ({p} − {f})/({o} − {f}) = {=(p-f)/(o-f):3}. At {q}: {q} × {o} + {=1-q:2} × {f} = {=q*o+(1-q)*f:2} (before time value and risk).''',
kind='calc', vars={'o': R(40, 70, 2), 'f': R(25, 38), 'pi': R(0.4, 0.8, 0.05), 'q': C(0.85, 0.9, 0.95)}, compute={'p': 'f+pi*(o-f)'}, constraints=['o-f>5'],
check=({'o': 52, 'f': 38, 'pi': 0.5714285714, 'q': 0.9}, {'p': 46})))
qs.append(Q('c38-e05', 38, 'LBO returns', '''
A company with EBITDA of {E0} is bought at {m}× EBITDA with debt of {D0}. After five years EBITDA is {E5} and debt {D5}. What are
the MOIC and IRR if the exit multiple is {m}×, and if it's {m2}×? Can you decompose the equity gain in the first case?''', '''
Entry EV {=m*E0}, equity {=m*E0-D0}. Exit at {m}×: EV {=m*E5}, equity {=m*E5-D5}, MOIC {=(m*E5-D5)/(m*E0-D0):2}, IRR {=((m*E5-D5)/(m*E0-D0))^(0.2)*100-100:1}%.
At {m2}×: equity {=m2*E5-D5}, MOIC {=(m2*E5-D5)/(m*E0-D0):2}, IRR {=((m2*E5-D5)/(m*E0-D0))^(0.2)*100-100:1}%. Decomposition: EBITDA growth {=(E5-E0)*m} + multiple change 0 +
debt paydown {=D0-D5} = {=(E5-E0)*m+D0-D5}.''',
kind='calc', diff=2, vars={'E0': R(40, 80, 5), 'm': C(8, 9, 10), 'lev': C(0.6, 0.67, 0.7), 'g': C(1.2, 1.3, 1.4), 'pay': C(0.3, 0.4), 'm2': C(6, 7)},
compute={'D0': 'round(m*E0*lev)', 'E5': 'round(E0*g)', 'D5': 'round(round(m*E0*lev)*(1-pay))'},
check=({'E0': 50, 'm': 9, 'lev': 0.6667, 'g': 1.3, 'pay': 0.4, 'm2': 7}, {'D0': 300, 'E5': 65, 'D5': 180})))
qs.append(Q('c38-e06', 38, 'Leverage and private-equity returns', '''
A company is bought for 450 (9× EBITDA of 50) and sold five years later for 585 (9× EBITDA of 65). What are the MOIC and IRR if
it was bought all-equity? With 300 of debt repaid down to 180 they'd be 2.70× and 22%. What explains the difference?''', '''
All-equity: MOIC 585/450 = 1.30, IRR 5.4%. Leverage turns a 30% rise in enterprise value, plus cash used to repay debt, into a 170%
gain on a much smaller equity stake — at the cost of much greater risk.''', kind='calc', diff=2))
qs.append(Q('c38-e07', 38, 'Interest coverage in an LBO', '''
An LBO has EBITDA of {E} and debt of {D} at {r}%. What's EBITDA/interest? What would it be if EBITDA fell {f}% in the first year,
and what might happen then?''', '''
Interest {=D*r/100}; coverage {=E/(D*r/100):2}×. After a {f}% fall: {=E*(1-f/100)/(D*r/100):2}×. After capex and taxes, cash may not cover interest and scheduled
repayments; covenants may be breached, and owners may need to inject equity or renegotiate with lenders.''',
kind='calc', vars={'E': R(40, 80, 5), 'D': R(250, 400, 50), 'r': R(6, 10), 'f': C(20, 30, 40)}, compute={}, check=({'E': 50, 'D': 300, 'r': 8, 'f': 30}, {})))
qs.append(Q('c38-e08', 38, 'Private-equity fund economics', '''
A fund has commitments of {C}. Fees total {F} and the remaining {=C-F} is invested, returning {R}. Carried interest is 20% of profits
over committed capital. What are the gross MOIC, the carry and the LPs' net MOIC?''', '''
Gross MOIC {R}/{=C-F} = {=R/(C-F):2}. Profit over commitments {=R-C}; carry {=0.2*(R-C)}. LPs receive {=R-0.2*(R-C)}: net MOIC {=(R-0.2*(R-C))/C:2} — fees and carry take a big bite.''',
kind='calc', vars={'C': R(400, 1000, 100), 'fr': C(0.15, 0.2), 'mult': R(2, 3.5, 0.25)}, compute={'F': 'C*fr', 'R': 'C*(1-fr)*mult'}, constraints=['C*(1-fr)*mult>C'],
check=({'C': 500, 'fr': 0.2, 'mult': 2.75}, {'F': 100, 'R': 1100})))
qs.append(Q('c38-e09', 38, 'IRR vs MOIC', '''
Fund A returns {a}× its money in {na} years; fund B returns {b}× in {nb} years. What's each IRR? Which would you prefer, and on what
does it depend?''', '''
A: {a}^(1/{na}) − 1 = {=(a^(1/na)-1)*100:1}%. B: {b}^(1/{nb}) − 1 = {=(b^(1/nb)-1)*100:1}%. A wins if you can reinvest its proceeds at more than
({b}/{a})^(1/{=nb-na}) − 1 = {=((b/a)^(1/(nb-na))-1)*100:1}% a year for the remaining {=nb-na} years; otherwise B delivers more wealth. IRR alone doesn't decide.''',
kind='calc', vars={'a': C(1.5, 1.6, 1.8), 'na': C(2, 3), 'b': C(2.5, 3), 'nb': C(7, 8)}, compute={'h': '((b/a)^(1/(nb-na))-1)*100'}, check=({'a': 1.6, 'na': 2, 'b': 2.5, 'nb': 7}, {'h': 9.34}), tol=0.002))
qs.append(Q('c38-e10', 38, 'Public market equivalent (PME)', '''
As an LP I contributed {c0} at time 0 and {c1} at time 1, and received {d} at time 5. A public index stood at 100, {i1} and {i5} at
those dates. What's the PME and what does it mean?''', '''
Discounted distributions {d}/{=i5/100:2} = {=d/(i5/100):1}; discounted contributions {c0} + {c1}/{=i1/100:2} = {=c0+c1/(i1/100):1}; PME = {pme:2}.
{?pme>1.02|The fund beat the index.|{?pme<0.98|The fund lagged the index.|The fund roughly matched the index — public shares would have done about as well.}}''',
kind='calc', vars={'c0': C(100), 'c1': R(30, 70, 10), 'd': R(200, 320, 10), 'i1': R(100, 120, 5), 'i5': R(150, 200, 10)}, compute={'pme': '(d/(i5/100))/(c0+c1/(i1/100))'},
check=({'c0': 100, 'c1': 50, 'd': 250, 'i1': 110, 'i5': 170}, {'pme': 1.011}), tol=0.002))
# ---------------- Chapter 39 ----------------
qs.append(Q('c39-e01', 39, 'Credit ratios', '''
A company has EBITDA of {E}, EBIT of {B}, interest expense {I}, debt {D} and cash {C}. What are net debt/EBITDA, EBITDA coverage and
EBIT coverage? What would you want to know before calling the leverage high?''', '''
Net debt {=D-C}; net debt/EBITDA {=(D-C)/E:2}×; EBITDA coverage {=E/I:2}×; EBIT coverage {=B/I:2}×. Context matters: industry cyclicality, stability of EBITDA, capex
needs, debt maturity profile and available liquidity.''',
kind='calc', vars={'E': R(100, 200, 10), 'B': R(60, 150, 10), 'I': R(20, 40, 5), 'D': R(400, 800, 50), 'C': R(50, 150, 25)}, constraints=['B<E'], compute={},
check=({'E': 150, 'B': 110, 'I': 30, 'D': 600, 'C': 75}, {})))
qs.append(Q('c39-e02', 39, 'Covenant headroom', '''
Our net debt is {nd} and EBITDA {E}; the maintenance covenant caps net debt/EBITDA at {cv}×. By how much can EBITDA fall before
a breach? If we spend {acq} of cash on an acquisition that adds no EBITDA, what's the new headroom?''', '''
Breach when EBITDA < {nd}/{cv} = {=nd/cv:1}: a fall of {=(1-nd/cv/E)*100:1}%. After the deal net debt is {=nd+acq}; breach below {=(nd+acq)/cv:1}: headroom {=(1-(nd+acq)/cv/E)*100:1}%.''',
kind='calc', vars={'nd': R(400, 600, 25), 'E': R(130, 180, 10), 'cv': C(4, 4.25, 4.5), 'acq': R(20, 60, 5)}, constraints=['nd/E<cv*0.9', '(nd+acq)/E<cv'], compute={'b': 'nd/cv'},
check=({'nd': 525, 'E': 150, 'cv': 4.25, 'acq': 45}, {'b': 123.53})))
qs.append(Q('c39-e03', 39, 'Risk-based loan pricing', '''
Our bank lends 10 million to a borrower with PD {pd}% and LGD {lgd}%. Funding cost is {f}%, operating costs {oc}% of the loan, we hold
capital of {k}% of the loan, and our cost of equity is {re}%. Roughly what loan rate should we charge?''', '''
Expected loss {=pd/100*lgd:3}%; capital charge {=k/100:2} × ({re} − {f}) = {=k/100*(re-f):3}%; rate ≈ {f} + {=pd/100*lgd:3} + {oc} + {=k/100*(re-f):3} = {=f+pd/100*lgd+oc+k/100*(re-f):2}%.''',
kind='calc', vars={'pd': R(0.5, 3, 0.5), 'lgd': C(35, 45, 60), 'f': R(3, 5, 0.5), 'oc': C(0.4, 0.5, 0.6), 'k': C(8, 10, 12), 're': R(10, 15)}, compute={'r': 'f+pd/100*lgd+oc+k/100*(re-f)'},
check=({'pd': 1.5, 'lgd': 45, 'f': 4, 'oc': 0.5, 'k': 8, 're': 12}, {'r': 5.815})))
qs.append(Q('c39-e04', 39, 'Rating transition matrices', '''
The annual transition matrix among investment grade (IG), high yield (HY) and default (D) is: IG → IG 0.90, HY 0.08, D 0.02;
HY → IG 0.10, HY 0.80, D 0.10; D stays D. What are the two-year default probabilities for an IG and an HY borrower?''', '''
IG: 0.02 + 0.90 × 0.02 + 0.08 × 0.10 = 0.046. HY: 0.10 + 0.10 × 0.02 + 0.80 × 0.10 = 0.182.''', kind='calc', diff=2))
qs.append(Q('c39-e05', 39, 'Distance to default (Merton)', '''
A firm's assets are worth {A} with volatility {s}% and expected return {mu}%; debt of {D} is due in a year. What's the distance to default
and probability of default? What happens if the share price falls sharply?''', '''
DD = [ln({A}/{D}) + {=mu/100:2} − {=(s/100)^2/2:4}]/{=s/100:2} = {dd:2}; PD = Φ(−{dd:2}) = {=ncdf(-dd)*100:1}%. A sharp share-price fall signals lower asset value (and
usually higher volatility), cutting DD and raising PD.''',
kind='calc', diff=3, vars={'A': R(150, 300, 10), 'D': R(100, 200, 10), 's': C(20, 25, 30, 40), 'mu': R(5, 9)}, constraints=['A>D', '(ln(A/D)+mu/100-(s/100)^2/2)/(s/100)<2.8'], compute={'dd': '(ln(A/D)+mu/100-(s/100)^2/2)/(s/100)'},
check=({'A': 200, 'D': 150, 's': 30, 'mu': 7}, {'dd': 1.042}), tol=0.002))
qs.append(Q('c39-e06', 39, 'Hazard rates from spreads', '''
A five-year bond trades at a spread of {sp} basis points; expected loss given default is {lgd}%. What risk-neutral hazard rate and
five-year default probability does that imply? Why might the real probability be lower?''', '''
λ ≈ {=sp/10000:4}/{=lgd/100:2} = {=sp/lgd:2}% a year; five-year survival e^(−5λ) = {=exp(-5*sp/(lgd*100)):3} → default probability {=(1-exp(-5*sp/(lgd*100)))*100:1}%. Spreads also
pay for systematic risk, illiquidity and taxes, so the actual probability is probably lower.''',
kind='calc', vars={'sp': R(100, 500, 50), 'lgd': C(40, 50, 60)}, compute={'l': 'sp/lgd'}, check=({'sp': 300, 'lgd': 60}, {'l': 5})))
qs.append(Q('c39-e07', 39, "Altman's Z-score", '''
A manufacturer's ratios: working capital/assets {a}, retained earnings/assets {b}, EBIT/assets {c}, market value of equity/liabilities {d},
sales/assets {e}. What's its Z-score (Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E), and how do you interpret it?''', '''
Z = 1.2 × {a} + 1.4 × {b} + 3.3 × ({c}) + 0.6 × {d} + {e} = {z:2}. {?z<1.81|Below 1.81: Altman's distress zone — high risk of failure.|{?z<2.99|Between 1.81 and 2.99: the grey zone.|Above 2.99: the safe zone.}}''',
kind='calc', vars={'a': C(0.05, 0.1, 0.2), 'b': C(0.02, 0.1, 0.2), 'c': C(-0.03, 0.05, 0.1), 'd': C(0.4, 1, 2), 'e': C(0.9, 1.2, 1.5)}, compute={'z': '1.2*a+1.4*b+3.3*c+0.6*d+e'},
check=({'a': 0.05, 'b': 0.02, 'c': -0.03, 'd': 0.4, 'e': 0.9}, {'z': 1.129})))
qs.append(Q('c39-e08', 39, 'Debt overhang', '''
A firm's assets are worth {A} for certain and it owes 100 in a year. A project costing 20, funded by shareholders, returns 30 in a year
for certain. Will shareholders fund it? What debt reduction would make both shareholders and creditors better off?''', '''
With the project assets are {=A+30}; creditors take {=min(100,A+30)}, shareholders get {=max(0,A+30-100)} for an investment of 20 — {?A+30-100<20|so they won't invest (debt overhang)|so they invest anyway}.
Without it, creditors get {A}. Writing the debt down to any F between {A} and {=A+10} fixes it: e.g. F = {=A+5} — shareholders get {=A+30-(A+5)} > 20 for their 20 and
creditors get {=A+5} > {A}. Both gain.''',
kind='calc', diff=3, vars={'A': C(60, 65, 70)}, compute={}, check=({'A': 70}, {})))
qs.append(Q('c39-e09', 39, 'Bankruptcy waterfall', '''
A firm's enterprise value in reorganisation is {EV}. Claims: DIP 30, secured 150, senior unsecured 180, subordinated 60. What does
each class recover under absolute priority, and which is the fulcrum security?''', '''
DIP 30 and secured 150 are paid in full. {?EV<360|Senior unsecured get {=EV-180} of 180 ({=(EV-180)/180*100:0}%) and are the fulcrum; subordinated and equity get nothing.|Senior unsecured are paid in full; subordinated get {=EV-360} of 60 ({=(EV-360)/60*100:0}%) and are the fulcrum; equity gets nothing.}''',
kind='calc', vars={'EV': C(260, 300, 340, 380, 400)}, compute={}, check=({'EV': 300}, {}), diff=2))
qs.append(Q('c39-e10', 39, 'Correlated defaults in a loan book', '''
A lender has 20 loans, each with default probability 5%. What's the probability of four or more defaults if defaults are
independent? Compare with a world where the economy is good (probability 0.75, default probability 2%) or bad (0.25, 14%), with
defaults independent within each state.''', '''
Independent (binomial n = 20, p = 0.05): P(≥ 4) ≈ 1.6%. Two states: 0.75 × 0.06% + 0.25 × 30.4% ≈ 7.6% — nearly five times as likely,
though expected defaults are 1 in both. Correlation fattens the tail.''', kind='calc', diff=3))
# ---------------- Chapter 40 ----------------
qs.append(Q('c40-e01', 40, 'Debt service coverage ratio', '''
A project's cash flow available for debt service (CFADS) is {c} and debt service {d}. What's the DSCR? Lock-up is at 1.15 and default
at 1.05. What happens if CFADS falls by {f}%?''', '''
DSCR = {c}/{d} = {=c/d:2}. After a {f}% fall: {=c*(1-f/100)/d:2} → {?c*(1-f/100)/d<1.05|below the default level: an event of default.|{?c*(1-f/100)/d<1.15|below lock-up: distributions to equity stop and cash is trapped, but no default.|still above lock-up.}}''',
kind='calc', vars={'c': R(16, 22), 'd': R(13, 16), 'f': C(5, 10, 15)}, constraints=['c/d>1.15'], compute={}, check=({'c': 18, 'd': 15, 'f': 10}, {})))
qs.append(Q('c40-e02', 40, 'Debt sculpting', '''
CFADS over a three-year loan is forecast at {a}, {b} and {c}. The target DSCR is {t} and the interest rate {r}%. What's the sculpted debt
service each year and the maximum debt?''', '''
Debt service = CFADS/{t}: {=a/t:2}, {=b/t:2}, {=c/t:2}. Maximum debt = their PV at {r}% = {=a/t/(1+r/100)+b/t/(1+r/100)^2+c/t/(1+r/100)^3:1}.''',
kind='calc', vars={'a': R(30, 50, 2), 'b': R(32, 52, 2), 'c': R(34, 54, 2), 't': C(1.25, 1.3, 1.35), 'r': R(4, 7)}, compute={'m': 'a/t/(1+r/100)+b/t/(1+r/100)^2+c/t/(1+r/100)^3'},
check=({'a': 40, 'b': 42, 'c': 44, 't': 1.3, 'r': 5}, {'m': 87.8}), tol=0.002))
qs.append(Q('c40-e03', 40, 'Loan life coverage ratio', '''
A project has {D} of debt outstanding and CFADS of {c} a year for the remaining {n} years of the loan, at {r}% interest. What's the LLCR?''', '''
PV of CFADS = {c} × {=pv(r/100,n,1):3} = {=pv(r/100,n,c):2}; LLCR = {=pv(r/100,n,c)/D:2}. {?pv(r/100,n,c)/D<1.1|Thin: the project can only just repay its debt if CFADS holds — any shortfall needs a longer tenor or restructuring.|Comfortable cover.}''',
kind='calc', vars={'D': R(80, 150, 10), 'c': R(25, 40), 'n': R(4, 6), 'r': R(4, 8)}, compute={'l': 'pv(r/100,n,c)/D'}, check=({'D': 100, 'c': 30, 'n': 4, 'r': 6}, {'l': 1.04}), tol=0.002))
qs.append(Q('c40-e04', 40, 'Cap rates and leverage in real estate', '''
An office building has NOI of {N} million and is valued at a {c}% cap rate. It carries a {L} million loan. What's the value, LTV and
equity? If the cap rate rises to {c2}%, what are they then?''', '''
Value {N}/{=c/100:3} = {=N/(c/100):1}; LTV {=L/(N/(c/100))*100:0}%; equity {=N/(c/100)-L:1}. At {c2}%: value {=N/(c2/100):1}, LTV {=L/(N/(c2/100))*100:0}%, equity {=N/(c2/100)-L:1} — a {=(1-(N/(c2/100)-L)/(N/(c/100)-L))*100:0}% equity
fall for a {=(1-c/c2)*100:0}% fall in value.''',
kind='calc', vars={'N': R(3, 8, 0.2), 'c': C(5, 5.5, 6), 'c2': C(6.5, 7, 7.5), 'lv': C(0.6, 0.65, 0.7)}, compute={'L': 'round(N/(c/100)*lv)'},
constraints=['N/(c2/100)>round(N/(c/100)*lv)'], check=({'N': 5.4, 'c': 6, 'c2': 7, 'lv': 0.6667}, {'L': 60})))
qs.append(Q('c40-e05', 40, 'Debt yield vs LTV', '''
A lender requires a debt yield of at least {dy}% and an LTV of at most {lt}%. For a building with NOI {N} million valued at {V} million, what's
the maximum loan, and which constraint binds?''', '''
Debt yield: {N}/{=dy/100:2} = {=N/(dy/100):1}; LTV: {=lt/100:2} × {V} = {=lt/100*V:1}. Maximum loan {=min(N/(dy/100),lt/100*V):1} — the {?N/(dy/100)<lt/100*V|debt-yield|LTV} test binds.''',
kind='calc', vars={'N': R(4, 8, 0.2), 'cap': C(5, 6, 7), 'dy': C(9, 10, 11), 'lt': C(60, 65, 70)}, compute={'V': 'N/(cap/100)'}, constraints=['abs(N/(dy/100)-lt/100*N/(cap/100))>0.5'],
check=({'N': 5.4, 'cap': 6, 'dy': 10, 'lt': 65}, {'V': 90})))
qs.append(Q('c40-e06', 40, 'Cap rates and growth', '''
Investors require {r}% on a property whose NOI should grow at {g}% a year. What's the cap rate? If the required return rises by one
percentage point, by how much does the value fall?''', '''
Cap rate ≈ r − g = {=r-g:2}%. At {=r+1}%: {=r+1-g:2}%; value falls by 1 − {=r-g:2}/{=r+1-g:2} = {=(1-(r-g)/(r+1-g))*100:1}%.''',
kind='calc', vars={'r': R(6, 10, 0.5), 'g': R(1.5, 3.5, 0.5)}, compute={'f': '(1-(r-g)/(r+1-g))*100'}, check=({'r': 8, 'g': 2.5}, {'f': 15.38})))
qs.append(Q('c40-e07', 40, 'Hotel RevPAR', '''
A {n}-room hotel has occupancy of {o}% and an average daily rate of {adr}. What's RevPAR and annual room revenue? We could cut the
rate 10%, which should raise occupancy to {o2}%, or keep it. Which gives more room revenue, and what else would you need to know?''', '''
RevPAR = {adr} × {=o/100:2} = {=adr*o/100:2}; room revenue {n} × {=adr*o/100:2} × 365 = {=n*adr*o/100*365:0}. With the cut: {=0.9*adr:1} × {=o2/100:2} = {=0.9*adr*o2/100:2}
({?0.9*adr*o2/100>adr*o/100|higher|lower}). Also consider variable costs per occupied room (cleaning, commissions), ancillary spending, and damage to pricing power.''',
kind='calc', vars={'n': R(80, 250, 10), 'o': R(60, 80, 2), 'adr': R(120, 250, 10), 'do': R(4, 12, 2)}, compute={'o2': 'o+do'}, check=({'n': 150, 'o': 70, 'adr': 180, 'do': 8}, {'o2': 78})))
qs.append(Q('c40-e08', 40, 'Levelised cost of electricity', '''
A wind farm costs {K} million, has operating costs of {oc} million a year and produces {Q} GWh a year for 20 years. What's its LCOE
at {r}%?''', '''
Annuity factor {=pv(r/100,20,1):3}. PV of costs = {K} + {oc} × {=pv(r/100,20,1):3} = {=K+oc*pv(r/100,20,1):1} million; PV of output = {Q} × {=pv(r/100,20,1):3} = {=Q*pv(r/100,20,1):0} GWh.
LCOE = {lc:1} per MWh.''',
kind='calc', vars={'K': R(100, 200, 10), 'oc': R(2, 6), 'Q': R(200, 400, 20), 'r': C(5, 6, 7, 8)}, compute={'lc': '(K+oc*pv(r/100,20,1))/(Q*pv(r/100,20,1))*1000'},
check=({'K': 150, 'oc': 4, 'Q': 300, 'r': 6}, {'lc': 56.9}), tol=0.002))
qs.append(Q('c40-e09', 40, 'P90 debt sizing', '''
A solar project's annual output is normal with mean {m} GWh and s.d. {s} GWh. Power sells at {p} per MWh under contract; operating
costs are {oc} million a year. What's the P90 output? What maximum annual debt service can lenders accept on a P90 basis with a DSCR
of 1.3, and how does that compare with P50 sizing?''', '''
P90 = {m} − 1.2816 × {s} = {p90:1} GWh; revenue {=p90*p/1000:2} million; CFADS {=p90*p/1000-oc:2}; max debt service {=(p90*p/1000-oc)/1.3:2} million. At P50: CFADS {=m*p/1000-oc:2},
debt service {=(m*p/1000-oc)/1.3:2} — P90 sizing cuts debt capacity by {=(1-(p90*p/1000-oc)/(m*p/1000-oc))*100:0}%.''',
kind='calc', diff=2, vars={'m': R(150, 300, 10), 's': R(10, 25), 'p': R(40, 70, 5), 'oc': R(1, 3)}, compute={'p90': 'm-1.2816*s'}, check=({'m': 200, 's': 15, 'p': 50, 'oc': 2}, {'p90': 180.78})))
qs.append(Q('c40-e10', 40, 'Risk allocation in PPPs', '''
For a new toll road financed as a PPP, who should bear (a) construction cost overruns, (b) traffic volume risk, (c) changes in law
specific to the project, (d) interest-rate risk on the debt — and why?''', '''
(a) The construction contractor under a fixed-price contract — it controls construction. (b) Traffic is hard to forecast and
largely uncontrollable; often the government via availability payments, or shared through revenue bands. (c) The government,
which controls the law. (d) The SPV should hedge it with interest-rate swaps — markets absorb it cheaply.''', diff=2))
# ---------------- Chapter 41 ----------------
qs.append(Q('c41-e01', 41, 'Forward prices and cash-and-carry arbitrage', '''
A commodity trades at {S}; the one-year interest rate is {r}%; storage costs {c} per unit, paid at year end. What's the one-year
forward price? If the market forward is {Fm}, what's the arbitrage and its profit?''', '''
F = {S} × {=1+r/100:2} + {c} = {F:2}. At {Fm}: {?Fm>F|borrow {S}, buy the commodity, sell forward at {Fm}; at year end deliver, receive {Fm}, repay {=S*(1+r/100):2} and pay storage {c}: profit {=Fm-F:2} per unit.|sell the commodity short (if possible), invest {S}, buy forward at {Fm}: profit {=F-Fm:2} per unit (reverse cash-and-carry).}''',
kind='calc', vars={'S': R(40, 80, 5), 'r': R(2, 6), 'c': R(0.5, 2, 0.5), 'd': C(-2, 2, 3)}, compute={'F': 'S*(1+r/100)+c', 'Fm': 'S*(1+r/100)+c+d'},
check=({'S': 50, 'r': 4, 'c': 1, 'd': 2}, {'F': 53, 'Fm': 55})))
qs.append(Q('c41-e02', 41, 'Index futures pricing', '''
A share index stands at {S}. The continuously compounded interest rate is {r}% and the dividend yield {q}%. What's the six-month
futures price? Is the market in contango or backwardation?''', '''
F = {S} × e^(({=r/100:3} − {=q/100:3}) × 0.5) = {F:1}. {?r>q|F > spot: contango, because the interest rate exceeds the dividend yield.|F < spot: backwardation, because the dividend yield exceeds the interest rate.}''',
kind='calc', vars={'S': R(3000, 6000, 250), 'r': R(1, 6, 0.5), 'q': R(1, 4, 0.5)}, constraints=['r!=q'], compute={'F': 'S*exp((r-q)/100*0.5)'}, check=({'S': 4000, 'r': 5, 'q': 1.5}, {'F': 4070.6})))
qs.append(Q('c41-e03', 41, 'Futures margin calls', '''
A trader buys {n} gold futures, each for 100 ounces, at {p}. Initial margin is 10,000 per contract and maintenance margin 7,500. The
price falls to {p2}. What's the loss, the margin balance per contract, and any margin call?''', '''
Loss = {=p-p2} × 100 × {n} = {=(p-p2)*100*n}, {=(p-p2)*100} per contract; balance {=10000-(p-p2)*100}. {?10000-(p-p2)*100<7500|Below maintenance: a call of {=(p-p2)*100} per contract ({=(p-p2)*100*n} total) to restore 10,000.|Still above maintenance: no call.}''',
kind='calc', vars={'n': R(5, 20), 'p': R(1900, 2500, 50), 'd': R(10, 40, 5)}, compute={'p2': 'p-d'}, check=({'n': 10, 'p': 2000, 'd': 30}, {'p2': 1970})))
qs.append(Q('c41-e04', 41, 'Minimum-variance hedge ratio', '''
We have a {V} million exposure to an asset whose price changes have s.d. {sa}%; available futures have s.d. {sf}% and correlation {rho}
with the asset. What's the minimum-variance hedge ratio, the futures position, and the share of variance removed?''', '''
h* = ρσ_S/σ_F = {rho} × {sa}/{sf} = {h:3}; sell futures worth {=h*V:2} million. Variance removed = ρ² = {=rho^2*100:0}%, leaving s.d. {=sqrt(1-rho^2)*100:0}% of the unhedged one.''',
kind='calc', vars={'V': R(5, 20), 'sa': R(15, 25), 'sf': R(20, 30), 'rho': C(0.7, 0.8, 0.9)}, compute={'h': 'rho*sa/sf'}, check=({'V': 10, 'sa': 20, 'sf': 25, 'rho': 0.8}, {'h': 0.64})))
qs.append(Q('c41-e05', 41, 'Interest-rate swap rate', '''
Discount factors for one, two and three years are {d1}, {d2} and {d3}. What's the three-year swap rate? A company with a three-year
floating-rate loan at floating + {m}% pays fixed in the swap — what rate does it effectively pay?''', '''
c = (1 − {d3})/({d1} + {d2} + {d3}) = {c:3}%. The company pays floating + {m} on the loan, receives floating and pays {c:3} in the swap: an
effective fixed {=c+m:3}%.''',
kind='calc', vars={'d1': C(0.97, 0.975, 0.98), 'd2': C(0.93, 0.935, 0.94), 'd3': C(0.89, 0.9, 0.905), 'm': C(1, 1.5, 2)}, compute={'c': '(1-d3)/(d1+d2+d3)*100'},
check=({'d1': 0.97, 'd2': 0.935, 'd3': 0.9, 'm': 1.5}, {'c': 3.565}), tol=0.001))
qs.append(Q('c41-e06', 41, 'Put–call parity arbitrage', '''
A share is at {S}; a one-year European call with strike {K} costs {C}; the one-year interest rate is {r}%. What put price does parity
imply? If the put trades at {Pm}, how would you arbitrage it?''', '''
P = C − S + K/(1 + r) = {C} − {S} + {=K/(1+r/100):2} = {P:2}. {?Pm>P|The put is overpriced: sell the put, buy the call, short the share and lend {=K/(1+r/100):2}. You pocket {=Pm-P:2} now and the position nets to zero at expiry.|The put is underpriced: buy the put, sell the call, buy the share and borrow {=K/(1+r/100):2}. You pocket {=P-Pm:2} now, riskless.}''',
kind='calc', diff=2, vars={'S': R(40, 60, 5), 'K': R(40, 60, 5), 'C': R(3, 8, 0.5), 'r': R(3, 6), 'd': C(-1, 0.8, 1.5)}, compute={'P': 'C-S+K/(1+r/100)', 'Pm': 'C-S+K/(1+r/100)+d'},
constraints=['C-S+K/(1+r/100)>0.5', 'C>S-K/(1+r/100)'], check=({'S': 50, 'K': 50, 'C': 6, 'r': 5, 'd': 0.8810}, {'P': 3.62}), tol=0.002))
qs.append(Q('c41-e07', 41, 'Binomial option pricing', '''
A share at {S} will be worth {u} or {d} in a year; the interest rate is {r}%. What's the value of a one-year put with strike {K} by
risk-neutral valuation, and what's the replicating portfolio?''', '''
q = ({=1+r/100:2} − {=d/S:3})/({=u/S:3} − {=d/S:3}) = {q:3}. Put payoffs {=max(K-u,0)} and {=max(K-d,0)}: P = ({q:3} × {=max(K-u,0)} + {=1-q:3} × {=max(K-d,0)})/{=1+r/100:2} = {P:2}.
Replication: Δ = ({=max(K-u,0)} − {=max(K-d,0)})/({u} − {d}) = {D:3} shares plus lending {=P-D*S:2}; cost = {P:2}.''',
kind='calc', diff=3, vars={'S': C(80, 100), 'up': C(1.2, 1.25), 'dn': C(0.8, 0.85), 'r': R(2, 5), 'K': C(80, 90, 100)}, compute={'u': 'S*up', 'd': 'S*dn', 'q': '((1+r/100)-dn)/(up-dn)', 'P': '(((1+r/100)-dn)/(up-dn)*max(K-S*up,0)+(1-((1+r/100)-dn)/(up-dn))*max(K-S*dn,0))/(1+r/100)', 'D': '(max(K-S*up,0)-max(K-S*dn,0))/(S*up-S*dn)'},
constraints=['K>S*dn'], check=({'S': 80, 'up': 1.25, 'dn': 0.8, 'r': 4, 'K': 80}, {'q': 0.5333, 'P': 7.18}), tol=0.002))
qs.append(Q('c41-e08', 41, 'Black–Scholes', '''
Value a six-month European call and put on a share at {S} with strike {K}, r = {r}% (continuous) and σ = {s}%.''', '''
d₁ = [ln({S}/{K}) + ({=r/100:2} + {=(s/100)^2/2:3}) × 0.5]/({=s/100:2}√0.5) = {d1:3}; d₂ = {=d1-s/100*sqrt(0.5):3}. C = {S}Φ(d₁) − {K}e^(−{=r/200:3})Φ(d₂) = {c:2}.
Put by parity: P = C − S + Ke^(−rT) = {=c-S+K*exp(-r/200):2}.''',
kind='calc', diff=3, vars={'S': R(40, 60, 5), 'K': R(40, 60, 5), 'r': R(2, 6), 's': C(20, 25, 30, 40)}, constraints=['abs(S-K)<=10'], compute={'d1': '(ln(S/K)+(r/100+(s/100)^2/2)*0.5)/(s/100*sqrt(0.5))', 'c': 'S*ncdf((ln(S/K)+(r/100+(s/100)^2/2)*0.5)/(s/100*sqrt(0.5)))-K*exp(-r/200)*ncdf((ln(S/K)+(r/100+(s/100)^2/2)*0.5)/(s/100*sqrt(0.5))-s/100*sqrt(0.5))'},
check=({'S': 50, 'K': 55, 'r': 4, 's': 30}, {'d1': -0.249, 'c': 2.71}), tol=0.005))
qs.append(Q('c41-e09', 41, 'Delta hedging', '''
A dealer sells {n} call contracts, each on 100 shares, with delta {d1}. How many shares must it hold to be delta-neutral? Next day the
price rises and delta becomes {d2}. What must it do? Why does frequent rehedging cost money when the share is volatile?''', '''
Hold {n} × 100 × {d1} = {=n*100*d1} shares. At delta {d2}: buy {=n*100*(d2-d1)} more. The dealer buys after rises and sells after falls — buy high, sell low —
so volatility generates rehedging losses (it's short gamma); that's what the option premium pays for.''',
kind='calc', vars={'n': R(50, 200, 50), 'd1': C(0.4, 0.5, 0.6), 'dd': C(0.05, 0.1)}, compute={'d2': 'd1+dd'}, check=({'n': 100, 'd1': 0.6, 'dd': 0.05}, {'d2': 0.65})))
qs.append(Q('c41-e10', 41, 'Cash-flow hedge accounting', '''
In year 1 our airline buys fuel futures to hedge fuel we'll buy in year 2. Fuel prices rise: the futures gain {g} million in year 1, and
the fuel costs {g} million more than budgeted in year 2. What are the reported profit effects each year with and without cash-flow
hedge accounting?''', '''
Without: year 1 +{g} million (futures gain), year 2 −{g} million (fuel). With cash-flow hedge accounting: the gain sits in OCI in year 1
and is released in year 2 against the higher fuel cost — zero effect on profit in both years, matching the economics of the hedge.''',
kind='calc', vars={'g': R(1, 10)}, compute={}, check=({'g': 3}, {})))
# ---------------- Chapter 42 ----------------
qs.append(Q('c42-e01', 42, 'Triangular FX arbitrage', '''
EUR/USD is {a} and USD/JPY is {b}. A bank quotes EUR/JPY at {q}. Starting with 1 million euros, what's the arbitrage and the profit?''', '''
Implied EUR/JPY = {a} × {b} = {=a*b:2}. {?q>a*b|The quote is too high (euros dear in yen): sell 1 million EUR for {q} million JPY, buy {=q/b:5} million USD, buy {=q/b/a:5} million EUR — profit ≈ {=(q/(a*b)-1)*1000000:0} euros.|The quote is too low: buy yen route the other way — sell EUR for USD, USD for JPY ({=a*b:2} million), buy back EUR at {q}: {=a*b/q:5} million EUR — profit ≈ {=(a*b/q-1)*1000000:0} euros.}''',
kind='calc', vars={'a': C(1.05, 1.08, 1.1, 1.12), 'b': R(140, 160, 5), 'dq': C(-2, -1.5, 1.5, 2)}, compute={'q': 'round(a*b+dq)'}, constraints=['abs(round(a*b+dq)-a*b)>0.5'],
check=({'a': 1.1, 'b': 150, 'dq': 2}, {'q': 167})))
qs.append(Q('c42-e02', 42, 'Covered interest parity', '''
GBP/USD spot is {S} dollars per pound. One-year rates are {i}% in dollars and {j}% in pounds. What's the one-year forward rate and the
forward points? Which currency trades at a forward premium?''', '''
F = {S} × {=1+i/100:3}/{=1+j/100:3} = {F:4} dollars per pound; forward points ≈ {=(F-S)*10000:0}. The currency with the lower interest rate trades at a forward premium:
{?i<j|the dollar (the pound is at a discount)|the pound}.''',
kind='calc', vars={'S': R(1.2, 1.35, 0.01), 'i': R(3, 6, 0.5), 'j': R(3, 6, 0.5)}, constraints=['i!=j'], compute={'F': 'S*(1+i/100)/(1+j/100)'}, check=({'S': 1.25, 'i': 4.5, 'j': 5}, {'F': 1.2440}), tol=0.0005))
qs.append(Q('c42-e03', 42, 'Forward vs money-market hedge', '''
Our US company will receive {A} million pounds in a year. GBP/USD spot is {S}; one-year rates are {i}% in dollars and {j}% in pounds.
What are our dollar receipts with a forward hedge and with a money-market hedge?''', '''
Forward: F = {S} × {=1+i/100:3}/{=1+j/100:3} = {=S*(1+i/100)/(1+j/100):4} → {=A*S*(1+i/100)/(1+j/100):3} million dollars. Money market: borrow {A}/{=1+j/100:3} = {=A/(1+j/100):3} million pounds, convert at {S} to
{=A/(1+j/100)*S:3} million dollars, invest at {i}% → {=A/(1+j/100)*S*(1+i/100):3} million. Identical, by covered interest parity.''',
kind='calc', vars={'A': R(2, 10), 'S': R(1.2, 1.35, 0.01), 'i': R(3, 6, 0.5), 'j': R(3, 6, 0.5)}, compute={'x': 'A*S*(1+i/100)/(1+j/100)'},
check=({'A': 5, 'S': 1.25, 'i': 4.5, 'j': 5}, {'x': 6.220}), tol=0.001))
qs.append(Q('c42-e04', 42, 'Option vs forward hedge', '''
Our US importer must pay 2 million euros in three months. The three-month forward rate is 1.103 dollars per euro. A call on euros
with strike 1.10 costs 0.03 dollars per euro. Compare the dollar cost unhedged, with the forward and with the option, if spot in three
months is 1.00, 1.10 or 1.20.''', '''
Premium 60,000. At 1.00: unhedged 2.00m; forward 2.206m; option 2.06m (let it lapse). At 1.10: 2.20m; 2.206m; 2.26m. At 1.20: 2.40m;
2.206m; 2.26m (exercise). The option caps the cost at 2.26m while keeping the upside if the euro falls.''', kind='calc', diff=2))
qs.append(Q('c42-e05', 42, 'Translation exposure', '''
Our UK group's euro-area subsidiary has net assets of {N} million euros. The rate moved from {r0} to {r1} pounds per euro this year.
What's the translation difference and where is it reported? Does it affect cash?''', '''
Net assets in pounds move from {=N*r0:2} to {=N*r1:2}: a translation {?r1<r0|loss|gain} of {=abs(N*(r1-r0)):2} million pounds, reported in OCI (translation reserve),
recycled to profit only if the subsidiary is sold. No cash moves.''',
kind='calc', vars={'N': R(20, 100, 10), 'r0': C(0.84, 0.85, 0.86, 0.88), 'dr': C(-0.05, -0.03, 0.02, 0.04)}, compute={'r1': 'r0+dr'}, check=({'N': 50, 'r0': 0.85, 'dr': -0.05}, {'r1': 0.8})))
qs.append(Q('c42-e06', 42, 'Multilateral netting', '''
Inside our group: A owes B 10 million, B owes C 7 million, C owes A 4 million and B owes A 3 million (dollar equivalents). What's
each subsidiary's net position and the payments needed after multilateral netting?''', '''
A: receives 7, pays 10 → −3. B: receives 10, pays 10 → 0. C: receives 7, pays 4 → +3. One payment of 3 million from A to C replaces four
payments totalling 24 million.''', kind='calc'))
qs.append(Q('c42-e07', 42, 'International capital budgeting', '''
Our UK company is considering a US project costing 30 million dollars and returning 12 million dollars a year for three years. The
dollar discount rate is 9%; GBP/USD spot is 1.25; one-year rates are 4.5% in dollars and 5% in pounds. What's the NPV in pounds by both methods?''', '''
Foreign method: dollar NPV = −30 + 12 × 2.531 = 0.376 million → 0.30 million pounds at 1.25. Home method: convert each flow at forwards
1.25 × (1.045/1.05)^t and discount at the sterling rate 1.09 × 1.05/1.045 − 1 = 9.52% → again 0.30 million pounds.''', kind='calc', diff=3))
qs.append(Q('c42-e08', 42, 'Murabaha financing', '''
An Islamic bank buys equipment for {C} and sells it to a customer for {P}, payable in two equal annual instalments. What's the implied
rate of return, and what's the economic substance?''', '''
{C} = {=P/2}/(1 + r) + {=P/2}/(1 + r)² → r = {=100*irr(-C, P/2, P/2):1}%. In substance a two-year amortising loan at that rate secured on the equipment; in form, a sale
at a markup in which the bank briefly owns the asset.''',
kind='calc', vars={'C': R(100000, 400000, 50000), 'm': C(0.1, 0.15, 0.2)}, compute={'P': 'C*(1+m)', 'r': '100*irr(-C, C*(1+m)/2, C*(1+m)/2)'},
check=({'C': 200000, 'm': 0.15}, {'P': 230000, 'r': 9.8}), tol=0.005))
qs.append(Q('c42-e09', 42, 'Sukuk', '''
A special-purpose company buys buildings from a government for 500 million, leases them back at 22.5 million a year for five years,
and will sell them back for 500 million at the end. What are investors' cash flows and yield? When would their position differ from
holders of a 4.5% government bond?''', '''
Investors pay 500, receive 22.5 a year and 500 at the end: a 4.5% yield, the same cash flows as the bond. Differences arise if the
structure is tested: asset-backed sukuk might give recourse to the buildings on default (asset-based sukuk, the usual case, rely on
the government's undertaking like a bond); if Shariah compliance or enforceability is challenged; and in tax/accounting treatment.''', diff=2))
qs.append(Q('c42-e10', 42, 'Economic exposure to exchange rates', '''
An Italian furniture maker sells only in the euro area but competes with imports priced in dollars. Regressing its monthly share
returns on the monthly % change in the dollar price of a euro gives a slope of −0.8. What does that mean, and how could it reduce the
exposure?''', '''
A 1% euro appreciation is associated with a 0.8% share-price fall: a stronger euro makes dollar-priced imports cheaper, squeezing sales
and margins. Reduce it by sourcing materials/production in dollars, differentiating products away from import competition, or partly
hedging expected cash flows with forwards (only for a limited horizon).''', diff=2))
write(9, 'Vice President', 'rank09_vice_president.json', qs)
