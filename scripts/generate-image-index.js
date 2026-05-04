#!/usr/bin/env node
/**
 * images/ 폴더를 스캔해 images/index.json 을 생성합니다.
 * 구조: { "카테고리명": ["파일1.png", "파일2.png", ...], ... }
 *
 * - images/ 바로 아래의 1단계 하위 폴더만 카테고리로 인식합니다.
 * - 이미지 확장자: png, jpg, jpeg, gif, webp, svg
 * - 정렬: 한글 로캘 기준 카테고리/파일명 가나다순
 * - 카테고리 폴더 안의 이미지가 0개면 인덱스에서 제외
 */

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = 'images';
const OUTPUT = path.join(IMAGES_DIR, 'index.json');
const IMG_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

if (!fs.existsSync(IMAGES_DIR) || !fs.statSync(IMAGES_DIR).isDirectory()) {
  console.error(`[generate-image-index] '${IMAGES_DIR}/' 디렉토리가 없습니다.`);
  // 디렉토리 자체가 없으면 빈 인덱스 만들지 말고 종료 (에러 아님)
  process.exit(0);
}

const sortKo = (a, b) => a.localeCompare(b, 'ko');

const result = {};
const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

const dirs = entries
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .sort(sortKo);

for (const dirName of dirs) {
  const subPath = path.join(IMAGES_DIR, dirName);
  let files;
  try {
    files = fs.readdirSync(subPath)
      .filter(f => {
        const fp = path.join(subPath, f);
        try { return fs.statSync(fp).isFile() && IMG_RE.test(f); }
        catch { return false; }
      })
      .sort(sortKo);
  } catch (e) {
    console.warn(`[generate-image-index] '${subPath}' 읽기 실패:`, e.message);
    continue;
  }
  if (files.length) result[dirName] = files;
}

const json = JSON.stringify(result, null, 2) + '\n';

// 파일 변경 여부 확인 (불필요한 commit 방지)
let prev = '';
try { prev = fs.readFileSync(OUTPUT, 'utf8'); } catch {}

if (prev === json) {
  console.log('[generate-image-index] 변경 없음. index.json 유지.');
} else {
  fs.writeFileSync(OUTPUT, json);
  const totalFiles = Object.values(result).reduce((s, a) => s + a.length, 0);
  console.log(`[generate-image-index] ${OUTPUT} 갱신: 카테고리 ${Object.keys(result).length}개, 이미지 ${totalFiles}개`);
}
