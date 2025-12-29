import { db } from "../server/db";
import { merchants } from "../shared/schema";
import { eq } from "drizzle-orm";

const DEMO_AGENCY_ID = 2;

const PROCESSOR_MAP: Record<string, number> = {
  "Global": 4,
  "TRX": 397,
  "MiCamp": 3,
  "Shift4": 393,
  "Merchant Lynx": 5,
  "Fiserv Omaha": 398,
  "Payment Advisors": 1,
  "Rectangle Health": 399,
  "Clearent": 2,
};

const merchantData = [
  { merchantName: "Metro Accounting & Co", mid: "501392155940", dba: "Uptown Remodeling", branch: "AG66", processor: "Global", city: "Madison", state: "GA", activeSince: "2021-10", status: "Active" },
  { merchantName: "Dan's Shop", mid: "751762920116", dba: "Dan's Shop", branch: "A786", processor: "TRX", city: "Hamilton", state: "NC", activeSince: "2021-11", status: "Pending" },
  { merchantName: "Lakeside Shop & Co", mid: "7894676025", dba: "Springfield Supply Brothers", branch: "9687", processor: "MiCamp", city: "Jackson", state: "TN", activeSince: "2024-11", status: "Inactive" },
  { merchantName: "Jim's Car Wash", mid: "NV17666620", dba: "Jim's Car Wash", branch: "BR604", processor: "Shift4", city: "Newport", state: "GA", activeSince: "2019-07", status: "Active" },
  { merchantName: "Premier Restaurant Group", mid: "283398407759", dba: "Premier Restaurant Group", branch: "A895", processor: "Merchant Lynx", city: "Newport", state: "FL", activeSince: "2021-07", status: "Pending" },
  { merchantName: "Riverside Optical Services", mid: "8672767925", dba: "Riverside Optical Services", branch: "AG94", processor: "Merchant Lynx", city: "Jefferson", state: "CA", activeSince: "2022-10", status: "Active" },
  { merchantName: "Elite Advisory Brothers", mid: "4908897746", dba: "Jim's Consulting", branch: "A813", processor: "Fiserv Omaha", city: "Greenville", state: "IL", activeSince: "2022-03", status: "Active" },
  { merchantName: "Urban Bar & Grill", mid: "UE77007263", dba: "Urban Bar & Grill", branch: "AG16", processor: "Payment Advisors", city: "Grant", state: "NC", activeSince: "2023-07", status: "Inactive" },
  { merchantName: "Grant Remodeling Associates", mid: "199153486594", dba: "Grant Remodeling Associates", branch: "BR910", processor: "Global", city: "Fairview", state: "NC", activeSince: "2021-11", status: "Pending" },
  { merchantName: "Prime Quick Lube", mid: "PR68377029", dba: "Prime Quick Lube", branch: "BR740", processor: "Shift4", city: "Grant", state: "MI", activeSince: "2019-07", status: "Active" },
  { merchantName: "Rick's Collision", mid: "ZF28495425", dba: "Monroe Quick Lube", branch: "A607", processor: "Rectangle Health", city: "Washington", state: "MI", activeSince: "2019-06", status: "Active" },
  { merchantName: "Pearl Restaurant Corp", mid: "1897172704", dba: "Pearl Restaurant Corp", branch: "2470", processor: "Payment Advisors", city: "Salem", state: "IL", activeSince: "2020-07", status: "Active" },
  { merchantName: "Peak Legal Services LLC", mid: "NH40904028", dba: "Peak Legal Services LLC", branch: "BR482", processor: "Global", city: "Bristol", state: "TN", activeSince: "2018-06", status: "Pending" },
  { merchantName: "Jade Quick Lube", mid: "4316011524", dba: "Jade Quick Lube", branch: "BR510", processor: "MiCamp", city: "Arlington", state: "IN", activeSince: "2018-02", status: "Inactive" },
  { merchantName: "Florence Deli Enterprises", mid: "7032768210", dba: "Florence Deli Enterprises", branch: "A808", processor: "MiCamp", city: "Washington", state: "VA", activeSince: "2019-09", status: "Active" },
  { merchantName: "Tony's Outlet", mid: "6090481882", dba: "Tony's Outlet", branch: "AG42", processor: "Rectangle Health", city: "Springfield", state: "FL", activeSince: "2019-09", status: "Active" },
  { merchantName: "Oakland Floral", mid: "KQ31169490", dba: "Oakland Floral", branch: "A677", processor: "MiCamp", city: "Lexington", state: "VA", activeSince: "2019-08", status: "Active" },
  { merchantName: "Blue Ridge Real Estate", mid: "9161883137", dba: "Blue Ridge Real Estate", branch: "BR448", processor: "MiCamp", city: "Fairview", state: "TX", activeSince: "2019-12", status: "Active" },
  { merchantName: "Ocean Painting Partners", mid: "AX88152727", dba: "Urban Tavern", branch: "BR502", processor: "Payment Advisors", city: "Lincoln", state: "TN", activeSince: "2024-10", status: "Pending" },
  { merchantName: "Trusted Gift Shop", mid: "5592221308", dba: "Trusted Gift Shop", branch: "AG95", processor: "Rectangle Health", city: "Springfield", state: "FL", activeSince: "2018-02", status: "Active" },
  { merchantName: "Arlington Landscaping Enterprises", mid: "982126110158", dba: "Arlington Landscaping Enterprises", branch: "AG15", processor: "Payment Advisors", city: "Washington", state: "VA", activeSince: "2020-05", status: "Active" },
  { merchantName: "Sunrise Hardware", mid: "DM71360701", dba: "Sunrise Hardware", branch: "A132", processor: "Global", city: "Newport", state: "NC", activeSince: "2021-11", status: "Inactive" },
  { merchantName: "Bill's Wellness LLC", mid: "289466720722", dba: "Bill's Wellness LLC", branch: "A588", processor: "TRX", city: "Florence", state: "FL", activeSince: "2020-01", status: "Inactive" },
  { merchantName: "Crystal Tax Services", mid: "7110648379", dba: "Crystal Tax Services", branch: "AG25", processor: "TRX", city: "Jackson", state: "MI", activeSince: "2023-04", status: "Pending" },
  { merchantName: "Urban Gift Shop", mid: "3984470470", dba: "Urban Gift Shop", branch: "4636", processor: "MiCamp", city: "Newport", state: "PA", activeSince: "2022-01", status: "Active" },
  { merchantName: "Maple Emporium", mid: "KS63348882", dba: "Maple Emporium", branch: "BR908", processor: "Global", city: "Riverside", state: "OH", activeSince: "2020-02", status: "Pending" },
  { merchantName: "Desert Grooming", mid: "CY93809482", dba: "Desert Grooming", branch: "A808", processor: "Payment Advisors", city: "Jackson", state: "WV", activeSince: "2021-09", status: "Pending" },
  { merchantName: "Sunset Jewelers", mid: "ME64577384", dba: "Horizon Pharmacy Inc", branch: "BR874", processor: "Shift4", city: "Clinton", state: "VA", activeSince: "2023-09", status: "Active" },
  { merchantName: "Bob's Studio", mid: "8013459038", dba: "Select Deli", branch: "AG90", processor: "Payment Advisors", city: "Oakland", state: "TX", activeSince: "2022-08", status: "Active" },
  { merchantName: "Mike's Kitchen", mid: "OE14455839", dba: "Bob's Restaurant Family", branch: "BR446", processor: "MiCamp", city: "Oakland", state: "IN", activeSince: "2023-07", status: "Inactive" },
  { merchantName: "Springfield Shop Partners", mid: "DH83285429", dba: "Springfield Shop Partners", branch: "BR621", processor: "Shift4", city: "Monroe", state: "TN", activeSince: "2022-12", status: "Active" },
  { merchantName: "Mike's Salon & Sons", mid: "EQ76774929", dba: "Mike's Salon & Sons", branch: "AG52", processor: "Fiserv Omaha", city: "Franklin", state: "GA", activeSince: "2019-10", status: "Inactive" },
  { merchantName: "Lakeside Building", mid: "570792778381", dba: "Western Supply", branch: "AG45", processor: "Clearent", city: "Greenville", state: "FL", activeSince: "2022-04", status: "Active" },
  { merchantName: "River Pharmacy & Sons", mid: "JS26265682", dba: "River Pharmacy & Sons", branch: "1088", processor: "Merchant Lynx", city: "Washington", state: "GA", activeSince: "2023-09", status: "Inactive" },
  { merchantName: "Northern Insurance", mid: "208053602482", dba: "Pearl Steakhouse", branch: "BR249", processor: "Global", city: "Burlington", state: "IL", activeSince: "2019-08", status: "Active" },
  { merchantName: "Tony's Wellness", mid: "7287808488", dba: "Tony's Wellness", branch: "AG24", processor: "MiCamp", city: "Lexington", state: "MO", activeSince: "2019-11", status: "Active" },
  { merchantName: "Bristol Restaurant Inc", mid: "7593767873", dba: "Bristol Restaurant Inc", branch: "BR685", processor: "Rectangle Health", city: "Jackson", state: "GA", activeSince: "2022-01", status: "Inactive" },
  { merchantName: "Clinton Pub", mid: "7872425612", dba: "Clinton Pub", branch: "A980", processor: "MiCamp", city: "Arlington", state: "OH", activeSince: "2022-11", status: "Active" },
  { merchantName: "Franklin Auto Body Group", mid: "6794888716", dba: "Franklin Auto Body Group", branch: "AG52", processor: "Shift4", city: "Fairview", state: "NC", activeSince: "2022-12", status: "Pending" },
  { merchantName: "Meadow Laundry", mid: "2830291848", dba: "Meadow Laundry", branch: "BR491", processor: "MiCamp", city: "Madison", state: "GA", activeSince: "2024-09", status: "Active" },
  { merchantName: "Desert Wellness", mid: "VX65411866", dba: "Desert Wellness", branch: "AG54", processor: "Clearent", city: "Hamilton", state: "CA", activeSince: "2019-01", status: "Active" },
  { merchantName: "Central Pizzeria", mid: "6652675948", dba: "National Brake Shop Partners", branch: "7416", processor: "Rectangle Health", city: "Newport", state: "MO", activeSince: "2020-09", status: "Active" },
  { merchantName: "Lakeside Auto Repair", mid: "SN92013554", dba: "Lakeside Auto Repair", branch: "A610", processor: "MiCamp", city: "Bristol", state: "GA", activeSince: "2018-02", status: "Active" },
  { merchantName: "Bob's Grooming", mid: "778387877620", dba: "Bob's Grooming", branch: "7948", processor: "Fiserv Omaha", city: "Fairview", state: "IN", activeSince: "2021-08", status: "Active" },
  { merchantName: "Crest Pharmacy Inc", mid: "6886256591", dba: "Crest Pharmacy Inc", branch: "6638", processor: "Clearent", city: "Kingston", state: "TN", activeSince: "2024-11", status: "Pending" },
  { merchantName: "Riverside Floral", mid: "9104126776", dba: "Riverside Floral", branch: "BR335", processor: "TRX", city: "Jefferson", state: "MI", activeSince: "2019-10", status: "Active" },
  { merchantName: "Lexington Veterinary Family", mid: "317700785276", dba: "John's Advisory & Co", branch: "6320", processor: "Shift4", city: "Marion", state: "CA", activeSince: "2022-06", status: "Active" },
  { merchantName: "Bill's Grooming", mid: "573851823733", dba: "Bill's Grooming", branch: "BR793", processor: "Merchant Lynx", city: "Madison", state: "FL", activeSince: "2019-01", status: "Pending" },
  { merchantName: "Pete's Contractors", mid: "806519136985", dba: "Kingston Consulting", branch: "AG37", processor: "Clearent", city: "Clayton", state: "KY", activeSince: "2022-07", status: "Inactive" },
  { merchantName: "Bristol Bazaar", mid: "ST57205500", dba: "Bristol Bazaar", branch: "AG51", processor: "Payment Advisors", city: "Washington", state: "VA", activeSince: "2022-10", status: "Pending" },
  { merchantName: "Pacific Chiropractic", mid: "2391929270", dba: "Pacific Chiropractic", branch: "BR344", processor: "Merchant Lynx", city: "Riverside", state: "VA", activeSince: "2023-11", status: "Inactive" },
  { merchantName: "Trusted Jewelers Co", mid: "DS71756001", dba: "Cedar Plumbing", branch: "A169", processor: "Shift4", city: "Bristol", state: "FL", activeSince: "2024-05", status: "Inactive" },
  { merchantName: "Jim's Daycare", mid: "6708962020", dba: "Manchester Floral Associates", branch: "A826", processor: "TRX", city: "Washington", state: "NC", activeSince: "2018-09", status: "Active" },
  { merchantName: "Salem Brake Shop", mid: "6844833414", dba: "Salem Brake Shop", branch: "A308", processor: "Shift4", city: "Grant", state: "MO", activeSince: "2019-01", status: "Active" },
  { merchantName: "Tom's Spa", mid: "RZ77341529", dba: "Tom's Spa", branch: "7065", processor: "Merchant Lynx", city: "Lexington", state: "KY", activeSince: "2019-12", status: "Active" },
  { merchantName: "Pacific Boutique Services", mid: "793033408368", dba: "Pacific Boutique Services", branch: "5993", processor: "Global", city: "Lexington", state: "KY", activeSince: "2019-06", status: "Active" },
  { merchantName: "Clayton Kitchen Inc", mid: "9360719256", dba: "Urban Cafe", branch: "3991", processor: "Rectangle Health", city: "Arlington", state: "OH", activeSince: "2018-12", status: "Active" },
  { merchantName: "Florence Shop & Co", mid: "7772074242", dba: "Steve's Gym Enterprises", branch: "5667", processor: "Fiserv Omaha", city: "Washington", state: "KY", activeSince: "2023-10", status: "Inactive" },
  { merchantName: "Joe's Outlet", mid: "6845321062", dba: "Oak Printing Group", branch: "A114", processor: "Clearent", city: "Newport", state: "VA", activeSince: "2021-08", status: "Active" },
  { merchantName: "Pearl Roofing", mid: "264756414577", dba: "Pearl Roofing", branch: "BR872", processor: "Merchant Lynx", city: "Kingston", state: "IN", activeSince: "2023-09", status: "Active" },
  { merchantName: "Madison Contractors", mid: "PG63420607", dba: "Midtown Contractors Solutions", branch: "BR565", processor: "Rectangle Health", city: "Madison", state: "GA", activeSince: "2021-03", status: "Pending" },
  { merchantName: "Valley Cafe Services", mid: "650225192231", dba: "Blue Ridge Legal Services Co", branch: "AG37", processor: "Payment Advisors", city: "Grant", state: "MI", activeSince: "2021-06", status: "Inactive" },
  { merchantName: "Rick's Flooring Group", mid: "4078913846", dba: "Rick's Flooring Group", branch: "9719", processor: "TRX", city: "Fairview", state: "PA", activeSince: "2022-07", status: "Pending" },
  { merchantName: "Sam's Grooming", mid: "LT50057048", dba: "Sam's Grooming", branch: "1282", processor: "Shift4", city: "Marion", state: "TN", activeSince: "2020-09", status: "Pending" },
  { merchantName: "Pearl Transmission Partners", mid: "CD71471937", dba: "Pearl Transmission Partners", branch: "BR490", processor: "Global", city: "Grant", state: "FL", activeSince: "2018-01", status: "Active" },
  { merchantName: "Southern Pub", mid: "1356084686", dba: "Southern Pub", branch: "BR885", processor: "Merchant Lynx", city: "Salem", state: "GA", activeSince: "2019-02", status: "Active" },
  { merchantName: "Mike's Supply & Co", mid: "5655320749", dba: "Mike's Supply & Co", branch: "BR563", processor: "MiCamp", city: "Salem", state: "TN", activeSince: "2024-04", status: "Pending" },
  { merchantName: "Bob's Shop", mid: "5284800177", dba: "Horizon Daycare", branch: "6845", processor: "Shift4", city: "Harrison", state: "FL", activeSince: "2021-10", status: "Inactive" },
  { merchantName: "Clinton Grooming Pro", mid: "SC78876947", dba: "Clinton Grooming Pro", branch: "BR903", processor: "MiCamp", city: "Washington", state: "TN", activeSince: "2019-10", status: "Active" },
  { merchantName: "Elite Solutions Group", mid: "1690456107", dba: "Elite Solutions Group", branch: "AG80", processor: "Payment Advisors", city: "Lincoln", state: "WV", activeSince: "2023-02", status: "Pending" },
  { merchantName: "Desert Gift Shop", mid: "6064794414", dba: "Desert Gift Shop", branch: "AG34", processor: "Shift4", city: "Hamilton", state: "FL", activeSince: "2024-10", status: "Active" },
  { merchantName: "Sunrise Consulting", mid: "544231551237", dba: "Sunrise Consulting", branch: "A993", processor: "Merchant Lynx", city: "Riverside", state: "OH", activeSince: "2019-07", status: "Active" },
  { merchantName: "Lakeside Landscaping", mid: "EN30717934", dba: "Lakeside Landscaping", branch: "AG40", processor: "Fiserv Omaha", city: "Bristol", state: "TN", activeSince: "2018-08", status: "Active" },
  { merchantName: "Tom's Landscaping", mid: "6874083524", dba: "Tom's Landscaping", branch: "BR961", processor: "Shift4", city: "Bristol", state: "CA", activeSince: "2024-04", status: "Active" },
  { merchantName: "Sunset Auto Repair", mid: "NU66217882", dba: "Sunset Auto Repair", branch: "AG33", processor: "Global", city: "Lexington", state: "TX", activeSince: "2018-02", status: "Active" },
  { merchantName: "River Auto Body & Sons", mid: "CY60711008", dba: "River Auto Body & Sons", branch: "BR220", processor: "Shift4", city: "Grant", state: "GA", activeSince: "2020-02", status: "Active" },
  { merchantName: "Pete's Outlet", mid: "5979396802", dba: "Pete's Outlet", branch: "A675", processor: "Shift4", city: "Monroe", state: "CA", activeSince: "2018-12", status: "Pending" },
  { merchantName: "Dan's Pub Co", mid: "GY10145134", dba: "Zenith Transmission", branch: "AG98", processor: "Merchant Lynx", city: "Georgetown", state: "IN", activeSince: "2024-08", status: "Pending" },
  { merchantName: "Bill's Hardware", mid: "7321085820", dba: "Bill's Hardware", branch: "1498", processor: "Clearent", city: "Jefferson", state: "MO", activeSince: "2023-08", status: "Inactive" },
  { merchantName: "Marion Barbershop", mid: "8114565754", dba: "Bob's Car Wash LLC", branch: "A783", processor: "Shift4", city: "Grant", state: "IL", activeSince: "2024-10", status: "Active" },
  { merchantName: "Sapphire Motors Group", mid: "273025131219", dba: "Sapphire Motors Group", branch: "BR583", processor: "Clearent", city: "Harrison", state: "IL", activeSince: "2019-10", status: "Active" },
  { merchantName: "Valley Pizzeria", mid: "UX70474085", dba: "Steve's Grill Associates", branch: "AG18", processor: "Shift4", city: "Riverside", state: "TX", activeSince: "2024-09", status: "Active" },
  { merchantName: "Blue Ridge Deli", mid: "534464910520", dba: "Blue Ridge Deli", branch: "AG93", processor: "Clearent", city: "Jackson", state: "IN", activeSince: "2021-09", status: "Active" },
  { merchantName: "Heritage Pet Care", mid: "229186161773", dba: "Heritage Pet Care", branch: "AG99", processor: "MiCamp", city: "Burlington", state: "IL", activeSince: "2021-12", status: "Pending" },
  { merchantName: "Coastal Wellness", mid: "966417049986", dba: "Kingston Barbershop Solutions", branch: "BR111", processor: "Rectangle Health", city: "Franklin", state: "IL", activeSince: "2024-02", status: "Active" },
  { merchantName: "Riverside HVAC", mid: "522528953872", dba: "Riverside HVAC", branch: "2654", processor: "Payment Advisors", city: "Lincoln", state: "OH", activeSince: "2020-05", status: "Pending" },
  { merchantName: "Clayton Motors", mid: "7732580111", dba: "Clayton Motors", branch: "AG74", processor: "Merchant Lynx", city: "Florence", state: "FL", activeSince: "2023-08", status: "Inactive" },
  { merchantName: "Mike's Advisory", mid: "672362977103", dba: "Mike's Advisory", branch: "3280", processor: "Rectangle Health", city: "Madison", state: "IN", activeSince: "2024-09", status: "Active" },
  { merchantName: "Lincoln Eatery", mid: "3600021093", dba: "Lincoln Eatery", branch: "A754", processor: "Payment Advisors", city: "Greenville", state: "IN", activeSince: "2018-02", status: "Inactive" },
  { merchantName: "Superior Emporium", mid: "WK26692252", dba: "Heritage Painting", branch: "8052", processor: "Payment Advisors", city: "Jackson", state: "TN", activeSince: "2023-03", status: "Active" },
  { merchantName: "Pinnacle Studio", mid: "BD19146173", dba: "Pinnacle Studio", branch: "A941", processor: "Fiserv Omaha", city: "Clinton", state: "MI", activeSince: "2024-10", status: "Active" },
  { merchantName: "Bob's Motors Inc", mid: "9725778981", dba: "Joe's Chiropractic", branch: "BR418", processor: "Payment Advisors", city: "Monroe", state: "FL", activeSince: "2023-11", status: "Pending" },
  { merchantName: "Select Eatery Associates", mid: "8944029852", dba: "Select Eatery Associates", branch: "BR671", processor: "MiCamp", city: "Chester", state: "OH", activeSince: "2024-02", status: "Active" },
  { merchantName: "Ashland Grill Inc", mid: "QL26843993", dba: "Dan's Accounting", branch: "AG38", processor: "MiCamp", city: "Salem", state: "GA", activeSince: "2022-03", status: "Pending" },
  { merchantName: "Pioneer HVAC", mid: "KY69144284", dba: "Pioneer HVAC", branch: "A492", processor: "Payment Advisors", city: "Washington", state: "IN", activeSince: "2018-05", status: "Pending" },
  { merchantName: "Riverside Advisory", mid: "JY61995998", dba: "Pearl Bar & Grill", branch: "A306", processor: "Global", city: "Harrison", state: "GA", activeSince: "2018-12", status: "Active" },
  { merchantName: "Tony's Quick Lube Enterprises", mid: "9772194955", dba: "Tony's Quick Lube Enterprises", branch: "BR228", processor: "Global", city: "Harrison", state: "IL", activeSince: "2022-08", status: "Active" },
  { merchantName: "Clayton Market", mid: "454955579779", dba: "Bob's Optical Group", branch: "BR815", processor: "Merchant Lynx", city: "Hamilton", state: "TX", activeSince: "2024-08", status: "Active" },
  { merchantName: "Family Photography", mid: "YE64421617", dba: "Family Photography", branch: "BR710", processor: "Rectangle Health", city: "Jackson", state: "TX", activeSince: "2020-07", status: "Active" },
  { merchantName: "Amber Laundry", mid: "481711640415", dba: "Amber Laundry", branch: "BR525", processor: "Merchant Lynx", city: "Greenville", state: "OH", activeSince: "2023-06", status: "Active" },
  { merchantName: "Fairview Veterinary", mid: "9928890908", dba: "John's Veterinary", branch: "BR691", processor: "Global", city: "Fairview", state: "TN", activeSince: "2022-12", status: "Active" },
  { merchantName: "Select Flooring", mid: "HR13617658", dba: "Trusted Floral", branch: "AG18", processor: "Clearent", city: "Monroe", state: "IL", activeSince: "2020-05", status: "Pending" },
  { merchantName: "Pioneer Veterinary", mid: "825950180287", dba: "Pioneer Veterinary", branch: "BR168", processor: "Fiserv Omaha", city: "Greenville", state: "CA", activeSince: "2021-10", status: "Pending" },
  { merchantName: "Dan's Outlet Corp", mid: "SN44698876", dba: "Dan's Outlet Corp", branch: "A156", processor: "TRX", city: "Bristol", state: "WV", activeSince: "2024-02", status: "Active" },
  { merchantName: "Downtown Maintenance", mid: "4987899871", dba: "Lincoln Gift Shop", branch: "A366", processor: "Shift4", city: "Riverside", state: "CA", activeSince: "2018-06", status: "Pending" },
  { merchantName: "Jade Tax Services", mid: "917583074912", dba: "Jade Tax Services", branch: "A411", processor: "Rectangle Health", city: "Franklin", state: "MO", activeSince: "2023-09", status: "Active" },
  { merchantName: "Lexington Deli", mid: "SO47756301", dba: "Lexington Deli", branch: "BR921", processor: "Payment Advisors", city: "Ashland", state: "PA", activeSince: "2018-09", status: "Active" },
  { merchantName: "Mountain Painting", mid: "CP55047739", dba: "Mountain Painting", branch: "A359", processor: "Merchant Lynx", city: "Fairview", state: "IN", activeSince: "2018-02", status: "Active" },
  { merchantName: "Forest Spa Brothers", mid: "4824343400", dba: "Marion Bazaar", branch: "9272", processor: "TRX", city: "Washington", state: "VA", activeSince: "2023-01", status: "Active" },
  { merchantName: "Premier Tavern Solutions", mid: "802427108695", dba: "Manchester Cafe", branch: "7014", processor: "MiCamp", city: "Lexington", state: "MO", activeSince: "2020-10", status: "Inactive" },
  { merchantName: "Harrison Dental Corp", mid: "LS28311553", dba: "John's Lumber", branch: "AG82", processor: "Merchant Lynx", city: "Riverside", state: "OH", activeSince: "2021-08", status: "Active" },
  { merchantName: "National Construction & Sons", mid: "RH19340291", dba: "National Construction & Sons", branch: "AG93", processor: "TRX", city: "Salem", state: "VA", activeSince: "2020-12", status: "Active" },
  { merchantName: "Meadow Tire Center", mid: "253721091807", dba: "Meadow Tire Center", branch: "BR512", processor: "Rectangle Health", city: "Washington", state: "TX", activeSince: "2024-08", status: "Active" },
  { merchantName: "Newport Optical Brothers", mid: "2098191941", dba: "Newport Optical Brothers", branch: "BR176", processor: "Fiserv Omaha", city: "Jefferson", state: "GA", activeSince: "2024-08", status: "Active" },
  { merchantName: "Arlington Pet Care Group", mid: "348642587069", dba: "Arlington Pet Care Group", branch: "A992", processor: "Rectangle Health", city: "Jackson", state: "GA", activeSince: "2023-04", status: "Active" },
  { merchantName: "Jim's Plumbing & Co", mid: "1101133964", dba: "Jim's Plumbing & Co", branch: "BR547", processor: "TRX", city: "Harrison", state: "CA", activeSince: "2020-09", status: "Active" },
  { merchantName: "John's Motors", mid: "6574610562", dba: "John's Motors", branch: "BR122", processor: "Global", city: "Riverside", state: "TX", activeSince: "2021-05", status: "Active" },
  { merchantName: "Franklin Landscaping & Co", mid: "VZ45508969", dba: "John's Boutique", branch: "AG94", processor: "Shift4", city: "Kingston", state: "MO", activeSince: "2022-05", status: "Active" },
  { merchantName: "Lakeside Landscaping Solutions", mid: "RM99162823", dba: "Lakeside Landscaping Solutions", branch: "A599", processor: "Payment Advisors", city: "Fairview", state: "KY", activeSince: "2024-10", status: "Active" },
  { merchantName: "Mike's Outlet", mid: "6907021525", dba: "Mike's Outlet", branch: "6110", processor: "MiCamp", city: "Jackson", state: "CA", activeSince: "2020-11", status: "Active" },
  { merchantName: "Elite Auto Repair", mid: "9486549473", dba: "Elite Auto Repair", branch: "A158", processor: "MiCamp", city: "Springfield", state: "NC", activeSince: "2021-10", status: "Pending" },
  { merchantName: "Horizon Tavern Enterprises", mid: "1914858417", dba: "Lexington Gift Shop Co", branch: "A260", processor: "Fiserv Omaha", city: "Lincoln", state: "VA", activeSince: "2018-12", status: "Active" },
  { merchantName: "Silver Floral", mid: "1002347813", dba: "Tom's Painting Solutions", branch: "9208", processor: "MiCamp", city: "Georgetown", state: "PA", activeSince: "2024-09", status: "Pending" },
  { merchantName: "Jackson Supply", mid: "9579369802", dba: "Jackson Supply", branch: "AG70", processor: "Fiserv Omaha", city: "Harrison", state: "IL", activeSince: "2019-03", status: "Pending" },
];

async function importDemoMerchants() {
  console.log(`Starting import of ${merchantData.length} merchants for DEMO agency (ID: ${DEMO_AGENCY_ID})`);
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of merchantData) {
    try {
      const existing = await db.select().from(merchants).where(eq(merchants.mid, m.mid)).limit(1);
      
      if (existing.length > 0) {
        console.log(`Skipping existing MID: ${m.mid}`);
        skipped++;
        continue;
      }

      await db.insert(merchants).values({
        mid: m.mid,
        legalName: m.merchantName,
        dba: m.dba,
        branchNumber: m.branch,
        status: m.status,
        currentProcessor: m.processor,
        agencyId: DEMO_AGENCY_ID,
      });
      
      inserted++;
      if (inserted % 20 === 0) {
        console.log(`Imported ${inserted} merchants...`);
      }
    } catch (err: any) {
      console.error(`Error importing ${m.mid}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (existing): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`\nAll data isolated to DEMO agency (agencyId: ${DEMO_AGENCY_ID})`);
}

importDemoMerchants().catch(console.error).finally(() => process.exit());
