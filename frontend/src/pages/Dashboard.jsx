import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
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
  DialogDescription,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Zap,
  Users,
  Mail,
  Download,
  RefreshCw,
  LogOut,
  Building2,
  MapPin,
  Phone,
  Globe,
  BarChart3,
  History,
  Trash2,
  ExternalLink,
  ChevronDown,
  Filter,
  Sparkles,
  TrendingUp,
  Target,
  MoreVertical,
  Info
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getAuthHeaders } = useAuth();
  
  const [searchPrompt, setSearchPrompt] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [enrichmentData, setEnrichmentData] = useState(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  
  // Filters
  const [industryFilter, setIndustryFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');

  useEffect(() => {
    fetchStats();
    fetchLeads();
    fetchSearchHistory();
    
    // Check if there's a prompt from landing page
    if (location.state?.prompt) {
      setSearchPrompt(location.state.prompt);
    }
  }, []);

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

  const fetchLeads = async () => {
    try {
      let url = `${API_URL}/api/leads?limit=100`;
      if (industryFilter) url += `&industry=${industryFilter}`;
      if (minScoreFilter) url += `&min_score=${minScoreFilter}`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/searches?limit=10`, {
        headers: getAuthHeaders()
      });
      setSearchHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPrompt.trim()) {
      toast.error('Please enter a search prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/leads/generate`, {
        prompt: searchPrompt,
        num_leads: 10
      }, {
        headers: getAuthHeaders()
      });
      
      setLeads(response.data.leads);
      toast.success(`Found ${response.data.total} leads!`);
      fetchStats();
      fetchSearchHistory();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to generate leads';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLead = async (lead) => {
    setSelectedLead(lead);
    setEnrichmentLoading(true);
    setEnrichmentData(null);

    try {
      const domain = lead.website?.replace(/https?:\/\//, '').replace(/\/$/, '');
      const response = await axios.post(`${API_URL}/api/enrich`, {
        company_name: lead.company_name,
        domain: domain
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

  const handleDeleteLead = async (leadId) => {
    try {
      await axios.delete(`${API_URL}/api/leads/${leadId}`, {
        headers: getAuthHeaders()
      });
      setLeads(leads.filter(l => l.id !== leadId));
      toast.success('Lead deleted');
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const headers = ['Company', 'Industry', 'Website', 'Email', 'Phone', 'Location', 'Employees', 'Revenue', 'Decision Maker', 'Title', 'Lead Score'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.company_name}"`,
        `"${lead.industry}"`,
        `"${lead.website || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.location || ''}"`,
        `"${lead.employees || ''}"`,
        `"${lead.revenue || ''}"`,
        `"${lead.decision_maker || ''}"`,
        `"${lead.decision_maker_title || ''}"`,
        lead.lead_score
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lacleo_leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Leads exported successfully!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="dashboard-logo">
              <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LaCleo<span className="text-purple-400">.ai</span></span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm hidden sm:block">
                Welcome, <span className="text-white font-medium">{user?.name}</span>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="user-menu-btn">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#12121a] border-[#2a2a3a] text-white">
                  <DropdownMenuItem onClick={handleLogout} className="text-gray-300 hover:text-white hover:bg-[#1a1a24] cursor-pointer" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="stat-card glass-card border-[#2a2a3a] bg-[#12121a]" data-testid="stat-total-leads">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.total_leads || 0}</p>
                  <p className="text-sm text-gray-400">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card glass-card border-[#2a2a3a] bg-[#12121a]" data-testid="stat-searches">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.total_searches || 0}</p>
                  <p className="text-sm text-gray-400">Searches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card glass-card border-[#2a2a3a] bg-[#12121a]" data-testid="stat-avg-score">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.average_lead_score || 0}</p>
                  <p className="text-sm text-gray-400">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card glass-card border-[#2a2a3a] bg-[#12121a]" data-testid="stat-industries">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.top_industries?.length || 0}</p>
                  <p className="text-sm text-gray-400">Industries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Section */}
        <Card className="glass-card border-[#2a2a3a] bg-[#12121a] mb-8 purple-glow-sm" data-testid="search-card">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Lead Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Find SaaS companies in California with 50-200 employees interested in AI solutions..."
                    value={searchPrompt}
                    onChange={(e) => setSearchPrompt(e.target.value)}
                    className="pl-12 py-6 bg-[#1a1a24] border-[#2a2a3a] text-white placeholder-gray-500 focus:border-purple-500 input-glow text-base"
                    data-testid="search-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="gradient-button text-white px-8 py-6 border-0"
                  data-testid="search-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Leads
                    </>
                  )}
                </Button>
              </div>
              
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <History className="w-4 h-4" />
                    Recent:
                  </span>
                  {searchHistory.slice(0, 3).map((search, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSearchPrompt(search.prompt)}
                      className="text-sm px-3 py-1 rounded-full bg-[#1a1a24] text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors truncate max-w-xs"
                    >
                      {search.prompt}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="glass-card border-[#2a2a3a] bg-[#12121a]" data-testid="leads-table-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Discovered Leads ({leads.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={industryFilter} onValueChange={(val) => { setIndustryFilter(val); fetchLeads(); }}>
                <SelectTrigger className="w-40 bg-[#1a1a24] border-[#2a2a3a] text-gray-300" data-testid="industry-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#2a2a3a] text-white">
                  <SelectItem value="">All Industries</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="HealthTech">HealthTech</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="border-[#2a2a3a] text-gray-300 hover:text-white hover:bg-[#1a1a24]"
                data-testid="export-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">No leads yet</h3>
                <p className="text-gray-500">Use the search above to discover your ideal customers</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2a3a] hover:bg-transparent">
                      <TableHead className="text-gray-400">Company</TableHead>
                      <TableHead className="text-gray-400">Industry</TableHead>
                      <TableHead className="text-gray-400">Decision Maker</TableHead>
                      <TableHead className="text-gray-400">Location</TableHead>
                      <TableHead className="text-gray-400">Size</TableHead>
                      <TableHead className="text-gray-400 text-center">Score</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="lead-table-row border-[#2a2a3a]"
                        data-testid={`lead-row-${lead.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-medium">
                              {lead.company_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{lead.company_name}</p>
                              {lead.website && (
                                <a 
                                  href={lead.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-gray-500 hover:text-purple-400 flex items-center gap-1"
                                >
                                  <Globe className="w-3 h-3" />
                                  {lead.website.replace(/https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                            {lead.industry}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{lead.decision_maker || '-'}</p>
                            <p className="text-sm text-gray-500">{lead.decision_maker_title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-gray-400">
                            <MapPin className="w-4 h-4" />
                            {lead.location || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">{lead.employees || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm ${getScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#12121a] border-[#2a2a3a] text-white">
                              <DropdownMenuItem 
                                onClick={() => handleEnrichLead(lead)}
                                className="text-gray-300 hover:text-white hover:bg-[#1a1a24] cursor-pointer"
                                data-testid={`enrich-btn-${lead.id}`}
                              >
                                <Info className="w-4 h-4 mr-2" />
                                Enrich Data
                              </DropdownMenuItem>
                              {lead.email && (
                                <DropdownMenuItem 
                                  onClick={() => window.location.href = `mailto:${lead.email}`}
                                  className="text-gray-300 hover:text-white hover:bg-[#1a1a24] cursor-pointer"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                              )}
                              {lead.website && (
                                <DropdownMenuItem 
                                  onClick={() => window.open(lead.website, '_blank')}
                                  className="text-gray-300 hover:text-white hover:bg-[#1a1a24] cursor-pointer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Visit Website
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                data-testid={`delete-btn-${lead.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Enrichment Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="bg-[#12121a] border-[#2a2a3a] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              {selectedLead?.company_name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enriched company data
            </DialogDescription>
          </DialogHeader>
          
          {enrichmentLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="spinner w-10 h-10"></div>
            </div>
          ) : enrichmentData ? (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                <p className="text-gray-300">{enrichmentData.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#1a1a24]">
                  <p className="text-sm text-gray-400">Industry</p>
                  <p className="text-white font-medium">{enrichmentData.industry}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1a1a24]">
                  <p className="text-sm text-gray-400">Employees</p>
                  <p className="text-white font-medium">{enrichmentData.employees || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1a1a24]">
                  <p className="text-sm text-gray-400">Revenue</p>
                  <p className="text-white font-medium">{enrichmentData.revenue || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1a1a24]">
                  <p className="text-sm text-gray-400">Founded</p>
                  <p className="text-white font-medium">{enrichmentData.founded || 'N/A'}</p>
                </div>
              </div>
              
              {enrichmentData.technologies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {enrichmentData.technologies.map((tech, i) => (
                      <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {(enrichmentData.social_links?.linkedin || enrichmentData.social_links?.twitter) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Social Links</h4>
                  <div className="flex gap-3">
                    {enrichmentData.social_links.linkedin && (
                      <a 
                        href={`https://linkedin.com/company/${enrichmentData.social_links.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        LinkedIn
                      </a>
                    )}
                    {enrichmentData.social_links.twitter && (
                      <a 
                        href={`https://twitter.com/${enrichmentData.social_links.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
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
