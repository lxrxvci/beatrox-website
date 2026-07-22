const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'site', 'content', 'services')

const TECH = {
  '3d-animation-motion-capture': ['Cinema 4D', 'Blender', 'Maya', 'Unreal Engine', 'Xsens', 'Rokoko'],
  'av-content-design': ['TouchDesigner', 'Notch', 'Adobe After Effects', 'Cinema 4D', 'Resolume Arena', 'Disguise'],
  'av-equipment-sourcing-rentals': ['L-Acoustics', 'd&b audiotechnik', 'DiGiCo', 'ROE Visual', 'Disguise', 'grandMA'],
  'av-system-integration': ['Novastar', 'Brompton', 'QSC Q-Sys', 'Crestron', 'Dante'],
  'cnc-machining': ['ShopBot', 'Fusion 360', 'VCarve Pro', 'Rhino'],
  'consultation-system-design': ['QSC Q-Sys', 'Dante', 'Crestron', 'Vectorworks'],
  'drafting-detail-drawings': ['AutoCAD', 'Vectorworks', 'Rhino'],
  'engineering-certification': ['RISA-3D', 'AutoCAD', 'SolidWorks'],
  'environmental-design': ['SketchUp', 'Vectorworks', 'Unreal Engine', 'Rhino'],
  'event-planning-logistics': ['Vectorworks', 'Monday.com', 'Microsoft Excel', 'Google Workspace'],
  'interactive-ui-ux-design': ['Figma', 'React', 'TouchDesigner', 'Electron'],
  'labor-hire-crew-roles': ['Clear-Com', 'Vectorworks', 'Microsoft Excel', 'Google Workspace'],
  'lighting-design': ['grandMA3', 'ETC Eos', 'Vectorworks Vision', 'Capture'],
  'lighting-integration': ['grandMA3', 'ETC Eos', 'DMX', 'sACN', 'Art-Net'],
  'materials-sourcing-selection': ['Material ConneXion', 'McMaster-Carr', 'Alro Steel', 'Tap Plastics', 'Grimco'],
  'media-server-playback-solutions': ['Disguise', 'Resolume Arena', 'Watchout', 'Pixera'],
  'permanent-installation': ['QSC Q-Sys', 'Crestron', 'Disguise', 'BrightSign'],
  'permit-submittal': ['AutoCAD', 'Vectorworks', 'Bluebeam Revu', 'Accela ePermitting'],
  'pre-visualization': ['Unreal Engine', 'Vectorworks', 'Capture', 'WYSIWYG'],
  'production-management': ['Vectorworks', 'Smartsheet', 'Monday.com', 'Microsoft Excel'],
  'realtime-content-ar-vr-xr': ['Unreal Engine', 'Unity', 'TouchDesigner', 'Notch'],
  'set-scenic-assembly': ['ShopBot CNC', 'Fusion 360', 'Carpentry & Joinery', 'Metalwork & Welding'],
  'site-floor-plans': ['AutoCAD', 'Vectorworks', 'SketchUp'],
  'software-development': ['TypeScript', 'React', 'Node.js', 'TouchDesigner', 'Python'],
  'staging-rigging': ['CM Lodestar', 'Prolyte Truss', 'Motion Laboratories', 'Vectorworks'],
  'system-maintenance-support': ['QSC Q-Sys', 'Crestron', 'Dante Domain Manager', 'Remote Monitoring & Diagnostics'],
  'technical-direction': ['Vectorworks', 'Microsoft Excel', 'Smartsheet'],
  'technical-documentation': ['AutoCAD', 'Vectorworks', 'Notion'],
  'tour-management': ['Master Tour', 'Vectorworks', 'Microsoft Excel', 'Google Workspace'],
  'trade-convention-booths': ['Vectorworks', 'SketchUp'],
  'venue-sourcing-booking': ['Vectorworks', 'AutoCAD', 'Microsoft Excel', 'Google Workspace'],
}

let updated = 0
const missing = []
for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.json'))) {
  const slug = file.replace(/\.json$/, '')
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8')
  const j = JSON.parse(raw)
  if (j.pageType !== 'tech') continue
  if (!TECH[slug]) { missing.push(slug); continue }
  if (j.tech) continue
  // Rebuild key order, inserting "tech" just before "pageType"
  const out = {}
  for (const [k, v] of Object.entries(j)) {
    if (k === 'pageType') out.tech = TECH[slug]
    out[k] = v
  }
  if (!('tech' in out)) out.tech = TECH[slug]
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(out, null, 2) + '\n')
  updated++
}
console.log('updated:', updated)
if (missing.length) { console.log('NO MAPPING FOR:', missing); process.exit(1) }
