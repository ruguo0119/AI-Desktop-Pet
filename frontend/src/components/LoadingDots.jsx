import { useState, useEffect } from 'react'

const LoadingDots = () => {
  const [dots, setDots] = useState('')
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  return <span className="loading-dots">{dots}</span>
}

export default LoadingDots 