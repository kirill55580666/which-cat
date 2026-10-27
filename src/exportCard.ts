import atlas1 from './assets/cats-1.png';
import atlas2 from './assets/cats-2.png';
import atlas3 from './assets/cats-3.png';
import type { Card, Cat, CatVariant } from './types';

const atlases = [atlas1, atlas2, atlas3];
function lines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const result: string[] = []; let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { result.push(line); line = word; }
    else line = next;
  }
  if (line) result.push(line);
  return result;
}
export async function renderCard(cat: Cat, variant: CatVariant, card: Card): Promise<Blob> {
  await Promise.all([document.fonts.load('700 72px Caveat'), document.fonts.load('400 32px Nunito')]);
  const img = new Image(); img.src = atlases[Math.floor(cat.art / 20)];
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.font = '700 82px Caveat';
  const nameLines = lines(ctx, cat.name, 900);
  ctx.font = '700 51px Caveat';
  const titleLines = lines(ctx, variant.title, 890);
  ctx.font = '400 32px Nunito';
  const descriptionLines = lines(ctx, variant.description, 870);
  ctx.font = '400 27px Nunito';
  const taskLines = lines(ctx, cat.task, 830);
  canvas.height = 1100 + nameLines.length * 85 + titleLines.length * 57 + descriptionLines.length * 46 + taskLines.length * 38;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#232326';
  ctx.font = '700 48px Caveat'; ctx.fillText('Какой ты кот?', 540, 45);
  ctx.font = '400 22px Nunito'; ctx.fillText('ТВОЙ МАЛЕНЬКИЙ ПОВОД ПОМУРЧАТЬ', 540, 108);
  let y = 168;
  ctx.fillStyle = '#d3edff';
  ctx.beginPath(); ctx.roundRect(70, y - 5, 940, nameLines.length * 85 + 12, 15); ctx.fill();
  ctx.fillStyle = '#202022'; ctx.font = '700 82px Caveat';
  for (const line of nameLines) { ctx.fillText(line, 540, y); y += 85; }
  y += 22;
  const col = cat.art % 5, row = Math.floor((cat.art % 20) / 5);
  const cellWidth = img.naturalWidth / 5, cellHeight = img.naturalHeight / 4;
  ctx.save();
  ctx.beginPath(); ctx.rect(270 + 540 * .04, y + 540 * .03, 540 * .92, 540 * .94); ctx.clip();
  ctx.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 270, y, 540, 540);
  ctx.restore();
  y += 570;
  ctx.font = '700 51px Caveat';
  for (const line of titleLines) { ctx.fillText(line, 540, y); y += 57; }
  y += 25; ctx.font = '400 32px Nunito';
  for (const line of descriptionLines) { ctx.fillText(line, 540, y); y += 46; }
  y += 34;
  cat.stats.forEach((label, index) => {
    const x = index === 0 ? 65 : 555;
    ctx.fillStyle = index === 0 ? '#def2ff' : '#fbd6e9';
    ctx.beginPath(); ctx.roundRect(x, y, 460, 94, 35); ctx.fill();
    ctx.fillStyle = '#232326'; ctx.font = '700 36px Caveat';
    ctx.fillText(`${label} ${card.values[index]}%`, x + 230, y + 26, 420);
  });
  y += 133; ctx.fillStyle = '#fff7dc';
  ctx.beginPath(); ctx.roundRect(65, y, 950, taskLines.length * 38 + 75, 16); ctx.fill();
  ctx.fillStyle = '#736239'; ctx.font = '700 20px Nunito'; ctx.fillText('КОШАЧЬЕ ПОРУЧЕНИЕ', 540, y + 15);
  y += 49; ctx.fillStyle = '#232326'; ctx.font = '400 27px Nunito';
  for (const line of taskLines) { ctx.fillText(line, 540, y); y += 38; }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
export async function downloadCard(cat: Cat, variant: CatVariant, card: Card): Promise<void> {
  const blob = await renderCard(cat, variant, card);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `which-cat-${cat.id}.png`; link.rel = 'noopener';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
