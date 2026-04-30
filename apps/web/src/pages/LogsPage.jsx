import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';

const LogsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { currentUser, authenticatedFetch } = useAuth();

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && currentUser.role !== 'Administrator') {
      navigate('/dashboard');
      toast({
        title: 'Access Denied',
        description: 'Only Administrators can view logs.',
        variant: 'destructive',
      });
    }
  }, [currentUser, navigate, toast]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `/api/logs?page=${page}&limit=10${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setLogs(result.items || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: 'Could not load logs. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLocalTime = (utcString) => {
    if (!utcString) return 'N/A';
    
    const date = new Date(utcString + ' UTC');
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: userTimeZone
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentUser?.role === 'Administrator') {
        fetchLogs();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm, currentUser]);

  if (currentUser?.role !== 'Administrator') {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Logs - CS2 Servers Admin Panel</title>
        <meta name="description" content="View panel activity logs" />
      </Helmet>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-[#00FF41] hover:text-[#00FF41] hover:bg-[#00FF41]/10 pl-0 gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[#00FF41]" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}>
            Activity Logs
          </h1>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by username, action type, or details..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-[#1a1a1a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00FF41] mb-2"></div>
            <div className="text-[#00FF41] animate-pulse">Loading logs...</div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0a0a0a]">
                  <TableRow className="border-gray-800 hover:bg-[#0a0a0a]">
                    <TableHead className="text-gray-400">ID</TableHead>
                    <TableHead className="text-gray-400">Username</TableHead>
                    <TableHead className="hidden md:table-cell text-gray-400">IP Address</TableHead>
                    <TableHead className="text-gray-400">Action Type</TableHead>
                    <TableHead className="text-gray-400">Details</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow className="border-gray-800">
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => (
                      <TableRow key={log.id || index} className="border-gray-800 hover:bg-[#252525]/50 transition-colors">
                        <TableCell className="font-medium text-white">#{log.id}</TableCell>
                        <TableCell className="text-gray-300">{log.username || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-400">{log.ip_address || 'N/A'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              log.action_type === 'Profile Updated'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : log.action_type.includes('Started') || log.action_type.includes('Created')
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : log.action_type.includes('Stopped') || log.action_type.includes('Deleted')
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : log.action_type.includes('Restarted') || log.action_type.includes('Updated')
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {log.action_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-[300px]">
                          <div 
                            className="text-sm whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: log.details }}
                          />
                        </TableCell>
                        <TableCell className="text-gray-300">{formatLocalTime(log.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-[#00FF41]/50 text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-[#00FF41]/50 text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default LogsPage;
