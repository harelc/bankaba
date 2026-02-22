import type { Config } from "@netlify/functions";

export default async () => {
  const siteUrl = process.env.URL || 'http://localhost:3000';
  const startTime = Date.now();

  console.log(`[daily-interest] Starting at ${new Date().toISOString()}`);
  console.log(`[daily-interest] Calling ${siteUrl}/api/cron/interest`);

  try {
    const response = await fetch(`${siteUrl}/api/cron/interest`, {
      method: 'POST',
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log(`[daily-interest] Status: ${response.status}`);
    console.log(`[daily-interest] Result: ${JSON.stringify(data)}`);
    console.log(`[daily-interest] Completed in ${duration}ms`);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[daily-interest] FAILED after ${duration}ms:`, error);
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 2 * * *", // Daily at 2am UTC
};
