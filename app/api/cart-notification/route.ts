import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // n8n webhook URL
    const n8nWebhookUrl = 'http://192.168.4.114:5678/webhook/cart-item-added';
    
    console.log('Proxying cart notification to n8n:', body);
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send notification', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('n8n webhook success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Cart notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
