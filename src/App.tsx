import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Buy from './pages/Buy'
import Ticket from './pages/Ticket'
import Scoreboard from './pages/overlay/Scoreboard'
import LowerThird from './pages/overlay/LowerThird'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Teams from './pages/admin/Teams'
import Contacts from './pages/admin/Contacts'
import Tickets from './pages/admin/Tickets'
import CheckIn from './pages/admin/CheckIn'
import Matches from './pages/admin/Matches'
import Analytics from './pages/admin/Analytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/ticket/:token" element={<Ticket />} />
      {/* Broadcast overlays (OBS browser sources, transparent bg) */}
      <Route path="/overlay/scoreboard" element={<Scoreboard />} />
      <Route path="/overlay/lower-third" element={<LowerThird />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="teams" element={<Teams />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="matches" element={<Matches />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="contacts" element={<Contacts />} />
      </Route>
    </Routes>
  )
}
