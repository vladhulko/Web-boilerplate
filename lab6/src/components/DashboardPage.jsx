import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import WeatherCard from './WeatherCard'

const getWeatherIcon = (conditionText) => {
  const condition = conditionText.toLowerCase()

  if (condition.includes('sun') || condition.includes('clear')) return '☀️'
  if (condition.includes('cloudy')) return '⛅️'
  if (condition.includes('cloud') || condition.includes('overcast')) return '☁️'
  if (condition.includes('rain') || condition.includes('drizzle')) return '🌧️'
  if (condition.includes('snow') || condition.includes('sleet') || condition.includes('blizzard')) return '❄️'
  if (condition.includes('thunder')) return '⛈️'
  if (condition.includes('mist') || condition.includes('fog')) return '🌫️'

  return '🌍'
}

function DashboardPage() {
  const [weatherData, setWeatherData] = useState([])
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const handleLogout = () => {
    Cookies.remove('isLoggedIn')
    navigate('/')
  }

  const fetchWeather = async (apiUrl) => {
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error('Weather data not found.')
      }
      const data = await response.json()
      setWeatherData(data.forecast.forecastday)
      setLocation(data.location.name)
    } catch (e) {
      console.error('Could not fetch weather data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY

    navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=5&aqi=no&alerts=no`
          fetchWeather(apiUrl)
        },
        (geoError) => {
          console.warn('Geolocation failed, falling back to Kyiv:', geoError.message)
          const fallbackApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=Kyiv&days=5&aqi=no&alerts=no`
          fetchWeather(fallbackApiUrl)
        }
    )
  }, [])

  if (loading) {
    return <div className="status-message loading">Loading weather data...</div>
  }

  return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <h1>{location} Weather Forecast</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </header>
        <div className="weather-grid">
          {weatherData.map((day) => (
              <WeatherCard
                  key={day.date_epoch}
                  date={new Date(day.date).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                  temp={day.day.avgtemp_c}
                  condition={day.day.condition.text}
                  icon={getWeatherIcon(day.day.condition.text)}
              />
          ))}
        </div>
      </div>
  )
}

export default DashboardPage
