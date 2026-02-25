
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
import ServerForm from '@/components/ServerForm.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Play, Square, RefreshCw, MonitorPlay } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ServersPage = () => {
  const { isAdmin, authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);

  const fetchServers = async () => {
    setLoading(true);
    try {
      // Build the query string for pagination and search
      // Note: We use standard URL search params instead of PocketBase syntax
      const params = new URLSearchParams({
        page: page,
        limit: 10,
        search: searchTerm || ''
      });

      const response = await authenticatedFetch(`/api/servers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const result = await response.json();
      
      // result matches your wrapper format: { items, totalPages, currentPage, totalItems }
      setServers(result.items);
      setTotalPages(result.totalPages);
      
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load servers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePowerAction = async (serverId, action) => {
    try {
        const response = await authenticatedFetch(`/api/servers/${serverId}/power`, {
            method: 'POST',
            body: JSON.stringify({ signal: action }), // e.g., action = 'restart'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Action failed');
        }

        toast({ title: 'Success', description: `Server ${action}ing...`,
        className: "bg-[#1a1a1a] border-[#00FF41] text-white" });
        
        // Optional: Refresh the list to see status change
        fetchServers(); 
    } catch (error) {
        toast({
            title: 'Action Error',
            description: error.message,
            variant: 'destructive',
        });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleAdd = () => {
    setSelectedServer(null);
    setFormOpen(true);
  };

  const handleEdit = (server) => {
    setSelectedServer(server);
    setFormOpen(true);
  };

  const handleDeleteClick = (server) => {
    setServerToDelete(server);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serverToDelete) return;

    try {
      await pb.collection('servers').delete(serverToDelete.id, { $autoCancel: false });
      toast({ title: 'Success', description: 'Server deleted successfully' });
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete server',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setServerToDelete(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Servers - CS2 Servers Admin Panel</title>
        <meta name="description" content="Manage CS2 game servers" />
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
            Game Servers
          </h1>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by server name or IP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-[#1a1a1a] border-gray-700 focus:border-[#00FF41] text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00FF41] mb-2"></div>
            <div className="text-[#00FF41] animate-pulse">Loading servers...</div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="hidden md:table-cell">Region</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        No servers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell className="font-medium text-[#00FF41]">{server.name}</TableCell>
                        <TableCell className="font-mono text-xs">{server.ip}:{server.port}</TableCell>
                        <TableCell className="hidden md:table-cell">{server.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Join"
                              onClick={() => {window.location.href = `steam://connect/${server.ip}:${server.port}`;}}
                              className="h-8 w-8 p-0 border-[#00FF41]/50 text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all duration-300"
                            >
                              <MonitorPlay className="w-4 h-4" />
                            </Button>
                            {isAdmin && (<Button
                              size="sm"
                              variant="outline"
                              title="Start"
                              onClick={() => handlePowerAction(server.id, 'start')}
                              className="h-8 w-8 p-0 border-[#00FF41]/50 text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all duration-300"
                            >
                              <Play className="w-4 h-4" />
                            </Button>)}
                            <Button
                              size="sm"
                              variant="outline"
                              title="Restart"
                              onClick={() => handlePowerAction(server.id, 'restart')}
                              className="h-8 w-8 p-0 border-[#00FF41]/50 text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all duration-300"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            {isAdmin && (<Button
                              size="sm"
                              variant="outline"
                              title="Stop"
                              onClick={() => handlePowerAction(server.id, 'stop')}
                              className="h-8 w-8 p-0 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300"
                            >
                              <Square className="w-4 h-4" />
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-gray-700 hover:bg-[#252525]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-gray-700 hover:bg-[#252525]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <ServerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          server={selectedServer}
          onSuccess={fetchServers}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-[#1a1a1a] border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#00FF41]">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This will permanently delete the server "{serverToDelete?.serverName}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-[#252525]">Cancel</AlertDialogCancel>
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

export default ServersPage;
