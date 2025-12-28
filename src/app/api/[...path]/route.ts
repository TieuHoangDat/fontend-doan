// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://tieuhoangdat.xyz';

// ✅ Helper function để thêm CORS headers
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

async function handleRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path: pathSegments } = await params;
  const path = pathSegments.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;

  console.log(`[PROXY] ${request.method} → ${url}`);

  try {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const text = await request.text();
      body = text || undefined;
    }

    // ✅ Thêm timeout để tránh hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.text();

    const res = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // ✅ Copy headers từ backend
    response.headers.forEach((value, key) => {
      res.headers.set(key, value);
    });

    // ✅ Thêm CORS headers
    return corsHeaders(res);
  } catch (error: any) {
    console.error('[PROXY ERROR]:', error);
    
    // ✅ Trả về lỗi với CORS headers
    const errorResponse = NextResponse.json(
      { 
        message: 'Backend connection failed', 
        error: error.name === 'AbortError' ? 'Request timeout' : error.message 
      },
      { status: error.name === 'AbortError' ? 504 : 500 }
    );
    
    return corsHeaders(errorResponse);
  }
}

// ✅ Handle OPTIONS request (preflight)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return corsHeaders(response);
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, context.params);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, context.params);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, context.params);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, context.params);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, context.params);
}