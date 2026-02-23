import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Zap,
  Users,
  Building2,
  Globe,
  Database,
  Download,
  Send,
  LogOut,
  ChevronDown,
  Sparkles,
  MoreVertical,
  ExternalLink,
  Mail,
  Trash2,
  Info,
  FileSpreadsheet,
  History,
  Settings,
  CreditCard,
  HelpCircle,
  ArrowRight,
  Plus,
  Loader2,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getAuthHeaders } = useAuth();
  const messagesEndRef = useRef(null);
  
  // State
  const [searchPrompt, setSearchPrompt] = useState('');
  const [activeMode, setActiveMode] = useState('find_people');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateCategories, setTemplateCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [enrichmentData, setEnrichmentData] = useState(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);

  const searchModes = [
    { id: 'find_people', label: 'Find People', icon: <Users className="w-4 h-4" /> },
    { id: 'find_companies', label: 'Find Companies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'scrape_websites', label: 'Scrape Websites', icon: <Globe className="w-4 h-4" /> },
    { id: 'enrich_data', label: 'Enrich Data', icon: <Database className="w-4 h-4" /> },
  ];

  useEffect(() => {
    fetchStats();
    fetchTemplateCategories();
    fetchTemplates();
    fetchConversations();
    
    if (location.state?.prompt) {
      setSearchPrompt(location.state.prompt);
      if (location.state?.mode) {
        setActiveMode(location.state.mode);
      }
      // Auto-search if prompt provided
      setTimeout(() => {
        handleSearch(null, location.state.prompt, location.state.mode);
      }, 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTemplateCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/templates/categories`, {
        headers: getAuthHeaders()
      });
      setTemplateCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch template categories:', error);
    }
  };

  const fetchTemplates = async (category = null) => {
    try {
      let url = `${API_URL}/api/templates`;
      if (category) url += `?category=${category}`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/conversations?limit=10`, {
        headers: getAuthHeaders()
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const handleSearch = async (e, promptOverride = null, modeOverride = null) => {
    if (e) e.preventDefault();
    
    const prompt = promptOverride || searchPrompt;
    const mode = modeOverride || activeMode;
    
    if (!prompt.trim()) {
      toast.error('Please enter a search prompt');
      return;
    }

    setLoading(true);
    setShowTemplates(false);

    try {
      const response = await axios.post(`${API_URL}/api/search`, {
        prompt: prompt,
        mode: mode,
        conversation_id: currentConversation?.conversation_id
      }, {
        headers: getAuthHeaders()
      });
      
      setCurrentConversation(response.data);
      setResults(response.data.results);
      setColumns(response.data.columns);
      setSearchPrompt('');
      
      toast.success(`Found ${response.data.total_found} results!`);
      fetchStats();
      fetchConversations();
    } catch (error) {
      const message = error.response?.data?.detail || 'Search failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTemplate = async (template) => {
    setSearchPrompt(template.prompt);
    setShowTemplates(false);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/templates/${template.id}/run`, {}, {
        headers: getAuthHeaders()
      });
      
      setCurrentConversation(response.data);
      setResults(response.data.results);
      setColumns(response.data.columns);
      
      toast.success(`Found ${response.data.total_found} results!`);
      fetchStats();
    } catch (error) {
      toast.error('Failed to run template');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLead = async (lead) => {
    setSelectedLead(lead);
    setEnrichmentLoading(true);
    setEnrichmentData(null);

    try {
      const response = await axios.post(`${API_URL}/api/enrich`, {
        company_name: lead.company_name,
        domain: lead.company_domain
      }, {
        headers: getAuthHeaders()
      });
      setEnrichmentData(response.data);
    } catch (error) {
      toast.error('Failed to enrich lead data');
    } finally {
      setEnrichmentLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    const headers = columns.filter(c => c !== 'Fit Score').join(',');
    const rows = results.map(r => {
      return columns.filter(c => c !== 'Fit Score').map(col => {
        const key = col.toLowerCase().replace(/ /g, '_');
        return `"${r[key] || r[col] || ''}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lacleo_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exported successfully!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
    setResults([]);
    setColumns([]);
    setShowTemplates(true);
    setSearchPrompt('');
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-emerald-500/20 text-emerald-600';
    if (score >= 80) return 'bg-amber-500/20 text-amber-600';
    if (score >= 70) return 'bg-blue-500/20 text-blue-600';
    return 'bg-gray-500/20 text-gray-600';
  };

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">LaCleo</span>
          </Link>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button 
            onClick={handleNewChat}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            data-testid="new-chat-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Search
          </Button>
        </div>

        {/* Recent Searches */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-medium text-gray-500 mb-2 px-2">Recent Searches</p>
          <div className="space-y-1">
            {conversations.slice(0, 8).map((conv, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchPrompt(conv.prompt);
                  handleSearch(null, conv.prompt, conv.mode);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200 truncate transition-colors"
              >
                <MessageSquare className="w-3 h-3 inline mr-2 text-gray-400" />
                {conv.prompt}
              </button>
            ))}
          </div>
        </div>

        {/* User Menu */}
        <div className="p-3 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">{stats?.credits_remaining || 500} credits</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600" data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {showTemplates && !currentConversation ? (
            /* Templates View */
            <div className="max-w-4xl mx-auto p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  How can I help you find customers?
                </h1>
                <p className="text-gray-500">
                  Start with a prompt or choose a template below
                </p>
              </div>

              {/* Quick Templates */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  {templateCategories.slice(0, 6).map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        fetchTemplates(cat.id);
                      }}
                      className={selectedCategory === cat.id ? "bg-violet-600 text-white" : "border-gray-300 text-gray-600"}
                    >
                      {cat.name}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {cat.count}
                      </Badge>
                    </Button>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {templates.slice(0, 6).map((template) => (
                    <Card 
                      key={template.id}
                      className="border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => handleRunTemplate(template)}
                      data-testid={`template-${template.id}`}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-violet-600 transition-colors">
                          {template.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {template.columns.slice(0, 4).map((col, j) => (
                            <Badge key={j} variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="max-w-5xl mx-auto p-6">
              {currentConversation && (
                <div className="space-y-6">
                  {/* AI Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 text-sm mb-4">
                        {currentConversation.ai_message}
                      </p>

                      {/* Results Card */}
                      <Card className="border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-violet-600" />
                            <span className="font-medium text-gray-900">Results</span>
                            <Badge className="bg-violet-100 text-violet-700">
                              {results.length} leads
                            </Badge>
                            <Badge variant="outline" className="text-gray-500">
                              {columns.length} columns
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-violet-600 hover:text-violet-700"
                            >
                              Get more leads (~{currentConversation.available_count})
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleExportCSV}
                              data-testid="export-btn"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-10">#</th>
                                {columns.map((col, i) => (
                                  <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    {col}
                                  </th>
                                ))}
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.map((result, i) => (
                                <tr 
                                  key={result.id || i}
                                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                  data-testid={`result-row-${i}`}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                                  {columns.map((col, j) => {
                                    const key = col.toLowerCase().replace(/ /g, '_');
                                    const value = result[key] || result[col.toLowerCase()] || '';
                                    
                                    if (col === 'Fit Score') {
                                      return (
                                        <td key={j} className="px-4 py-3">
                                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${getScoreColor(result.fit_score)}`}>
                                            {result.fit_score}
                                          </span>
                                        </td>
                                      );
                                    }
                                    
                                    if (col === 'Company') {
                                      return (
                                        <td key={j} className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            {result.company_logo ? (
                                              <img src={result.company_logo} alt="" className="w-5 h-5 rounded" />
                                            ) : (
                                              <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                                                {(result.company_name || '?').charAt(0)}
                                              </div>
                                            )}
                                            <span className="font-medium text-gray-900">
                                              {result.company_name}
                                            </span>
                                          </div>
                                        </td>
                                      );
                                    }
                                    
                                    if (col === 'Contact') {
                                      return (
                                        <td key={j} className="px-4 py-3 text-sm text-gray-700">
                                          {result.contact_name}
                                        </td>
                                      );
                                    }
                                    
                                    return (
                                      <td key={j} className="px-4 py-3 text-sm text-gray-600">
                                        {typeof value === 'object' ? JSON.stringify(value) : value}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEnrichLead(result)} className="cursor-pointer">
                                          <Info className="w-4 h-4 mr-2" />
                                          Enrich Data
                                        </DropdownMenuItem>
                                        {result.email && (
                                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${result.email}`} className="cursor-pointer">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Email
                                          </DropdownMenuItem>
                                        )}
                                        {result.website && (
                                          <DropdownMenuItem onClick={() => window.open(result.website, '_blank')} className="cursor-pointer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Visit Website
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>

                      {/* Suggested Follow-ups */}
                      {currentConversation.suggested_follow_ups?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {currentConversation.suggested_follow_ups.map((followUp, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSearchPrompt(followUp);
                                handleSearch(null, followUp);
                              }}
                              className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm hover:bg-violet-100 transition-colors"
                            >
                              {followUp}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch}>
              <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Find your perfect customers..."
                    value={searchPrompt}
                    onChange={(e) => setSearchPrompt(e.target.value)}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    data-testid="search-input"
                  />
                  <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                    {searchModes.slice(0, 2).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setActiveMode(mode.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          activeMode === mode.id 
                            ? 'bg-violet-100 text-violet-700' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {mode.icon}
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    data-testid="search-btn"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Enrichment Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-600" />
              {selectedLead?.company_name}
            </DialogTitle>
          </DialogHeader>
          
          {enrichmentLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : enrichmentData ? (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-700">{enrichmentData.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Industry", value: enrichmentData.industry },
                  { label: "Employees", value: enrichmentData.employees },
                  { label: "Revenue", value: enrichmentData.revenue },
                  { label: "Founded", value: enrichmentData.founded },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value || 'N/A'}</p>
                  </div>
                ))}
              </div>
              
              {enrichmentData.technologies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {enrichmentData.technologies.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="bg-violet-50 text-violet-700">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {enrichmentData.recent_news?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Recent News</h4>
                  <ul className="space-y-2">
                    {enrichmentData.recent_news.map((news, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {news}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
