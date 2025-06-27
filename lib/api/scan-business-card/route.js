// app/api/scan-business-card/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { imageBase64 } = await request.json();
        
        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Remove data URL prefix if present
        const base64Image = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Call Google Vision API
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [{
                        type: 'TEXT_DETECTION',
                        maxResults: 1
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
            const extractedText = data.responses[0].textAnnotations[0].description;
            
            // Basic parsing logic
            const parsedContact = parseBusinessCardText(extractedText);
            
            return NextResponse.json({ 
                success: true, 
                extractedText,
                parsedContact 
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                error: 'No text detected in image' 
            }, { status: 400 });
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process image' 
        }, { status: 500 });
    }
}

// Simple parsing function
function parseBusinessCardText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    const contact = {
        name: '',
        email: '',
        phone: '',
        company: '',
        title: ''
    };
    
    // Email detection
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
        contact.email = emailMatch[0];
    }
    
    // Phone detection (simple version)
    const phoneRegex = /[\+]?[(]?[\d\s\-\(\)\.]{10,}[\d]/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
        contact.phone = phoneMatch[0].trim();
    }
    
    // Name (usually first or second line, largest text)
    if (lines.length > 0) {
        contact.name = lines[0].trim();
    }
    
    // Company (often after name)
    if (lines.length > 1) {
        contact.company = lines[1].trim();
    }
    
    return contact;
}