-- Amex activity.csv -> budget.expenses (July 2026 charges only; payments excluded)
-- 64 rows | Total: $4981.80

-- Pre-insert duplicate check (run first):
-- SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
-- FROM budget.expenses
-- WHERE payment_method LIKE 'AMEX%'
--   AND expense_date >= '2026-07-01'
--   AND expense_date < '2026-08-01'
--   AND is_deleted = false;

INSERT INTO budget.expenses (expense_name, category, amount, payment_method, expense_date, notes)
VALUES
  ('AplPay BJ''SRESTAURANHUNTINGTON BEACH    CA', 'Supplies & Materials', 28.13, 'AMEX -31009', '2026-07-01', '0522        FOOD/BEVERAG
AplPay BJ''SRESTAURANTS MOBI
HUNTINGTON BEACH
CA
FOOD/BEVERAG

Category: Restaurant-Restaurant'),
  ('AplPay TARGET.COM   BROOKLYN PARK       MN', 'Supplies & Materials', 31.39, 'AMEX -31009', '2026-07-02', '91200354248 800-591-3869
AplPay TARGET.COM
BROOKLYN PARK
MN
Description : APPAREL HSWRS/ACC Price : 0.00
800-591-3869

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay DUNKIN #34676ROUND ROCK          TX', 'Supplies & Materials', 18.60, 'AMEX -31009', '2026-07-03', '26031328466 212-507-9782
AplPay DUNKIN #346762 Q35 346762
ROUND ROCK
TX
Description : FAST FOOD RESTAURAN Price : 0.00
212-507-9782

Category: Restaurant-Bar & Café'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 10.81, 'AMEX -31009', '2026-07-04', '4BY9RUWLY2U MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay THE HOME DEPOROUND ROCK          TX', 'Supplies & Materials', 60.74, 'AMEX -31009', '2026-07-05', '07050050451 800-466-3337
AplPay THE HOME DEPOT
ROUND ROCK
TX
800-466-3337

Category: Merchandise & Supplies-Hardware Supplies'),
  ('AplPay TST* BURROS TROUND ROCK          TX', 'Supplies & Materials', 41.87, 'AMEX -31009', '2026-07-05', '21105176187 RESTAURANT
AplPay TST* BURROS TEXMEX BAR AN 00014211
ROUND ROCK
TX
RESTAURANT

Category: Restaurant-Restaurant'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 32.46, 'AMEX -31009', '2026-07-06', 'NY1ANAXEMNP MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay CENTRAL DONUTRound Rock          TX', 'Supplies & Materials', 36.25, 'AMEX -31009', '2026-07-06', '3tFqAXm9TDH squareup.com/receipts
AplPay CENTRAL DONUT
Round Rock
TX
squareup.com/receipts

Category: Restaurant-Bar & Café'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 34.63, 'AMEX -31009', '2026-07-06', '0002:261452 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.3463
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('AplPay BT*DD *DOORDASAN FRANCISCO       CA', 'Supplies & Materials', 16.74, 'AMEX -31009', '2026-07-07', 'QDR8VG6Q    8559731040
AplPay BT*DD *DOORDASH POKEWORKS
SAN FRANCISCO
CA
8559731040

Category: Restaurant-Restaurant'),
  ('AplPay H-E-B #024 00AUSTIN              TX', 'Supplies & Materials', 6.43, 'AMEX -31009', '2026-07-07', '000383813   8009874438
AplPay H-E-B #024 000000000876039
AUSTIN
TX
8009874438

Category: Merchandise & Supplies-Groceries'),
  ('FACEBK *535QPYD8L2  MENLO PARK', 'Supplies & Materials', 251.00, 'AMEX -31009', '2026-07-07', '28031174686 3052154008 / payment-
3052154008 / payment-prov
FACEBK *535QPYD8L2
MENLO PARK
3052154008 / payment-prov

Category: Business Services-Advertising Services'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 102.83, 'AMEX -31009', '2026-07-08', '5ZMFLUR6XAQ MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON.COM          AMZN.COM/BILL       WA', 'Supplies & Materials', 42.53, 'AMEX -31009', '2026-07-08', '5EWYMABD01G BOOK STORES
AMAZON.COM
AMZN.COM/BILL
WA
BOOK STORES

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay BJ''SRESTAURANHUNTINGTON BEACH    CA', 'Supplies & Materials', 28.13, 'AMEX -31009', '2026-07-08', '0522        FOOD/BEVERAG
AplPay BJ''SRESTAURANTS MOBI
HUNTINGTON BEACH
CA
FOOD/BEVERAG

Category: Restaurant-Restaurant'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 8.47, 'AMEX -31009', '2026-07-09', '0002:262049 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.0847
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('AplPay BT*DD *DOORDASAN FRANCISCO       CA', 'Supplies & Materials', 18.79, 'AMEX -31009', '2026-07-10', '1AA33Z2J    8559731040
AplPay BT*DD *DOORDASH POKEWORKS
SAN FRANCISCO
CA
8559731040

Category: Restaurant-Restaurant'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 19.50, 'AMEX -31009', '2026-07-10', '0002:262256 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.195
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 215.95, 'AMEX -31009', '2026-07-11', 'GIXWML8G7K6 MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('DAM-A 43684556018360AUSTIN              TX', 'Supplies & Materials', 77.94, 'AMEX -31009', '2026-07-11', '73011006193 CHOSUNGALBIAUSTIN@GMA
CHOSUNGALBIAUSTIN@GMAIL.C
DAM-A 436845560183609
AUSTIN
TX
CHOSUNGALBIAUSTIN@GMAIL.C

Category: Restaurant-Restaurant'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 21.10, 'AMEX -31009', '2026-07-12', '6T3EW1W167C MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 96.86, 'AMEX -31009', '2026-07-12', '6ACJR3TWA4D MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('FACEBK *X3UECWR7L2  MENLO PARK', 'Supplies & Materials', 251.00, 'AMEX -31009', '2026-07-12', '27768017039 3052154008 / payment-
3052154008 / payment-prov
FACEBK *X3UECWR7L2
MENLO PARK
3052154008 / payment-prov

Category: Business Services-Advertising Services'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 96.56, 'AMEX -31009', '2026-07-12', '0002:262714 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.9656
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 10.81, 'AMEX -31009', '2026-07-14', '1IEDUAQ3Z7W MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 20.55, 'AMEX -31009', '2026-07-14', '6OACL9NEKTX MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 35.71, 'AMEX -31009', '2026-07-14', '0002:262986 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.3571
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 133.21, 'AMEX -31009', '2026-07-15', '2K4DJC8U7F0 MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 247.34, 'AMEX -31009', '2026-07-15', '457Y024Z1HZ MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay IN-N-OUT ROUNROUND ROCK          TX', 'Supplies & Materials', 22.14, 'AMEX -31009', '2026-07-15', '863412      FAST FOOD RESTAURANT
AplPay IN-N-OUT ROUND ROCK
ROUND ROCK
TX
FAST FOOD RESTAURANT

Category: Restaurant-Bar & Café'),
  ('H-E-B GAS/CAR WASH #ROUND ROCK          TX', 'Supplies & Materials', 40.10, 'AMEX -31009', '2026-07-15', '000269009   8009874438
H-E-B GAS/CAR WASH #591 00000000087945
ROUND ROCK
TX
8009874438

Category: Transportation-Fuel'),
  ('AplPay BT*DD *DOORDASAN FRANCISCO       CA', 'Supplies & Materials', 39.46, 'AMEX -31009', '2026-07-16', 'G6P5YE5B    8559731040
AplPay BT*DD *DOORDASH CHIPOTLEM
SAN FRANCISCO
CA
8559731040

Category: Restaurant-Restaurant'),
  ('AplPay PANDA EXPRESSROUND ROCK          TX', 'Supplies & Materials', 22.73, 'AMEX -31009', '2026-07-16', '245734      800-877-8988
AplPay PANDA EXPRESS
ROUND ROCK
TX
Description : FAST FOOD RESTAURAN Price : 0.00
800-877-8988

Category: Restaurant-Bar & Café'),
  ('GREEN MOUNTAIN ENERGHOUSTON             TX', 'Supplies & Materials', 134.70, 'AMEX -31009', '2026-07-16', '2563440726 7152723369       78665
ELECTRICITY
GREEN MOUNTAIN ENERG
HOUSTON
TX
ELECTRICITY
7152723369       78665

Category: Other-Utilities'),
  ('AplPay TRACTOR SUPPLCEDAR PARK          TX', 'Supplies & Materials', 47.97, 'AMEX -31009', '2026-07-17', '0900008971  8668724850
AplPay TRACTOR SUPPLY CO
CEDAR PARK
TX
Description : REFER TO RECEIPT Price : 0.00
8668724850

Category: Merchandise & Supplies-Hardware Supplies'),
  ('AplPay TST* BURROS TROUND ROCK          TX', 'Supplies & Materials', 40.25, 'AMEX -31009', '2026-07-17', '21105176199 RESTAURANT
AplPay TST* BURROS TEXMEX BAR AN 00014211
ROUND ROCK
TX
RESTAURANT

Category: Restaurant-Restaurant'),
  ('FACEBK *3WGMUWM7L2  MENLO PARK', 'Supplies & Materials', 158.70, 'AMEX -31009', '2026-07-17', '27824667500 6507962848 / payment-
6507962848 / payment-prov
FACEBK *3WGMUWM7L2
MENLO PARK
6507962848 / payment-prov

Category: Business Services-Advertising Services'),
  ('AplPay TST* RAMEN TAROUND ROCK          TX', 'Supplies & Materials', 30.31, 'AMEX -31009', '2026-07-18', '21105176200 RESTAURANT
AplPay TST* RAMEN TATSU-YA - ROU 00181835
ROUND ROCK
TX
RESTAURANT

Category: Restaurant-Restaurant'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 35.70, 'AMEX -31009', '2026-07-19', '2HZFZPPS91V MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 9.72, 'AMEX -31009', '2026-07-20', '387QC1KZOD3 MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 119.05, 'AMEX -31009', '2026-07-20', '4TQ05NBZWI9 MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('H-E-B ONLINE #108   855-803-0611        TX', 'Supplies & Materials', 8.70, 'AMEX -31009', '2026-07-20', 'HEB20472942GROCERIES
H-E-B ONLINE #108
855-803-0611
TX
GROCERIES

Category: Merchandise & Supplies-Groceries'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 33.63, 'AMEX -31009', '2026-07-20', '0001:603445 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.3363
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('SUPABASE            SINGAPORE           SG', 'Supplies & Materials', 25.00, 'AMEX -31009', '2026-07-21', 'CH_3TVV8FJD +6587498462
SUPABASE
SINGAPORE
SG
+6587498462

Category: Merchandise & Supplies-Computer Supplies'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 22.61, 'AMEX -31009', '2026-07-23', '7FCH300F1ZX MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 40.66, 'AMEX -31009', '2026-07-23', '1KY4US5T80F MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON.COM          AMZN.COM/BILL       WA', 'Supplies & Materials', 479.89, 'AMEX -31009', '2026-07-24', '6JOAQ4WW6KD BOOK STORES
AMAZON.COM
AMZN.COM/BILL
WA
BOOK STORES

Category: Merchandise & Supplies-Internet Purchase'),
  ('FACEBK *ULJFDYM8L2  MENLO PARK', 'Supplies & Materials', 251.00, 'AMEX -31009', '2026-07-24', '27995285380 650-543-4800 / paymen
650-543-4800 / payment-pr
FACEBK *ULJFDYM8L2
MENLO PARK
650-543-4800 / payment-pr

Category: Business Services-Advertising Services'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 312.69, 'AMEX -31009', '2026-07-25', '1XLF4W6I1M2 MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('H-E-B GAS/CAR WASH #ROUND ROCK          TX', 'Supplies & Materials', 40.63, 'AMEX -31009', '2026-07-26', '000672912   8009874438
H-E-B GAS/CAR WASH #591 00000000087945
ROUND ROCK
TX
8009874438

Category: Transportation-Fuel'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 41.12, 'AMEX -31009', '2026-07-27', '147AK6A1J9S MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay EL POLLO RICOROUND ROCK          TX', 'Supplies & Materials', 23.36, 'AMEX -31009', '2026-07-27', '10156320260 5123397300
AplPay EL POLLO RICO 8 650000013380442
ROUND ROCK
TX
5123397300

Category: Restaurant-Restaurant'),
  ('AplPay TARGET.COM   BROOKLYN PARK       MN', 'Supplies & Materials', 30.29, 'AMEX -31009', '2026-07-27', '91200359504 800-591-3869
AplPay TARGET.COM
BROOKLYN PARK
MN
Description : APPAREL HSWRS/ACC Price : 0.00
800-591-3869

Category: Merchandise & Supplies-Internet Purchase'),
  ('AMAZON MARKEPLACE NA PA', 'Supplies & Materials', 97.41, 'AMEX -31009', '2026-07-28', '3MO344HGQMW MERCHANDISE
AMAZON MARKETPLACE NA PA
AMZN.COM/BILL
WA
MERCHANDISE

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay DOLLAR TREE 0ROUND ROCK          TX', 'Supplies & Materials', 96.61, 'AMEX -31009', '2026-07-28', '800106950498775308733
VARIETY STORES
AplPay DOLLAR TREE 000001162
ROUND ROCK
TX
VARIETY STORES
8775308733

Category: Merchandise & Supplies-Groceries'),
  ('AplPay DOLLAR TREE 0ROUND ROCK          TX', 'Supplies & Materials', 147.33, 'AMEX -31009', '2026-07-28', '800300183828775308733
VARIETY STORES
AplPay DOLLAR TREE 000001162
ROUND ROCK
TX
VARIETY STORES
8775308733

Category: Merchandise & Supplies-Groceries'),
  ('AplPay STARBUCKS    800-782-7282        WA', 'Supplies & Materials', 15.00, 'AMEX -31009', '2026-07-28', 'XESDM1BDF5L GIFT CARD
AplPay STARBUCKS
800-782-7282
WA
GIFT CARD

Category: Restaurant-Bar & Café'),
  ('MEMBERSHIP FEE', 'Supplies & Materials', 95.00, 'AMEX -31017', '2026-07-28', 'MEMBERSHIP FEE

Category: Fees & Adjustments-Fees & Adjustments'),
  ('MEMBERSHIP FEE', 'Supplies & Materials', 375.00, 'AMEX -31009', '2026-07-28', 'MEMBERSHIP FEE

Category: Fees & Adjustments-Fees & Adjustments'),
  ('WALMART.COM 80092562BENTONVILLE         AR', 'Supplies & Materials', 66.16, 'AMEX -31009', '2026-07-28', 'WP19XR6Y2HE 8009256278
WALMART.COM 8009256278 09920
BENTONVILLE
AR
Description : REFER TO RECEIPT Price : 0.00
8009256278

Category: Merchandise & Supplies-Internet Purchase'),
  ('AplPay CHILI''S      ROUND ROCK          TX', 'Supplies & Materials', 34.62, 'AMEX -31009', '2026-07-29', '30202671727 800-983-4637
AplPay CHILI''S
ROUND ROCK
TX
Description : FOOD/BEVERAGE Price : 0.00
800-983-4637

Category: Restaurant-Restaurant'),
  ('AplPay DD *DOORDASHDSAN FRANCISCO       CA', 'Supplies & Materials', 4.99, 'AMEX -31009', '2026-07-29', 'CH_2TYBOMRW +16506819470
AplPay DD *DOORDASHDASHPASS
SAN FRANCISCO
CA
+16506819470

Category: Restaurant-Restaurant'),
  ('HEB CURBSIDE 1111111SAN ANTONIO         TX', 'Supplies & Materials', 9.64, 'AMEX -31009', '2026-07-29', '0001:608867 8004323113
HEB CURBSIDE 111111111
SAN ANTONIO
TX
Description : GROCERY STORES Price : 0.0964
8004323113

Category: Merchandise & Supplies-Groceries'),
  ('AplPay EL POLLO RICOROUND ROCK          TX', 'Supplies & Materials', 33.30, 'AMEX -31009', '2026-07-30', '10156320260 5123397300
AplPay EL POLLO RICO 8 650000013380442
ROUND ROCK
TX
5123397300

Category: Restaurant-Restaurant');

-- Post-insert verification:
-- SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
-- FROM budget.expenses
-- WHERE payment_method LIKE 'AMEX%'
--   AND expense_date >= '2026-07-01'
--   AND expense_date < '2026-08-01'
--   AND is_deleted = false;
-- Expected: 64 rows, $4981.80