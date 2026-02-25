
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import BanForm from '@/components/BanForm.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';

const BansPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBan, setSelectedBan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banToDelete, setBanToDelete] = useState(null);

  const { currentUser, authenticatedFetch } = useAuth();
  const canDeleteBans = currentUser?.role === 'Senior Moderator' || currentUser?.role === 'Administrator';

  const fetchBans = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `/api/bans?page=${page}&limit=10${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setBans(result.items || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: 'Could not load bans. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLocalTime = (utcString) => {
    if (!utcString) return 'N/A';
    
    // Create a date object from the DB string
    // Note: Most DBs return 'YYYY-MM-DD HH:mm:ss'. 
    // Appending 'Z' tells JS this is UTC.
    const date = new Date(utcString + ' UTC');
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimeZone
    });
  };

  const formatDuration = (minutes) => {
    if (minutes === 0 || minutes === "0") return "Permanent";
    
    const units = [
      { label: "y", value: 60 * 24 * 365 },
      { label: "mo", value: 60 * 24 * 30 },
      { label: "d", value: 60 * 24 },
      { label: "h", value: 60 },
      { label: "m", value: 1 },
    ];

    let remaining = parseInt(minutes);
    const parts = [];

    for (const { label, value } of units) {
      const result = Math.floor(remaining / value);
      if (result > 0) {
        parts.push(`${result}${label}`);
        remaining %= value;
      }
    }

    return parts.length > 0 ? parts.join(" ") : "0m";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBans();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleAdd = () => {
    setSelectedBan(null);
    setFormOpen(true);
  };

  const handleEdit = (ban) => {
    setSelectedBan(ban);
    setFormOpen(true);
  };

  const handleDeleteClick = (ban) => {
    setBanToDelete(ban);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!banToDelete) return;

    try {
      const response = await authenticatedFetch(`/api/bans/${banToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete ban');
      }

      toast({ 
        title: 'Success', 
        description: 'Ban deleted successfully',
        className: "bg-[#1a1a1a] border-[#00FF41] text-white"
      });
      
      // Refresh the bans table
      fetchBans();
    } catch (error) {
      console.error('Error deleting ban:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ban',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setBanToDelete(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Bans - CS2 Servers Admin Panel</title>
        <meta name="description" content="Manage player bans" />
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
            Player Bans
          </h1>
          <Button
            onClick={handleAdd}
            className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)] w-full md:w-auto font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ban
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by player name or Steam ID..."
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
            <div className="text-[#00FF41] animate-pulse">Loading bans...</div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0a0a0a]">
                  <TableRow className="border-gray-800 hover:bg-[#0a0a0a]">
                    <TableHead className="text-gray-400">Player Name</TableHead>
                    <TableHead className="hidden lg:table-cell text-gray-400">Banned By</TableHead>
                    <TableHead className="hidden md:table-cell text-gray-400">Reason</TableHead>
                    <TableHead className="hidden md:table-cell text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400">Ban Date</TableHead>
                    <TableHead className="hidden lg:table-cell text-gray-400">Expiry</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bans.length === 0 ? (
                    <TableRow className="border-gray-800">
                      <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                        No bans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bans.map((ban, index) => (
                      <TableRow key={ban.id || index} className="border-gray-800 hover:bg-[#252525]/50 transition-colors">
                        <TableCell className="font-medium text-white">{ban.player_name}</TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-400">{ban.admin_name}</TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[150px] text-gray-300">{ban.reason}</TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[150px] text-gray-300">{formatDuration(ban.duration)}</TableCell>
                        <TableCell className="text-gray-300">{formatLocalTime(ban.created)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-300">
                          {ban.ends ? formatLocalTime(ban.ends) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              ban.status === 'ACTIVE'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : ban.status === 'UNBANNED'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {ban.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(ban)}
                              className="h-8 w-8 p-0 border-[#00FF41]/50 text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all duration-300"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {canDeleteBans && (<Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(ban)}
                              className="h-8 w-8 p-0 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <BanForm
          open={formOpen}
          onOpenChange={setFormOpen}
          ban={selectedBan}
          onSuccess={fetchBans}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-[#1a1a1a] border-gray-700 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#00FF41]">Delete Ban Record?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This will permanently delete the ban for <span className="text-white font-semibold">"{banToDelete?.player_name}"</span>. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-[#252525] hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default BansPage;
