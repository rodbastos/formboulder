import { NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const response = await fetch('https://script.google.com/macros/s/AKfycbzPOuwqqEEQEadvVweOlhOAG5d9DIy6zE4rlgckUb1o7ERWFWL6TQ2Ulkf8QBYhOSVXqw/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
      },
      body: JSON.stringify(data),
      redirect: 'follow',
    });

    const rawBody = await response.text();
    let result: Record<string, unknown> = {};

    if (rawBody) {
      try {
        result = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        result = {
          success: false,
          error: 'Google Sheets endpoint returned non-JSON content',
          responsePreview: rawBody.slice(0, 300),
        };
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            (typeof result.error === 'string' && result.error) ||
            `Google Sheets endpoint returned ${response.status}`,
          upstreamStatus: response.status,
          upstreamStatusText: response.statusText,
          details: result,
        },
        {
          status: 502,
          headers: CORS_HEADERS,
        }
      );
    }

    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error:
            (typeof result.error === 'string' && result.error) ||
            'Google Sheets script reported failure',
          details: result,
        },
        {
          status: 500,
          headers: CORS_HEADERS,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error('Error saving to sheets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save to Google Sheets',
        details: error instanceof Error ? error.message : 'Unknown server error',
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: CORS_HEADERS,
    }
  );
}
