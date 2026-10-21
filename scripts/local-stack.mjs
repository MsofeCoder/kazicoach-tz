import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// No remote override: bind CLI discovery to this checkout's project and API port.
export function localStack() {
  const branch = spawnSync('git', ['branch', '--show-current'], {encoding:'utf8'});
  if (branch.status !== 0 || branch.stdout.trim() !== 'feature/kazicoach-v2')
    throw new Error('Local tooling requires feature/kazicoach-v2');
  const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  if (!/^project_id\s*=\s*"kazicoach-tz"\s*$/m.test(config)) throw new Error('Unexpected local project');
  const api = config.match(/^\[api\]\r?\n([\s\S]*?)(?=^\[)/m)?.[1];
  const port = api?.match(/^port\s*=\s*(\d+)\s*$/m)?.[1];
  if (!port || Number(port) < 1024 || Number(port) > 65535) throw new Error('Invalid local API port');
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d','/s','/c','supabase status --output json'], {encoding:'utf8'})
    : spawnSync('supabase', ['status','--output','json'], {encoding:'utf8'});
  if (result.status !== 0) throw new Error('Start this repository local Supabase stack first');
  const settings = JSON.parse(result.stdout);
  if (settings.API_URL !== `http://127.0.0.1:${port}`) throw new Error('CLI endpoint does not match this local project configuration');
  return settings; // Contains local privileged keys: never print this object.
}
