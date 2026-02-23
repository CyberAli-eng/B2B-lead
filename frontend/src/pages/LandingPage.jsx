import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Users, 
  Mail, 
  Zap, 
  BarChart3, 
  Shield, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Star,
  Play
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchPrompt, setSearchPrompt] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard', { state: { prompt: searchPrompt } });
    } else {
      navigate('/register', { state: { prompt: searchPrompt } });
    }
  };

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Leads Discovery Intelligence",
      description: "Discover and segment high-quality leads, reveal verified contacts, and get smart recommendations with AI-powered insights"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Outreach & Engagement",
      description: "Streamline your outreach process and boost engagement with targeted communication tools"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Leads Data Enrichment",
      description: "Enhance your lead data with additional insights and information for better decision making"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "LaCleo AI Force",
      description: "Leverage advanced AI capabilities to automate workflows and uncover valuable insights"
    }
  ];

  const stats = [
    { value: "300M+", label: "Total Global Contacts" },
    { value: "100M+", label: "Total Accounts" },
    { value: "95.4%", label: "Email Accuracy" },
    { value: "15M+", label: "Contacts Verified Monthly" }
  ];

  const testimonials = [
    {
      quote: "Switching to LaCleo was a game-changer for our market launch. Our team saved countless hours, and we saw a 30% increase in sales in the first quarter alone.",
      author: "Sarah Johnson",
      role: "VP of Sales, TechFlow",
      avatar: "SJ"
    },
    {
      quote: "Launching in new markets used to be daunting, but LaCleo changed that. We've cut our time-to-market in half, and the process is efficient and repeatable.",
      author: "Michael Chen",
      role: "Head of Growth, DataScale",
      avatar: "MC"
    },
    {
      quote: "The support from LaCleo is fantastic. Our dedicated rep guided us every step of the way, and the platform scales with our needs.",
      author: "Emily Rodriguez",
      role: "Director of Sales, CloudFirst",
      avatar: "ER"
    }
  ];

  const trustedCompanies = [
    "TechCorp", "DataFlow", "CloudScale", "InnovateLabs", "GrowthHub", "ScaleUp"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
              <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">LaCleo<span className="text-purple-400">.ai</span></span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-link text-gray-300 hover:text-white">Features</a>
              <a href="#stats" className="nav-link text-gray-300 hover:text-white">Stats</a>
              <a href="#testimonials" className="nav-link text-gray-300 hover:text-white">Testimonials</a>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="gradient-button text-white border-0"
                  data-testid="nav-dashboard-btn"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-300 hover:text-white" data-testid="nav-login-btn">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="gradient-button text-white border-0" data-testid="nav-signup-btn">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 hero-pattern grid-bg">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8 animate-fade-in">
            <span className="text-purple-400 text-sm">No credit card required</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm">Monthly Free Credits</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in stagger-1">
            AI Powered Lead Generation with
            <br />
            <span className="gradient-text">Unmatched Accuracy</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in stagger-2">
            <div className="text-6xl font-bold gradient-text">95%</div>
            <p className="text-left text-gray-400 text-sm max-w-xs">
              AI-driven lead-generation platform, delivering up to unprecedented accuracy.
            </p>
          </div>
          
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto animate-fade-in stagger-3">
            Discover, enrich, and engage high-value B2B leads with our intelligent platform that works 24/7 for you.
          </p>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-12 animate-fade-in stagger-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="glass-card rounded-2xl p-2 purple-glow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Find SaaS companies in California with 50-200 employees..."
                      value={searchPrompt}
                      onChange={(e) => setSearchPrompt(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-transparent border-0 text-white placeholder-gray-500 focus:ring-0 text-lg"
                      data-testid="hero-search-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="gradient-button text-white px-8 py-4 text-lg border-0"
                    data-testid="hero-search-btn"
                  >
                    Find Leads
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </form>
            <p className="text-gray-500 text-sm mt-4 flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Try voice search for faster lead discovery
            </p>
          </div>
          
          {/* Trusted By */}
          <div className="animate-fade-in stagger-5">
            <p className="text-gray-500 text-sm mb-6">Trusted by leading companies</p>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-50">
              {trustedCompanies.map((company, i) => (
                <span key={i} className="text-gray-400 font-medium">{company}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Core capabilities
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to discover, enrich, and engage with high-quality leads
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="glass-card feature-card border-[#2a2a3a] bg-[#12121a]"
                data-testid={`feature-card-${i}`}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link to="/register">
              <Button className="gradient-button text-white px-8 py-3 border-0" data-testid="features-cta-btn">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <Card 
                key={i} 
                className="stat-card glass-card border-[#2a2a3a] bg-[#12121a] text-center"
                data-testid={`stat-card-${i}`}
              >
                <CardContent className="p-8">
                  <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                  <p className="text-gray-400">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Power Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-purple-400 text-sm font-medium">From Discovery to Deal — Fully Automated</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6">
                The Power of AI Beyond Leads Discovery
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Use the power of AI to automate your sales funnel. Use LaCleo's intelligent AI force to identify high-quality leads in real-time, craft personalized outreach, and track engagement — all the way to conversion.
              </p>
              <ul className="space-y-3 mb-8">
                {['Real-time lead identification', 'Personalized outreach automation', 'Engagement tracking', 'Full-stack revenue machine'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="gradient-button text-white px-8 py-3 border-0" data-testid="ai-section-cta-btn">
                  Get Started for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="glass-card rounded-2xl p-8 purple-glow">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a24]">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Leads Discovered</p>
                      <p className="text-xl font-bold">2,847</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a24]">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Emails Sent</p>
                      <p className="text-xl font-bold">1,234</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a24]">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Conversion Rate</p>
                      <p className="text-xl font-bold">24.8%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICP Signals Section */}
      <section className="py-20 px-4 bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="glass-card rounded-2xl p-8">
                <div className="space-y-4">
                  {[
                    { icon: <Globe className="w-5 h-5 text-blue-400" />, title: "Job Changes", desc: "Key decision maker moved to target company" },
                    { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: "Funding News", desc: "Series B funding announced - $25M" },
                    { icon: <Shield className="w-5 h-5 text-green-400" />, title: "Tech Adoption", desc: "Started using competitor's solution" },
                  ].map((signal, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#1a1a24]">
                      <div className="w-10 h-10 rounded-full bg-[#0a0a0f] flex items-center justify-center">
                        {signal.icon}
                      </div>
                      <div>
                        <p className="font-medium text-white">{signal.title}</p>
                        <p className="text-sm text-gray-400">{signal.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-purple-400 text-sm font-medium">ICP Signals — Smart Alerts for Smarter Outreach</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6">
                Powerful ICP Signals
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Don't just chase leads. Engage when it matters. LaCleo's AI tracks real-time intent and behavioral signals — like job changes, tech adoption, funding news, or decision-makers exploring new tools.
              </p>
              <p className="text-gray-300 font-medium mb-8">
                Right person. Right time. Right signal.
              </p>
              <Link to="/register">
                <Button className="gradient-button text-white px-8 py-3 border-0" data-testid="icp-section-cta-btn">
                  Get Started for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            What everyone is saying
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Trusted by professionals worldwide
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card 
                key={i} 
                className="glass-card border-[#2a2a3a] bg-[#12121a]"
                data-testid={`testimonial-card-${i}`}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{testimonial.author}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to supercharge your lead generation?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of sales professionals who are closing more deals with LaCleo AI.
          </p>
          <Link to="/register">
            <Button className="gradient-button text-white px-10 py-4 text-lg border-0" data-testid="final-cta-btn">
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">LaCleo<span className="text-purple-400">.ai</span></span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 LaCleo AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
