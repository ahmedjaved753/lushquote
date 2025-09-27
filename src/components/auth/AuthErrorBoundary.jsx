import { Component } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class AuthErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Authentication error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
              <CardDescription>
                Something went wrong with the authentication system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    this.setState({ hasError: false, error: null })
                  }}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthErrorBoundary
