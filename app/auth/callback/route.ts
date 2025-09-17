import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/api-helpers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirectTo') || '/'
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }
      
      // Successfully authenticated
      console.log('Session created successfully')
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
