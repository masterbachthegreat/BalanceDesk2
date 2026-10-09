from qlib import *
qs = []
# ---------------- Chapter 9 ----------------
qs.append(Q('c09-x02', 9, 'Annuities and perpetuities', '''
At an interest rate of {i}%, what's the value today of: (a) {A} a year for {n} years, paid at the end of each year;
(b) the same but paid at the start of each year; (c) {A} a year forever; (d) a perpetuity starting at {A} and
growing at {g}% a year?''', '''
(a) {A} × (1 − {=1+i/100:2}^−{n})/{=i/100:2} = {pv:2}. (b) Annuity due = {pv:2} × {=1+i/100:2} = {=pv*(1+i/100):2}.
(c) {A}/{=i/100:2} = {=A/(i/100):2}. (d) {A}/({=i/100:2} − {=g/100:2}) = {=A/((i-g)/100):2}. Note how much of the perpetuity's value
lies beyond year {n}: {=A/(i/100)-pv:2}.''',
kind='calc', vars={'i': R(3, 9), 'A': R(100, 1000, 100), 'n': C(5, 10, 15, 20), 'g': R(1, 2)}, compute={'pv': 'pv(i/100, n, A)'},
check=({'i': 5, 'A': 100, 'n': 10, 'g': 2}, {'pv': 772.17})))
qs.append(Q('c09-e01', 9, 'Lump sum vs annuity', '''
I won the lottery! I can take ${L} now or ${A} at the end of each year for {n} years. Which is worth more if the
interest rate is {r1}%? And at {r2}%?''', '''
PV of the annuity = {A} × (1 − (1 + r)^−{n})/r. At {r1}%: {p1:0} → {?p1>L|take the annuity|take the lump sum}.
At {r2}%: {p2:0} → {?p2>L|take the annuity|take the lump sum}. The ranking depends on the rate because the annuity's
payments stretch far into the future.''',
kind='calc', vars={'L': R(800000, 1200000, 50000), 'A': R(40000, 80000, 5000), 'n': C(20, 25, 30), 'r1': C(4, 5, 6), 'r2': C(2, 3)},
compute={'p1': 'pv(r1/100, n, A)', 'p2': 'pv(r2/100, n, A)'}, check=({'L': 1000000, 'A': 60000, 'n': 25, 'r1': 4, 'r2': 3}, {'p1': 937325, 'p2': 1044789}), tol=0.0005))
qs.append(Q('c09-e02', 9, 'Annuity timing', '''
Our office lease requires payments of ${A} a year for {n} years. What's its present value at {r}% if the payments are
made (a) at the end of each year, (b) at the start of each year?''', '''
(a) {A} × (1 − {=1+r/100:2}^−{n})/{=r/100:2} = {pv:2}. (b) Paying a year earlier multiplies by {=1+r/100:2}: {=pv*(1+r/100):2}.''',
kind='calc', vars={'A': R(6000, 30000, 1000), 'n': R(3, 10), 'r': R(4, 10)}, compute={'pv': 'pv(r/100, n, A)'},
check=({'A': 12000, 'n': 5, 'r': 7}, {'pv': 49202.37})))
qs.append(Q('c09-e03', 9, 'Deferred annuity', '''
My pension will pay ${A} a year at the end of each year from year {s} to year {e}. What's it worth today at {r}%?''', '''
Value at the end of year {=s-1}: {A} × (1 − {=1+r/100:2}^−{=e-s+1})/{=r/100:2} = {v:2}. Discount back {=s-1} years:
{v:2}/{=1+r/100:2}^{=s-1} = {=v/(1+r/100)^(s-1):2}.''',
kind='calc', diff=2, vars={'A': R(10000, 40000, 2000), 's': C(11, 16, 21, 26), 'len': C(15, 20, 25), 'r': R(3, 7)},
compute={'e': 's+len-1', 'v': 'pv(r/100, len, A)'}, check=({'A': 20000, 's': 21, 'len': 20, 'r': 5}, {'e': 40, 'v': 249244.21})))
qs.append(Q('c09-e04', 9, 'Loan amortisation schedule', '''
I'm taking a car loan of ${L} at {r}% a year, repaid in {n} equal annual payments. What's the payment? Can you walk
me through how much of the first payment is interest and how much repays principal, and what I'll still owe after it?''', '''
Payment = r·L/(1 − (1 + r)^−n) = {=r/100:2} × {L}/(1 − {=1+r/100:2}^−{n}) = {A:2}. Year 1: interest = {=r/100:2} × {L} = {=L*r/100:2};
principal = {A:2} − {=L*r/100:2} = {=A-L*r/100:2}; balance = {=L-(A-L*r/100):2}. Each year interest is charged on the opening
balance, so the interest part shrinks and the principal part grows until the balance reaches zero.''',
kind='calc', vars={'L': R(10000, 40000, 1000), 'r': R(4, 12), 'n': R(3, 6)}, compute={'A': 'pmt(r/100, n, L)'},
check=({'L': 24000, 'r': 9, 'n': 4}, {'A': 7408.05})))
qs.append(Q('c09-x03', 9, 'Amortisation schedule (full)', '''
A loan of {L} at {r}% is repaid in three equal annual payments. What's the payment, and can you give me the full
schedule (opening balance, interest, principal, closing balance each year)?''', '''
A = {=r/100:2} × {L}/(1 − {=1+r/100:2}^−3) = {A:2}. Year 1: interest {i1:2}, principal {=A-i1:2}, closing {b1:2}.
Year 2: interest {i2:2}, principal {=A-i2:2}, closing {b2:2}. Year 3: interest {=b2*r/100:2}, principal {b2:2}, closing 0.''',
kind='calc', vars={'L': R(5000, 30000, 1000), 'r': R(4, 10)},
compute={'A': 'pmt(r/100, 3, L)', 'i1': 'L*r/100', 'b1': 'L-(pmt(r/100,3,L)-L*r/100)', 'i2': '(L-(pmt(r/100,3,L)-L*r/100))*r/100', 'b2': '(L-(pmt(r/100,3,L)-L*r/100))*(1+r/100)-pmt(r/100,3,L)'},
check=({'L': 10000, 'r': 6}, {'A': 3741.10, 'b1': 6858.90, 'b2': 3529.34})))
qs.append(Q('c09-e05', 9, 'Mortgage payments and effective rate', '''
I'm taking a ${L} mortgage repaid monthly over {y} years. The quoted rate is {r}% a year, compounded monthly. What's
my monthly payment, and what's the effective annual rate?''', '''
Monthly rate = {r}/12 = {=r/1200:5}, n = {=y*12}. Payment = {=r/1200:5} × {L}/(1 − (1 + {=r/1200:5})^−{=y*12}) = {A:2}.
Effective annual rate = (1 + {=r/1200:5})¹² − 1 = {=((1+r/1200)^12-1)*100:2}%.''',
kind='calc', vars={'L': R(150000, 600000, 25000), 'y': C(15, 20, 25, 30), 'r': R(3, 8, 0.25)}, compute={'A': 'pmt(r/1200, y*12, L)'},
check=({'L': 300000, 'y': 30, 'r': 6}, {'A': 1798.65})))
qs.append(Q('c09-e06', 9, 'NPV and IRR', '''
A project costs ${C} and returns ${A} at the end of each of {n} years. What's its NPV at {r1}% and at {r2}%? Roughly
where does its IRR lie?''', '''
NPV = −{C} + {A} × annuity factor. At {r1}%: {n1:2}. At {r2}%: {n2:2}. The IRR (where NPV = 0) is about {irr:2}%
{?n1>0 && n2>0|— above both rates, so the project is worth doing at either|{?n1<0 && n2<0|— below both rates|— between the two rates}}.''',
kind='calc', diff=2, vars={'C': R(4000, 10000, 500), 'A': R(1000, 3000, 100), 'n': R(3, 6), 'r1': C(6, 8), 'r2': C(10, 12)},
compute={'n1': '-C+pv(r1/100,n,A)', 'n2': '-C+pv(r2/100,n,A)', 'irr': '100*irr(-C, n>=1?A:0, n>=2?A:0, n>=3?A:0, n>=4?A:0, n>=5?A:0, n>=6?A:0)'},
constraints=['A*n>C*1.05'], check=({'C': 5000, 'A': 1500, 'n': 4, 'r1': 8, 'r2': 10}, {'n1': -31.81, 'n2': -245.20, 'irr': 7.71}), tol=0.01))
qs.append(Q('c09-x05', 9, 'NPV vs IRR rule', '''
A machine costs {C} and yields {A} at the end of each of the next three years. Our cost of funds is {r}%. What's the
NPV, roughly what's the IRR, and should we buy it?''', '''
NPV = −{C} + {A} × (1 − {=1+r/100:2}^−3)/{=r/100:2} = {npv:2}. The IRR solves {A}(1 − (1 + i)^−3)/i = {C}: i ≈ {irr:2}%.
{?npv>0|NPV is positive and the IRR exceeds the {r}% cost of funds, so buy it — the rules agree here.|NPV is negative and the IRR is below {r}%, so don't buy it.}
(For mutually exclusive projects of different scale/timing the rules can disagree; NPV is the reliable one.)''',
kind='calc', vars={'C': R(800, 2000, 100), 'A': R(300, 900, 50), 'r': R(5, 12)}, compute={'npv': '-C+pv(r/100,3,A)', 'irr': '100*irr(-C,A,A,A)'},
constraints=['abs(-C+pv(r/100,3,A))>5', '3*A>C'], check=({'C': 1000, 'A': 400, 'r': 8}, {'npv': 30.84, 'irr': 9.70}), tol=0.01))
qs.append(Q('c09-e07', 9, 'Bond pricing', '''
A {n}-year bond with face value 1,000 pays a {c}% annual coupon. What's its price if the market yield is {y}%? Can you
explain without calculating why it's {?c<y|below|above} 1,000?''', '''
P = Σ coupons/(1 + y)^t + 1,000/(1 + y)^{n} = {P:2}. The coupon rate ({c}%) is {?c<y|below|above} the market yield ({y}%),
so investors pay {?c<y|less|more} than face value: the {?c<y|gain from buying below face value compensates for the low coupon|premium paid is offset by the above-market coupons}.''',
kind='calc', vars={'n': R(2, 5), 'c': R(2, 10), 'y': R(2, 10)}, constraints=['c!=y'], compute={'P': 'pv(y/100, n, 10*c, 1000)'},
check=({'n': 2, 'c': 8, 'y': 10}, {'P': 965.29})))
qs.append(Q('c09-x06', 9, 'Bond prices and yields move inversely', '''
A three-year bond with face value 1,000 pays an annual coupon of 50. What's its price if the market yield is 6%? What
if the yield falls to 4%? And at 5%?''', '''
At 6%: 50/1.06 + 50/1.06² + 1,050/1.06³ = 47.17 + 44.50 + 881.60 = 973.27. At 4%: 1,027.75. At 5% (= the coupon rate):
exactly 1,000. Bond prices and yields move in opposite directions.''', kind='calc'))
qs.append(Q('c09-e08', 9, 'Real vs nominal discounting', '''
A project produces {X} a year in today's prices for three years, and prices rise {pi}% a year. The nominal discount
rate is {nom:2}%. Can you value it (a) by discounting nominal cash flows at the nominal rate and (b) by discounting
real cash flows at the real rate? Why do the answers match?''', '''
Real rate = (1 + nominal)/(1 + inflation) − 1 = {=(1+nom/100)/(1+pi/100):4} − 1 = {rr:2}%. (a) Nominal flows
{=X*(1+pi/100):2}, {=X*(1+pi/100)^2:2}, {=X*(1+pi/100)^3:2} discounted at {nom:2}% → {v:2}. (b) {X} × (1 − {=1+rr/100:4}^−3)/{=rr/100:4} = {v:2}.
They agree because each nominal factor (1 + π)^t/(1 + i)^t equals the real factor 1/(1 + r)^t.''',
kind='calc', diff=2, vars={'X': R(500, 3000, 100), 'pi': R(2, 5), 'rr': R(3, 7)}, compute={'nom': '((1+rr/100)*(1+pi/100)-1)*100', 'v': 'pv(rr/100, 3, X)'},
check=({'X': 1000, 'pi': 3, 'rr': 5}, {'nom': 8.15, 'v': 2723.25})))
qs.append(Q('c09-e09', 9, 'Two-period consumption choice', '''
A household with u(c) = ln c and no impatience (β = 1) earns {y1} this period and {y2} next period, and the interest
rate is {r}%. How much will it consume in each period, and how much will it save (or borrow) now? What if it
couldn't borrow?''', '''
Wealth W = {y1} + {y2}/{=1+r/100:2} = {W:2}. With β = 1: c₁ = W/2 = {=W/2:2}, c₂ = {=1+r/100:2} × {=W/2:2} = {=W/2*(1+r/100):2}.
Saving = {y1} − {=W/2:2} = {=y1-W/2:2} {?y1<W/2|(it borrows and repays with interest next period)|(it saves)}.
{?y1<W/2|Without borrowing it would consume c₁ = {y1}, c₂ = {y2}: lower lifetime utility.|The borrowing constraint doesn't bind here.}''',
kind='calc', diff=2, vars={'y1': R(30, 80, 10), 'y2': R(110, 220, 11), 'r': C(5, 10)}, compute={'W': 'y1+y2/(1+r/100)'},
check=({'y1': 50, 'y2': 165, 'r': 10}, {'W': 200})))
qs.append(Q('c09-x07', 9, 'Consumption smoothing with impatience', '''
With log utility u(c) = ln c and discount factor β = 0.9, a household earns 100 now and 110 next period at r = 10%.
How much does it consume in each period? Does it borrow?''', '''
W = 100 + 110/1.1 = 200. Euler equation with log utility: c₂ = β(1 + r)c₁, so c₁ = W/(1 + β) = 200/1.9 = 105.26 and
c₂ = 0.9 × 1.1 × 105.26 = 104.21. Check: 105.26 + 104.21/1.1 = 200. It borrows 5.26 now, so consumption is nearly
equal across periods even though income isn't.''', kind='calc', diff=2))
qs.append(Q('c09-e10', 9, 'Growing annuity formula', '''
How do I show that the present value of n payments — the first, A, at the end of period 1, each growing at rate g,
discounted at i ≠ g — equals [A/(i − g)]·[1 − ((1 + g)/(1 + i))ⁿ]? And what happens as n → ∞?''', '''
The payments are A(1 + g)^(t−1), so PV = A/(1 + i) × Σ q^t (t = 0 … n−1) with q = (1 + g)/(1 + i). The geometric sum is
(1 − qⁿ)/(1 − q), and (1 + i)(1 − q) = i − g, giving the formula. If g < i, qⁿ → 0 and the value tends to the growing
perpetuity A/(i − g); if g ≥ i it grows without limit.''', diff=3))
# ---------------- Chapter 10 ----------------
qs.append(Q('c10-e01', 10, 'The accounting equation', '''
For each transaction, what happens to assets, liabilities and equity? (a) a firm buys inventory for 5,000 cash;
(b) it buys inventory for 5,000 on credit; (c) it pays a supplier 2,000; (d) it sells goods costing 3,000 for 4,500
on credit; (e) it pays a dividend of 1,000; (f) it repays 10,000 of a bank loan.''', '''
(a) Inventory +5,000, cash −5,000: total assets unchanged. (b) Inventory +5,000, accounts payable +5,000.
(c) Cash −2,000, payables −2,000. (d) Receivables +4,500, inventory −3,000: assets +1,500, retained earnings +1,500
(revenue 4,500 − COGS 3,000). (e) Cash −1,000, retained earnings −1,000 — a distribution to owners, not an expense.
(f) Cash −10,000, loan −10,000.'''))
qs.append(Q('c10-e02', 10, 'Preparing financial statements', '''
Our café, Harbour Coffee, had this balance sheet on 31 January: cash 45,000, receivables 3,000, inventory 2,000,
equipment 29,500; loan 20,000, payables 4,000, interest payable 100, share capital 50,000, retained earnings 5,400.
In February we: sold drinks for 20,000 cash using supplies that cost 7,000; bought supplies for 9,000 on credit;
collected the 3,000 the office owed us; paid the supplier 10,000; paid wages of 7,000; recorded depreciation of 500;
and accrued another 100 of interest (none paid). What's the 28 February balance sheet, February's income statement,
and operating cash flow?''', '''
Income statement: revenue 20,000 − COGS 7,000 − wages 7,000 − depreciation 500 − interest 100 = net income 5,400.
Balance sheet: cash 51,000; receivables 0; inventory 4,000; equipment 29,000 → assets 84,000. Payables 3,000,
interest payable 200, loan 20,000, share capital 50,000, retained earnings 10,800 → 84,000. Operating cash flow 6,000
(direct: 23,000 received − 10,000 suppliers − 7,000 wages; indirect: 5,400 + 500 + 3,000 − 2,000 − 1,000 + 100).''', kind='calc', diff=3))
qs.append(Q('c10-e03', 10, 'Accrual vs cash accounting', '''
On 1 December our software company signed a contract to provide a year of service for {P}, paid in full on signing.
Our financial year ends on 31 December. How much revenue do we recognise this year? What liability appears on the
balance sheet? And what's the effect on operating cash flow?''', '''
One month of service has been delivered: revenue = {P}/12 = {=P/12:2}. The remaining {=P*11/12:2} is a liability (deferred
revenue / contract liability) — 11 months of service still owed. Operating cash flow includes the full {P} received,
which is why growing subscription businesses often show cash flow well above net income.''',
kind='calc', vars={'P': R(6000, 60000, 1200)}, compute={}, check=({'P': 12000}, {})))
qs.append(Q('c10-e04', 10, 'Value added and GDP', '''
A mine produces iron ore worth {o} and sells it to a steelmaker. The steelmaker also buys energy worth {en} and makes
steel worth {s}, of which {sd} goes to a carmaker and the rest is exported. The carmaker buys parts worth {p} from
other domestic firms (which used no purchased inputs) and makes cars worth {c}, all sold to households. The energy
producer used no purchased inputs. What's each firm's value added and GDP? Can you check it with the expenditure approach?''', '''
Mine {o}; energy {en}; steelmaker {s} − {o} − {en} = {=s-o-en}; parts makers {p}; carmaker {c} − {sd} − {p} = {=c-sd-p}.
GDP = {gdp}. Expenditure: consumption (cars) {c} + exports (steel) {=s-sd} = {=c+s-sd} ✓.''',
kind='calc', vars={'o': R(150, 300, 50), 'en': R(50, 150, 50), 's': R(500, 800, 100), 'x': R(100, 200, 50), 'p': R(200, 400, 50), 'c': R(1000, 1500, 100)},
compute={'sd': 's-x', 'gdp': 'o+en+(s-o-en)+p+(c-(s-x)-p)'}, constraints=['s>o+en', 'c>s-x+p'],
check=({'o': 200, 'en': 100, 's': 600, 'x': 150, 'p': 300, 'c': 1200}, {'gdp': 1350})))
qs.append(Q('c10-e05', 10, 'What counts in GDP?', '''
Is each of these in this year's GDP, and if so in which expenditure component? (a) a household buys a newly built
house; (b) a household buys a ten-year-old house; (c) a firm buys a new delivery van; (d) the government pays
unemployment benefits; (e) the government pays teachers' salaries; (f) a German firm buys machinery made in China;
(g) a Malaysian factory produces chips that are unsold at year end; (h) I buy shares in a company.''', '''
(a) Yes — residential investment (I). (b) No — produced in an earlier year (an agent's commission would count).
(c) Yes — business investment (I). (d) No — a transfer, not a purchase of output. (e) Yes — government purchases (G).
(f) Germany: in I but subtracted in imports, so no net effect; China: exports, in Chinese GDP. (g) Yes — Malaysian
inventory investment. (h) No — a financial transaction, not production.'''))
qs.append(Q('c10-e06', 10, 'GDP vs GNI', '''
Our country's GDP is {G}. Foreign-owned firms here earn profits of {f}, which they send home. Residents earn {i} in
interest on foreign bonds and {w} in wages from working across the border. What's GNI, and which measure better
reflects residents' incomes?''', '''
GNI = GDP − income paid to foreigners + income received from abroad = {G} − {f} + {i} + {w} = {=G-f+i+w}. GNI is the better
guide to residents' incomes, because the {f} of profits belongs to foreigners.''',
kind='calc', vars={'G': R(300, 1000, 50), 'f': R(20, 100, 10), 'i': R(5, 30, 5), 'w': R(2, 10)}, compute={}, check=({'G': 500, 'f': 60, 'i': 15, 'w': 5}, {})))
qs.append(Q('c10-x09', 10, 'Laspeyres, Paasche and Fisher indexes', '''
My household's purchases. Base period: bread 100 loaves at 2.00, 1 phone at 500, 12 months' rent at 800. Current
period: 95 loaves at 2.20, 1.2 phones at {ph}, 12 months' rent at 840. What are the Laspeyres, Paasche and Fisher
price indexes?''', '''
Base basket: at base prices 10,300; at current prices 220 + {ph} + 10,080 = {cb} → Laspeyres = {L:4}. Current basket:
at current prices 209 + {=1.2*ph} + 10,080 = {cc}; at base prices 190 + 600 + 9,600 = 10,390 → Paasche = {P:4}.
Fisher = √(L × P) = {=sqrt(L*P):4}. Laspeyres ignores substitution toward goods that got cheaper, so it is usually higher.''',
kind='calc', diff=2, vars={'ph': C(350, 400, 450, 480)}, compute={'cb': '220+ph+10080', 'cc': '209+1.2*ph+10080', 'L': '(220+ph+10080)/10300', 'P': '(209+1.2*ph+10080)/10390'},
check=({'ph': 450}, {'L': 1.0437, 'P': 1.0423})))
qs.append(Q('c10-e08', 10, 'CPI vs GDP deflator', '''
Our country imports all its oil. The world oil price doubles and nothing else changes immediately. What happens to
(a) the CPI and (b) the GDP deflator?''', '''
(a) The CPI rises — oil products (petrol, heating) are in the consumer basket, imported or not. (b) The GDP deflator
is not directly affected, because imported oil isn't domestic production. Later, domestic firms may pass on higher
energy costs, which does raise the deflator.'''))
qs.append(Q('c10-e09', 10, 'Base-year bias in real GDP', '''
An economy produces apples and computers. Year 1: 100 apples at 1, 10 computers at 100. Year 2: 110 apples at 1.2,
15 computers at 80. Using year 1 as the base, what's real GDP growth and the GDP deflator for year 2? Why would a
chain-weighted measure give a different answer?''', '''
Nominal GDP: 1,100 → 1,332. Real GDP in year 2 at year-1 prices = 110 + 1,500 = 1,610: growth 46.4%. Deflator =
1,332/1,610 = 0.827, implying −17.3% inflation — computers' price fell, and valuing year-2 output at year-1's high
computer prices inflates real GDP. Chain-weighting (Fisher quantity index, growth 45.6%) gives a deflator of
(1,332/1,100)/1.4557 = 0.832, about −16.8%. The base year changes measured real growth and inflation.''', kind='calc', diff=3))
qs.append(Q('c10-e10', 10, 'Sector financial balances', '''
An economy has Y = {Y}, C = {Cn}, I = {I}, G = {G}, T = {T} and imports M = {M}. What are exports, private saving and the
three sector balances? Who's financing whom?''', '''
X = Y − C − I − G + M = {X}. Private saving S = Y − T − C = {S}. Private balance S − I = {=S-I}; government T − G = {=T-G};
rest of world M − X = {=M-X}. They sum to zero. {?M-X>0|Foreigners are in surplus ({=M-X}) vis-à-vis this country — it runs a current-account deficit financed from abroad.|The country runs a current-account surplus: it lends {=X-M} to the rest of the world.}''',
kind='calc', diff=2, vars={'Y': C(1000, 2000, 3000), 'cs': R(0.6, 0.7, 0.05), 'is': R(0.15, 0.22, 0.01), 'gs': R(0.18, 0.25, 0.01), 'ts': R(0.17, 0.24, 0.01), 'ms': R(0.15, 0.3, 0.05)},
compute={'Cn': 'Y*cs', 'I': 'Y*is', 'G': 'Y*gs', 'T': 'Y*ts', 'M': 'Y*ms', 'X': 'Y-Y*cs-Y*is-Y*gs+Y*ms', 'S': 'Y-Y*ts-Y*cs'},
constraints=['Y-Y*cs-Y*is-Y*gs+Y*ms>0'], check=({'Y': 2000, 'cs': 0.65, 'is': 0.2, 'gs': 0.225, 'ts': 0.19, 'ms': 0.25}, {'X': 350, 'S': 320})))
qs.append(Q('c10-e11', 10, 'Identities vs theories', '''
A politician says: "A country that cuts its government deficit will automatically improve its current account."
Is that right? Use the sector balances identity.''', '''
X − M ≡ (S − I) + (T − G). If T − G rises, the current account improves only if the private balance S − I doesn't fall
by an offsetting amount — and it might: fiscal tightening can reduce incomes and private saving, or lower interest
rates can raise investment. Nothing is automatic; the claim confuses an identity with a theory of behaviour.''', diff=2))
qs.append(Q('c10-e12', 10, 'Data revisions', '''
Our central bank raised rates after an advance estimate showed 4% annual growth. Two years later the figure was
revised to 2%. Was the decision a mistake? What else would you want to know?''', '''
Not necessarily: judge a decision against the information available at the time and the costs of waiting. You'd want
to know what other indicators showed then (employment, inflation, surveys), how uncertain the advance estimate was
known to be, and the costs of acting vs not acting. If growth looked strong and inflation was rising, raising rates may
have been sensible even though the estimate was later revised down.''', diff=2))
qs.append(Q('c10-e13', 10, 'Value added of a firm', '''
In January our café had revenue of 18,000, used 6,000 of supplies bought from other domestic firms, paid wages of
6,000, accrued 100 of interest, recorded 500 of depreciation and made a profit of 5,400. We also bought 30,000 of
equipment. What was our contribution to GDP (value added)? And why doesn't buying the equipment reduce it?''', '''
Value added = output − intermediate inputs used = 18,000 − 6,000 = 12,000. It is paid out as wages 6,000 + interest
100 + depreciation 500 + profit 5,400 = 12,000 (the income approach for one firm). Equipment is a capital good, not an
intermediate input — its purchase is investment in GDP; only its depreciation (part of gross value added) reflects its use.''', kind='calc', diff=2))
qs.append(Q('c10-x07', 10, 'Three approaches to GDP', '''
A bread chain: a farm grows wheat worth 100 (wages 60, profit 40, no purchased inputs); a mill turns it into flour
worth 250 (wages 100, profit 50); a bakery makes bread worth 400 (wages 110, profit 40). A machine-maker builds an
oven worth 50 for the bakery (wages 30, profit 20, no inputs). Households buy all the bread. What's GDP by the
production, income and expenditure approaches?''', '''
Production (value added): farm 100 + mill 150 + bakery 150 + machine-maker 50 = 450. Income: wages 300 + profits
150 = 450. Expenditure: consumption (bread) 400 + investment (oven) 50 = 450. Summing gross outputs (800) would
double-count intermediate inputs.''', kind='calc'))
write(3, 'Associate', 'rank03_associate.json', qs)
