import React from 'react'

function WeatherCard({ date, temp, condition, icon }) {
  return (
      <div className="weather-card">
        <p className="card-category">{date}</p>
        <div className="weather-info">
          <span className="weather-icon">{icon}</span>
          <h3 className="card-title">{temp}°C</h3>
        </div>
        <p className="card-condition">{condition}</p>
      </div>
  )
}

export default WeatherCard
