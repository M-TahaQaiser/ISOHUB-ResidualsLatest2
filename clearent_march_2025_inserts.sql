-- BLU SUSHI
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002435956', 'BLU SUSHI', 'BLU SUSHI', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 2178.82, 196734.65, 2521
FROM merchants m, processors p 
WHERE m.mid = '6588000002435956' AND p.name = 'Clearent';

-- LOW KEY FISHERIES
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002119642', 'LOW KEY FISHERIES', 'LOW KEY FISHERIES', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 1227.47, 79030.41, 1259
FROM merchants m, processors p 
WHERE m.mid = '6588000002119642' AND p.name = 'Clearent';

-- NUTRITION CONNECTION BALANCE
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002331049', 'NUTRITION CONNECTION BALANCE', 'NUTRITION CONNECTION BALANCE', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 666.22, 76773.77, 148
FROM merchants m, processors p 
WHERE m.mid = '6588000002331049' AND p.name = 'Clearent';

-- TOBACCO HAVEN
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002315281', 'TOBACCO HAVEN', 'TOBACCO HAVEN', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 652.16, 141114.9, 5411
FROM merchants m, processors p 
WHERE m.mid = '6588000002315281' AND p.name = 'Clearent';

-- AISD DIck Bivins Stadium
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002406122', 'AISD DIck Bivins Stadium', 'AISD DIck Bivins Stadium', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 602.65, 6223.45, 955
FROM merchants m, processors p 
WHERE m.mid = '6588000002406122' AND p.name = 'Clearent';

-- Great Events Catering
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002372241', 'Great Events Catering', 'Great Events Catering', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 595.07, 88702.86, 19
FROM merchants m, processors p 
WHERE m.mid = '6588000002372241' AND p.name = 'Clearent';

-- STEVE'S AUTO CENTER OF CONWAY, INC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002302396', 'STEVE'S AUTO CENTER OF CONWAY, INC', 'STEVE'S AUTO CENTER OF CONWAY, INC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 561.54, 28579.44, 62
FROM merchants m, processors p 
WHERE m.mid = '6588000002302396' AND p.name = 'Clearent';

-- PRECIDENT - AR
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002693984', 'PRECIDENT - AR', 'PRECIDENT - AR', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 518.96, 68606.01, 80
FROM merchants m, processors p 
WHERE m.mid = '6588000002693984' AND p.name = 'Clearent';

-- True Builders Inc.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002387512', 'True Builders Inc.', 'True Builders Inc.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 505.28, 60550, 33
FROM merchants m, processors p 
WHERE m.mid = '6588000002387512' AND p.name = 'Clearent';

-- TOBACCO HAVEN 4
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002769487', 'TOBACCO HAVEN 4', 'TOBACCO HAVEN 4', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 448.68, 63890, 2191
FROM merchants m, processors p 
WHERE m.mid = '6588000002769487' AND p.name = 'Clearent';

-- PRECIDENT - LARGO FL
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002698215', 'PRECIDENT - LARGO FL', 'PRECIDENT - LARGO FL', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 408.16, 53206.3, 77
FROM merchants m, processors p 
WHERE m.mid = '6588000002698215' AND p.name = 'Clearent';

-- NADA MARKET
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002481430', 'NADA MARKET', 'NADA MARKET', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 400.46, 35599.15, 3342
FROM merchants m, processors p 
WHERE m.mid = '6588000002481430' AND p.name = 'Clearent';

-- Blue Martini Galleria
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002418804', 'Blue Martini Galleria', 'Blue Martini Galleria', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 386.67, 262234.87, 3372
FROM merchants m, processors p 
WHERE m.mid = '6588000002418804' AND p.name = 'Clearent';

-- FIVE BROTHERS TWO
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002530889', 'FIVE BROTHERS TWO', 'FIVE BROTHERS TWO', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 386.39, 83064.65, 3715
FROM merchants m, processors p 
WHERE m.mid = '6588000002530889' AND p.name = 'Clearent';

-- ARKANSAS SELECT TAX SERVICES, INC.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002516151', 'ARKANSAS SELECT TAX SERVICES, INC.', 'ARKANSAS SELECT TAX SERVICES, INC.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 380.85, 98865.66, 439
FROM merchants m, processors p 
WHERE m.mid = '6588000002516151' AND p.name = 'Clearent';

-- ALL FIRE SERVICES, INC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002578847', 'ALL FIRE SERVICES, INC', 'ALL FIRE SERVICES, INC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 358.06, 157974.9, 74
FROM merchants m, processors p 
WHERE m.mid = '6588000002578847' AND p.name = 'Clearent';

-- GARDENING ANGEL NURSERY
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002711158', 'GARDENING ANGEL NURSERY', 'GARDENING ANGEL NURSERY', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 353.56, 167319.92, 238
FROM merchants m, processors p 
WHERE m.mid = '6588000002711158' AND p.name = 'Clearent';

-- TOBACCO HAVEN
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002278513', 'TOBACCO HAVEN', 'TOBACCO HAVEN', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 344.87, 118354.42, 4042
FROM merchants m, processors p 
WHERE m.mid = '6588000002278513' AND p.name = 'Clearent';

-- Magnolia Square Nursing and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318749', 'Magnolia Square Nursing and Rehab', 'Magnolia Square Nursing and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 320.21, 19333.41, 6
FROM merchants m, processors p 
WHERE m.mid = '6588000002318749' AND p.name = 'Clearent';

-- ALL RITE PAVING CONTRACTORS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002730778', 'ALL RITE PAVING CONTRACTORS', 'ALL RITE PAVING CONTRACTORS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 308.78, 71225.5, 17
FROM merchants m, processors p 
WHERE m.mid = '6588000002730778' AND p.name = 'Clearent';

-- HEARTLAND FORD
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002270981', 'HEARTLAND FORD', 'HEARTLAND FORD', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 265.98, 167417.69, 354
FROM merchants m, processors p 
WHERE m.mid = '6588000002270981' AND p.name = 'Clearent';

-- COX & CRESWELL PLLC CPA
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002509719', 'COX & CRESWELL PLLC CPA', 'COX & CRESWELL PLLC CPA', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 245.77, 92004.98, 148
FROM merchants m, processors p 
WHERE m.mid = '6588000002509719' AND p.name = 'Clearent';

-- RELIABLE JET MAINTENANCE
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002444693', 'RELIABLE JET MAINTENANCE', 'RELIABLE JET MAINTENANCE', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 225.95, 49202.71, 14
FROM merchants m, processors p 
WHERE m.mid = '6588000002444693' AND p.name = 'Clearent';

-- Evergreen Living Center at Stagecoach
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318533', 'Evergreen Living Center at Stagecoach', 'Evergreen Living Center at Stagecoach', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 218.82, 18525.47, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000002318533' AND p.name = 'Clearent';

-- EL JALISCO WEWAHITCHKA INC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002563492', 'EL JALISCO WEWAHITCHKA INC', 'EL JALISCO WEWAHITCHKA INC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 218.67, 62067.82, 1402
FROM merchants m, processors p 
WHERE m.mid = '6588000002563492' AND p.name = 'Clearent';

-- HORIZON SOUTH
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002272839', 'HORIZON SOUTH', 'HORIZON SOUTH', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 214.59, 33991.1, 484
FROM merchants m, processors p 
WHERE m.mid = '6588000002272839' AND p.name = 'Clearent';

-- TOBACCO HAVEN 3
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002466753', 'TOBACCO HAVEN 3', 'TOBACCO HAVEN 3', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 203.46, 45564.11, 2210
FROM merchants m, processors p 
WHERE m.mid = '6588000002466753' AND p.name = 'Clearent';

-- JOHN P SHELDON OD PA
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002854248', 'JOHN P SHELDON OD PA', 'JOHN P SHELDON OD PA', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 201.87, 39835.33, 178
FROM merchants m, processors p 
WHERE m.mid = '6588000002854248' AND p.name = 'Clearent';

-- CONWAY COLLISION CENTER
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002495737', 'CONWAY COLLISION CENTER', 'CONWAY COLLISION CENTER', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 201.77, 81441.74, 53
FROM merchants m, processors p 
WHERE m.mid = '6588000002495737' AND p.name = 'Clearent';

-- LEAD APRON CATERING LLC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002741502', 'LEAD APRON CATERING LLC', 'LEAD APRON CATERING LLC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 200.73, 14270.66, 615
FROM merchants m, processors p 
WHERE m.mid = '6588000002741502' AND p.name = 'Clearent';

-- COFFEY TIRE & BRAKE INC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002765600', 'COFFEY TIRE & BRAKE INC', 'COFFEY TIRE & BRAKE INC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 199.46, 57704.53, 185
FROM merchants m, processors p 
WHERE m.mid = '6588000002765600' AND p.name = 'Clearent';

-- TTT MEATS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002139517', 'TTT MEATS', 'TTT MEATS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 184.35, 11474.91, 584
FROM merchants m, processors p 
WHERE m.mid = '6588000002139517' AND p.name = 'Clearent';

-- RIB CRIB
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002533370', 'RIB CRIB', 'RIB CRIB', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 148.92, 156374.68, 3903
FROM merchants m, processors p 
WHERE m.mid = '6588000002533370' AND p.name = 'Clearent';

-- Acunto Landscape & Design
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002375111', 'Acunto Landscape & Design', 'Acunto Landscape & Design', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 135.46, 5444.91, 15
FROM merchants m, processors p 
WHERE m.mid = '6588000002375111' AND p.name = 'Clearent';

-- SITN IN THE KEYS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002548436', 'SITN IN THE KEYS', 'SITN IN THE KEYS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 135.15, 5470.4, 12
FROM merchants m, processors p 
WHERE m.mid = '6588000002548436' AND p.name = 'Clearent';

-- PRECIDENT - ST PETE FL
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002698223', 'PRECIDENT - ST PETE FL', 'PRECIDENT - ST PETE FL', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 130.36, 14886.96, 27
FROM merchants m, processors p 
WHERE m.mid = '6588000002698223' AND p.name = 'Clearent';

-- HAYES MARINE SERVICE LLC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002533651', 'HAYES MARINE SERVICE LLC', 'HAYES MARINE SERVICE LLC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 120.58, 7112.26, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002533651' AND p.name = 'Clearent';

-- MOTORSPORTS AUTHORITY-HOT SPRINGS CLOSED
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000001914894', 'MOTORSPORTS AUTHORITY-HOT SPRINGS CLOSED', 'MOTORSPORTS AUTHORITY-HOT SPRINGS CLOSED', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 103.64, 7797.27, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000001914894' AND p.name = 'Clearent';

-- KENNY STRANGE ELECTRIC AND SERVICE COMPANY, INC.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002572964', 'KENNY STRANGE ELECTRIC AND SERVICE COMPANY, INC.', 'KENNY STRANGE ELECTRIC AND SERVICE COMPANY, INC.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 92.66, 15704.6, 29
FROM merchants m, processors p 
WHERE m.mid = '6588000002572964' AND p.name = 'Clearent';

-- COMPANIONS CLOTHIER CLOSED
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002518579', 'COMPANIONS CLOTHIER CLOSED', 'COMPANIONS CLOTHIER CLOSED', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 86.72, 24501.87, 100
FROM merchants m, processors p 
WHERE m.mid = '6588000002518579' AND p.name = 'Clearent';

-- BIG PINE FLOWER SHOP
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002535292', 'BIG PINE FLOWER SHOP', 'BIG PINE FLOWER SHOP', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 85.27, 4573.44, 31
FROM merchants m, processors p 
WHERE m.mid = '6588000002535292' AND p.name = 'Clearent';

-- FLORIDA CARPENTERS REGIONAL COUNCIL
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002465011', 'FLORIDA CARPENTERS REGIONAL COUNCIL', 'FLORIDA CARPENTERS REGIONAL COUNCIL', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 83.24, 626.48, 13
FROM merchants m, processors p 
WHERE m.mid = '6588000002465011' AND p.name = 'Clearent';

-- ARKANSAS SELECT TAX SERVICES
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002516185', 'ARKANSAS SELECT TAX SERVICES', 'ARKANSAS SELECT TAX SERVICES', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 83.2, 22830.43, 122
FROM merchants m, processors p 
WHERE m.mid = '6588000002516185' AND p.name = 'Clearent';

-- Edgewood Health and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318509', 'Edgewood Health and Rehab', 'Edgewood Health and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 82.01, 2601.7, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002318509' AND p.name = 'Clearent';

-- RIB CRIB
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002510402', 'RIB CRIB', 'RIB CRIB', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 79.39, 142936.82, 2933
FROM merchants m, processors p 
WHERE m.mid = '6588000002510402' AND p.name = 'Clearent';

-- ENDLESS LAND MANAGEMENT
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002758621', 'ENDLESS LAND MANAGEMENT', 'ENDLESS LAND MANAGEMENT', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 76.09, 3300, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002758621' AND p.name = 'Clearent';

-- HEARTLAND CHRYSLER DODGE JEEP RAM
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002271021', 'HEARTLAND CHRYSLER DODGE JEEP RAM', 'HEARTLAND CHRYSLER DODGE JEEP RAM', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 67.72, 24379.68, 80
FROM merchants m, processors p 
WHERE m.mid = '6588000002271021' AND p.name = 'Clearent';

-- HEARTLAND CHEVROLET GMC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002270932', 'HEARTLAND CHEVROLET GMC', 'HEARTLAND CHEVROLET GMC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 66.39, 22966.26, 47
FROM merchants m, processors p 
WHERE m.mid = '6588000002270932' AND p.name = 'Clearent';

-- BEACH RV LLC CLOSED
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002585214', 'BEACH RV LLC CLOSED', 'BEACH RV LLC CLOSED', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 61.81, 4434.33, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002585214' AND p.name = 'Clearent';

-- Richard Weylman, Inc
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002448298', 'Richard Weylman, Inc', 'Richard Weylman, Inc', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 59.76, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002448298' AND p.name = 'Clearent';

-- Hiram Shaddox Health and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318699', 'Hiram Shaddox Health and Rehab', 'Hiram Shaddox Health and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 56.35, 2873.98, 7
FROM merchants m, processors p 
WHERE m.mid = '6588000002318699' AND p.name = 'Clearent';

-- THE WICKS FOUNDATION FOR VETERANS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002770303', 'THE WICKS FOUNDATION FOR VETERANS', 'THE WICKS FOUNDATION FOR VETERANS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 53.1, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002770303' AND p.name = 'Clearent';

-- COMBUSTION DRIVEN REPAIRS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002843258', 'COMBUSTION DRIVEN REPAIRS', 'COMBUSTION DRIVEN REPAIRS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 53.08, 1829.49, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002843258' AND p.name = 'Clearent';

-- EZ ROLL CASTERS INC.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002580264', 'EZ ROLL CASTERS INC.', 'EZ ROLL CASTERS INC.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 52.14, 281.34, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002580264' AND p.name = 'Clearent';

-- BEN AUTO TECHNICIAN
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002534683', 'BEN AUTO TECHNICIAN', 'BEN AUTO TECHNICIAN', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 49.39, 2359.24, 6
FROM merchants m, processors p 
WHERE m.mid = '6588000002534683' AND p.name = 'Clearent';

-- Alcoa Pines Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002315901', 'Alcoa Pines Health and Rehabilitation', 'Alcoa Pines Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 47.9, 4327.78, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000002315901' AND p.name = 'Clearent';

-- Aqua Vista Pool & Spa LLC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002347672', 'Aqua Vista Pool & Spa LLC', 'Aqua Vista Pool & Spa LLC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 44.95, 5743.38, 26
FROM merchants m, processors p 
WHERE m.mid = '6588000002347672' AND p.name = 'Clearent';

-- St. Elizabeth's Place
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002329852', 'St. Elizabeth's Place', 'St. Elizabeth's Place', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 44.41, 2679.53, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000002329852' AND p.name = 'Clearent';

-- Solomon Center
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002401479', 'Solomon Center', 'Solomon Center', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 42.66, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002401479' AND p.name = 'Clearent';

-- LEMLEY FUNERAL SERVICES, INC.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002482990', 'LEMLEY FUNERAL SERVICES, INC.', 'LEMLEY FUNERAL SERVICES, INC.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 41.26, 1296.5, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000002482990' AND p.name = 'Clearent';

-- PREVENTIVE CARDIOLOGY
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002544898', 'PREVENTIVE CARDIOLOGY', 'PREVENTIVE CARDIOLOGY', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 40.18, 21713.4, 265
FROM merchants m, processors p 
WHERE m.mid = '6588000002544898' AND p.name = 'Clearent';

-- KAYAK KINGS OF KEY WEST CLOSED
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002205862', 'KAYAK KINGS OF KEY WEST CLOSED', 'KAYAK KINGS OF KEY WEST CLOSED', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 39.69, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002205862' AND p.name = 'Clearent';

-- CONWAY DUMPSTER RENTAL
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002463529', 'CONWAY DUMPSTER RENTAL', 'CONWAY DUMPSTER RENTAL', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 39.01, 1134.1, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000002463529' AND p.name = 'Clearent';

-- DIVERSITY MRI
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002306322', 'DIVERSITY MRI', 'DIVERSITY MRI', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 36.41, 3099.65, 17
FROM merchants m, processors p 
WHERE m.mid = '6588000002306322' AND p.name = 'Clearent';

-- SCHAIN AND COMPANY, CPAS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318657', 'SCHAIN AND COMPANY, CPAS', 'SCHAIN AND COMPANY, CPAS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 35.68, 2850, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002318657' AND p.name = 'Clearent';

-- ISLAND SHORES ASSOCIATION INC.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002283364', 'ISLAND SHORES ASSOCIATION INC.', 'ISLAND SHORES ASSOCIATION INC.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 33.58, 394.75, 87
FROM merchants m, processors p 
WHERE m.mid = '6588000002283364' AND p.name = 'Clearent';

-- AMTECH
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002788842', 'AMTECH', 'AMTECH', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 33.43, 1270, 278
FROM merchants m, processors p 
WHERE m.mid = '6588000002788842' AND p.name = 'Clearent';

-- Bailey Creek Health & Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318202', 'Bailey Creek Health & Rehab', 'Bailey Creek Health & Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 31.71, 1439.22, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002318202' AND p.name = 'Clearent';

-- Birch Pointe Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318269', 'Birch Pointe Health and Rehabilitation', 'Birch Pointe Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 31.06, 1703.35, 4
FROM merchants m, processors p 
WHERE m.mid = '6588000002318269' AND p.name = 'Clearent';

-- Ridgecrest Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318897', 'Ridgecrest Health and Rehabilitation', 'Ridgecrest Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 30.44, 925.51, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002318897' AND p.name = 'Clearent';

-- MEDTRUST HEALTH ALLIANCE
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002253805', 'MEDTRUST HEALTH ALLIANCE', 'MEDTRUST HEALTH ALLIANCE', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 27.9, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002253805' AND p.name = 'Clearent';

-- KNOX'S CRANE SERVICE LLC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002786606', 'KNOX'S CRANE SERVICE LLC', 'KNOX'S CRANE SERVICE LLC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 26.1, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002786606' AND p.name = 'Clearent';

-- A-1 CHIMNEY PRO, INC.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002455723', 'A-1 CHIMNEY PRO, INC.', 'A-1 CHIMNEY PRO, INC.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 25.83, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002455723' AND p.name = 'Clearent';

-- Amarillo ISD Caprock High School Food Service
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002437440', 'Amarillo ISD Caprock High School Food Service', 'Amarillo ISD Caprock High School Food Service', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 25.06, 930.7, 302
FROM merchants m, processors p 
WHERE m.mid = '6588000002437440' AND p.name = 'Clearent';

-- SOUTHERNMOST BOAT RENTALS CLOSED
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002523710', 'SOUTHERNMOST BOAT RENTALS CLOSED', 'SOUTHERNMOST BOAT RENTALS CLOSED', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 24.46, 986.78, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002523710' AND p.name = 'Clearent';

-- Heritage Living Center
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318624', 'Heritage Living Center', 'Heritage Living Center', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 24.4, 1279.82, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002318624' AND p.name = 'Clearent';

-- Athletic Building Amarillo ISD
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002406882', 'Athletic Building Amarillo ISD', 'Athletic Building Amarillo ISD', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 24.16, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002406882' AND p.name = 'Clearent';

-- Caprock High School Amarillo ISD
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002406916', 'Caprock High School Amarillo ISD', 'Caprock High School Amarillo ISD', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 24.16, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002406916' AND p.name = 'Clearent';

-- Palo Duro High School AISD
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002406940', 'Palo Duro High School AISD', 'Palo Duro High School AISD', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 24.16, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002406940' AND p.name = 'Clearent';

-- Tascosa High Amarillo ISD
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002406833', 'Tascosa High Amarillo ISD', 'Tascosa High Amarillo ISD', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 24.16, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002406833' AND p.name = 'Clearent';

-- THE MOTORCOACH STORE
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002132702', 'THE MOTORCOACH STORE', 'THE MOTORCOACH STORE', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 23.89, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002132702' AND p.name = 'Clearent';

-- LANGFORD TREE SERVICE LLC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002573053', 'LANGFORD TREE SERVICE LLC', 'LANGFORD TREE SERVICE LLC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 21.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002573053' AND p.name = 'Clearent';

-- ASHFORD AUTO DETAIL
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002482180', 'ASHFORD AUTO DETAIL', 'ASHFORD AUTO DETAIL', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 21.19, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002482180' AND p.name = 'Clearent';

-- NANCY SMITH PHILLIPS
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002572543', 'NANCY SMITH PHILLIPS', 'NANCY SMITH PHILLIPS', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 19.99, 1280, 23
FROM merchants m, processors p 
WHERE m.mid = '6588000002572543' AND p.name = 'Clearent';

-- ISLAMORADA CHAMBER OF COMMERCE
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000001994169', 'ISLAMORADA CHAMBER OF COMMERCE', 'ISLAMORADA CHAMBER OF COMMERCE', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 15.3, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000001994169' AND p.name = 'Clearent';

-- Beebe Retirement Center
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318244', 'Beebe Retirement Center', 'Beebe Retirement Center', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 15.16, 571.96, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002318244' AND p.name = 'Clearent';

-- Chambers Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318392', 'Chambers Health and Rehabilitation', 'Chambers Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 13.54, 1497.47, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002318392' AND p.name = 'Clearent';

-- DEL MEDLIN
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002711174', 'DEL MEDLIN', 'DEL MEDLIN', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 12.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002711174' AND p.name = 'Clearent';

-- FAULKNER COUNTY ANIMAL COALITION INC
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002728798', 'FAULKNER COUNTY ANIMAL COALITION INC', 'FAULKNER COUNTY ANIMAL COALITION INC', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 12.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002728798' AND p.name = 'Clearent';

-- No Weeds Lawn Care Inc. CLOSED
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002428068', 'No Weeds Lawn Care Inc. CLOSED', 'No Weeds Lawn Care Inc. CLOSED', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 12.51, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002428068' AND p.name = 'Clearent';

-- Spring Creek Health & Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002329811', 'Spring Creek Health & Rehab', 'Spring Creek Health & Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 12.06, 519.95, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002329811' AND p.name = 'Clearent';

-- Amarillo ISD Tascosa High Food Service
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002437051', 'Amarillo ISD Tascosa High Food Service', 'Amarillo ISD Tascosa High Food Service', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 11.48, 399.95, 123
FROM merchants m, processors p 
WHERE m.mid = '6588000002437051' AND p.name = 'Clearent';

-- Amarillo High School Amarillo ISD
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002406908', 'Amarillo High School Amarillo ISD', 'Amarillo High School Amarillo ISD', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 10.66, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002406908' AND p.name = 'Clearent';

-- Silver Oaks Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002329670', 'Silver Oaks Health and Rehabilitation', 'Silver Oaks Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 10.53, 257.06, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002329670' AND p.name = 'Clearent';

-- Twin Lakes Therapy and Living
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330363', 'Twin Lakes Therapy and Living', 'Twin Lakes Therapy and Living', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 9.85, 207.98, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002330363' AND p.name = 'Clearent';

-- Amarillo ISD AHS Food Service
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002437424', 'Amarillo ISD AHS Food Service', 'Amarillo ISD AHS Food Service', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 8.59, 242.45, 82
FROM merchants m, processors p 
WHERE m.mid = '6588000002437424' AND p.name = 'Clearent';

-- The Maples Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330322', 'The Maples Health and Rehabilitation', 'The Maples Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 8.53, 233.98, 3
FROM merchants m, processors p 
WHERE m.mid = '6588000002330322' AND p.name = 'Clearent';

-- The Maples at Har-Ber Meadows
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330272', 'The Maples at Har-Ber Meadows', 'The Maples at Har-Ber Meadows', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 7.93, 166.38, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002330272' AND p.name = 'Clearent';

-- Timberlane Health & Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330330', 'Timberlane Health & Rehabilitation', 'Timberlane Health & Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 5.62, 134.84, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002330330' AND p.name = 'Clearent';

-- Amberwood Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318020', 'Amberwood Health and Rehabilitation', 'Amberwood Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 5.09, 88.39, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002318020' AND p.name = 'Clearent';

-- Mountain Meadows Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318764', 'Mountain Meadows Health and Rehabilitation', 'Mountain Meadows Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 4.38, 62.4, 2
FROM merchants m, processors p 
WHERE m.mid = '6588000002318764' AND p.name = 'Clearent';

-- Gassville Therapy and Living
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318558', 'Gassville Therapy and Living', 'Gassville Therapy and Living', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.64, 12.45, 1
FROM merchants m, processors p 
WHERE m.mid = '6588000002318558' AND p.name = 'Clearent';

-- Care Manor Nursing and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318343', 'Care Manor Nursing and Rehab', 'Care Manor Nursing and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318343' AND p.name = 'Clearent';

-- Chapel Woods Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318400', 'Chapel Woods Health and Rehabilitation', 'Chapel Woods Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318400' AND p.name = 'Clearent';

-- CITY OF PORT ST JOE
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002774776', 'CITY OF PORT ST JOE', 'CITY OF PORT ST JOE', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002774776' AND p.name = 'Clearent';

-- Corning Therapy and Living Center
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318434', 'Corning Therapy and Living Center', 'Corning Therapy and Living Center', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318434' AND p.name = 'Clearent';

-- EagleCrest Nursing and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318467', 'EagleCrest Nursing and Rehab', 'EagleCrest Nursing and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318467' AND p.name = 'Clearent';

-- Katherine's Place at Wedington
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318723', 'Katherine's Place at Wedington', 'Katherine's Place at Wedington', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318723' AND p.name = 'Clearent';

-- North Hills Life Care and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318806', 'North Hills Life Care and Rehab', 'North Hills Life Care and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318806' AND p.name = 'Clearent';

-- Oak Ridge Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318830', 'Oak Ridge Health and Rehabilitation', 'Oak Ridge Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318830' AND p.name = 'Clearent';

-- Pioneer Therapy and Living
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318855', 'Pioneer Therapy and Living', 'Pioneer Therapy and Living', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318855' AND p.name = 'Clearent';

-- Rector Nursing and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002318871', 'Rector Nursing and Rehab', 'Rector Nursing and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002318871' AND p.name = 'Clearent';

-- SouthFork River Therapy and Living
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002329712', 'SouthFork River Therapy and Living', 'SouthFork River Therapy and Living', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002329712' AND p.name = 'Clearent';

-- The Crossing at Riverside Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002329894', 'The Crossing at Riverside Health and Rehabilitation', 'The Crossing at Riverside Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002329894' AND p.name = 'Clearent';

-- The Lakes at Maumelle Health and Rehabilitation
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330264', 'The Lakes at Maumelle Health and Rehabilitation', 'The Lakes at Maumelle Health and Rehabilitation', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002330264' AND p.name = 'Clearent';

-- Westwood Health & Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330389', 'Westwood Health & Rehab', 'Westwood Health & Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.6, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002330389' AND p.name = 'Clearent';

-- Windcrest Health and Rehab, Inc.
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002330405', 'Windcrest Health and Rehab, Inc.', 'Windcrest Health and Rehab, Inc.', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.55, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002330405' AND p.name = 'Clearent';

-- Southridge Village Nursing and Rehab
INSERT INTO merchants (mid, dba, legal_name, current_processor) 
VALUES ('6588000002329753', 'Southridge Village Nursing and Rehab', 'Southridge Village Nursing and Rehab', 'Clearent')
ON CONFLICT (mid) DO UPDATE SET current_processor = 'Clearent';

INSERT INTO monthly_data (merchant_id, processor_id, month, net, sales_amount, transactions)
SELECT m.id, p.id, '2025-03', 3.36, 0, 0
FROM merchants m, processors p 
WHERE m.mid = '6588000002329753' AND p.name = 'Clearent';