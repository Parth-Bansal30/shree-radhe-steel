/* Grade library
   VERIFY: The owner said "we deal in all" grades. This is a reference list of
   commonly traded steel grades, NOT a stock list. Ask Vikas Bansal to remove any
   grade the business does not want to show, and to add any that are missing.
   - "eq" are close cross-references between standards (approximate, for orientation).
   - "rel" are RELATIVE comparisons on a 1–5 scale for browsing only. They are not
     specification values and change with heat treatment and supply condition.
   - "paint" is an illustrative bar-end colour. Real colour codes vary by mill/stockist. */

export const FAMILIES = [
  { id: 'carbon',  name: 'Carbon & mild steel',   tint: '#9aa3ad', note: 'Everyday engineering and fabrication steels.' },
  { id: 'alloy',   name: 'Alloy steel',           tint: '#8d97a6', note: 'Through-hardening steels for high-strength parts.' },
  { id: 'case',    name: 'Case-hardening steel',  tint: '#a3a29a', note: 'Hard wear surface over a tough core, after carburising.' },
  { id: 'bearing', name: 'Bearing & spring steel', tint: '#8f9aa0', note: 'High-carbon and spring grades for rolling and flexing parts.' },
  { id: 'tool',    name: 'Tool & die steel',      tint: '#7b8594', note: 'Cold-work, hot-work, mould and high-speed steels.' },
  { id: 'stainless', name: 'Stainless steel',     tint: '#c3cad2', note: 'Chromium-bearing grades for corrosion resistance.' },
];

// rel: [strength, toughness, wear resistance, machinability, corrosion resistance]
export const PROPS = ['Strength', 'Toughness', 'Wear resistance', 'Machinability', 'Corrosion resistance'];

export const GRADES = [
  { code: 'IS 2062', sub: 'E250', fam: 'carbon', eq: ['Structural mild steel'], el: ['C', 'Mn'], use: 'Fabrication, structures, base plates and general engineering.', rel: [2, 4, 1, 4, 1], paint: '#5a6a7a' },
  { code: 'EN1A', fam: 'carbon', eq: ['230M07', '≈ AISI 1215'], el: ['C', 'Mn', 'S'], use: 'Free-cutting steel for high-volume turned parts and fittings.', rel: [2, 2, 1, 5, 1], paint: '#c9c2a8' },
  { code: 'EN8', fam: 'carbon', eq: ['080M40', '≈ AISI 1040'], el: ['C', 'Mn'], use: 'Shafts, studs, bolts, pins and general machined parts.', rel: [3, 3, 2, 4, 1], paint: '#2f7bd8' },
  { code: 'EN9', fam: 'carbon', eq: ['070M55', '≈ AISI 1055'], el: ['C', 'Mn'], use: 'Sprockets, cams and gears needing more wear resistance than EN8.', rel: [3, 2, 3, 3, 1], paint: '#2aa37a' },

  { code: 'EN19', fam: 'alloy', eq: ['709M40', '42CrMo4', '≈ AISI 4140'], el: ['C', 'Cr', 'Mo'], use: 'High-tensile shafts, axles, gears, spindles and bolts.', rel: [4, 4, 3, 3, 1], paint: '#d63c3c' },
  { code: 'EN24', fam: 'alloy', eq: ['817M40', '≈ AISI 4340'], el: ['C', 'Ni', 'Cr', 'Mo'], use: 'Heavy-duty shafts, gears and highly stressed components.', rel: [5, 5, 3, 2, 1], paint: '#e8a33a' },

  { code: 'EN353', fam: 'case', eq: ['815M17'], el: ['C', 'Ni', 'Cr', 'Mo'], use: 'Carburised gears, pinions, cams and shafts.', rel: [4, 4, 4, 3, 1], paint: '#8b5bd6' },
  { code: 'EN36', fam: 'case', eq: ['655M13'], el: ['C', 'Ni', 'Cr'], use: 'Heavy-duty carburised gears and transmission parts.', rel: [4, 5, 4, 3, 1], paint: '#3fb6c9' },
  { code: '20MnCr5', fam: 'case', eq: ['1.7147'], el: ['C', 'Mn', 'Cr'], use: 'Carburised gears, shafts and automotive components.', rel: [4, 3, 4, 3, 1], paint: '#c75a9a' },

  { code: 'EN31', fam: 'bearing', eq: ['535A99', '100Cr6', '≈ AISI 52100'], el: ['C', 'Cr'], use: 'Bearings, rollers, gauges, punches and wear parts.', rel: [5, 2, 5, 2, 1], paint: '#f0d23a' },
  { code: 'EN45', fam: 'bearing', eq: ['250A58'], el: ['C', 'Si', 'Mn'], use: 'Leaf and coil springs.', rel: [4, 3, 3, 2, 1], paint: '#6fbf3a' },
  { code: 'EN47', fam: 'bearing', eq: ['735A51', '50CrV4', '≈ AISI 6150'], el: ['C', 'Cr', 'V'], use: 'Springs and highly stressed parts needing fatigue resistance.', rel: [4, 4, 3, 2, 1], paint: '#3a9a5f' },

  { code: 'D2', fam: 'tool', aka: 'HCHCr', eq: ['1.2379', 'X153CrMoV12'], el: ['C', 'Cr', 'Mo', 'V'], use: 'Cold-work dies, punches, blanking tools and shear blades.', rel: [5, 2, 5, 1, 2], paint: '#e05a2a' },
  { code: 'D3', fam: 'tool', aka: 'HCHCr', eq: ['1.2080', 'X210Cr12'], el: ['C', 'Cr'], use: 'Blanking and drawing dies and high-wear tooling.', rel: [5, 1, 5, 1, 2], paint: '#b8452a' },
  { code: 'OHNS', fam: 'tool', eq: ['O1', '1.2510'], el: ['C', 'Mn', 'Cr', 'W'], use: 'Gauges, small cutting tools, punches and dies.', rel: [4, 3, 4, 3, 1], paint: '#4a7ad8' },
  { code: 'H11', fam: 'tool', eq: ['1.2343', 'X37CrMoV5-1'], el: ['C', 'Cr', 'Mo', 'V'], use: 'Hot-work dies, extrusion tooling and die-casting parts.', rel: [4, 5, 3, 2, 1], paint: '#d6843a' },
  { code: 'H13', fam: 'tool', eq: ['1.2344', 'X40CrMoV5-1'], el: ['C', 'Cr', 'Mo', 'V'], use: 'Die-casting dies, forging dies and extrusion tooling.', rel: [4, 4, 4, 2, 1], paint: '#c23a5a' },
  { code: 'P20', fam: 'tool', eq: ['1.2311', '40CrMnMo7'], el: ['C', 'Cr', 'Mn', 'Mo'], use: 'Plastic injection moulds and die holders.', rel: [3, 4, 3, 4, 1], paint: '#3ab0a0' },
  { code: 'M2', fam: 'tool', eq: ['1.3343', 'HS6-5-2'], el: ['C', 'W', 'Mo', 'V', 'Cr'], use: 'Drills, taps, milling cutters and cutting tools.', rel: [5, 2, 5, 1, 1], paint: '#9a3ad6' },

  { code: 'SS 304', fam: 'stainless', eq: ['1.4301', 'AISI 304'], el: ['Cr', 'Ni'], use: 'General corrosion-resistant parts, food and process equipment.', rel: [2, 5, 2, 2, 4], paint: '#e6e9ee' },
  { code: 'SS 316', fam: 'stainless', eq: ['1.4401', 'AISI 316'], el: ['Cr', 'Ni', 'Mo'], use: 'Marine, chemical and pharmaceutical environments.', rel: [2, 5, 2, 2, 5], paint: '#b9d4e8' },
  { code: 'SS 410', fam: 'stainless', eq: ['1.4006', 'AISI 410'], el: ['Cr'], use: 'Hardenable stainless for valve parts, pump shafts and fasteners.', rel: [3, 3, 3, 3, 3], paint: '#a7b0bb' },
  { code: 'SS 420', fam: 'stainless', eq: ['1.4021', 'AISI 420'], el: ['C', 'Cr'], use: 'Moulds, surgical and cutting tools needing a hard stainless.', rel: [4, 2, 4, 2, 3], paint: '#8fa0b4' },
];

export const ELEMENTS = {
  C: 'Carbon', Mn: 'Manganese', Si: 'Silicon', S: 'Sulphur', Cr: 'Chromium', Ni: 'Nickel', Mo: 'Molybdenum', V: 'Vanadium', W: 'Tungsten',
};

// Grades shown on the bar-end stamp during the 3D story
export const STORY_GRADES = ['EN8', 'EN19', 'EN24', 'EN31', 'D2', 'H13', 'SS 304'];
export const gradeByCode = (code) => GRADES.find((g) => g.code === code);
