
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
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
import VIPForm from '@/components/VIPForm.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatLocalTime } from '@/lib/utils.js';
import { activeBrand } from '@/themes';

const VIPsPage = () => {
  const { authenticatedFetch, currentUser } = useAuth();
  const canManageVIPs = currentUser?.role === 'Administrator';
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vips, setVips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVip, setSelectedVip] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vipToDelete, setVipToDelete] = useState(null);

  const fetchVips = async () => {
    setLoading(true);
    try {
      // Construct the URL with query parameters for your Node.js API
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`/api/vips?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      // Result now uses 'items' and 'totalPages' from your Express response
      setVips(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching VIPs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load VIPs from the server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVipStatus = (vipExpiry) => {
    // 1. Check for the "0" case (Permanent/Lifetime VIP)
    if (vipExpiry === 0) {
        return 'ACTIVE';
    }

    // 2. Get current time in seconds
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    // 3. Compare expiry to current time
    return vipExpiry > currentTimeInSeconds ? 'ACTIVE' : 'EXPIRED';
  };

  

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVips();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleAdd = () => {
    setSelectedVip(null);
    setFormOpen(true);
  };

  const handleEdit = (vip) => {
    setSelectedVip(vip);
    setFormOpen(true);
  };

  const handleDeleteClick = (vip) => {
    setVipToDelete(vip);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vipToDelete) return;

    try {
        // Target the specific VIP ID with the DELETE method
        const response = await authenticatedFetch(`/api/vips/${vipToDelete.id}`, {
            method: 'DELETE',
        });

        // Parse the response
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete VIP');
        }

        toast({ title: 'Success', description: 'VIP deleted successfully',
        className: "bg-panel border-theme text-ink"});
        
        // Refresh the list
        fetchVips();
    } catch (error) {
        console.error('Error deleting VIP:', error);
        toast({
            title: 'Error',
            description: error.message || 'Failed to delete VIP',
            variant: 'destructive',
        });
    } finally {
        setDeleteDialogOpen(false);
        setVipToDelete(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>VIPs - {activeBrand.appName}</title>
        <meta name="description" content="Manage VIP players" />
      </Helmet>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-theme hover:text-theme hover:bg-theme/10 pl-0 gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-theme" style={{ textShadow: '0 0 15px rgb(var(--theme-primary-rgb) / 0.5)' }}>
            VIP Players
          </h1>
          {canManageVIPs && (
            <Button
              onClick={handleAdd}
              className="bg-theme text-black hover:bg-theme/90 shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.5)] w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add VIP
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              placeholder="Search by player name or Steam ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-panel border-line focus:border-theme text-ink"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-theme mb-2"></div>
            <div className="text-theme animate-pulse">Loading VIPs...</div>
          </div>
        ) : (
          <div className="bg-panel border border-line-subtle rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-canvas">
                  <TableRow className="border-line-subtle hover:bg-canvas">
                    <TableHead className="text-ink-muted">Player Name</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">Steam ID</TableHead>
                    <TableHead className="text-ink-muted">Group</TableHead>
                    <TableHead className="text-ink-muted">Expiry</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">Last Visit</TableHead>
                    <TableHead className="text-ink-muted">Status</TableHead>
                    {canManageVIPs && <TableHead className="text-right text-ink-muted">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vips.length === 0 ? (
                    <TableRow className="border-line-subtle">
                      <TableCell colSpan={canManageVIPs ? 7 : 6} className="text-center text-ink-muted py-8">
                        No VIPs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    vips.map((vip) => (
                      <TableRow key={vip.id} className="border-line-subtle hover:bg-hover/50 transition-colors">
                        <TableCell className="font-medium">{vip.name}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{vip.steamid64}</TableCell>
                        <TableCell>{vip.group_name}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatLocalTime(vip.expires)}</TableCell>
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{formatLocalTime(vip.lastvisit)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              getVipStatus(vip.expires) === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {getVipStatus(vip.expires)}
                          </span>
                        </TableCell>
                        {canManageVIPs && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(vip)}
                                className="h-8 w-8 p-0 border-theme/50 text-theme bg-transparent hover:bg-theme/10 hover:shadow-[0_0_15px_rgb(var(--theme-primary-rgb)_/_0.4)] transition-all duration-300"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(vip)}
                                className="h-8 w-8 p-0 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-line hover:bg-hover"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-ink-muted">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-line hover:bg-hover"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <VIPForm
          open={formOpen}
          onOpenChange={setFormOpen}
          vip={selectedVip}
          onSuccess={fetchVips}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-panel border-line text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-theme">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                This will permanently delete the VIP record for <span className="text-ink font-semibold">{vipToDelete?.name}</span>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-line text-ink hover:bg-hover">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default VIPsPage;
