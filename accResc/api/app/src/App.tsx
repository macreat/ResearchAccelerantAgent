import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import Home from './pages/Home'
import Session from './pages/Session'
import History from './pages/History'
import Docs from './pages/Docs'
import AppLayout from './components/AppLayout'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:id" element={<Session />} />
        <Route path="/history" element={<History />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
      <Toaster position="top-right" />
    </AppLayout>
  )
}
