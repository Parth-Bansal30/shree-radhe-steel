/* Grade library
   VERIFY: The owner said "we deal in all" grades. This is a REFERENCE library of commonly traded
   steel grades, NOT a stock list. Ask Vikas Bansal to remove any grade the business does not want
   to show, and to add any that are missing.

   - `ch`   Chemical composition in weight %, as published in the standard named in `std`.
            "a-b" is a range, "-b" a maximum, "a-" a minimum. Actual heat analysis is on the mill
            test certificate for each lot.
   - `eq`   Close cross-references between standards (approximate, for orientation only).
   - `ht`   Typical heat-treatment temperatures (°C), for orientation only.
   - `hard` Typical hardness / strength in common supply or treated conditions, for orientation only.
   - `rel`  RELATIVE comparisons on a 1–5 scale for browsing only, not specification values:
            [strength, toughness, wear resistance, machinability, corrosion resistance]
   - `paint` An illustrative bar-end colour. Real colour codes vary by mill and stockist. */

export const FAMILIES = [
  { id: 'carbon', name: 'Carbon & mild steel', note: 'Everyday engineering, structural and free-cutting steels.' },
  { id: 'alloy', name: 'Alloy steel', note: 'Through-hardening and nitriding steels for high-strength parts.' },
  { id: 'case', name: 'Case-hardening steel', note: 'Hard wear surface over a tough core, after carburising.' },
  { id: 'bearing', name: 'Bearing & spring steel', note: 'High-carbon and spring grades for rolling and flexing parts.' },
  { id: 'tool', name: 'Tool & die steel', note: 'Cold-work, hot-work, mould and high-speed steels.' },
  { id: 'stainless', name: 'Stainless steel', note: 'Chromium-bearing grades for corrosion and heat resistance.' },
];

export const PROPS = ['Strength', 'Toughness', 'Wear resistance', 'Machinability', 'Corrosion resistance'];

export const ELEMENTS = {
  C: ['Carbon', 'The main hardening element. Raises strength and hardness; lowers weldability.'],
  Si: ['Silicon', 'Deoxidiser. Raises strength and elastic limit (spring steels) and temper resistance.'],
  Mn: ['Manganese', 'Raises hardenability and strength, and ties up sulphur.'],
  P: ['Phosphorus', 'Usually a controlled impurity, kept low for toughness.'],
  S: ['Sulphur', 'Usually kept low. Added on purpose in free-cutting grades to help machining.'],
  Cr: ['Chromium', 'Hardenability and wear resistance. Above about 10.5% it makes steel stainless.'],
  Ni: ['Nickel', 'Toughness, especially at low temperature. Stabilises austenite in stainless steel.'],
  Mo: ['Molybdenum', 'Hardenability, temper resistance and high-temperature strength. Pitting resistance in stainless.'],
  V: ['Vanadium', 'Refines grain and forms very hard carbides for wear resistance.'],
  W: ['Tungsten', 'Hot hardness and wear resistance in tool and high-speed steels.'],
  Co: ['Cobalt', 'Raises hot hardness in high-speed steels.'],
  Cu: ['Copper', 'Precipitation hardening in 17-4 PH; mild help with corrosion.'],
  N: ['Nitrogen', 'Strength and pitting resistance in stainless and duplex grades.'],
  Ti: ['Titanium', 'Ties up carbon so the steel resists sensitisation when welded.'],
  Nb: ['Niobium', 'Carbide former used for stabilising and precipitation hardening.'],
  Pb: ['Lead', 'Added in leaded free-cutting grades to improve machining.'],
};
export const EL_ORDER = ['C', 'Si', 'Mn', 'P', 'S', 'Cr', 'Ni', 'Mo', 'V', 'W', 'Co', 'Cu', 'Nb', 'Ti', 'N', 'Pb'];

const STD = {
  bs970: 'BS 970 (EN series)',
  en10083: 'EN 10083',
  en10084: 'EN 10084',
  a681: 'ASTM A681',
  a600: 'ASTM A600',
  a276: 'ASTM A276',
  din: 'DIN / W.Nr.',
  is2062: 'IS 2062',
  sae: 'SAE J404',
};

/* Raw data. `ch` uses a compact "El range | El range" string, parsed below. */
const RAW = [
  /* ---------- Carbon & mild ---------- */
  { code: 'IS 2062', sub: 'E250', id: 'IS 2062 E250', fam: 'carbon', kind: 'Structural', std: `${STD.is2062} · E250`, paint: '#5a6a7a', rel: [2, 4, 1, 4, 1], key: ['C', 'Mn'],
    ch: 'C -.23 | Si -.40 | Mn -1.50 | P -.045 | S -.045',
    eq: [['Common name', 'Structural mild steel'], ['≈ ASTM', 'A36'], ['≈ EN 10025', 'S235JR / S275JR']],
    use: 'Fabrication, structures, base plates, frames and general engineering.',
    apps: ['Structural fabrication', 'Base and gusset plates', 'Machine frames', 'General engineering'],
    ht: [['Supply condition', 'As rolled or normalised rolled']],
    hard: [['Yield strength (≤ 20 mm)', '250 MPa min'], ['Tensile strength', '410 MPa min'], ['Elongation', '23% min']] },
  { code: 'IS 2062', sub: 'E350', id: 'IS 2062 E350', fam: 'carbon', kind: 'Structural', std: `${STD.is2062} · E350`, paint: '#4a5c70', rel: [3, 4, 1, 3, 1], key: ['C', 'Mn'],
    ch: 'C -.20 | Si -.45 | Mn -1.55 | P -.045 | S -.045',
    eq: [['Common name', 'High-tensile structural steel'], ['≈ EN 10025', 'S355JR'], ['≈ ASTM', 'A572 Gr. 50']],
    use: 'Higher-strength structural work where section weight matters.',
    apps: ['Heavy structures', 'Cranes and gantries', 'Trailer chassis', 'Bridges and towers'],
    ht: [['Supply condition', 'As rolled or normalised rolled']],
    hard: [['Yield strength (≤ 20 mm)', '350 MPa min'], ['Tensile strength', '490 MPa min'], ['Elongation', '22% min']] },
  { code: 'EN1A', fam: 'carbon', kind: 'Free-cutting', std: `${STD.bs970} · 230M07`, paint: '#c9c2a8', rel: [2, 2, 1, 5, 1],
    ch: 'C -.15 | Si -.10 | Mn .90-1.30 | P .04-.09 | S .25-.35',
    eq: [['BS 970', '230M07'], ['≈ AISI / SAE', '1215'], ['≈ W.Nr.', '1.0715 (11SMn30)'], ['≈ JIS', 'SUM23']],
    use: 'Free-cutting steel for high-volume turned parts, fittings and fasteners.',
    apps: ['Auto-lathe turned parts', 'Hydraulic fittings', 'Nuts, screws and bushes', 'Inserts'],
    ht: [['Heat treatment', 'Not normally hardened; can be lightly case-hardened']],
    hard: [] },
  { code: 'EN3B', fam: 'carbon', kind: 'Low carbon', std: `${STD.bs970} · 070M20`, paint: '#7e8a96', rel: [2, 4, 1, 4, 1], key: ['C', 'Mn'],
    ch: 'C .16-.24 | Si .10-.40 | Mn .50-.90 | P -.050 | S -.050',
    eq: [['BS 970', '070M20'], ['≈ AISI / SAE', '1020'], ['≈ W.Nr.', '1.0402 (C22)'], ['≈ JIS', 'S20C'], ['≈ IS', '20C8']],
    use: 'Low-carbon steel for lightly stressed parts, welding and case-hardening.',
    apps: ['Brackets and spacers', 'Welded fabrications', 'Lightly case-hardened pins', 'Jigs and fixtures'],
    ht: [['Normalise', '880–910 °C, air cool'], ['Carburise (optional)', '880–920 °C']],
    hard: [] },
  { code: 'EN8', fam: 'carbon', kind: 'Medium carbon', std: `${STD.bs970} · 080M40`, paint: '#2f7bd8', rel: [3, 3, 2, 4, 1],
    ch: 'C .36-.44 | Si .10-.40 | Mn .60-1.00 | P -.050 | S -.050',
    eq: [['BS 970', '080M40'], ['≈ AISI / SAE', '1040'], ['≈ W.Nr.', '1.0511 (C40)'], ['≈ JIS', 'S40C'], ['≈ IS', '40C8']],
    use: 'Shafts, studs, bolts, pins and general machined parts.',
    apps: ['Shafts and axles', 'Studs and bolts', 'Keys and pins', 'Gears for light duty'],
    ht: [['Normalise', '830–860 °C, air cool'], ['Harden', '830–860 °C, oil or water quench'], ['Temper', '550–660 °C']],
    hard: [['Normalised (typical)', '≈ 550 MPa tensile'], ['Condition R (hardened & tempered)', '700–850 MPa tensile']] },
  { code: 'C45', fam: 'carbon', kind: 'Medium carbon', std: `${STD.en10083} · 1.0503`, paint: '#3a8ac0', rel: [3, 3, 2, 4, 1], key: ['C', 'Mn'],
    ch: 'C .42-.50 | Si -.40 | Mn .50-.80 | P -.030 | S -.035 | Cr -.40 | Ni -.40 | Mo -.10',
    eq: [['W.Nr.', '1.0503'], ['≈ AISI / SAE', '1045'], ['≈ BS 970', '080M46'], ['≈ JIS', 'S45C'], ['≈ IS', '45C8']],
    use: 'Medium-carbon steel for shafts, gears and parts that are flame or induction hardened.',
    apps: ['Shafts and spindles', 'Induction-hardened parts', 'Gears and couplings', 'Machine parts'],
    ht: [['Normalise', '840–880 °C, air cool'], ['Harden', '820–860 °C, water or oil'], ['Temper', '550–660 °C']],
    hard: [] },
  { code: 'EN9', fam: 'carbon', kind: 'Medium-high carbon', std: `${STD.bs970} · 070M55`, paint: '#2aa37a', rel: [3, 2, 3, 3, 1], key: ['C', 'Mn'],
    ch: 'C .50-.60 | Si .05-.35 | Mn .50-.90 | P -.060 | S -.060',
    eq: [['BS 970', '070M55'], ['≈ AISI / SAE', '1055'], ['≈ W.Nr.', '1.0535 (C55)'], ['≈ JIS', 'S55C'], ['≈ IS', '55C8']],
    use: 'Sprockets, cams and gears needing more wear resistance than EN8.',
    apps: ['Sprockets', 'Cams', 'Flame-hardened gears', 'Wear plates'],
    ht: [['Harden', '810–840 °C, oil or water'], ['Temper', '550–660 °C'], ['Surface hardening', 'Responds well to flame or induction hardening']],
    hard: [] },

  /* ---------- Alloy (through-hardening, nitriding) ---------- */
  { code: 'EN16', fam: 'alloy', kind: 'Mn-Mo', std: `${STD.bs970} · 605M36`, paint: '#b0503a', rel: [4, 4, 2, 3, 1],
    ch: 'C .32-.40 | Si .10-.35 | Mn 1.30-1.70 | P -.035 | S -.040 | Mo .22-.32',
    eq: [['BS 970', '605M36'], ['≈ IS', '35Mn6Mo3']],
    use: 'Medium-tensile shafts, axles, bolts and connecting rods.',
    apps: ['Axles and shafts', 'Connecting rods', 'High-tensile bolts', 'Gear shafts'],
    ht: [['Harden', '840–870 °C, oil quench'], ['Temper', '550–660 °C']],
    hard: [['Condition R / S / T', '700–850 / 770–930 / 850–1000 MPa tensile']] },
  { code: 'EN18', fam: 'alloy', kind: 'Cr', std: `${STD.bs970} · 530M40`, paint: '#c0703a', rel: [4, 3, 3, 3, 1],
    ch: 'C .36-.44 | Si .10-.35 | Mn .60-.90 | P -.035 | S -.040 | Cr .90-1.20',
    eq: [['BS 970', '530M40'], ['≈ AISI / SAE', '5140'], ['≈ W.Nr.', '1.7035 (41Cr4)'], ['≈ JIS', 'SCr440'], ['≈ IS', '40Cr4']],
    use: 'Chromium steel for gears, shafts and parts that are hardened and tempered.',
    apps: ['Gears', 'Shafts', 'Steering parts', 'Bolts and studs'],
    ht: [['Harden', '840–870 °C, oil quench'], ['Temper', '550–700 °C']],
    hard: [] },
  { code: 'EN19', fam: 'alloy', kind: 'Cr-Mo', std: `${STD.bs970} · 709M40`, paint: '#d63c3c', rel: [4, 4, 3, 3, 1],
    ch: 'C .36-.44 | Si .10-.35 | Mn .70-1.00 | P -.035 | S -.040 | Cr .90-1.20 | Mo .25-.35',
    eq: [['BS 970', '709M40'], ['≈ AISI / SAE', '4140'], ['≈ W.Nr.', '1.7225 (42CrMo4)'], ['≈ JIS', 'SCM440'], ['≈ IS', '40Cr4Mo3']],
    use: 'High-tensile shafts, axles, gears, spindles and bolts.',
    apps: ['Transmission shafts', 'Axles and spindles', 'Gears and pinions', 'High-tensile bolts', 'Hydraulic parts'],
    ht: [['Harden', '840–870 °C, oil quench'], ['Temper', '550–700 °C'], ['Surface', 'Can be induction or flame hardened, or nitrided']],
    hard: [['Condition T (typical supply)', '850–1000 MPa tensile']] },
  { code: 'EN24', fam: 'alloy', kind: 'Ni-Cr-Mo', std: `${STD.bs970} · 817M40`, paint: '#e8a33a', rel: [5, 5, 3, 2, 1],
    ch: 'C .36-.44 | Si .10-.35 | Mn .45-.70 | P -.035 | S -.040 | Cr 1.00-1.40 | Ni 1.30-1.70 | Mo .20-.35',
    eq: [['BS 970', '817M40'], ['≈ AISI / SAE', '4340'], ['≈ W.Nr.', '1.6582 (34CrNiMo6)'], ['≈ JIS', 'SNCM439'], ['≈ IS', '40Ni6Cr4Mo3']],
    use: 'Heavy-duty shafts, gears and highly stressed components in larger sections.',
    apps: ['Heavy-duty shafts', 'Gears and crankshafts', 'Heavy-duty bolts and studs', 'Press and rolling-mill parts', 'Highly stressed machine parts'],
    ht: [['Harden', '830–850 °C, oil quench'], ['Temper', '550–660 °C'], ['Surface', 'Can be nitrided']],
    hard: [['Condition T (typical supply)', '850–1000 MPa tensile'], ['Condition V', '1000–1150 MPa tensile']] },
  { code: 'EN30B', fam: 'alloy', kind: 'Ni-Cr-Mo (air hardening)', std: `${STD.bs970} · 835M30`, paint: '#a0485f', rel: [5, 5, 3, 2, 1],
    ch: 'C .26-.34 | Si .10-.35 | Mn .45-.70 | P -.035 | S -.040 | Cr 1.10-1.40 | Ni 3.90-4.30 | Mo .20-.35',
    eq: [['BS 970', '835M30'], ['≈ W.Nr.', '1.6747 (30NiCrMo16-6)']],
    use: 'Air-hardening steel for very highly stressed parts with good toughness.',
    apps: ['Heavy-duty gears', 'Crankshafts', 'Drop-forged components', 'Highly stressed shafts'],
    ht: [['Harden', '810–830 °C, air cool or oil'], ['Temper', '150–250 °C (maximum strength)']],
    hard: [] },
  { code: 'EN40B', fam: 'alloy', kind: 'Cr-Mo (nitriding)', std: `${STD.bs970} · 722M24`, paint: '#8a6a3a', rel: [4, 4, 4, 3, 1],
    ch: 'C .20-.28 | Si .10-.35 | Mn .45-.70 | P -.035 | S -.040 | Cr 3.00-3.50 | Mo .45-.65',
    eq: [['BS 970', '722M24'], ['≈ W.Nr.', '1.8515 (31CrMo12)']],
    use: 'Nitriding steel for a very hard surface with minimal distortion.',
    apps: ['Nitrided shafts', 'Gears and spindles', 'Crankshafts', 'Extruder screws'],
    ht: [['Harden', '880–910 °C, oil quench'], ['Temper', '570–700 °C'], ['Nitride', '≈ 490–530 °C']],
    hard: [] },

  /* ---------- Case-hardening ---------- */
  { code: 'EN353', fam: 'case', kind: 'Ni-Cr-Mo', std: `${STD.bs970} · 815M17`, paint: '#8b5bd6', rel: [4, 4, 4, 3, 1],
    ch: 'C .14-.20 | Si .10-.35 | Mn .60-1.00 | P -.035 | S -.040 | Cr .80-1.10 | Ni 1.20-1.50 | Mo .10-.20',
    eq: [['BS 970', '815M17']],
    use: 'Carburised gears, pinions, cams and shafts.',
    apps: ['Gears and pinions', 'Camshafts', 'Gudgeon pins', 'Splined shafts'],
    ht: [['Carburise', '880–930 °C'], ['Core refine', '850–880 °C, oil'], ['Case harden', '780–820 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },
  { code: 'EN354', fam: 'case', kind: 'Ni-Cr-Mo', std: `${STD.bs970} · 820M17`, paint: '#6e4ac0', rel: [4, 5, 4, 3, 1],
    ch: 'C .14-.20 | Si .10-.35 | Mn .60-1.00 | P -.035 | S -.040 | Cr 1.00-1.40 | Ni 1.50-2.00 | Mo .10-.20',
    eq: [['BS 970', '820M17']],
    use: 'Heavier-section carburised gears and transmission parts than EN353.',
    apps: ['Heavy gears', 'Crown wheels and pinions', 'Transmission shafts', 'Rock-drill parts'],
    ht: [['Carburise', '880–930 °C'], ['Core refine', '850–880 °C, oil'], ['Case harden', '780–820 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },
  { code: 'EN36', fam: 'case', kind: 'Ni-Cr', std: `${STD.bs970} · 655M13`, paint: '#3fb6c9', rel: [4, 5, 4, 3, 1],
    ch: 'C .10-.16 | Si .10-.35 | Mn .35-.60 | P -.035 | S -.040 | Cr .70-1.00 | Ni 3.00-3.75',
    eq: [['BS 970', '655M13'], ['≈ IS', '13Ni13Cr3']],
    use: 'Heavy-duty carburised gears and transmission parts needing high core toughness.',
    apps: ['Heavy-duty gears', 'Worm gears', 'Crown wheels', 'Clutch parts'],
    ht: [['Carburise', '880–930 °C'], ['Case harden', '760–780 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },
  { code: '20MnCr5', fam: 'case', kind: 'Mn-Cr', std: `${STD.en10084} · 1.7147`, paint: '#c75a9a', rel: [4, 3, 4, 3, 1],
    ch: 'C .17-.22 | Si -.40 | Mn 1.10-1.40 | P -.025 | S -.035 | Cr 1.00-1.30',
    eq: [['W.Nr.', '1.7147'], ['≈ AISI / SAE', '5120']],
    use: 'Carburised gears, shafts and automotive components.',
    apps: ['Automotive gears', 'Shafts and spindles', 'Piston pins', 'Bevel gears'],
    ht: [['Carburise', '880–980 °C'], ['Harden', '810–840 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },
  { code: '16MnCr5', fam: 'case', kind: 'Mn-Cr', std: `${STD.en10084} · 1.7131`, paint: '#d07ab0', rel: [3, 3, 4, 3, 1],
    ch: 'C .14-.19 | Si -.40 | Mn 1.00-1.30 | P -.025 | S -.035 | Cr .80-1.10',
    eq: [['W.Nr.', '1.7131'], ['≈ AISI / SAE', '5115']],
    use: 'Case-hardening steel for small and medium gears, cams and pins.',
    apps: ['Small gears', 'Cams and followers', 'Pins and bushes', 'Spindles'],
    ht: [['Carburise', '880–980 °C'], ['Harden', '810–840 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },
  { code: 'SAE 8620', fam: 'case', kind: 'Ni-Cr-Mo', std: `${STD.sae}`, paint: '#9b6fd0', rel: [3, 4, 4, 3, 1],
    ch: 'C .18-.23 | Si .15-.35 | Mn .70-.90 | P -.030 | S -.040 | Cr .40-.60 | Ni .40-.70 | Mo .15-.25',
    eq: [['≈ W.Nr.', '1.6523 (20NiCrMo2-2)'], ['≈ BS 970', '805M20 (EN362)'], ['≈ JIS', 'SNCM220']],
    use: 'Versatile carburising steel for gears, shafts and fasteners.',
    apps: ['Ring gears', 'Shafts', 'Chain parts', 'Fasteners'],
    ht: [['Carburise', '900–925 °C'], ['Harden', '810–840 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },
  { code: '18CrNiMo7-6', aka: '17CrNiMo6', fam: 'case', kind: 'Cr-Ni-Mo', std: `${STD.en10084} · 1.6587`, paint: '#5a3aa8', rel: [5, 5, 4, 2, 1],
    ch: 'C .15-.21 | Si -.40 | Mn .50-.90 | P -.025 | S -.035 | Cr 1.50-1.80 | Ni 1.40-1.70 | Mo .25-.35',
    eq: [['W.Nr.', '1.6587'], ['Older name', '17CrNiMo6']],
    use: 'Large, heavily loaded carburised gears and shafts.',
    apps: ['Large industrial gears', 'Gearbox shafts', 'Mining equipment', 'Wind and heavy drives'],
    ht: [['Carburise', '880–980 °C'], ['Harden', '830–870 °C, oil'], ['Temper', '150–200 °C']],
    hard: [] },

  /* ---------- Bearing & spring ---------- */
  { code: 'EN31', fam: 'bearing', kind: 'High carbon Cr', std: `${STD.bs970} · 535A99`, paint: '#f0d23a', rel: [5, 2, 5, 2, 1],
    ch: 'C .90-1.20 | Si .10-.35 | Mn .30-.75 | P -.050 | S -.050 | Cr 1.00-1.60',
    eq: [['BS 970', '535A99'], ['≈ AISI / SAE', '52100'], ['≈ W.Nr.', '1.3505 (100Cr6)'], ['≈ JIS', 'SUJ2']],
    use: 'Bearings, rollers, gauges, punches and wear parts.',
    apps: ['Ball and roller bearings', 'Rollers', 'Gauges', 'Punches and dies', 'Wear parts'],
    ht: [['Harden', '810–840 °C, oil quench'], ['Temper', '150–200 °C']],
    hard: [['Hardened & low-tempered', '≈ 60–64 HRC']] },
  { code: 'EN45', fam: 'bearing', kind: 'Si-Mn spring', std: `${STD.bs970} · 250A58`, paint: '#6fbf3a', rel: [4, 3, 3, 2, 1],
    ch: 'C .55-.65 | Si 1.70-2.10 | Mn .70-1.00 | P -.050 | S -.050',
    eq: [['BS 970', '250A58'], ['≈ AISI / SAE', '9255']],
    use: 'Leaf and coil springs.',
    apps: ['Leaf springs', 'Coil springs', 'Spring clips'],
    ht: [['Harden', '840–870 °C, oil quench'], ['Temper', '400–500 °C']],
    hard: [] },
  { code: 'EN47', fam: 'bearing', kind: 'Cr-V spring', std: `${STD.bs970} · 735A51`, paint: '#3a9a5f', rel: [4, 4, 3, 2, 1],
    ch: 'C .45-.55 | Si -.50 | Mn .50-.80 | P -.035 | S -.040 | Cr .80-1.20 | V .15-',
    eq: [['BS 970', '735A51'], ['≈ AISI / SAE', '6150'], ['≈ W.Nr.', '1.8159 (50CrV4)'], ['≈ JIS', 'SUP10'], ['≈ IS', '50Cr4V2']],
    use: 'Springs and highly stressed parts needing fatigue resistance.',
    apps: ['Heavy springs', 'Torsion bars', 'Gears and shafts', 'Hand tools'],
    ht: [['Harden', '850–880 °C, oil quench'], ['Temper', '400–550 °C']],
    hard: [] },

  /* ---------- Tool & die ---------- */
  { code: 'D2', aka: 'HCHCr', fam: 'tool', kind: 'Cold work', std: `${STD.a681}`, paint: '#e05a2a', rel: [5, 2, 5, 1, 2],
    ch: 'C 1.40-1.60 | Si .10-.60 | Mn .10-.60 | P -.030 | S -.030 | Cr 11.00-13.00 | Ni -.30 | Mo .70-1.20 | V .50-1.10',
    eq: [['AISI', 'D2'], ['W.Nr.', '1.2379 (X153CrMoV12)'], ['≈ JIS', 'SKD11']],
    use: 'Cold-work dies, punches, blanking tools and shear blades.',
    apps: ['Blanking and piercing dies', 'Punches', 'Shear and slitter blades', 'Thread-rolling dies', 'Gauges'],
    ht: [['Anneal', '850–870 °C, slow cool'], ['Harden', '1000–1040 °C, air, oil or vacuum'], ['Temper', '150–540 °C']],
    hard: [['Annealed', '≤ 255 HB'], ['Hardened & tempered', '≈ 58–62 HRC']] },
  { code: 'D3', aka: 'HCHCr', fam: 'tool', kind: 'Cold work', std: `${STD.a681}`, paint: '#b8452a', rel: [5, 1, 5, 1, 2],
    ch: 'C 2.00-2.35 | Si .10-.60 | Mn .10-.60 | P -.030 | S -.030 | Cr 11.00-13.50 | Ni -.30 | V -1.00 | W -1.00',
    eq: [['AISI', 'D3'], ['W.Nr.', '1.2080 (X210Cr12)'], ['≈ JIS', 'SKD1']],
    use: 'Blanking and drawing dies and high-wear tooling.',
    apps: ['Blanking dies', 'Drawing dies', 'Brick and ceramic moulds', 'High-wear tooling'],
    ht: [['Anneal', '870–900 °C, slow cool'], ['Harden', '925–980 °C, oil'], ['Temper', '150–260 °C']],
    hard: [['Annealed', '≤ 255 HB'], ['Hardened & tempered', '≈ 58–64 HRC']] },
  { code: 'A2', fam: 'tool', kind: 'Cold work', std: `${STD.a681}`, paint: '#d27a3a', rel: [4, 3, 4, 2, 2],
    ch: 'C .95-1.05 | Si .10-.50 | Mn .40-1.00 | P -.030 | S -.030 | Cr 4.75-5.50 | Mo .90-1.40 | V .15-.50',
    eq: [['AISI', 'A2'], ['W.Nr.', '1.2363 (X100CrMoV5)'], ['≈ JIS', 'SKD12']],
    use: 'Air-hardening cold-work steel with less distortion than oil-hardening grades.',
    apps: ['Blanking and forming dies', 'Punches', 'Trimming dies', 'Gauges'],
    ht: [['Harden', '925–980 °C, air cool'], ['Temper', '175–540 °C']],
    hard: [['Hardened & tempered', '≈ 57–62 HRC']] },
  { code: 'OHNS', aka: 'O1', fam: 'tool', kind: 'Cold work (oil hardening)', std: `${STD.a681} · O1`, paint: '#4a7ad8', rel: [4, 3, 4, 3, 1],
    ch: 'C .85-1.00 | Si .10-.50 | Mn 1.00-1.40 | P -.030 | S -.030 | Cr .40-.70 | Ni -.30 | V -.30 | W .40-.60',
    eq: [['AISI', 'O1'], ['W.Nr.', '1.2510 (100MnCrW4)'], ['≈ JIS', 'SKS3']],
    use: 'Gauges, small cutting tools, punches and dies.',
    apps: ['Gauges', 'Punches', 'Small dies', 'Knives and cutting tools', 'Bushes'],
    ht: [['Harden', '790–815 °C, oil quench'], ['Temper', '175–260 °C']],
    hard: [['Hardened & tempered', '≈ 57–62 HRC']] },
  { code: 'H11', fam: 'tool', kind: 'Hot work', std: `${STD.a681}`, paint: '#d6843a', rel: [4, 5, 3, 2, 1],
    ch: 'C .33-.43 | Si .80-1.25 | Mn .20-.60 | P -.030 | S -.030 | Cr 4.75-5.50 | Ni -.30 | Mo 1.10-1.60 | V .30-.60',
    eq: [['AISI', 'H11'], ['W.Nr.', '1.2343 (X37CrMoV5-1)'], ['≈ JIS', 'SKD6']],
    use: 'Hot-work dies, extrusion tooling and die-casting parts.',
    apps: ['Forging dies', 'Extrusion tooling', 'Die-casting parts', 'Hot shear blades'],
    ht: [['Harden', '995–1025 °C, air or vacuum'], ['Temper', '540–650 °C (double)']],
    hard: [['Hardened & tempered', '≈ 38–54 HRC']] },
  { code: 'H13', fam: 'tool', kind: 'Hot work', std: `${STD.a681}`, paint: '#c23a5a', rel: [4, 4, 4, 2, 1],
    ch: 'C .32-.45 | Si .80-1.25 | Mn .20-.60 | P -.030 | S -.030 | Cr 4.75-5.50 | Ni -.30 | Mo 1.10-1.75 | V .80-1.20',
    eq: [['AISI', 'H13'], ['W.Nr.', '1.2344 (X40CrMoV5-1)'], ['≈ JIS', 'SKD61']],
    use: 'Die-casting dies, forging dies and extrusion tooling.',
    apps: ['Aluminium die-casting dies', 'Forging dies', 'Extrusion dies', 'Plastic moulds'],
    ht: [['Harden', '995–1040 °C, air or vacuum'], ['Temper', '540–650 °C (double)']],
    hard: [['Hardened & tempered', '≈ 40–53 HRC']] },
  { code: 'DB6', aka: '1.2714', fam: 'tool', kind: 'Hot work (die block)', std: `${STD.din} · 1.2714`, paint: '#8c5a3a', rel: [4, 5, 3, 3, 1],
    ch: 'C .50-.60 | Si .10-.40 | Mn .65-.95 | P -.030 | S -.030 | Cr 1.00-1.20 | Ni 1.50-1.80 | Mo .45-.55 | V .07-.12',
    eq: [['W.Nr.', '1.2714 (55NiCrMoV7)'], ['≈ AISI', 'L6'], ['≈ JIS', 'SKT4']],
    use: 'Forging die blocks, hammer dies and die holders.',
    apps: ['Hammer and press forging dies', 'Die holders', 'Hot shear blades', 'Extrusion parts'],
    ht: [['Harden', '830–870 °C, oil'], ['Temper', '400–600 °C']],
    hard: [['Typical working range', '≈ 36–46 HRC']] },
  { code: 'P20', fam: 'tool', kind: 'Mould', std: `${STD.din} · 1.2311`, paint: '#3ab0a0', rel: [3, 4, 3, 4, 1],
    ch: 'C .35-.45 | Si .20-.40 | Mn 1.30-1.60 | P -.035 | S -.035 | Cr 1.80-2.10 | Mo .15-.25',
    eq: [['W.Nr.', '1.2311 (40CrMnMo7)'], ['≈ AISI', 'P20']],
    use: 'Plastic injection moulds, die holders and bolster plates.',
    apps: ['Plastic injection moulds', 'Mould bases', 'Die holders', 'Bolster plates'],
    ht: [['Supply condition', 'Usually supplied pre-hardened, ready to machine']],
    hard: [['Pre-hardened (typical)', '≈ 28–34 HRC (≈ 280–325 HB)']] },
  { code: 'P20+Ni', aka: '1.2738', fam: 'tool', kind: 'Mould', std: `${STD.din} · 1.2738`, paint: '#2a9a8a', rel: [3, 4, 3, 4, 1],
    ch: 'C .35-.45 | Si .20-.40 | Mn 1.30-1.60 | P -.035 | S -.035 | Cr 1.80-2.10 | Ni .90-1.20 | Mo .15-.25',
    eq: [['W.Nr.', '1.2738 (40CrMnNiMo8-6-4)'], ['≈ AISI', 'P20 + Ni']],
    use: 'Larger plastic moulds where even hardness through the section matters.',
    apps: ['Large injection moulds', 'Automotive bumper and dashboard moulds', 'Mould bases'],
    ht: [['Supply condition', 'Usually supplied pre-hardened, ready to machine']],
    hard: [['Pre-hardened (typical)', '≈ 28–34 HRC (≈ 280–325 HB)']] },
  { code: 'M2', fam: 'tool', kind: 'High speed', std: `${STD.a600}`, paint: '#9a3ad6', rel: [5, 2, 5, 1, 1],
    ch: 'C .78-.88 | Si .20-.45 | Mn .15-.40 | P -.030 | S -.030 | Cr 3.75-4.50 | Mo 4.50-5.50 | V 1.75-2.20 | W 5.50-6.75',
    eq: [['AISI', 'M2'], ['W.Nr.', '1.3343 (HS6-5-2)'], ['≈ JIS', 'SKH51']],
    use: 'Drills, taps, milling cutters and general cutting tools.',
    apps: ['Drills and taps', 'Milling cutters', 'Broaches', 'Lathe tool bits', 'Punches'],
    ht: [['Harden', '1190–1230 °C, oil, salt or vacuum'], ['Temper', '540–595 °C (triple)']],
    hard: [['Hardened & tempered', '≈ 62–65 HRC']] },
  { code: 'M35', fam: 'tool', kind: 'High speed (cobalt)', std: `${STD.a600}`, paint: '#7a2ab6', rel: [5, 2, 5, 1, 1],
    ch: 'C .82-.88 | Si .20-.45 | Mn .15-.40 | P -.030 | S -.030 | Cr 3.75-4.50 | Mo 4.50-5.50 | V 1.75-2.20 | W 5.50-6.75 | Co 4.50-5.50',
    eq: [['AISI', 'M35'], ['W.Nr.', '1.3243 (HS6-5-2-5)'], ['≈ JIS', 'SKH55']],
    use: 'Cutting tools for tougher materials and higher speeds than M2.',
    apps: ['Drills for hard materials', 'End mills', 'Taps', 'Form tools'],
    ht: [['Harden', '1180–1220 °C'], ['Temper', '540–580 °C (triple)']],
    hard: [['Hardened & tempered', '≈ 63–66 HRC']] },
  { code: 'M42', fam: 'tool', kind: 'High speed (cobalt)', std: `${STD.a600}`, paint: '#5a1a96', rel: [5, 1, 5, 1, 1],
    ch: 'C 1.05-1.15 | Si .15-.65 | Mn .15-.40 | P -.030 | S -.030 | Cr 3.50-4.25 | Mo 9.00-10.00 | V .95-1.35 | W 1.15-1.85 | Co 7.75-8.75',
    eq: [['AISI', 'M42'], ['W.Nr.', '1.3247 (HS2-9-1-8)'], ['≈ JIS', 'SKH59']],
    use: 'Very hard cutting tools for difficult-to-machine materials.',
    apps: ['End mills', 'Drills for stainless and alloys', 'Tool bits', 'Bandsaw teeth'],
    ht: [['Harden', '1175–1190 °C'], ['Temper', '510–595 °C (triple)']],
    hard: [['Hardened & tempered', '≈ 65–68 HRC']] },

  /* ---------- Stainless ---------- */
  { code: 'SS 202', fam: 'stainless', kind: 'Austenitic (Cr-Mn)', std: `${STD.a276} · 202`, paint: '#d8dce2', rel: [2, 4, 2, 2, 3],
    ch: 'C -.15 | Si -1.00 | Mn 7.50-10.00 | P -.060 | S -.030 | Cr 17.00-19.00 | Ni 4.00-6.00 | N -.25',
    eq: [['UNS', 'S20200'], ['≈ W.Nr.', '1.4373']],
    use: 'Lower-nickel austenitic stainless for indoor and decorative use.',
    apps: ['Kitchenware', 'Railings and decorative work', 'Indoor fittings'],
    ht: [['Solution anneal', '1010–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [] },
  { code: 'SS 303', fam: 'stainless', kind: 'Austenitic (free-machining)', std: `${STD.a276} · 303`, paint: '#e0e4ea', rel: [2, 4, 2, 4, 3],
    ch: 'C -.15 | Si -1.00 | Mn -2.00 | P -.20 | S .15- | Cr 17.00-19.00 | Ni 8.00-10.00 | Mo -.60',
    eq: [['UNS', 'S30300'], ['W.Nr.', '1.4305'], ['≈ JIS', 'SUS303']],
    use: 'Free-machining stainless for turned parts where welding is not needed.',
    apps: ['Shafts and spindles', 'Fittings and fasteners', 'Turned parts', 'Valve parts'],
    ht: [['Solution anneal', '1010–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [] },
  { code: 'SS 304', fam: 'stainless', kind: 'Austenitic', std: `${STD.a276} · 304`, paint: '#e6e9ee', rel: [2, 5, 2, 2, 4],
    ch: 'C -.08 | Si -1.00 | Mn -2.00 | P -.045 | S -.030 | Cr 18.00-20.00 | Ni 8.00-11.00',
    eq: [['UNS', 'S30400'], ['W.Nr.', '1.4301 (X5CrNi18-10)'], ['≈ JIS', 'SUS304']],
    use: 'General corrosion-resistant parts, food and process equipment.',
    apps: ['Food and dairy equipment', 'Process piping parts', 'Architectural work', 'Fasteners', 'Tanks'],
    ht: [['Solution anneal', '1010–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [['Annealed bar (min)', '515 MPa tensile · 205 MPa yield']] },
  { code: 'SS 304L', fam: 'stainless', kind: 'Austenitic (low carbon)', std: `${STD.a276} · 304L`, paint: '#eceff3', rel: [2, 5, 2, 2, 4],
    ch: 'C -.030 | Si -1.00 | Mn -2.00 | P -.045 | S -.030 | Cr 18.00-20.00 | Ni 8.00-12.00',
    eq: [['UNS', 'S30403'], ['W.Nr.', '1.4307 / 1.4306'], ['≈ JIS', 'SUS304L']],
    use: 'Low-carbon 304 for welded parts, with less risk of weld decay.',
    apps: ['Welded tanks and vessels', 'Chemical equipment', 'Pipe fittings'],
    ht: [['Solution anneal', '1010–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [['Annealed bar (min)', '485 MPa tensile · 170 MPa yield']] },
  { code: 'SS 316', fam: 'stainless', kind: 'Austenitic (Mo)', std: `${STD.a276} · 316`, paint: '#b9d4e8', rel: [2, 5, 2, 2, 5],
    ch: 'C -.08 | Si -1.00 | Mn -2.00 | P -.045 | S -.030 | Cr 16.00-18.00 | Ni 10.00-14.00 | Mo 2.00-3.00',
    eq: [['UNS', 'S31600'], ['W.Nr.', '1.4401 (X5CrNiMo17-12-2)'], ['≈ JIS', 'SUS316']],
    use: 'Marine, chemical and pharmaceutical environments.',
    apps: ['Marine fittings', 'Chemical and pharma equipment', 'Pump and valve parts', 'Heat exchangers'],
    ht: [['Solution anneal', '1010–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [['Annealed bar (min)', '515 MPa tensile · 205 MPa yield']] },
  { code: 'SS 316L', fam: 'stainless', kind: 'Austenitic (Mo, low carbon)', std: `${STD.a276} · 316L`, paint: '#c6dcec', rel: [2, 5, 2, 2, 5],
    ch: 'C -.030 | Si -1.00 | Mn -2.00 | P -.045 | S -.030 | Cr 16.00-18.00 | Ni 10.00-14.00 | Mo 2.00-3.00',
    eq: [['UNS', 'S31603'], ['W.Nr.', '1.4404'], ['≈ JIS', 'SUS316L']],
    use: 'Low-carbon 316 for welded parts in corrosive service.',
    apps: ['Welded pharma equipment', 'Marine and offshore parts', 'Chemical process lines'],
    ht: [['Solution anneal', '1010–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [['Annealed bar (min)', '485 MPa tensile · 170 MPa yield']] },
  { code: 'SS 310S', fam: 'stainless', kind: 'Austenitic (heat resisting)', std: `${STD.a276} · 310S`, paint: '#d0c8c0', rel: [2, 4, 2, 2, 4],
    ch: 'C -.08 | Si -1.50 | Mn -2.00 | P -.045 | S -.030 | Cr 24.00-26.00 | Ni 19.00-22.00',
    eq: [['UNS', 'S31008'], ['W.Nr.', '1.4845'], ['≈ JIS', 'SUS310S']],
    use: 'Heat-resisting stainless for furnace parts and high-temperature service.',
    apps: ['Furnace parts', 'Heat-treatment fixtures', 'Burners', 'Kiln parts'],
    ht: [['Solution anneal', '1040–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [] },
  { code: 'SS 321', fam: 'stainless', kind: 'Austenitic (Ti stabilised)', std: `${STD.a276} · 321`, paint: '#c8d0d8', rel: [2, 5, 2, 2, 4], key: ['Cr', 'Ni', 'Ti'],
    ch: 'C -.08 | Si -1.00 | Mn -2.00 | P -.045 | S -.030 | Cr 17.00-19.00 | Ni 9.00-12.00 | Ti -.70',
    notes: { Ti: 'Ti ≥ 5 × (C + N), up to 0.70' },
    eq: [['UNS', 'S32100'], ['W.Nr.', '1.4541'], ['≈ JIS', 'SUS321']],
    use: 'Stabilised stainless for welded parts used at elevated temperature.',
    apps: ['Exhaust systems', 'Expansion bellows', 'High-temperature welded parts'],
    ht: [['Solution anneal', '950–1120 °C, rapid cool'], ['Note', 'Not hardenable by heat treatment']],
    hard: [] },
  { code: 'SS 410', fam: 'stainless', kind: 'Martensitic', std: `${STD.a276} · 410`, paint: '#a7b0bb', rel: [3, 3, 3, 3, 3],
    ch: 'C .08-.15 | Si -1.00 | Mn -1.00 | P -.040 | S -.030 | Cr 11.50-13.50',
    eq: [['UNS', 'S41000'], ['W.Nr.', '1.4006'], ['≈ JIS', 'SUS410']],
    use: 'Hardenable stainless for valve parts, pump shafts and fasteners.',
    apps: ['Valve trim', 'Pump shafts', 'Fasteners', 'Turbine parts'],
    ht: [['Harden', '925–1010 °C, oil or air'], ['Temper', 'By required hardness; avoid ≈ 400–580 °C for toughness']],
    hard: [] },
  { code: 'SS 420', fam: 'stainless', kind: 'Martensitic', std: `${STD.a276} · 420`, paint: '#8fa0b4', rel: [4, 2, 4, 2, 3],
    ch: 'C .15- | Si -1.00 | Mn -1.00 | P -.040 | S -.030 | Cr 12.00-14.00',
    eq: [['UNS', 'S42000'], ['W.Nr.', '1.4021 / 1.4028 / 1.2083'], ['≈ JIS', 'SUS420J1 / J2']],
    use: 'Moulds, surgical and cutting tools needing a hard stainless.',
    apps: ['Plastic moulds (corrosive resins)', 'Surgical instruments', 'Cutlery and blades', 'Pump parts'],
    ht: [['Harden', '980–1050 °C, oil or air'], ['Temper', '150–370 °C']],
    hard: [['Hardened & tempered', 'Up to ≈ 50 HRC, depending on carbon']] },
  { code: 'SS 431', fam: 'stainless', kind: 'Martensitic (Ni)', std: `${STD.a276} · 431`, paint: '#98a8b8', rel: [4, 3, 3, 2, 3],
    ch: 'C -.20 | Si -1.00 | Mn -1.00 | P -.040 | S -.030 | Cr 15.00-17.00 | Ni 1.25-2.50',
    eq: [['UNS', 'S43100'], ['W.Nr.', '1.4057'], ['≈ JIS', 'SUS431']],
    use: 'High-strength stainless for shafts and fasteners in corrosive service.',
    apps: ['Pump and propeller shafts', 'Marine hardware', 'Valve spindles', 'Bolts'],
    ht: [['Harden', '980–1065 °C, oil or air'], ['Temper', 'By required strength']],
    hard: [] },
  { code: 'SS 430', fam: 'stainless', kind: 'Ferritic', std: `${STD.a276} · 430`, paint: '#b4bcc6', rel: [2, 3, 2, 3, 3],
    ch: 'C -.12 | Si -1.00 | Mn -1.00 | P -.040 | S -.030 | Cr 16.00-18.00',
    eq: [['UNS', 'S43000'], ['W.Nr.', '1.4016'], ['≈ JIS', 'SUS430']],
    use: 'Ferritic stainless for appliances, trim and mildly corrosive service.',
    apps: ['Appliance parts', 'Trim and decorative work', 'Fasteners', 'Furnace parts (mild)'],
    ht: [['Anneal', '705–790 °C'], ['Note', 'Not hardenable by heat treatment']],
    hard: [] },
  { code: '17-4 PH', aka: 'SS 630', fam: 'stainless', kind: 'Precipitation hardening', std: `${STD.a276} · 630`, paint: '#7c8ea4', rel: [5, 4, 3, 2, 4], key: ['Cr', 'Ni', 'Cu', 'Nb'],
    ch: 'C -.07 | Si -1.00 | Mn -1.00 | P -.040 | S -.030 | Cr 15.00-17.50 | Ni 3.00-5.00 | Cu 3.00-5.00 | Nb .15-.45',
    notes: { Nb: 'Nb + Ta' },
    eq: [['UNS', 'S17400'], ['W.Nr.', '1.4542'], ['≈ JIS', 'SUS630']],
    use: 'High-strength stainless hardened by a simple ageing treatment.',
    apps: ['Pump and valve shafts', 'Aerospace fittings', 'Oil and gas parts', 'Moulds'],
    ht: [['Solution treat', '1020–1060 °C (Condition A)'], ['Age', '480–620 °C (H900 to H1150)']],
    hard: [] },
  { code: 'Duplex 2205', fam: 'stainless', kind: 'Duplex', std: 'UNS S32205', paint: '#6f8aa6', rel: [4, 4, 3, 2, 5], key: ['Cr', 'Ni', 'Mo', 'N'],
    ch: 'C -.030 | Si -1.00 | Mn -2.00 | P -.030 | S -.020 | Cr 22.00-23.00 | Ni 4.50-6.50 | Mo 3.00-3.50 | N .14-.20',
    eq: [['UNS', 'S32205 / S31803'], ['W.Nr.', '1.4462']],
    use: 'Duplex stainless with high strength and resistance to chloride stress corrosion.',
    apps: ['Oil and gas equipment', 'Chemical tankers', 'Desalination', 'Pulp and paper'],
    ht: [['Solution anneal', '1020–1100 °C, rapid cool']],
    hard: [] },
];

/* ---------- parsing ---------- */
function parseChem(s) {
  const out = {};
  s.split('|').map((x) => x.trim()).filter(Boolean).forEach((tok) => {
    const [el, r] = tok.split(/\s+/);
    const [a, b] = r.split('-');
    out[el] = [a === '' ? null : Number(a), b === '' || b === undefined ? null : Number(b)];
  });
  return out;
}
function keyElements(ch) {
  return Object.entries(ch).filter(([el, [min]]) => {
    if (min === null || min <= 0 || el === 'P') return false;
    if (el === 'Si') return min >= 0.8;
    if (el === 'Mn') return min >= 0.6;
    return true;
  }).map(([el]) => el);
}

export const GRADES = RAW.map((g) => {
  const chem = parseChem(g.ch);
  return { ...g, id: g.id || g.code, chem, el: g.key || keyElements(chem), hard: g.hard || [], ht: g.ht || [], notes: g.notes || {} };
});

// Largest value of each element across the library (for bar scales)
export const EL_MAX = {};
GRADES.forEach((g) => Object.entries(g.chem).forEach(([el, [a, b]]) => { EL_MAX[el] = Math.max(EL_MAX[el] || 0, b ?? a ?? 0); }));

// Nominal (mid-range) value, used for the composition ring. Max-only limits count as half the limit,
// except P and S (impurity limits), which are ignored.
export function nominal(g) {
  const out = {};
  Object.entries(g.chem).forEach(([el, [a, b]]) => {
    if (el === 'P' || (el === 'S' && a === null)) return;
    const v = a !== null && b !== null ? (a + b) / 2 : a !== null ? a : b * 0.5;
    if (v > 0) out[el] = v;
  });
  return out;
}

export const fmtRange = ([a, b]) => {
  const f = (v) => (v >= 1 ? v.toFixed(2) : v.toFixed(Math.round(v * 1000) % 10 ? 3 : 2)).replace(/^0/, '0');
  if (a !== null && b !== null) return `${f(a)} – ${f(b)}`;
  if (b !== null) return `≤ ${f(b)}`;
  return `≥ ${f(a)}`;
};

// Grades shown on the bar-end stamp during the 3D story
export const STORY_GRADES = ['EN8', 'EN19', 'EN24', 'EN31', 'D2', 'H13', 'SS 304'];
export const gradeByCode = (code) => GRADES.find((g) => g.id === code || g.code === code);

// Short secondary designation for the bar-end stamp
export function stampSub(g) {
  if (g.sub) return g.sub;
  for (const [, v] of g.eq) { const s = v.split(' (')[0].split(' / ')[0]; if (s !== g.code && s.length <= 12) return s; }
  return '';
}
