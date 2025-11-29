import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return Response.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set('gemini_api_key', apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error setting API key:', error);
    return Response.json(
      { error: 'Failed to set API key' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('gemini_api_key');
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return Response.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasKey = !!cookieStore.get('gemini_api_key')?.value;
    return Response.json({ hasKey });
  } catch (error) {
    console.error('Error checking API key:', error);
    return Response.json(
      { error: 'Failed to check API key' },
      { status: 500 }
    );
  }
}
