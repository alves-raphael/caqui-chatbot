async function ping(url: string): Promise<boolean> {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void> {
  const web = process.env['WEB_URL'] ?? 'http://localhost:5174';
  const api = process.env['API_URL'] ?? 'http://localhost:3000';
  if (!(await ping(web)) || !(await ping(`${api}/health`))) {
    throw new Error('Environment is not running. Run `yarn setup` (or `yarn status` to inspect).');
  }
}
