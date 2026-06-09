import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Ticket from './pages/Ticket'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Teams from './pages/admin/Teams'
import Contacts from './pages/admin/Contacts'
import Tickets from './pages/admin/Tickets'
import CheckIn from './pages/admin/CheckIn'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/ticket/:token" element={<Ticket />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="teams" element={<Teams />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="checkin" element={<CheckIn />} />
      </Route>
    </Routes>
  )
}
