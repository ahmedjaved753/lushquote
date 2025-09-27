import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CheckCircle, AlertCircle, Flower2 } from 'lucide-react'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    // Check if we have the required tokens
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    // Check for error parameters in the URL hash
    const hash = window.location.hash.substring(1) // Remove the # symbol
    const hashParams = new URLSearchParams(hash)
    const error = hashParams.get('error')
    const errorCode = hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')

    // If we have error parameters, the link is expired/invalid
    if (error || errorCode || errorDescription) {
      setIsValidToken(false)
      if (errorCode === 'otp_expired') {
        setError('This password reset link has expired. Password reset links are only valid for a limited time for security reasons.')
      } else {
        setError(errorDescription || 'This password reset link is invalid or has expired.')
      }
    } else if (!accessToken || !refreshToken || type !== 'recovery') {
      setIsValidToken(false)
      setError('This password reset link is invalid or missing required parameters.')
    }
  }, [searchParams])

  const validateForm = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    
    return true
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError('')

    try {
      await updatePassword(password)
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login', { 
          state: { message: 'Password updated successfully. Please sign in with your new password.' }
        })
      }, 3000)
    } catch (error) {
      console.error('Password update error:', error)
      
      if (error.message.includes('Password should be')) {
        setError('Password must be at least 6 characters long.')
      } else if (error.message.includes('New password should be different')) {
        setError('New password should be different from your current password.')
      } else {
        setError(error.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4">
        <Card className="w-full max-w-md shadow-xl border-red-100">
          <CardHeader className="space-y-1 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-2xl font-bold text-red-700">Invalid reset link</CardTitle>
            <CardDescription className="text-gray-600">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-gray-600 text-center">
              Please request a new password reset link to continue.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Link to="/auth/forgot-password">
              <Button variant="outline">Request new link</Button>
            </Link>
            <Link to="/auth/login">
              <Button>Back to sign in</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4">
        <Card className="w-full max-w-md shadow-xl border-green-100">
          <CardHeader className="space-y-1 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">Password updated</CardTitle>
            <CardDescription className="text-gray-600">
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              You will be redirected to the sign in page automatically.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/auth/login">
              <Button>Sign in now</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-green-100">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4">
            <Flower2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">Set new password</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
