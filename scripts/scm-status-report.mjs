// Contabilidad de estado (Laboratorio Dual, Fase 5).
// Genera scm-status-report.json con los metadatos del cambio fusionado y
// agrega una fila al log de auditoría SCM (docs/SCM_LOG.md), conforme a
// IEEE Std 828-2012 (rastro de auditoría: qué cambió, quién, cuándo).
//
// Uso local:  node scripts/scm-status-report.mjs
// En CI:      se ejecuta tras un merge exitoso a la rama principal.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();
const env = process.env;

const sha = env.GITHUB_SHA || git('rev-parse HEAD');
const shortSha = sha.slice(0, 7);
const ref = env.GITHUB_REF_NAME || git('rev-parse --abbrev-ref HEAD');
const author = env.GITHUB_ACTOR || git('log -1 --pretty=%an');
const subject = git('log -1 --pretty=%s');
const isoDate = new Date().toISOString();

// El número de PR/run si está disponible en CI.
const runId = env.GITHUB_RUN_ID || null;
const repo = env.GITHUB_REPOSITORY || 'Edstone5/hc-backend';

const report = {
  changeId: env.SCM_CHANGE_ID || `RUN-${env.GITHUB_RUN_NUMBER || 'local'}`,
  commit: sha,
  shortCommit: shortSha,
  branch: ref,
  author,
  subject,
  ciStatus: env.SCM_CI_STATUS || 'passed',
  qualityGate: 'coverage >= 80% (núcleo de dominio)',
  approvedAt: isoDate,
  baseline: env.SCM_BASELINE || 'v1.1.0',
  runUrl: runId ? `https://github.com/${repo}/actions/runs/${runId}` : null,
};

writeFileSync('scm-status-report.json', JSON.stringify(report, null, 2) + '\n');
console.log('scm-status-report.json generado:');
console.log(JSON.stringify(report, null, 2));

// Apéndice al log de auditoría SCM (tabla Markdown estilo IEEE 828-2012).
const LOG = 'docs/SCM_LOG.md';
const row =
  `| ${report.changeId} | ${report.shortCommit} | ${report.subject.replace(/\|/g, '/')} | ` +
  `${report.author} | ✅ ${report.ciStatus} | ${isoDate.slice(0, 10)} | ${report.baseline} |\n`;

if (existsSync(LOG)) {
  const content = readFileSync(LOG, 'utf8');
  if (
    !content.includes(report.commit) &&
    !content.includes(report.changeId + ' |')
  ) {
    writeFileSync(LOG, content.replace(/\n*$/, '\n') + row);
    console.log(`\nFila agregada a ${LOG}`);
  } else {
    console.log(`\n${LOG} ya contiene este cambio; sin cambios.`);
  }
}
