import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (email === 'vlad3' && password === 'vlad3') {
      Cookies.set('isLoggedIn', 'true', { expires: 1 })
      navigate('/dashboard')
    } else {
      setError('Invalid email or password. Please try again.')
    }
  }

  return (
      <div className="login-form-container">
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>
          <div className="password-options">
            <a href="#">Forgot password?</a>
          </div>
          <button type="submit" className="submit-btn">
            Continue
          </button>
        </form>
      </div>
  )
}

export default LoginPage
