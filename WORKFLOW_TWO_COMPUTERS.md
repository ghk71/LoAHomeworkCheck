# Workflow for Two Computers

회사 PC와 집 PC에서 같은 프로젝트를 이어서 작업하기 위한 규칙이다.

## 핵심 원칙

GitHub를 중앙 원본으로 사용한다.

```txt
회사 PC → commit/push → GitHub → pull → 집 PC
집 PC → commit/push → GitHub → pull → 회사 PC
```

동시 작업은 하지 않는다.

## 최초 세팅

회사 PC와 집 PC 모두:

```bash
git clone https://github.com/YOUR_ID/loa-homework-tracker.git
cd loa-homework-tracker
npm install -g @openai/codex
```

## 작업 시작 루틴

```bash
cd loa-homework-tracker
git checkout dev
git pull
git status
```

`git status` 결과가 깨끗해야 한다.

```txt
nothing to commit, working tree clean
```

## 작업 중

Codex 실행:

```bash
codex
```

작업 전 Codex에게:

```txt
AGENTS.md와 CODEX_INSTRUCTIONS.md를 먼저 읽고 현재 작업을 시작하세요.
```

## 작업 종료 루틴

```bash
node tools/check-project.js
git status
git diff
git add .
git commit -m "짧고 명확한 작업 내용"
git push
```

## 회사에서 하다가 집으로 갈 때

회사 PC:

```bash
node tools/check-project.js
git add .
git commit -m "WIP: 작업 내용"
git push
```

집 PC:

```bash
git checkout dev
git pull
```

## 권장 브랜치

```txt
main = GitHub Pages 배포 안정판
dev = 개발 작업 브랜치
```

처음 한 번:

```bash
git checkout -b dev
git push -u origin dev
```

작업은 `dev`에서 한다.

배포할 때:

```bash
git checkout main
git pull
git merge dev
git push
```

## 충돌 방지 규칙

- 작업 시작 전 무조건 `git pull`
- 작업 종료 전 무조건 `commit + push`
- WIP라도 컴퓨터 이동 전에는 commit
- 같은 파일을 양쪽에서 따로 수정하지 않기
- Codex가 수정한 뒤 반드시 `git diff` 확인

## 실수 복구

수정 전으로 되돌리기:

```bash
git restore .
```

특정 파일만 되돌리기:

```bash
git restore index.html
```

직전 commit 취소:

```bash
git reset --hard HEAD~1
```

이미 push한 commit은 조심해서 처리한다.
