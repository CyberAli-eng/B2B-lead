import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully!');
      
      // If there was a search prompt, redirect to dashboard with it
      const prompt = location.state?.prompt;
      if (prompt) {
        navigate('/dashboard', { state: { prompt } });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const benefits = [
    "300M+ global contacts database",
    "AI-powered lead discovery",
    "95.4% email accuracy",
    "Free monthly credits"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 hero-pattern grid-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8" data-testid="register-logo">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">LaCleo<span className="text-purple-400">.ai</span></span>
        </Link>

        <Card className="glass-card border-[#2a2a3a] bg-[#12121a]/90 purple-glow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white">Create your account</CardTitle>
            <CardDescription className="text-gray-400">
              Start discovering high-quality leads today
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Benefits */}
            <div className="mb-6 p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
              <ul className="space-y-2">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    className="pl-10 bg-[#1a1a24] border-[#2a2a3a] text-white placeholder-gray-500 focus:border-purple-500 input-glow"
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-[#1a1a24] border-[#2a2a3a] text-white placeholder-gray-500 focus:border-purple-500 input-glow"
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-10 pr-10 bg-[#1a1a24] border-[#2a2a3a] text-white placeholder-gray-500 focus:border-purple-500 input-glow"
                    data-testid="register-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-button text-white py-3 border-0"
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="spinner w-5 h-5 mx-auto"></div>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium" data-testid="register-login-link">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
