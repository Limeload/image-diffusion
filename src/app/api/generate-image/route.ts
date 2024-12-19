import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    const prompt = `A beautiful image of ${text}`;
    const apiKey = process.env.API_KEY;
    
    // Create URL with properly encoded parameters
    const url = new URL('https://faizan--sd-demo-model-generate.modal.run/');
    // Use the raw prompt without double encoding
    url.searchParams.set('prompt', prompt);

    console.log('Requesting URL:', url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        'X-API-Key': apiKey || '',
        'Accept': 'image/jpeg'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Get the image data as an array buffer
    const imageBuffer = await response.arrayBuffer();

    // Return the image with the correct content type
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    });
    
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json(
      { success: false, error: `Failed to process request: ${error}` },
      { status: 500 }
    );
  }
}
