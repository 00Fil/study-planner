import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/api-helpers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }
      
      // Successfully authenticated
      console.log('Session created successfully')
      
      // Create response with redirect
      const redirectUrl = `${origin}${next}`
      const response = NextResponse.redirect(redirectUrl)
      
      return response
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
