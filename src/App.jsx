import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from '@/hooks/useAuth'
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary'

function App() {
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <Pages />
        <Toaster />
      </AuthProvider>
    </AuthErrorBoundary>
  )
}

export default App 