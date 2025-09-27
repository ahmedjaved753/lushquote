import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle OAuth callback
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/'
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        // Handle email confirmation
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (accessToken && refreshToken) {
          if (type === 'signup') {
            // Email confirmation
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            if (error) throw error
            
            setSuccess(true)
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 2000)
          } else if (type === 'recovery') {
            // Password reset - redirect to reset password page with tokens
            navigate(`/auth/reset-password?${searchParams.toString()}`, { replace: true })
            return
          }
        } else {
          // OAuth success
          setSuccess(true)
          setTimeout(() => {
            navigate(next, { replace: true })
          }, 2000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError(error.message || 'Authentication failed')
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/auth/login', { 
            state: { 
              error: 'Authentication failed. Please try again.' 
            },
            replace: true 
          })
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        {loading && (
          <>
            <CardHeader className="space-y-1 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Authenticating</CardTitle>
              <CardDescription>
                Please wait while we complete your authentication...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {success && !loading && (
          <>
            <CardHeader className="space-y-1 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Success!</CardTitle>
              <CardDescription>
                Authentication completed successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                You will be redirected shortly...
              </p>
            </CardContent>
          </>
        )}

        {error && !loading && (
          <>
            <CardHeader className="space-y-1 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600 text-center mt-4">
                You will be redirected to the login page...
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
