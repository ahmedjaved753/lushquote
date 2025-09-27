import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Home, Flower2 } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-orange-100">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-700">Access Denied</CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            This page requires specific permissions that your account doesn't have. 
            Please contact an administrator if you believe this is an error.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to="/" className="inline-flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()} className="border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
