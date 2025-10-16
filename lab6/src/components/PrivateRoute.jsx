import React from 'react'
import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'

function PrivateRoute({ children }) {
  const isLoggedIn = Cookies.get('isLoggedIn')

  return isLoggedIn ? children : <Navigate to="/" />
}

export default PrivateRoute
