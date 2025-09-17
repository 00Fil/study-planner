import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'study-planner',
    features: {
      scraping: process.env.PUPPETEER_EXECUTABLE_PATH ? 'enabled' : 'disabled',
      environment: process.env.NODE_ENV || 'development'
    }
  });
}