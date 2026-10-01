import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Usar exclusivamente con un worktree temporal creado por el propio fixture.
export function fixtureDaemonPid(worktree) {
  const file = join(worktree, ".tgrep", "serve.json");
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")).pid;
}

export async function stopFixtureDaemon(worktree) {
  const pid = fixtureDaemonPid(worktree);
  if (!pid) return;
  try { process.kill(pid); } catch (error) { if (error.code === "ESRCH") return; throw error; }
  for (let attempt = 0; attempt < 100; attempt++) {
    try { process.kill(pid, 0); }
    catch (error) { assert.equal(error.code, "ESRCH"); return; }
    await delay(50);
  }
  throw new Error(`El daemon del fixture ${pid} no terminó en cinco segundos.`);
}

export async function cleanServiceFixture(worktree) {
  await stopFixtureDaemon(worktree);
  // Permitir recoger los handles de spawn antes de borrar el cwd en Windows.
  await delay(100);
  rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
