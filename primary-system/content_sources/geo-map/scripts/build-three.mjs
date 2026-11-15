// 仅更新本地供应文件时运行；学习页面与 Django 部署无需 Node 或联网。
import { mkdtempSync, rmSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'study-three-'));
const dest = join(here, '../assets/vendor');
try {
  execFileSync('npm', ['install', '--prefix', temp, '--no-audit', '--no-fund', '--ignore-scripts', 'three@0.180.0', 'esbuild@0.25.10'], { stdio: 'inherit' });
  const require = createRequire(join(temp, 'package.json'));
  mkdirSync(dest, { recursive: true });
  require('esbuild').buildSync({
    entryPoints: [join(here, 'three-entry.mjs')], nodePaths: [join(temp, 'node_modules')],
    outfile: join(dest, 'three-map.js'), bundle: true, minify: true,
    format: 'iife', globalName: 'GMThree', target: ['es2020'], legalComments: 'inline',
    banner: { js: '/* Three.js 0.180.0 + OrbitControls · MIT · 见 THREE-LICENSE.txt。由 scripts/build-three.mjs 生成。 */' },
  });
  copyFileSync(join(temp, 'node_modules/three/LICENSE'), join(dest, 'THREE-LICENSE.txt'));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
