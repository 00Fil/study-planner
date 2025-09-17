import { AuthForm } from '@/components/auth/AuthForm'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Caricamento...</div>}>
      <AuthForm />
    </Suspense>
  )
}
