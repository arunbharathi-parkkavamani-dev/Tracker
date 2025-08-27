import { useRoutes } from 'react-router-dom'
import routes from '~react-pages'
import './App.css'

function App() {
  const element = useRoutes(routes)
  return element
}

export default App
