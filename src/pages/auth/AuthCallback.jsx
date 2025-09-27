import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Flower2 } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-green-100">
        {loading && (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">Authenticating</CardTitle>
              <CardDescription className="text-gray-600">
                Please wait while we complete your authentication...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {success && !loading && (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">Success!</CardTitle>
              <CardDescription className="text-gray-600">
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
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-700">Authentication Error</CardTitle>
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
