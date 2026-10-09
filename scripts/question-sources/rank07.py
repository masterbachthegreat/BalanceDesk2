from qlib import *
qs = []
# ---------------- Chapter 27 ----------------
qs.append(Q('c27-e01', 27, 'Elements of financial statements', '''
Is each of these an asset, liability, equity, income, expense or none — and why? (a) our highly skilled workforce; (b) a
signed contract to buy raw materials next month; (c) a customer's deposit for goods not yet delivered; (d) a patent we
bought from an inventor; (e) a brand we built internally over decades; (f) cash from issuing new shares; (g) electricity
used this month but billed next month.''', '''
(a) None — the firm doesn't control employees. (b) None yet — an executory contract (unless onerous). (c) Liability
(contract liability). (d) Asset — a purchased, controlled right. (e) Generally not recognised — internally generated
brands aren't capitalised under IFRS or US GAAP. (f) Equity (share capital) plus an asset (cash); not income. (g) Expense
this month with a liability (accrued expense).''', diff=2))
qs.append(Q('c27-e02', 27, 'Journal entries', '''
What are the journal entries for: (a) buying a delivery van for {v}, paying {c} cash and signing a note for the rest;
(b) receiving 5,000 from a customer for last month's invoice; (c) paying 2,400 in advance for a two-year software
subscription; (d) declaring and paying a dividend of 8,000; (e) providing consulting worth 7,000 on credit?''', '''
(a) Dr Vehicles {v}; Cr Cash {c}; Cr Notes payable {=v-c}. (b) Dr Cash 5,000; Cr Accounts receivable 5,000. (c) Dr Prepaid software
2,400; Cr Cash 2,400. (d) Dr Dividends (retained earnings) 8,000; Cr Cash 8,000. (e) Dr Accounts receivable 7,000; Cr Service revenue 7,000.''',
kind='calc', vars={'v': R(20000, 50000, 5000), 'c': R(5000, 15000, 5000)}, compute={}, check=({'v': 30000, 'c': 10000}, {})))
qs.append(Q('c27-e03', 27, 'Trial balance errors', '''
Which of these errors would make the trial balance not balance? (a) A 500 cash sale recorded as Dr Cash 500, Cr Sales 50.
(b) A 300 payment to a supplier omitted entirely. (c) Rent of 1,000 debited to wages expense instead of rent expense.
(d) An 800 receipt from a customer debited to cash and debited to receivables.''', '''
(a) Yes — debits exceed credits by 450. (b) No — both sides omitted. (c) No — wrong account, but debits still equal credits.
(d) Yes — two debits, no credit: debits exceed credits by 1,600.'''))
qs.append(Q('c27-e04', 27, 'Adjusting entries', '''
What adjusting entries do we need at 31 December for: (a) a one-year rent payment of {rent} made on 1 October and debited
to prepaid rent; (b) a {fee} fee received on 1 November for six months of maintenance starting that day, credited to
unearned revenue; (c) a {L} loan taken on 1 September at {r}% a year, interest payable annually; (d) services worth 4,000
performed in December but not yet billed?''', '''
(a) 3 months used: Dr Rent expense {=rent/4}; Cr Prepaid rent {=rent/4}. (b) 2 months earned: Dr Unearned revenue {=fee/3}; Cr Service revenue {=fee/3}.
(c) 4 months' interest = {L} × {r}% × 4/12 = {=L*r/100/3}: Dr Interest expense; Cr Interest payable. (d) Dr Accounts receivable (accrued
revenue) 4,000; Cr Service revenue 4,000.''',
kind='calc', vars={'rent': R(12000, 24000, 1200), 'fee': R(6000, 18000, 600), 'L': R(60000, 150000, 30000), 'r': C(3, 6, 9)}, compute={},
check=({'rent': 18000, 'fee': 12000, 'L': 100000, 'r': 6}, {})))
qs.append(Q('c27-e05', 27, 'Effect of omitted adjustments', '''
Our year-end adjustments were: depreciation of equipment {d}, expired prepaid insurance {i}, accrued wages {w} and accrued
interest {n}. After them we reported profit before tax of {p}. If we'd forgotten all four, what would profit have been,
and how much would total assets and total liabilities have been misstated?''', '''
Omitted expenses = {d} + {i} + {w} + {n} = {=d+i+w+n}, so profit before tax would have been {=p+d+i+w+n}. Assets overstated by {=d+i} (equipment {d}
+ prepaid insurance {i}); liabilities understated by {=w+n} (wages + interest payable).''',
kind='calc', vars={'d': R(5000, 15000, 1000), 'i': R(2000, 6000, 500), 'w': R(1000, 5000, 500), 'n': R(500, 3000, 500), 'p': R(10000, 30000, 1000)}, compute={},
check=({'d': 10000, 'i': 4500, 'w': 3000, 'n': 1500, 'p': 17000}, {})))
qs.append(Q('c27-e06', 27, 'The full accounting cycle', '''
My design studio started on 1 March. During March: (1) owners invested 40,000 cash; (2) we bought computers for 12,000
cash (3-year life, no residual); (3) paid 3,000 for three months' rent in advance; (4) billed clients 25,000, of which
15,000 was received in cash; (5) paid staff 9,000; (6) got a 400 phone bill, unpaid at month end. What's March's
profit (ignore tax) and our 31 March balance sheet?''', '''
Adjustments: depreciation 12,000/36 ≈ 333; rent expense 1,000. Profit = 25,000 − 9,000 − 1,000 − 400 − 333 = 14,267.
Balance sheet: cash 31,000; receivables 10,000; prepaid rent 2,000; computers 11,667 → assets 54,667. Payables 400; share
capital 40,000; retained earnings 14,267 → 54,667.''', kind='calc', diff=3))
qs.append(Q('c27-e07', 27, 'Fair-value hierarchy', '''
We hold (a) 10,000 shares of a listed company; (b) an interest-rate swap valued using quoted swap rates; (c) a 5% stake
in an unlisted start-up valued with a DCF model. Which level of the fair-value hierarchy is each? Which valuation
should an analyst scrutinise most?''', '''
(a) Level 1 (quoted price). (b) Level 2 (observable inputs, not a quote for the identical item). (c) Level 3 (unobservable
inputs). Scrutinise Level 3 most — management's assumptions drive it, and small changes produce large value swings.''', diff=2))
qs.append(Q('c27-e08', 27, 'Historical cost vs fair value', '''
Our retail company's land was bought in 1985 for 2 million and is reported at that cost. A recent appraisal values it at
30 million. How relevant and faithful is each figure? What can we do under IFRS vs US GAAP?''', '''
Historical cost is verifiable but not relevant to current value or collateral; the appraisal is relevant but less
verifiable (judgement). IFRS (IAS 16) allows the revaluation model for the class of land, with increases to OCI
(revaluation surplus), kept up to date. US GAAP requires cost; the appraisal can only be disclosed.''', diff=2))
qs.append(Q('c27-e09', 27, 'Audit evidence', '''
Rank these as audit evidence for the existence of a bank balance, most to least reliable: (a) a bank statement supplied
by the client's finance team; (b) a confirmation sent by the bank directly to the auditor; (c) a screenshot of the online
banking portal emailed by the CFO; (d) a letter from a third-party trustee saying it holds the funds.''', '''
(b) most reliable — direct from an independent source. Then (d) — third party, but its independence must be verified. Then
(a) — client-provided, could be altered. (c) least — easily fabricated by an interested party. (Wirecard's auditors relied
on evidence closer to (d) than (b).)''', diff=2))
# ---------------- Chapter 28 ----------------
qs.append(Q('c28-e01', 28, 'Revenue allocation (IFRS 15)', '''
We sell a licence, one year of support and on-site installation for {T} in total. Standalone prices: licence {L},
support {S}, installation {I}. Licence delivered and installed 1 October; support runs 12 months from 1 October. How much
revenue do we recognise in the year to 31 December?''', '''
Allocate {T} by standalone prices (sum {=L+S+I}): licence {aL:0}, support {aS:0}, installation {aI:0}. Recognised by 31 Dec: licence {aL:0}
(point in time) + installation {aI:0} + support {aS:0} × 3/12 = {=aS/4:0} → total {=aL+aI+aS/4:0}.''',
kind='calc', diff=2, vars={'T': R(80000, 120000, 10000), 'L': R(60000, 90000, 10000), 'S': R(15000, 25000, 5000), 'I': R(5000, 15000, 5000)},
compute={'aL': 'T*L/(L+S+I)', 'aS': 'T*S/(L+S+I)', 'aI': 'T*I/(L+S+I)'}, check=({'T': 100000, 'L': 80000, 'S': 20000, 'I': 10000}, {'aL': 72727, 'aS': 18182}), tol=0.0001))
qs.append(Q('c28-e02', 28, 'Variable consideration: returns', '''
We sell {n} units to a distributor at {p} each with a right to return unsold units within 90 days. From experience we
expect {r}% to come back. How much revenue do we recognise on delivery, and what liability?''', '''
Revenue = {n} × {p} × {=1-r/100:2} = {=n*p*(1-r/100)}. Refund liability {=n*p*r/100}, plus an asset for the right to recover the returned goods (at former
carrying amount less recovery costs), with cost of sales reduced accordingly.''',
kind='calc', vars={'n': R(5000, 20000, 1000), 'p': R(20, 80, 5), 'r': R(2, 10)}, compute={}, check=({'n': 10000, 'p': 50, 'r': 5}, {})))
qs.append(Q('c28-e03', 28, 'Revenue over time (cost-to-cost)', '''
A shipbuilder signs a 50 million contract with expected total cost 40 million. Costs are 12 million in year 1 and 20
million in year 2, when the total-cost estimate rises to 45 million; year-3 costs are 13 million. What are revenue and
profit each year using cost-to-cost? What if, at the end of year 2, total cost were expected to be 52 million?''', '''
Y1: 12/40 = 30% → revenue 15, profit 3. Y2: 32/45 = 71.1% → cumulative revenue 35.56, year revenue 20.56, profit 0.56.
Y3: revenue 14.44, profit 1.44. Total 5. If total cost were 52, the contract loses 2 overall; having booked +3, year 2 must
show a loss of 5 so the cumulative result is −2 (full expected loss recognised immediately).''', kind='calc', diff=3))
qs.append(Q('c28-e04', 28, 'Principal vs agent', '''
An online travel company sells hotel rooms. In model A it books rooms at hotels' prices and earns a {c}% commission; in
model B it buys room blocks in advance at a fixed price, bears the risk of unsold rooms and sets its own prices. For a
room sold for {p}, what revenue does it report in each model? Why might two firms with identical profits show very
different revenue growth?''', '''
A: agent — revenue is the commission, {=c/100:2} × {p} = {=c*p/100}. B: principal (controls the room, bears inventory risk) —
revenue {p}, with room cost in cost of sales. Switching from A to B inflates revenue growth without changing profit; compare
gross bookings and margins.''', kind='calc', vars={'c': R(10, 20), 'p': R(100, 300, 50)}, compute={}, check=({'c': 15, 'p': 200}, {})))
qs.append(Q('c28-e05', 28, 'Expected credit losses', '''
At year end our receivables are {R}, and the ageing analysis implies expected credit losses of {E}. The allowance started
the year at {O} (credit) and we wrote off {W} of receivables during the year. What are the entries, and what's the
credit-loss expense for the year?''', '''
Write-offs: Dr Allowance {W}; Cr Receivables {W} → allowance {=O-W}. To reach the required {E}: Dr Credit-loss expense {=E-O+W}; Cr Allowance {=E-O+W}.
Expense for the year = {=E-O+W}.''',
kind='calc', vars={'R': R(300000, 800000, 50000), 'E': R(12000, 30000, 1000), 'O': R(10000, 20000, 1000), 'W': R(5000, 15000, 1000)}, constraints=['W<=O', 'E>O-W'], compute={},
check=({'R': 500000, 'E': 18000, 'O': 15000, 'W': 12000}, {})))
qs.append(Q('c28-e06', 28, 'Inventory cost formulas: FIFO, average, LIFO', '''
Opening inventory is 50 units at {c0}. Purchases: 150 at {c1}, then 100 at {c2}. Sales: 220 units at {p}. What are cost of goods
sold, ending inventory and gross profit under FIFO, weighted average and (periodic) LIFO? What's the LIFO reserve?''', '''
Goods available 300 units costing {tot}; revenue {=220*p}. FIFO: COGS {fifo}, ending 80 × {c2} = {=80*c2}, gross profit {=220*p-fifo}.
Average: {=tot/300:3}/unit → COGS {=220*tot/300:2}, ending {=80*tot/300:2}, GP {=220*p-220*tot/300:2}. LIFO: COGS {lifo}, ending 30 × {c1} + 50 × {c0} = {=30*c1+50*c0},
GP {=220*p-lifo}. LIFO reserve = {=80*c2} − {=30*c1+50*c0} = {=80*c2-30*c1-50*c0}.''',
kind='calc', diff=2, vars={'c0': R(18, 22), 'd1': R(1, 3), 'd2': R(2, 4), 'p': R(35, 45, 5)},
compute={'c1': 'c0+d1', 'c2': 'c0+d1+d2', 'tot': '50*c0+150*(c0+d1)+100*(c0+d1+d2)', 'fifo': '50*c0+150*(c0+d1)+20*(c0+d1+d2)', 'lifo': '100*(c0+d1+d2)+120*(c0+d1)'},
check=({'c0': 20, 'd1': 2, 'd2': 3, 'p': 40}, {'tot': 6800, 'fifo': 4800, 'lifo': 5140})))
qs.append(Q('c28-e07', 28, 'Tax effect of LIFO', '''
Our LIFO reserve is {r} (LIFO profit is that much lower than FIFO), the tax rate is {t}% and we use LIFO for tax. How much tax
do we defer compared with FIFO? Is it a permanent saving?''', '''
Tax deferred = {=t/100:2} × {r} = {=t*r/100:2}. It's a deferral: if layers are liquidated or prices fall, the tax becomes payable. But while
inventory is maintained and prices rise, the deferral can persist indefinitely, which has real present value.''',
kind='calc', vars={'r': R(200, 2000, 100), 't': C(21, 25, 30)}, compute={}, check=({'r': 340, 't': 21}, {})))
qs.append(Q('c28-e08', 28, 'Net realisable value', '''
Our fashion shop holds {n} jackets that cost {c} each. At year end the expected selling price has fallen to {s} and selling
costs are {k} per jacket. What write-down is needed? If next year the expected price recovers to {s2}, what does IFRS
require, and US GAAP?''', '''
NRV = {s} − {k} = {=s-k} < cost {c}: write down {n} × {=c-s+k} = {=n*(c-s+k)}. Next year NRV = {=s2-k}: IFRS requires reversal up to original cost
(back to {c}, a gain of {=n*(min(c,s2-k)-(s-k))}); US GAAP prohibits reversal (stays at {=s-k}).''',
kind='calc', vars={'n': R(500, 2000, 100), 'c': R(50, 80, 5), 'k': R(10, 20, 5), 'drop': R(5, 15, 5), 's2': R(85, 100, 5)},
compute={'s': 'c+k-drop'}, constraints=['s2-k>=c'], check=({'n': 1000, 'c': 60, 'k': 15, 'drop': 5, 's2': 85}, {'s': 70})))
qs.append(Q('c28-e09', 28, 'Inventory errors', '''
Our ending inventory for 2025 was overstated by {e}. What are the effects on 2025 and 2026 profit before tax, and on
retained earnings at the end of each year?''', '''
2025: COGS understated → profit and end-2025 retained earnings overstated by {e}. 2026: opening inventory overstated →
COGS overstated → profit understated by {e}; end-2026 retained earnings are correct (the error self-reverses).''',
kind='calc', vars={'e': R(10000, 60000, 5000)}, compute={}, check=({'e': 30000}, {})))
qs.append(Q('c28-e10', 28, 'Cash conversion cycle', '''
Firm X has revenue 1,200,000, COGS 800,000, inventory {ix}, receivables {rx} and payables {px}. Firm Y has the same
revenue and COGS but inventory 40,000, receivables 20,000 and payables 140,000. What's each firm's cash conversion
cycle? If each grows revenue 10% with unchanged ratios, how much extra working capital does each need?''', '''
X: DIO = {ix}/800,000 × 365 = {=ix/800000*365:1}; DSO = {=rx/1200000*365:1}; DPO = {=px/800000*365:1}; CCC = {=ix/800000*365+rx/1200000*365-px/800000*365:1} days.
Y: DIO 18.3, DSO 6.1, DPO 63.9 → CCC −39.5 days. Working capital: X {=ix+rx-px}, Y −80,000. With 10% growth X needs {=(ix+rx-px)/10} more;
Y releases 8,000 (to −88,000).''',
kind='calc', diff=2, vars={'ix': R(120000, 200000, 10000), 'rx': R(100000, 200000, 10000), 'px': R(40000, 100000, 10000)}, compute={'w': 'ix+rx-px'},
check=({'ix': 160000, 'rx': 150000, 'px': 60000}, {'w': 250000})))
qs.append(Q('c28-e11', 28, 'Supplier finance programmes', '''
We have payables of 100 million on 60-day terms and just joined a supplier-finance programme: our bank pays suppliers after
10 days and we pay the bank after 120 days. Annual COGS is 600 million and the balances stay classified as trade payables.
What happens to reported DPO and operating cash flow in the first year? How should an analyst adjust?''', '''
Paying after 120 days, payables roughly double to ~200 million; DPO rises from ~61 to ~122 days and operating cash flow is
boosted by ~100 million as payments are delayed. Economically it's short-term bank debt: reclassify amounts owed under the
programme as debt, move the flows from operating to financing, and recompute DPO and leverage.''', diff=3))
# ---------------- Chapter 29 ----------------
qs.append(Q('c29-e01', 29, 'Cost of property, plant and equipment', '''
We bought a machine: list price {lp}, trade discount {td}%, delivery {dl}, installation {ins}, staff training {tr}, a consultant
who supervised testing {cs}, and repairs of damage our own staff caused while unloading {rp}. What's the machine's cost?''', '''
{lp} × {=1-td/100:2} = {=lp*(1-td/100)} + delivery {dl} + installation {ins} + testing supervision {cs} = {=lp*(1-td/100)+dl+ins+cs}. Training ({tr}) is expensed;
the damage repair ({rp}) is expensed too — it results from an error, not from bringing the asset to working condition.''',
kind='calc', vars={'lp': R(150000, 300000, 10000), 'td': C(0, 5, 10), 'dl': R(3000, 8000, 1000), 'ins': R(5000, 12000, 1000), 'tr': R(2000, 6000, 1000), 'cs': R(2000, 5000, 1000), 'rp': R(1000, 4000, 500)},
compute={}, check=({'lp': 250000, 'td': 5, 'dl': 6000, 'ins': 9000, 'tr': 4000, 'cs': 3000, 'rp': 2500}, {})))
qs.append(Q('c29-e02', 29, 'Depreciation methods', '''
Equipment costs {C}, has residual value {RV} and a 4-year life. What's the annual depreciation under straight-line, and the
first two years under double-declining-balance? (Book value can't go below residual value.)''', '''
Depreciable amount {=C-RV}. Straight-line: {=(C-RV)/4} a year (book values {=C-(C-RV)/4}, {=C-2*(C-RV)/4}, {=C-3*(C-RV)/4}, {RV}). DDB (50% of book value):
year 1 {=C/2}, year 2 {=C/4}, year 3 {=C/8}, with year 4 limited so book value ends at {RV}.''',
kind='calc', vars={'C': R(40000, 100000, 4000), 'RV': R(2000, 8000, 2000)}, compute={'sl': '(C-RV)/4'}, constraints=['C/8>RV'], check=({'C': 60000, 'RV': 6000}, {'sl': 13500})))
qs.append(Q('c29-e02b', 29, 'Units-of-production depreciation', '''
Equipment costs 60,000, residual value 6,000, expected output 27,000 units (9,000, 8,000, 6,000 and 4,000 in successive
years). What's the units-of-production depreciation schedule?''', '''
Rate = 54,000/27,000 = 2 per unit. Charges 18,000, 16,000, 12,000, 8,000; book values 42,000, 26,000, 14,000, 6,000.''', kind='calc'))
qs.append(Q('c29-e03', 29, 'Change in accounting estimate', '''
A building bought for {C} with no residual value was depreciated straight-line over {n} years. At the start of year {=k+1}
management extends the remaining useful life to {m} years. What's the depreciation charge in year {=k+1}, and how much does
the change raise profit before tax that year?''', '''
Carrying amount after {k} years = {C} − {k} × {=C/n} = {=C-k*C/n}. New charge = {=C-k*C/n}/{m} = {=(C-k*C/n)/m:0} vs {=C/n} before: profit rises by {=C/n-(C-k*C/n)/m:0}
(prospectively — prior years aren't restated).''',
kind='calc', vars={'C': R(1000000, 4000000, 500000), 'n': C(25, 40, 50), 'k': C(5, 10), 'm': C(40, 50, 60)}, compute={'nc': '(C-k*C/n)/m'},
check=({'C': 2000000, 'n': 40, 'k': 10, 'm': 50}, {'nc': 30000})))
qs.append(Q('c29-e04', 29, 'Disposal of an asset', '''
Equipment that cost {C} (residual {RV}, 4-year life, straight-line) is sold at the end of year 3 for {S}. What's the
journal entry?''', '''
Accumulated depreciation = 3 × {=(C-RV)/4} = {=3*(C-RV)/4}; carrying amount {=C-3*(C-RV)/4}. Dr Cash {S}; Dr Accumulated depreciation {=3*(C-RV)/4};
{?S<C-3*(C-RV)/4|Dr Loss on disposal {=C-3*(C-RV)/4-S}|Cr Gain on disposal {=S-(C-3*(C-RV)/4)}}; Cr Equipment {C}.''',
kind='calc', vars={'C': R(40000, 80000, 4000), 'RV': R(4000, 8000, 2000), 'S': R(8000, 25000, 1000)}, constraints=['S!=C-3*(C-RV)/4'], compute={},
check=({'C': 60000, 'RV': 6000, 'S': 15000}, {})))
qs.append(Q('c29-e05', 29, 'Impairment: IFRS vs US GAAP', '''
An asset group has carrying amount 80 million. Undiscounted expected cash flows are 75 million; value in use is 60 million;
fair value 62 million with disposal costs of 2 million. What's the impairment loss under IFRS and under US GAAP? Two years
later value in use rises to 70 million; the carrying amount is 50 million (would have been 64 million without the
impairment). What does each framework require?''', '''
IFRS: recoverable amount = max(62 − 2, 60) = 60 → loss 20. US GAAP: undiscounted 75 < 80 → impaired; write down to fair value 62 →
loss 18. Later: IFRS reverses up to the lower of recoverable amount (70) and the no-impairment carrying amount (64) → write up
50 → 64, a gain of 14. US GAAP prohibits reversal.''', kind='calc', diff=3))
qs.append(Q('c29-e06', 29, 'R&D capitalisation', '''
Our pharma company spent {r} million on research and {d} million on development this year; {c} million of the development meets
IAS 38's capitalisation criteria. How do profit before tax and total assets compare under IFRS vs US GAAP? Which is more
useful to investors?''', '''
IFRS: expense {r} + {=d-c} = {=r+d-c}, capitalise {c} as an intangible. US GAAP: expense all {=r+d}. IFRS profit and assets are {c} million higher.
IFRS arguably more relevant (recognises development likely to pay off); US GAAP more verifiable and comparable (no
feasibility judgement). Reasonable people disagree.''',
kind='calc', diff=2, vars={'r': R(200, 400, 50), 'd': R(150, 300, 50), 'c': R(50, 150, 10)}, constraints=['c<d'], compute={}, check=({'r': 300, 'd': 200, 'c': 120}, {})))
qs.append(Q('c29-e07', 29, 'Goodwill on acquisition', '''
We're acquiring 100% of a company for {P} million. Its book equity is {B} million. Fair-value adjustments: property up {pr}
million; an unrecognised brand worth {br} million; a contingent litigation liability of {cl} million; deferred tax on the
adjustments {dt} million. What's goodwill?''', '''
Net identifiable assets at fair value = {B} + {pr} + {br} − {cl} − {dt} = {=B+pr+br-cl-dt}. Goodwill = {P} − {=B+pr+br-cl-dt} = {=P-(B+pr+br-cl-dt)} million.''',
kind='calc', vars={'P': R(900, 1500, 100), 'B': R(400, 600, 50), 'pr': R(50, 150, 25), 'br': R(150, 300, 50), 'cl': R(20, 80, 10), 'dt': R(50, 100, 25)},
compute={'g': 'P-(B+pr+br-cl-dt)'}, constraints=['P-(B+pr+br-cl-dt)>0'], check=({'P': 1200, 'B': 500, 'pr': 100, 'br': 250, 'cl': 50, 'dt': 75}, {'g': 475})))
qs.append(Q('c29-e08', 29, 'Lease accounting (IFRS 16)', '''
We lease a machine for 4 years, paying {A} at the end of each year; the discount rate is {r}%. What's the initial lease
liability? What's the year-1 interest, depreciation and total expense under IFRS 16? And the annual expense under ASC 842
if it's an operating lease?''', '''
Liability = {A} × (1 − {=1+r/100:2}^−4)/{=r/100:2} = {L:0}. Year 1: interest {=L*r/100:0}, depreciation {=L/4:0} → expense {=L*r/100+L/4:0}; closing liability
{=L*(1+r/100)-A:0}. Expense is front-loaded under IFRS 16. Under ASC 842 operating lease: a straight-line {A} a year.''',
kind='calc', diff=2, vars={'A': R(10000, 50000, 5000), 'r': R(4, 10)}, compute={'L': 'pv(r/100, 4, A)'}, check=({'A': 25000, 'r': 8}, {'L': 82803})))
qs.append(Q('c29-e09', 29, 'IFRS 16 and EBITDA', '''
Before IFRS 16 our airline reported EBITDA of {E} million after operating-lease rentals of {R} million. Under IFRS 16 the
rentals are replaced by depreciation of {D} million and interest of {I} million. What's the new EBITDA, and the effect on
operating profit? Why might lenders with a debt/EBITDA covenant need to rewrite it?''', '''
EBITDA rises by the {R} of rentals: {=E+R} million. EBIT rises by {R} − {D} = {=R-D} (interest is below the operating line). Debt now includes
lease liabilities and EBITDA is higher, so the covenant changes meaning — parties freeze old definitions ("frozen GAAP") or
recalibrate thresholds.''',
kind='calc', vars={'E': R(500, 2000, 100), 'R': R(200, 600, 50), 'f': C(0.75, 0.8, 0.85)}, compute={'D': 'round(R*f)', 'I': 'round(R*(1.1-f))'}, check=({'E': 1000, 'R': 400, 'f': 0.825}, {'D': 330, 'I': 110})))
qs.append(Q('c29-e10', 29, 'Capitalisation red flags', '''
A telecoms company's revenue has been flat at 30 billion for three years. Operating expenses fell from 26 to 24 billion
while capex rose from 4 to 6 billion. What explanations should I consider, and what evidence would tell them apart?''', '''
(i) Real efficiency from new network equipment; (ii) reclassifying costs from opex to capex (legit only if criteria are
met — WorldCom did it fraudulently); (iii) shifting from leasing capacity to owning it. Evidence: composition of capex and
asset additions; whether depreciation rises as assets enter service; physical network growth vs capex; disclosed policy
changes; whether free cash flow actually improved.''', diff=3))
# ---------------- Chapter 30 ----------------
qs.append(Q('c30-e01', 30, 'Bonds issued at a premium', '''
We're issuing two-year bonds with face value {F} and a {c}% annual coupon when the market yield is {y}%. What's the issue
price? Can you show the amortisation (effective-interest) schedule and the year-1 entries?''', '''
Price = {=F*c/100}/{=1+y/100:2} + {=F*(1+c/100)}/{=1+y/100:2}² = {P:0}. Year 1: interest expense {=y/100:2} × {P:0} = {i1:0}; coupon {=F*c/100}; carrying amount falls by
{=F*c/100-i1:0} to {=P-(F*c/100-i1):0}. Year 2: interest {=(P-(F*c/100-i1))*y/100:0}, carrying amount reaches {F}, repaid. Entries: issue Dr Cash {P:0}, Cr Bonds payable;
year end Dr Interest expense {i1:0}, Dr Bonds payable {=F*c/100-i1:0}, Cr Cash {=F*c/100}.''',
kind='calc', diff=2, vars={'F': R(200000, 1000000, 100000), 'c': R(6, 10), 'y': R(3, 6)}, constraints=['c>y'], compute={'P': 'pv(y/100, 2, F*c/100, F)', 'i1': 'pv(y/100, 2, F*c/100, F)*y/100'},
check=({'F': 500000, 'c': 8, 'y': 6}, {'P': 518334}), tol=0.0001))
qs.append(Q('c30-e02', 30, 'Amortised cost vs market value of debt', '''
We issued 3-year bonds (face 1,000,000, 5% annual coupon) at a 6% yield; after one year their amortised cost is 981,666.
Market yields have now risen to {y}%, with two coupons left. What's the market value of the bonds? At what amount are
they reported? Are we better or worse off economically?''', '''
Market value = 50,000/{=1+y/100:2} + 1,050,000/{=1+y/100:2}² = {mv:0}. Reported at amortised cost, 981,666. Economically the company is better off by
about {=981666-mv:0}: it locked in borrowing at 6% while the market now demands {y}%. The gain isn't recognised (lenders bear
the mirror-image loss).''',
kind='calc', vars={'y': C(7, 8, 9, 10)}, compute={'mv': 'pv(y/100, 2, 50000, 1000000)'}, check=({'y': 9}, {'mv': 929636}), tol=0.0001))
qs.append(Q('c30-e03', 30, 'Securities classification: HTM, AFS, trading', '''
Our bank holds a 10-year Treasury bought at par for 100 million with a 2% coupon. Yields rose and its fair value fell to {fv}
million. What's the effect on net income, OCI and equity if it's classified (a) held-to-maturity, (b) available-for-sale,
(c) trading? And what happens in each case if we sell it?''', '''
Loss = {=100-fv} million. (a) HTM: no effect on NI, OCI or equity — only disclosed. (b) AFS: {=100-fv} loss in OCI, equity −{=100-fv}, NI unaffected.
(c) Trading: {=100-fv} loss in NI, equity −{=100-fv}. On sale: HTM — realised loss in NI (and possible tainting); AFS — the OCI loss is
reclassified to NI (equity unchanged by that); trading — nothing further. Equity ends {=100-fv} lower in every case once sold.''',
kind='calc', vars={'fv': R(70, 90, 5)}, compute={}, check=({'fv': 80}, {}), diff=2))
qs.append(Q('c30-e04', 30, 'Basic and diluted EPS', '''
Net income is {NI} million, no preference shares. 10 million shares were outstanding on 1 January; we issued 2 million on
1 April and bought back 1 million on 1 October. We also have convertible bonds (face {B} million, {c}% coupon) convertible
into 1 million shares; tax rate 25%. What are basic and diluted EPS?''', '''
Weighted shares = 10 + 2 × 9/12 − 1 × 3/12 = 11.25 million. Basic EPS = {NI}/11.25 = {=NI/11.25:3}. Diluted: add back after-tax interest
{B} × {c}% × 0.75 = {=B*c/100*0.75:3}, add 1 million shares → ({=NI+B*c/100*0.75:3})/12.25 = {=(NI+B*c/100*0.75)/12.25:3}.
{?(NI+B*c/100*0.75)/12.25<NI/11.25|Lower than basic, so the bonds are dilutive and included.|Not lower than basic: the bonds are antidilutive and excluded, so diluted EPS = basic.}''',
kind='calc', diff=2, vars={'NI': R(20, 40), 'B': R(10, 30, 5), 'c': R(3, 6)}, compute={'b': 'NI/11.25'}, check=({'NI': 30, 'B': 20, 'c': 5}, {'b': 2.667}), tol=0.001))
qs.append(Q('c30-e05', 30, 'Deferred tax liabilities', '''
We bought equipment for 100,000: for accounting, straight-line over 5 years (20,000 a year); for tax, 40,000 in year 1 then
15,000 a year for four years. Profit before depreciation is 150,000 a year; tax rate 25%. In year 2 the deferred tax
liability was 3,750. What's the deferred tax liability at the end of years 3, 4 and 5, and the tax expense each year?''', '''
Year 3: carrying amount 40,000 vs tax base 30,000 → DTL 2,500 (down 1,250). Year 4: 20,000 vs 15,000 → DTL 1,250. Year 5: 0.
Each year current tax 33,750 (taxable profit 135,000) and deferred tax −1,250 → tax expense 32,500 = 25% of accounting profit
130,000.''', kind='calc', diff=3))
qs.append(Q('c30-e06', 30, 'Deferred tax assets', '''
We booked a warranty provision of {P} in year 1; warranty costs are tax-deductible only when paid. We pay {p2} in year 2 and
the rest in year 3. With a {t}% tax rate, what deferred tax balance appears at the end of years 1 and 2?''', '''
End of year 1: deductible temporary difference {P} → deferred tax asset {=t/100:2} × {P} = {=t*P/100} (if future taxable profit is probable).
End of year 2: provision {=P-p2} → DTA {=t*(P-p2)/100}. End of year 3: zero.''',
kind='calc', vars={'P': R(100000, 400000, 50000), 'p2': R(50000, 200000, 10000), 't': C(21, 25, 30)}, constraints=['p2<P'], compute={},
check=({'P': 200000, 'p2': 120000, 't': 30}, {})))
qs.append(Q('c30-e07', 30, 'Provisions vs contingent liabilities', '''
How should we treat: (a) a lawsuit where our lawyers estimate a 70% chance of losing, best estimate of damages 5 million;
(b) a lawsuit with a 20% chance of losing; (c) a board decision, not yet announced, to close a factory next year; (d) a legal
obligation to dismantle a drilling platform in 20 years at an estimated 100 million (discount rate 5%)?''', '''
(a) Provision of 5 million (present obligation, probable outflow, reliable estimate). (b) Contingent liability: disclose,
don't recognise. (c) Nothing yet — no constructive obligation until the plan is announced or implementation starts.
(d) Provision at present value 100/1.05²⁰ = 37.7 million, added to the platform's cost; the discount unwinds as a finance cost.''', diff=2))
qs.append(Q('c30-e08', 30, 'Pension obligations and discount rates', '''
Our defined-benefit plan will pay {A} million a year for {n} years starting in one year. What's the obligation at discount
rates of {r1}% and {r2}%? By what percentage does it fall when the rate rises?''', '''
At {r1}%: {A} × (1 − {=1+r1/100:2}^−{n})/{=r1/100:2} = {o1:1} million. At {r2}%: {o2:1} million. It falls by {=(1-o2/o1)*100:1}% — long-dated
obligations are very sensitive to discount rates.''',
kind='calc', vars={'A': R(5, 20), 'n': C(15, 20, 25), 'r1': C(2, 3), 'r2': C(4, 5, 6)}, compute={'o1': 'pv(r1/100, n, A)', 'o2': 'pv(r2/100, n, A)'},
check=({'A': 10, 'n': 20, 'r1': 2, 'r2': 5}, {'o1': 163.5, 'o2': 124.6}), tol=0.001))
qs.append(Q('c30-e09', 30, 'Modigliani–Miller and the tax shield', '''
An unlevered firm worth {V} has assets earning an expected {ra}%. It issues {D} of debt at {rd}% and buys back shares.
Ignoring taxes, what's the expected return on equity afterwards? With a {t}% corporate tax and permanent debt, what's the
tax shield worth?''', '''
Equity = {=V-D}. r_E = r_A + (r_A − r_D) × D/E = {ra} + ({ra} − {rd}) × {D}/{=V-D} = {re:2}%. (Check: {=V*ra/100} − {=D*rd/100} interest = {=V*ra/100-D*rd/100} on {=V-D}.)
Tax shield = τD = {=t/100:2} × {D} = {=t*D/100}.''',
kind='calc', vars={'V': R(1000, 3000, 500), 'ra': R(8, 12), 'rd': R(4, 6), 'df': C(0.3, 0.4, 0.5), 't': C(21, 25, 30)}, compute={'D': 'V*df', 're': 'ra+(ra-rd)*df/(1-df)'},
check=({'V': 1000, 'ra': 10, 'rd': 5, 'df': 0.4, 't': 25}, {'re': 13.333})))
qs.append(Q('c30-e10', 30, 'Silicon Valley Bank', '''
SVB reported equity of about 16 billion dollars in late 2022, but held about 15 billion of unrealised losses on
held-to-maturity securities, and most of its deposits were uninsured and from one industry. Why was the reported equity a
misleading guide to its ability to absorb losses? What in its statements would have revealed the problem? And why did
selling its AFS portfolio make things worse?''', '''
Reported equity excluded ~15 billion of HTM unrealised losses that were economically real — had it needed to sell, it would
realise them; on a fair-value basis equity was near zero. Warning signs: the HTM fair-value disclosure, maturity profile,
concentration of large uninsured deposits from one sector, and rate-sensitivity of economic value. Selling AFS realised a
loss, required new capital and publicised the problem — triggering a run by uninsured depositors afraid of being last.''', diff=3))
# ---------------- Chapter 31 ----------------
qs.append(Q('c31-e01', 31, 'Free cash flow to firm and equity', '''
A company has EBIT of {E}, tax rate {t}%, depreciation {D}, capex {K}, and an increase in operating working capital of {W}. It
pays interest of {I} and borrows a net {B}. What are FCFF and FCFE?''', '''
FCFF = EBIT(1 − t) + D − capex − ΔWC = {=E*(1-t/100)} + {D} − {K} − {W} = {ff}. FCFE = FCFF − interest × (1 − t) + net borrowing = {ff} − {=I*(1-t/100)} + {B} = {=ff-I*(1-t/100)+B}.''',
kind='calc', vars={'E': R(200, 600, 50), 't': C(20, 25, 30), 'D': R(50, 150, 10), 'K': R(100, 300, 25), 'W': R(10, 80, 10), 'I': R(20, 80, 10), 'B': R(-20, 50, 10)},
compute={'ff': 'E*(1-t/100)+D-K-W'}, check=({'E': 400, 't': 25, 'D': 120, 'K': 200, 'W': 50, 'I': 60, 'B': 30}, {'ff': 170})))
qs.append(Q('c31-e02', 31, 'DuPont analysis and leverage', '''
A company has sales {S}, net income {N}, total assets {A} and equity {E}. What's ROE and its three DuPont components? If it
borrows 400 to buy back shares (assets unchanged) and after-tax interest cuts net income by 15, what's the new ROE? Is the
firm more valuable?''', '''
Margin {=N/S*100:2}%, turnover {=S/A:3}, leverage {=A/E:2} → ROE {=N/E*100:2}%. After: equity {=E-400}, net income {=N-15}, ROE = {=(N-15)/(E-400)*100:2}%.
ROE rises, but (Modigliani–Miller) the firm isn't more valuable just from this: equity is riskier and its required return higher;
the tax shield may add a little value, offset by distress risk.''',
kind='calc', diff=2, vars={'S': R(1500, 3000, 100), 'N': R(80, 150, 10), 'A': R(1200, 2000, 100), 'E': R(700, 1000, 100)}, compute={'roe': 'N/E*100'},
check=({'S': 2000, 'N': 100, 'A': 1600, 'E': 800}, {'roe': 12.5})))
qs.append(Q('c31-e03', 31, 'Economic value added', '''
A division has invested capital of {K}, EBIT of {E} and a {t}% tax rate; the WACC is {w}%. What are ROIC and EVA? Should it
take a project needing {k2} more capital that would raise EBIT by {e2}?''', '''
NOPAT = {=E*(1-t/100)}; ROIC = {=E*(1-t/100)/K*100:2}%; EVA = {=E*(1-t/100)} − {=w/100*K} = {=E*(1-t/100)-w/100*K}. Project: NOPAT {=e2*(1-t/100)} on {k2} = {=e2*(1-t/100)/k2*100:2}% vs WACC {w}% →
{?e2*(1-t/100)/k2*100>w|accept (adds {=e2*(1-t/100)-w/100*k2:2} of EVA)|reject (it would cut EVA by {=w/100*k2-e2*(1-t/100):2})}.''',
kind='calc', vars={'K': R(400, 800, 100), 'E': R(60, 120, 10), 't': C(25), 'w': R(8, 11), 'k2': C(100), 'e2': R(9, 16)}, constraints=['abs(e2*0.75-w)>0.2'],
compute={}, check=({'K': 500, 'E': 80, 't': 25, 'w': 10, 'k2': 100, 'e2': 12}, {})))
qs.append(Q('c31-e04', 31, 'Residual income valuation', '''
A firm has book equity of {B}, expected ROE of {roe}% forever, a payout ratio of {po}% and a cost of equity of {r}%. Value the
equity with the residual income model and check with the Gordon model. What's the P/B ratio?''', '''
g = (1 − payout) × ROE = {g:2}%. RI₁ = {=roe/100*B:2} − {=r/100*B:2} = {=(roe-r)/100*B:2}; V = {B} + {=(roe-r)/100*B:2}/({=r/100:3} − {=g/100:3}) = {v:2}.
Gordon: D₁ = {=po/100*roe/100*B:2}; V = {=po/100*roe/100*B:2}/({=(r-g)/100:3}) = {v:2}. P/B = {=v/B:2}.''',
kind='calc', diff=2, vars={'B': R(100, 400, 50), 'roe': R(10, 16), 'po': C(40, 50, 60, 75), 'r': R(8, 11)}, compute={'g': '(1-po/100)*roe', 'v': 'po/100*roe/100*B/((r-(1-po/100)*roe)/100)'},
constraints=['r>(1-po/100)*roe+1'], check=({'B': 200, 'roe': 12, 'po': 50, 'r': 9}, {'v': 400})))
qs.append(Q('c31-e05', 31, 'Accruals and earnings quality', '''
A company reports net income of {N} but operating cash flow of only {cfo}. Receivables rose by {dr} and inventory by {di};
payables were unchanged; depreciation was {d}. Can you reconcile net income to CFO? What would you ask management?''', '''
CFO = {N} + {d} − {dr} − {di} + 0 = {cfo}; accruals = {=N-cfo}. Ask: why receivables grew so much faster than sales (are customers
paying? revenue recognised early?), why inventory built up (slowing sales, obsolescence?), and whether credit terms or revenue
policies changed.''',
kind='calc', vars={'N': R(40, 80, 5), 'd': R(5, 15), 'dr': R(20, 40, 5), 'di': R(10, 20, 5)}, compute={'cfo': 'N+d-dr-di'}, check=({'N': 50, 'd': 10, 'dr': 35, 'di': 15}, {'cfo': 10})))
qs.append(Q('c31-e06', 31, 'Break-even analysis', '''
My café sells coffee for {p}; variable cost per cup is {v}. Monthly fixed costs are {F}. What's the break-even volume, and the
volume needed for a monthly profit of {T}? If rent rises by {k} a month, how many more cups to keep the same profit?''', '''
Contribution {=p-v:2} per cup. Break-even = {F}/{=p-v:2} = {=F/(p-v):0} cups. Target: ({F} + {T})/{=p-v:2} = {=(F+T)/(p-v):0} cups. Extra rent needs
{k}/{=p-v:2} = {=k/(p-v):0} more cups a month.''',
kind='calc', vars={'p': R(3, 5, 0.5), 'v': R(0.8, 1.5, 0.1), 'F': R(8000, 20000, 1000), 'T': R(3000, 9000, 1000), 'k': R(600, 1800, 200)}, compute={'be': 'F/(p-v)'},
check=({'p': 3.5, 'v': 1.1, 'F': 12000, 'T': 6000, 'k': 1200}, {'be': 5000})))
qs.append(Q('c31-e07', 31, 'Degree of operating leverage', '''
Two firms each earn operating profit of 100 on sales of 1,000. Firm A has fixed costs of {fa}; Firm B has fixed costs of {fb}.
What's each firm's DOL, and what happens to operating profit if sales fall {d}%?''', '''
A: contribution {=100+fa}, DOL {=(100+fa)/100:2}; profit → {=(100+fa)*(1-d/100)-fa:1} ({=-(100+fa)/100*d:1}%). B: contribution {=100+fb}, DOL {=(100+fb)/100:2}; profit →
{=(100+fb)*(1-d/100)-fb:1} ({=-(100+fb)/100*d:1}%). High fixed costs amplify swings.''',
kind='calc', vars={'fa': R(50, 150, 50), 'fb': R(300, 600, 100), 'd': C(10, 20)}, compute={}, check=({'fa': 100, 'fb': 500, 'd': 20}, {})))
qs.append(Q('c31-e08', 31, 'Special orders with a capacity constraint', '''
Our plant has capacity of {cap} units and currently sells {s} at {p}; variable cost is {v}, fixed cost 250,000. A customer
offers to buy {q} units at {o}. Should we accept? Consider capacity and accepting only part of the order.''', '''
Spare capacity {=cap-s}. Each spare unit used earns {o} − {v} = {=o-v}: {=(cap-s)*(o-v)}. The other {=q-(cap-s)} units would displace regular sales, each
giving up {=p-v} to earn {=o-v}: a loss of {=(q-cap+s)*(p-o)}. Full order net: {=(cap-s)*(o-v)-(q-cap+s)*(p-o)}. Best: accept only {=cap-s} units if possible (+{=(cap-s)*(o-v)}).''',
kind='calc', diff=2, vars={'cap': C(50000), 's': R(42000, 47000, 1000), 'p': C(20), 'v': C(12), 'q': R(6000, 10000, 1000), 'o': R(14, 17)}, constraints=['q>cap-s', 'o>v'],
compute={'net': '(cap-s)*(o-v)-(q-cap+s)*(p-o)'}, check=({'cap': 50000, 's': 45000, 'p': 20, 'v': 12, 'q': 8000, 'o': 15}, {'net': 0})))
qs.append(Q('c31-e09', 31, 'Activity-based costing', '''
Our factory makes Standard (10,000 units, batches of 1,000, 20,000 machine hours, 10 set-ups) and Custom (1,000 units,
batches of 50, 5,000 machine hours, 20 set-ups). Overhead 400,000: 250,000 machine-related, 150,000 set-ups. Custom sells for
{p} with direct costs of 40 per unit. Is it profitable under traditional allocation (all overhead on machine hours)? Under
ABC? What do you recommend?''', '''
Traditional: 16/hour → Custom overhead 80/unit, cost 120 → margin {=p-120}. ABC: machine 10/hour + set-ups 5,000 each → Custom overhead
150/unit, cost 190 → margin {=p-190} per unit ({=(p-190)*1000} a year). Recommend repricing Custom, cutting set-up costs (bigger batches,
faster changeovers), or dropping it — after checking which overheads would actually be avoided.''',
kind='calc', diff=2, vars={'p': C(120, 130, 150, 170)}, compute={}, check=({'p': 120}, {})))
qs.append(Q('c31-e10', 31, 'Labour variances', '''
Standard labour is 0.5 hours per unit at {sr} per hour. This month we made {u} units using {h} hours at a total cost of {c}.
What are the labour rate and efficiency variances?''', '''
Actual rate = {c}/{h} = {=c/h:2}. Standard hours for actual output = {=u/2}. Rate variance = ({=c/h:2} − {sr}) × {h} = {=c-sr*h:0} ({?c<sr*h|favourable|unfavourable}).
Efficiency variance = ({h} − {=u/2}) × {sr} = {=(h-u/2)*sr:0} ({?h>u/2|unfavourable|favourable}). Total {=c-sr*u/2:0}.''',
kind='calc', vars={'sr': R(20, 30), 'u': R(3000, 6000, 500), 'dh': R(-100, 300, 50), 'ar': R(-1.5, 1.5, 0.5)}, compute={'h': 'u/2+dh', 'c': '(u/2+dh)*(sr+ar)'},
constraints=['dh!=0', 'ar!=0'], check=({'sr': 24, 'u': 4000, 'dh': 150, 'ar': -0.5}, {'h': 2150, 'c': 50525})))
write(7, 'Accountant', 'rank07_accountant.json', qs)
