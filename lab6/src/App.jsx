import { Routes, Route } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import DashboardPage from './components/DashboardPage'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
      <Routes>
        <Route
            path="/"
            element={
              <div className="page-container">
                <LoginPage />
              </div>
            }
        />
        <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
        />
      </Routes>
  )
}

export default App
