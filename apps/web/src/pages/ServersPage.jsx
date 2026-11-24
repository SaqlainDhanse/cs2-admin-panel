
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
import ServerConsole from '@/components/ServerConsole.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Play, Square, RefreshCw, MonitorPlay, Badge, RotateCcw } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { activeBrand } from '@/themes';

const ServersPage = () => {
  const { isAdmin, authenticatedFetch, currentUser } = useAuth();
  const canStartServers = currentUser?.role === 'Senior Moderator' || currentUser?.role === 'Administrator';
  const canStopServers = currentUser?.role === 'Administrator';
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
  const [powerDialogOpen, setPowerDialogOpen] = useState(false);
  const [powerAction, setPowerAction] = useState(null);
  const [serverForPowerAction, setServerForPowerAction] = useState(null);
  const [consoleServer, setConsoleServer] = useState(null);

  const formatUptime = (ms) => {
    if (!ms || ms === 0) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'stopped':
      case 'offline':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'starting':
      case 'stopping':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default:
        return 'bg-ink-faint/20 text-ink-muted border border-line-strong/30';
    }
  };

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

      const response = await fetch(`/api/servers?${params.toString()}`);
      
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

  const handlePowerActionClick = (server, action) => {
    setServerForPowerAction(server);
    setPowerAction(action);
    setPowerDialogOpen(true);
  };

  const handlePowerActionConfirm = async () => {
    if (!serverForPowerAction || !powerAction) return;

    try {
        const response = await authenticatedFetch(`/api/servers/${serverForPowerAction.id}/power`, {
            method: 'POST',
            body: JSON.stringify({ signal: powerAction }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Action failed');
        }

        const result = await response.json();

        toast({
            title: 'Success',
            description: `Server ${powerAction}ing...`,
            className: "bg-panel border-theme text-ink"
        });

        // Update only the specific server that was acted upon
        if (result.server) {
            setServers(prevServers =>
                prevServers.map(server =>
                    server.id === result.server.id
                        ? { ...server, status: result.server.status, uptime: result.server.uptime }
                        : server
                )
            );
            setConsoleServer(prev =>
                prev && prev.id === result.server.id
                    ? { ...prev, status: result.server.status, uptime: result.server.uptime }
                    : prev
            );
        }
    } catch (error) {
        toast({
            title: 'Action Error',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setPowerDialogOpen(false);
        setServerForPowerAction(null);
        setPowerAction(null);
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
        <title>Servers - {activeBrand.appName}</title>
        <meta name="description" content="Manage CS2 game servers" />
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
            Game Servers
          </h1>
          <Button
            onClick={fetchServers}
            disabled={loading}
            className="bg-theme text-black hover:bg-theme/90 shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.5)] w-auto font-semibold"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              placeholder="Search by server name or IP..."
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
            <div className="text-theme animate-pulse">Loading servers...</div>
          </div>
        ) : (
          <div className="bg-panel border border-line-subtle rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-canvas">
                  <TableRow className="border-line-subtle hover:bg-canvas">
                    <TableHead className="text-ink-muted">Server Name</TableHead>
                    <TableHead className="text-ink-muted">Status</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">Uptime</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">IP Address</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">Region</TableHead>
                    <TableHead className="text-right text-ink-muted">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servers.length === 0 ? (
                    <TableRow className="border-line-subtle">
                      <TableCell colSpan={6} className="text-center text-ink-muted py-8">
                        No servers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    servers.map((server) => (
                      <TableRow key={server.id} className="border-line-subtle hover:bg-hover/50 transition-colors">
                        <TableCell className="font-medium">
                          <button
                            onClick={() => setConsoleServer(server)}
                            className="text-theme hover:underline hover:shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.4)] transition-all duration-300 text-left"
                            title="View console"
                          >
                            {server.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(server.status)}`}>
                            {server.status ? server.status.charAt(0).toUpperCase() + server.status.slice(1).toLowerCase() : 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-ink">{formatUptime(server.uptime)}</TableCell>
                        <TableCell className="font-mono text-xs hidden md:table-cell">{server.ip}:{server.port}</TableCell>
                        <TableCell className="hidden md:table-cell">{server.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {server.status?.toLowerCase() === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Join"
                                onClick={() => {window.location.href = `steam://connect/${server.ip}:${server.port}`;}}
                                className="h-8 w-8 p-0 border-theme/50 text-theme bg-transparent hover:bg-theme/10 hover:shadow-[0_0_15px_rgb(var(--theme-primary-rgb)_/_0.4)] transition-all duration-300"
                              >
                                <MonitorPlay className="w-4 h-4" />
                              </Button>
                            )}
                            {server.status?.toLowerCase() === 'running' && (
                              <>
                                {canStartServers && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Restart"
                                    onClick={() => handlePowerActionClick(server, 'restart')}
                                    className="h-8 w-8 p-0 border-theme/50 text-theme bg-transparent hover:bg-theme/10 hover:shadow-[0_0_15px_rgb(var(--theme-primary-rgb)_/_0.4)] transition-all duration-300"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                                {canStopServers && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Stop"
                                    onClick={() => handlePowerActionClick(server, 'stop')}
                                    className="h-8 w-8 p-0 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300"
                                  >
                                    <Square className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            {server.status?.toLowerCase() === 'offline' && canStartServers && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Start"
                                onClick={() => handlePowerActionClick(server, 'start')}
                                className="h-8 w-8 p-0 border-green-500/50 text-green-500 bg-transparent hover:bg-green-500/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
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

        <ServerConsole
          server={consoleServer}
          open={!!consoleServer}
          onOpenChange={(o) => { if (!o) setConsoleServer(null); }}
          onPowerAction={handlePowerActionClick}
        />

        <ServerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          server={selectedServer}
          onSuccess={fetchServers}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-panel border-line text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-theme">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                This will permanently delete the server <span className="text-ink font-semibold">{serverToDelete?.serverName}</span>. This action cannot be undone.
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

        <AlertDialog open={powerDialogOpen} onOpenChange={setPowerDialogOpen}>
          <AlertDialogContent className="bg-panel border-line text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-theme">Confirm Power Action</AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                Are you sure you want to {powerAction} the server <span className="text-ink font-semibold">{serverForPowerAction?.name}</span>? This action will affect all players currently on the server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-line text-ink hover:bg-hover">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePowerActionConfirm}
                className={
                  powerAction === 'start'
                    ? 'bg-theme hover:bg-theme/90 text-black'
                    : powerAction === 'restart'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }
              >
                {powerAction?.charAt(0).toUpperCase() + powerAction?.slice(1)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ServersPage;
