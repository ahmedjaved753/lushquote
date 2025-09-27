import { Component } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Flower2 } from 'lucide-react'

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4">
          <Card className="w-full max-w-md shadow-xl border-red-100">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-700">Authentication Error</CardTitle>
              <CardDescription className="text-gray-600">
                Something went wrong with the authentication system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    this.setState({ hasError: false, error: null })
                  }}
                  className="border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
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
