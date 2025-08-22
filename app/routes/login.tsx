import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { userAtom } from '~/utils/userAtom';
import { AuthAPI, handleAuthError, type LoginResponse } from '~/utils/api.auth';
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react';
import { useAuthRedirect } from '~/hooks/useAuthRedirect';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [, setUser] = useAtom(userAtom);
  
  useAuthRedirect(false);
  

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Lütfen e-posta adresinizi giriniz');
      return;
    }
    
    if (!password.trim()) {
      setError('Lütfen şifrenizi giriniz');
      return;
    }

    setIsLoading(true);

    try {
      const response: LoginResponse = await AuthAPI.login({
        email: email.trim(),
        password: password,
      });

      if (response.success) {
        const userData = {
          userId: response.userId,
          email: response.email,
          permissionType: response.permissionType,
          status: response.status,
          loginTime: Date.now(),
          fullName: response.fullName || response.email.split('@')[0],
          role: response.permissionType
        };

        setUser(userData);
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        navigate('/dashboard');
      } else {
        const errorMessage = response.message || 'Giriş işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.';
        setError(errorMessage);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = handleAuthError(error) || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-white/10 p-3 rounded-lg mr-4 backdrop-blur-sm">
                <img src='unixpadel-logo.png' className="w-25 h-16 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Unix Padel CRM</h1>
                <p className="text-blue-200">Business Solutions</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Streamline Your Business Operations
              </h2>
              <p className="text-lg text-blue-100 leading-relaxed">
                Access your comprehensive CRM dashboard to manage customers, track sales, 
                and grow your business with powerful analytics and automation tools.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Customer Relationship Management</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Sales Pipeline Tracking</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Advanced Analytics & Reports</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Team Collaboration Tools</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 opacity-10">
          <svg width="400" height="400" viewBox="0 0 400 400" className="text-white">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="lg:hidden flex-col justify-center mb-8">
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <img src="unixpadel-logo.png" className="w-25 h-16 object-contain" alt="Unixpadel Logo" />
          </div>
            <h1 className="text-2xl font-bold text-gray-900">Unix Padel CRM</h1>
            <p className="text-gray-600">Business Solutions</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Please sign in to your account</p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

           

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign In
                  <ArrowRightIcon className="ml-2 w-5 h-5" />
                </div>
              )}
            </button>

            </div>
        </div>
      </div>
    </div>
  );
}
