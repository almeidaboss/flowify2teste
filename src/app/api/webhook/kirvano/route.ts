
// src/app/api/webhook/kirvano/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// This is a simplified example. In a real-world scenario, you should
// validate the webhook request, for example, by checking a secret token.
// const KIRVANO_SECRET = process.env.KIRVANO_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // In a real scenario, you'd verify the request source here.
    // const headers = req.headers;
    // const kirvanoSignature = headers.get('x-kirvano-signature');
    // if (kirvanoSignature !== KIRVANO_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();

    // NOTE: Adjust these fields based on the actual payload from Kirvano
    const buyerEmail = body?.customer?.email;
    const productName = body?.product?.name; // Or some product ID

    if (!buyerEmail || !productName) {
      return NextResponse.json({ error: 'Missing required fields: email or product name' }, { status: 400 });
    }

    // Logic to map product name/ID to a plan ID
    let planId = 'iniciante'; // Default plan ID
    if (productName.toLowerCase().includes('chefe')) {
      planId = 'intermediario';
    } else if (productName.toLowerCase().includes('bigode')) {
      planId = 'bigode';
    } else if (productName.toLowerCase().includes('iniciante')) {
      planId = 'iniciante';
    }
    
    const approvedEmailsRef = collection(db, 'approvedEmails');
    await addDoc(approvedEmailsRef, {
      email: buyerEmail.toLowerCase(),
      plan: planId,
      createdAt: Timestamp.now(),
    });

    console.log(`Email ${buyerEmail} approved for plan ${planId}.`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
