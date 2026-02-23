import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Users, 
  Building2, 
  Globe, 
  Database,
  ArrowRight,
  Star,
  Zap,
  FileSpreadsheet,
  UserSearch,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchPrompt, setSearchPrompt] = useState('');
  const [activeMode, setActiveMode] = useState('find_people');

  const handleSearch = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard', { state: { prompt: searchPrompt, mode: activeMode } });
    } else {
      navigate('/register', { state: { prompt: searchPrompt, mode: activeMode } });
    }
  };

  const searchModes = [
    { id: 'find_people', label: 'Find People', icon: <Users className="w-4 h-4" /> },
    { id: 'find_companies', label: 'Find Companies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'scrape_websites', label: 'Scrape Websites', icon: <Globe className="w-4 h-4" /> },
    { id: 'enrich_data', label: 'Enrich Data', icon: <Database className="w-4 h-4" /> },
  ];

  const quickActions = [
    { label: 'Personalize for You', icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Importing CSV', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { label: 'Find Numbers and Emails', icon: <UserSearch className="w-4 h-4" /> },
    { label: 'Find Lookalikes', icon: <Users className="w-4 h-4" /> },
  ];

  const sampleResults = [
    { fit_score: 97, company: "Burt", logo: "B", founder: "Kurt Sharma", batch: "W26", category: "AI/ML" },
    { fit_score: 95, company: "21st", logo: "2", founder: "Serafim Korablev", batch: "W26", category: "Developer Tools" },
    { fit_score: 93, company: "Sparkles", logo: "S", founder: "Daniil Bekirov", batch: "W26", category: "Developer Tools" },
    { fit_score: 91, company: "Traverse", logo: "T", founder: "Lance Yan", batch: "W26", category: "AI/ML" },
    { fit_score: 89, company: "Tensol", logo: "T", founder: "Oliviero Pinotti", batch: "W26", category: "AI Agents" },
    { fit_score: 87, company: "Crow", logo: "C", founder: "Aryan Vij", batch: "W26", category: "AI Agents" },
    { fit_score: 85, company: "Corelayer", logo: "C", founder: "Mitch Radhuber", batch: "W26", category: "AI Agents" },
    { fit_score: 83, company: "Perfectly", logo: "P", founder: "Victor Luo", batch: "W26", category: "AI/ML" },
  ];

  const templateCategories = [
    { name: "Popular", count: 13 },
    { name: "Healthcare", count: 41 },
    { name: "Fintech", count: 25 },
    { name: "E-commerce", count: 20 },
    { name: "Biotech", count: 17 },
    { name: "Proptech", count: 14 },
  ];

  const trustedCompanies = ["Route", "Rho", "CBRE", "Redesign Health", "MightyCause", "TouchSuite"];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LaCleo</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#use-cases" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Use Cases</a>
              <a href="#templates" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Templates</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 text-sm font-medium">FAQ</a>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  data-testid="nav-dashboard-btn"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900" data-testid="nav-login-btn">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="nav-signup-btn">
                      Start Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Product Hunt Badge */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span className="font-medium text-orange-800">We just hit #1 Product of the Day on Product Hunt</span>
          <a href="#" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            Read more <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-4">How can I find your perfect customers?</p>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Stop building lead lists manually.
            <br />
            <span className="text-gray-400">Find your perfect customers with one prompt.</span>
          </h1>
          
          {/* Search Box */}
          <div className="max-w-3xl mx-auto mb-6">
            <form onSubmit={handleSearch}>
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:border-violet-300 transition-colors">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Find VPs of Sales at SaaS companies that just raised Series B..."
                    value={searchPrompt}
                    onChange={(e) => setSearchPrompt(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-lg placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                    data-testid="hero-search-input"
                  />
                </div>
                
                {/* Search Mode Tabs */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-1">
                    {searchModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setActiveMode(mode.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          activeMode === mode.id 
                            ? 'bg-violet-100 text-violet-700' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        data-testid={`mode-${mode.id}`}
                      >
                        {mode.icon}
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  <Button 
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6"
                    data-testid="hero-search-btn"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-gray-400 text-sm">or start by</span>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mb-8">
            Try it free — no credit card required
          </p>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gray-900 text-white border-0 rounded-2xl overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              {/* Chat Header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-400">YC W26 Founders — AI/ML</span>
              </div>
              
              {/* AI Response */}
              <div className="px-6 py-4">
                <p className="text-gray-300 text-sm mb-4">
                  Find YC W26 founders building in AI and developer tools
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Found 20 YC W26 founders in AI/ML and developer tools. Results are sorted by relevance — I've included founder details, batch, and category information.
                </p>
                
                {/* Results Table */}
                <div className="bg-gray-800/50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium">People</span>
                      <Badge variant="secondary" className="bg-violet-600/20 text-violet-300 text-xs">
                        20 leads
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                        5 columns
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 text-xs">
                      Get more leads (~327)
                    </Button>
                  </div>
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs text-gray-500 border-b border-gray-700/50">
                    <div className="col-span-1"></div>
                    <div>Fit Score</div>
                    <div>Company</div>
                    <div>Founder</div>
                    <div>Batch</div>
                    <div>Category</div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="max-h-80 overflow-y-auto">
                    {sampleResults.map((result, i) => (
                      <div 
                        key={i}
                        className="grid grid-cols-6 gap-4 px-4 py-3 text-sm border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors items-center"
                      >
                        <div className="text-gray-500">{i + 1}</div>
                        <div>
                          <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${
                            result.fit_score >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                            result.fit_score >= 80 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {result.fit_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
                            {result.logo}
                          </div>
                          <span className="text-white">{result.company}</span>
                        </div>
                        <div className="text-gray-300">{result.founder}</div>
                        <div className="text-gray-400">{result.batch}</div>
                        <div>
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                            {result.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Follow-up Input */}
                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-xl">
                  <Input
                    placeholder="Ask a follow-up..."
                    className="flex-1 bg-transparent border-0 text-white placeholder-gray-500 focus-visible:ring-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 px-4 border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-8">
            Trusted by scale-ups and public companies to generate qualified pipeline
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
            {trustedCompanies.map((company, i) => (
              <span key={i} className="text-gray-600 font-semibold text-lg">{company}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Personalize Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Personalize LaCleo for <span className="text-violet-600">You</span>
          </h2>
          <p className="text-gray-500 mb-8">
            Enter your website to get personalized prospect recommendations
          </p>
          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="yourcompany.com"
                className="pl-12 py-6 text-lg border-2 border-gray-200 focus:border-violet-400"
              />
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-6">
              Analyze
            </Button>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Example Use Cases</h2>
          <p className="text-gray-500 mb-8">Browse by industry or search for specific workflows</p>
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {templateCategories.map((cat, i) => (
              <Button
                key={i}
                variant={i === 0 ? "default" : "outline"}
                className={i === 0 ? "bg-violet-600 text-white" : "border-gray-300 text-gray-600"}
                size="sm"
              >
                {cat.name}
                <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                  {cat.count}
                </Badge>
              </Button>
            ))}
          </div>
          
          {/* Template Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Find VPs of Sales at Series B Companies",
                description: "Search for VP-level sales executives at companies that recently raised Series B funding.",
                columns: ["Fit Score", "Company", "Contact", "Title", "Funding"],
              },
              {
                title: "Find Recently Funded Fintechs",
                description: "Search for fintech companies that have recently raised capital for vendor opportunities.",
                columns: ["Fit Score", "Company", "Segment", "Funding", "Stage"],
              },
              {
                title: "Find Healthcare Orgs with New Leadership",
                description: "Search for healthcare organizations with recent executive changes.",
                columns: ["Fit Score", "Organization", "Contact", "Title", "Start Date"],
              },
              {
                title: "Find Stores Migrating Platforms",
                description: "Search for e-commerce brands migrating between platforms.",
                columns: ["Fit Score", "Brand", "From", "To", "Revenue"],
              },
            ].map((template, i) => (
              <Card key={i} className="border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-violet-600 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">{template.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {template.columns.map((col, j) => (
                      <Badge key={j} variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-end mt-4">
                    <span className="text-violet-600 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          
          <div className="space-y-4">
            {[
              { q: "What is LaCleo?", a: "LaCleo is an AI-powered GTM platform that helps sales teams find ideal customers, build prospect lists, and enrich data using natural language prompts." },
              { q: "How is LaCleo different from Apollo or ZoomInfo?", a: "LaCleo uses AI to understand natural language queries and can search across multiple data sources to find prospects that traditional databases miss." },
              { q: "What data sources does LaCleo use?", a: "We aggregate data from multiple sources including company databases, social networks, news, funding announcements, and job postings." },
              { q: "How accurate is the contact data?", a: "Our email accuracy rate is 95.4% with real-time verification before delivery." },
              { q: "How does the credit system work?", a: "Credits are used when you export leads or enrich data. Free tier includes 100 credits per month." },
            ].map((faq, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{faq.q}</h3>
                  <p className="text-gray-500 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Find your next perfect customers.
          </h2>
          <p className="text-violet-200 mb-8">
            Join teams who are already using AI to build pipeline faster. Start your free trial today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button className="bg-white text-violet-700 hover:bg-gray-100 px-8 py-3" data-testid="final-cta-btn">
                Start Free
              </Button>
            </Link>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3">
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900">LaCleo</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 LaCleo. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
