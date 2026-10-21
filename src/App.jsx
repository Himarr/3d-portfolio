import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ScrollToHash from './components/ScrollToHash.jsx'
import SnapScroller from './components/SnapScroller.jsx'
import RouteScrollReset from './components/RouteScrollReset.jsx'
import HomePage from './pages/HomePage.jsx'
import ProjectPage from './pages/ProjectPage.jsx'
import ViewerPage from './pages/ViewerPage.jsx'

const shellClass = 'flex min-h-svh flex-col bg-ink text-text font-sans'
const mainClass = 'flex-1'

function App() {
  return (
    <div className={shellClass}>
      <Navbar />
      <ScrollToHash />
      <RouteScrollReset />
      <SnapScroller />
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="/projects/:slug" element={<ProjectPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
