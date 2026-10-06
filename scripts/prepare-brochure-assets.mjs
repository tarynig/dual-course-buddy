import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
// Build-time only: own-host production contains every photo, with no CDN dependency.
await mkdir('public/brochure', { recursive: true });
const dirs = ['src/assets/brochure', 'src/assets'];
for (const dir of dirs) for (const file of await readdir(dir)) {
  if (!file.endsWith('.asset.json')) continue;
  const asset = JSON.parse(await readFile(`${dir}/${file}`, 'utf8'));
  const response = await fetch(new URL(asset.url, 'https://dual-course-buddy.lovable.app'));
  if (!response.ok) throw new Error(`Cannot prepare brochure photo ${asset.original_filename}: ${response.status}`);
  await writeFile(`public/brochure/${asset.original_filename}`, new Uint8Array(await response.arrayBuffer()));
}