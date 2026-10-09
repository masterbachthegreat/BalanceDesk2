# Questions where the customer sends their data as an attached file (a small table) instead of
# typing it all out. qlib.write() swaps in the new text and adds the attachment. Cells may use the
# same {placeholders} as the question text. The solution stays as written in the rank file.

def A(file, title, columns, rows, note=None):
    d = {'file': file, 'title': title, 'columns': columns, 'rows': rows}
    if note:
        d['note'] = note
    return d

ATTACH = {
    'c10-e02': ('''Our café, Harbour Coffee: I've attached our 31 January balance sheet and the list of what happened in
February. Could you put together the 28 February balance sheet, February's income statement, and the operating cash flow?''',
        A('harbour_coffee_feb.xlsx', 'Harbour Coffee: balance sheet 31 Jan and February transactions',
          ['Item', 'Amount'],
          [['Cash', '45,000'], ['Receivables (owed by the office upstairs)', '3,000'], ['Inventory (supplies)', '2,000'], ['Equipment', '29,500'],
           ['Loan', '20,000'], ['Payables', '4,000'], ['Interest payable', '100'], ['Share capital', '50,000'], ['Retained earnings', '5,400'],
           ['— February —', ''], ['Drinks sold for cash', '20,000'], ['…using supplies that cost', '7,000'], ['Supplies bought on credit', '9,000'],
           ['Cash collected from the office', '3,000'], ['Paid to supplier', '10,000'], ['Wages paid', '7,000'], ['Depreciation', '500'],
           ['Interest accrued (not paid)', '100']])),
    'c10-x09': ('''Attached is what my household bought in the base period and now. What are the Laspeyres, Paasche and Fisher price indexes?''',
        A('household_spending.csv', 'Household purchases', ['Item', 'Base qty', 'Base price', 'Current qty', 'Current price'],
          [['Bread (loaves)', '100', '2.00', '95', '2.20'], ['Phone', '1', '500', '1.2', '{ph}'], ["Rent (months)", '12', '800', '12', '840']])),
    'c10-e09': ('''A toy economy for my macro class (data attached). Using year 1 as the base, what's real GDP growth and the GDP
deflator for year 2? Why would a chain-weighted measure give a different answer?''',
        A('apples_computers.csv', 'Output and prices', ['Good', 'Y1 quantity', 'Y1 price', 'Y2 quantity', 'Y2 price'],
          [['Apples', '100', '1', '110', '1.2'], ['Computers', '10', '100', '15', '80']])),
    'c10-x07': ('''Here's a little bread supply chain (table attached); households buy all the bread, and the oven goes to the
bakery. What's GDP by the production, income and expenditure approaches?''',
        A('bread_chain.csv', 'Who produces what', ['Producer', 'Output', 'Wages', 'Profit', 'Inputs bought'],
          [['Farm (wheat)', '100', '60', '40', '—'], ['Mill (flour)', '250', '100', '50', 'wheat'], ['Bakery (bread)', '400', '110', '40', 'flour'],
           ['Machine-maker (oven for the bakery)', '50', '30', '20', '—']])),
    'c11-e08': ('''I've attached the incomes of a group of ten people. What share of total income goes to the top 10% and the top 20%,
and what's the 90/10 ratio (using the ninth and first values)?''',
        A('incomes.csv', 'Incomes (thousands)', ['Person', 'Income'], [[str(i + 1), str(v)] for i, v in enumerate([5, 8, 10, 12, 15, 18, 20, 25, 37, 50])])),
    'c18-e08': ('''We're comparing two forecasting models; the outturns and forecasts are in the attached sheet. What are the RMSE and
mean absolute error of each? Which model is better?''',
        A('forecast_comparison.xlsx', 'Outturns vs forecasts', ['Period', 'Outturn', 'Model A', 'Model B'],
          [['1', '3', '4', '3'], ['2', '5', '4', '4'], ['3', '4', '4', '5'], ['4', '6', '5', '5']])),
    'c16-e01': ('''Can you run a regression by hand for me? Data attached. What are the OLS intercept and slope, the residuals, and R²?''',
        A('regression_data.csv', 'Data', ['x', 'y'], [['0', '1'], ['1', '3'], ['2', '2'], ['3', '6']])),
    'c14-e02': ('''What's the sample correlation between x and y in the attached data?''',
        A('xy.csv', 'Paired observations', ['x', 'y'], [['1', '2'], ['2', '4'], ['3', '5'], ['4', '4'], ['5', '5']])),
    'c27-e06': ('''My design studio started on 1 March; I've attached everything that happened during March. The computers have a
3-year life with no residual value. What's March's profit (ignore tax) and our 31 March balance sheet?''',
        A('studio_march.xlsx', 'March transactions', ['#', 'What happened', 'Amount'],
          [['1', 'Owners invested cash', '40,000'], ['2', 'Bought computers for cash', '12,000'], ['3', 'Paid three months of rent in advance', '3,000'],
           ['4', 'Billed clients (15,000 received in cash)', '25,000'], ['5', 'Paid staff', '9,000'], ['6', 'Phone bill received, unpaid at month end', '400']])),
    'c28-e06': ('''Our inventory movements are in the attached sheet. What are cost of goods sold, ending inventory and gross profit
under FIFO, weighted average and (periodic) LIFO? What's the LIFO reserve?''',
        A('inventory_movements.xlsx', 'Inventory', ['Event', 'Units', 'Price per unit'],
          [['Opening inventory', '50', '{c0}'], ['Purchase 1', '150', '{c1}'], ['Purchase 2', '100', '{c2}'], ['Sales', '220', '{p}']])),
    'c28-e10': ('''I've attached figures for two firms. What's each firm's cash conversion cycle? If each grows revenue 10% with
unchanged ratios, how much extra working capital does each need?''',
        A('firms_xy.xlsx', 'Two firms', ['', 'Firm X', 'Firm Y'],
          [['Revenue', '1,200,000', '1,200,000'], ['COGS', '800,000', '800,000'], ['Inventory', '{ix}', '40,000'], ['Receivables', '{rx}', '20,000'], ['Payables', '{px}', '140,000']])),
    'c29-e02b': ('''Details of our new equipment are attached. What's the units-of-production depreciation schedule?''',
        A('equipment.xlsx', 'Equipment', ['Item', 'Value'],
          [['Cost', '60,000'], ['Residual value', '6,000'], ['Expected total output (units)', '27,000'], ['Year 1 output', '9,000'], ['Year 2 output', '8,000'], ['Year 3 output', '6,000'], ['Year 4 output', '4,000']])),
    'c30-e05': ('''We bought equipment for 100,000; the accounting and tax depreciation are in the attached sheet. Profit before
depreciation is 150,000 a year and the tax rate is 25%. In year 2 the deferred tax liability was 3,750. What's the deferred tax
liability at the end of years 3, 4 and 5, and the tax expense each year?''',
        A('depreciation_book_vs_tax.xlsx', 'Depreciation', ['Year', 'Accounting (straight-line)', 'Tax'],
          [['1', '20,000', '40,000'], ['2', '20,000', '15,000'], ['3', '20,000', '15,000'], ['4', '20,000', '15,000'], ['5', '20,000', '15,000']])),
    'c31-e09': ('''Our product and overhead data are attached. Custom sells for {p} with direct costs of 40 per unit. Is it profitable
under traditional allocation (all overhead on machine hours)? Under ABC? What do you recommend?''',
        A('products_overhead.xlsx', 'Products and overhead', ['', 'Standard', 'Custom'],
          [['Units', '10,000', '1,000'], ['Batch size', '1,000', '50'], ['Machine hours', '20,000', '5,000'], ['Set-ups', '10', '20']],
          note='Overhead 400,000: 250,000 machine-related, 150,000 set-up-related.')),
    'c32-e06': ('''We have a budget of 700 for the projects in the attached list, and projects can't be split. Which should we choose?''',
        A('project_shortlist.csv', 'Candidate projects', ['Project', 'Cost', 'NPV'], [['A', '300', '60'], ['B', '400', '90'], ['C', '350', '80'], ['D', '250', '45']])),
    'c34-e08': ('''I'm comparing two funds (numbers attached; the risk-free rate was 3%). What are each fund's Sharpe ratio, alpha and
Treynor ratio? Which would you prefer as your only investment, and which as a small addition to a diversified portfolio?''',
        A('fund_comparison.xlsx', 'Last year', ['', 'Return', 'Std dev', 'Beta'],
          [['Market', '10%', '16%', '1.0'], ['Fund X', '12%', '20%', '1.4'], ['Fund Y', '9%', '12%', '0.7']])),
    'c37-e02': ('''I've attached our DCF inputs. What's the terminal value, enterprise value, equity value per share, and the share of
EV from the terminal value?''',
        A('dcf_inputs.xlsx', 'DCF inputs', ['Input', 'Value'],
          [['FCFF year 1', '{f1}'], ['FCFF year 2', '{f2}'], ['FCFF year 3', '{f3}'], ['Growth after year 3', '{g}%'], ['WACC', '{w}%'], ['Net debt', '{nd}'], ['Shares', '{n}']])),
    'c37-e06': ('''The peer multiples are attached. Our target has EBITDA of {e} and net debt of {nd}. What's its equity value using the
median and the mean? Which would you use, and what would you investigate?''',
        A('peer_multiples.csv', 'Peers', ['Peer', 'EV/EBITDA'], [['Peer 1', '6.5'], ['Peer 2', '7.5'], ['Peer 3', '8'], ['Peer 4', '9'], ['Peer 5', '15']])),
    'c14-e07': ('''My portfolio is in the attached sheet. The correlation is 0.5 between assets 1 and 2 and zero otherwise. What are
the portfolio's expected return and volatility?''',
        A('portfolio.xlsx', 'Portfolio', ['Asset', 'Weight', 'Expected return', 'Volatility'],
          [['1', '0.5', '8%', '20%'], ['2', '0.3', '6%', '15%'], ['3', '0.2', '4%', '5%']])),
    'c03-e10': ('''I've attached the 2024 U.S. federal tax brackets for single filers. What's the tax, the average rate and the marginal
rate on taxable incomes of $40,000 and $150,000?''',
        A('tax_brackets_2024.csv', '2024 brackets (single)', ['Taxable income', 'Rate'],
          [['up to $11,600', '10%'], ['$11,600 – $47,150', '12%'], ['$47,150 – $100,525', '22%'], ['$100,525 – $191,950', '24%']])),
    'c24-e11': ('''The market shares are in the attached file. What are CR4 and the HHI? The two smallest firms want to merge. How much
does the HHI rise, and would the merger be presumed anti-competitive under the 2023 U.S. guidelines (HHI > 1,800 and
increase > 100)?''',
        A('market_shares.csv', 'Market shares', ['Firm', 'Share'],
          [['Firm 1', '{s1}%'], ['Firm 2', '{s2}%'], ['Firm 3', '{s3}%'], ['Firm 4', '{s4}%'], ['Firm 5', '{s5}%']])),
}
