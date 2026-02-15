import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import assets from '../assets/assets';
import authService from '../services/authService';
import LoadingCard from '../Components/AuthPage/LoadingCard';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/home';

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (!formData.username.trim()) {
        setError('Username is required');
        return false;
      }
    }
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      if (isLogin) {
        // Login
        const response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
        
        // Ensure minimum 1.2s loading animation
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1200 - elapsedTime);
        
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        // Check if user has admin role
        const userRoles = response.user?.roles || [];
        const isAdmin = userRoles.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN');
        
        if (isAdmin) {
          // Redirect admin users to admin dashboard
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Redirect regular users to the page they tried to access or home
          navigate(from, { replace: true });
        }
      } else {
        // Registration - Call backend without auto-login
        const response = await fetch('http://localhost:8080/public/api/v1/register', {
          method: 'POST',
          
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Username: formData.username,
            Email: formData.email,
            Password: formData.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Registration failed');
        }

        // Ensure minimum 1.2s loading animation
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1200 - elapsedTime);
        
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        // After successful registration, switch to login mode
        setSuccessMessage('Registration successful! Please login with your credentials.');
        setIsLogin(true);
        setFormData({
          email: formData.email, // Keep email for convenience
          password: '',
          confirmPassword: '',
          username: ''
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    });
  };

  return (
    <>
      {/* Loading Card Animation */}
      <LoadingCard 
        isLoading={loading} 
        message={isLogin ? 'Logging in...' : 'Creating account...'}
      />

      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <img 
          src={assets.herobg} 
          alt="Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-green-900/20"></div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity }}
        style={{ top: '10%', left: '10%' }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
        style={{ bottom: '10%', right: '10%' }}
      />

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              SocialStream
            </h1>
            <p className="text-gray-400">
              {isLogin ? 'Welcome back!' : 'Join the community'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-400 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg"
            >
              <p className="text-green-400 text-sm text-center">{successMessage}</p>
            </motion.div>
          )}

          {/* Sliding Card with Two Panels */}
          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-green-500/20 overflow-hidden h-[480px]">
            <motion.div
              animate={{ x: isLogin ? '0%' : '-50%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="flex w-[200%] h-full"
            >
              {/* Login Section - Left Panel when Login, Hidden when Signup */}
              <div className="w-1/2 flex">
                {/* Login Form */}
                <div className="w-1/2 p-8 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Login</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* Password Input */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                        placeholder="Enter your password"
                      />
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                      <button type="button" className="text-xs text-green-400 hover:text-green-300 transition">
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? 'Loading...' : 'Login'}
                    </button>
                  </form>
                </div>

                {/* Welcome Back Panel - Right side for Login */}
                <div className="w-1/2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-8 flex flex-col justify-center items-center text-center border-l border-green-500/30">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Welcome Back!</h3>
                    <p className="text-gray-300 text-sm mb-6">
                      Enter your credentials to access your account and continue streaming with friends
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-300 text-sm mb-3">Don't have an account?</p>
                    <button
                      onClick={toggleAuthMode}
                      className="px-6 py-2 bg-white/10 backdrop-blur-sm rounded-lg font-semibold border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-white transition-all duration-300"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Signup Section - Right Panel when Signup, Hidden when Login */}
              <div className="w-1/2 flex">
                {/* Welcome Panel - Left side for Signup */}
                <div className="w-1/2 bg-gradient-to-br from-emerald-500/20 to-green-600/20 p-8 flex flex-col justify-center items-center text-center border-r border-green-500/30">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Join Us!</h3>
                    <p className="text-gray-300 text-sm mb-6">
                      Create an account and start your journey of watching movies and streaming music together
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-300 text-sm mb-3">Already have an account?</p>
                    <button
                      onClick={toggleAuthMode}
                      className="px-6 py-2 bg-white/10 backdrop-blur-sm rounded-lg font-semibold border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-white transition-all duration-300"
                    >
                      Login
                    </button>
                  </div>
                </div>

                {/* Signup Form */}
                <div className="w-1/2 p-8 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Sign Up</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Username Input */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                        placeholder="Choose a username"
                      />
                    </div>

                    {/* Email Input */}
                    <div>
                      <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* Password Input */}
                    <div>
                      <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        id="signup-password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                        placeholder="Create a password"
                      />
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 bg-white/5 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                        placeholder="Confirm your password"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Social Login (Optional) */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-green-500/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-black text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="px-4 py-3 bg-white/5 border border-green-500/20 rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button className="px-4 py-3 bg-white/5 border border-green-500/20 rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
};

export default AuthPage;
