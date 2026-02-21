import type { Config } from "@netlify/functions";

// Netlify scheduled function - triggers the interest cron API route
export default async () => {
  const siteUrl = process.env.URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || '';

  try {
    const response = await fetch(`${siteUrl}/api/cron/interest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();
    console.log('Interest accrual result:', data);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Interest accrual failed:', error);
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 2 * * *", // Daily at 2am
};
