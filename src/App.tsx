import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import NewsPage from './pages/NewsPage'
import MapPage from './pages/MapPage'
import About from './pages/About'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<NewsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  )
}

export default App
