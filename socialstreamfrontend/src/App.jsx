import React from 'react'
import {Route,Routes} from 'react-router-dom'
import LandingPage from './Pages/LandingPage'
import HomePage from './Pages/HomePage'
import AuthPage from './Pages/AuthPage'
import AdminLoginPage from './Pages/AdminLoginPage'
import VideoDetailsPage from './Pages/VideoDetailsPage'
import AdminDashboard from './Pages/AdminDashboard'
import PrivateRoute from './Components/shared/PrivateRoute'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element ={<LandingPage/>}/>
        <Route path='/auth' element={<AuthPage/>}/>
        <Route path='/admin/login' element={<AdminLoginPage/>}/>
        <Route 
          path ='/home' 
          element={
            <PrivateRoute allowedRoles={['USER']}>
              <HomePage/>
            </PrivateRoute>
          }
        />
        <Route 
          path='/admin/dashboard' 
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard/>
            </PrivateRoute>
          }
        />
        <Route 
          path='/video/:id' 
          element={
            <PrivateRoute>
              <VideoDetailsPage/>
            </PrivateRoute>
          }
        />
      </Routes>
      
    </div>
  )
}

export default App
