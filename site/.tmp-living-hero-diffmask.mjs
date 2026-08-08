// Dump outside-region diff mask for frame-t3 vs static-reference.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const OUT = path.resolve(process.cwd(), '../.audit-screenshots/living-hero')
const W = 1440, H = 900
const IMG_ASPECT = 1637 / 921
function uvRectToScreen(u0, v0, u1, v1) {
  const boxA = W / H
  const sx = boxA / IMG_ASPECT, ox = (1 - sx) / 2
  return {
    x: Math.round(((u0 - ox) / sx) * W), y: Math.round(v0 * H),
    w: Math.round(((u1 - u0) / sx) * W), h: Math.round((v1 - v0) * H),
  }
}
const xR = uvRectToScreen(0.39, 0.12, 0.62, 0.50)
const gR = uvRectToScreen(0.0, 0.0, 0.46, 0.56)

const a = PNG.sync.read(readFileSync(path.join(OUT, 'static-reference.png')))
const b = PNG.sync.read(readFileSync(path.join(OUT, 'frame-t3.png')))
const diff = new PNG({ width: W, height: H })
pixelmatch(a.data, b.data, diff.data, W, H, { threshold: 0.12 })

const mask = new PNG({ width: W, height: H })
const boxHist = {}
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    const isDiff = diff.data[i] > 200 && diff.data[i + 1] < 100
    const inX = x >= xR.x && x < xR.x + xR.w && y >= xR.y && y < xR.y + xR.h
    const inG = x >= gR.x && x < gR.x + gR.w && y >= gR.y && y < gR.y + gR.h
    if (isDiff && !inX && !inG) {
      mask.data[i] = 255; mask.data[i + 3] = 255
      const key = `${Math.floor(x / 180)},${Math.floor(y / 180)}`
      boxHist[key] = (boxHist[key] || 0) + 1
    } else if (isDiff) {
      mask.data[i + 1] = 120; mask.data[i + 3] = 255
    }
  }
}
writeFileSync(path.join(OUT, 'outside-diff-mask.png'), PNG.sync.write(mask))
console.log(boxHist)
