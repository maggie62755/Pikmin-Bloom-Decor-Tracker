import { mkdir, readFile, writeFile } from 'node:fs/promises';

// GitHub Pages needs a physical entry page for direct React route requests.
// Reuse Vite's built HTML, whose asset URLs already include the project base.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
for (const route of ['tracker', 'dashboard', 'privacy']) {
  const directory = new URL(`../dist/${route}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}
