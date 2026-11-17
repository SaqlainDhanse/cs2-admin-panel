
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
import ServerAdminForm from '@/components/ServerAdminForm.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { activeBrand } from '@/themes';

const ServerAdminsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const filter = searchTerm 
        ? `name ~ "${searchTerm}" || steamID ~ "${searchTerm}" || email ~ "${searchTerm}"`
        : '';
      
      const result = await pb.collection('serverAdmins').getList(page, 10, {
        filter,
        sort: '-created',
        $autoCancel: false,
      });
      
      setAdmins(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load server admins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmins();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleAdd = () => {
    setSelectedAdmin(null);
    setFormOpen(true);
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setFormOpen(true);
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    try {
      await pb.collection('serverAdmins').delete(adminToDelete.id, { $autoCancel: false });
      toast({ 
        title: 'Success', 
        description: 'Server admin deleted successfully',
        className: "bg-panel border-theme text-ink"
      });
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete server admin',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Server Admins - {activeBrand.appName}</title>
        <meta name="description" content="Manage CS2 server administrators" />
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-theme" style={{ textShadow: '0 0 15px rgb(var(--theme-primary-rgb) / 0.5)' }}>
            Server Admins
          </h1>
          <Button
            onClick={handleAdd}
            className="bg-theme text-black hover:bg-theme/90 shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.5)] w-full md:w-auto font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              placeholder="Search by name, Steam ID, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-panel border-line focus:border-theme text-ink placeholder:text-ink-ghost"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-theme mb-2"></div>
            <div className="text-theme animate-pulse">Loading admins...</div>
          </div>
        ) : (
          <div className="bg-panel border border-line-subtle rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-canvas">
                  <TableRow className="border-line-subtle hover:bg-canvas">
                    <TableHead className="text-ink-muted">Name</TableHead>
                    <TableHead className="text-ink-muted">Steam ID</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">Email</TableHead>
                    <TableHead className="text-ink-muted">Role</TableHead>
                    <TableHead className="text-ink-muted">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-ink-muted">Join Date</TableHead>
                    <TableHead className="text-right text-ink-muted">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.length === 0 ? (
                    <TableRow className="border-line-subtle">
                      <TableCell colSpan={7} className="text-center text-ink-muted py-8">
                        No server admins found
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id} className="border-line-subtle hover:bg-hover/50 transition-colors">
                        <TableCell className="font-medium text-ink">{admin.name}</TableCell>
                        <TableCell className="font-mono text-xs text-ink-muted">{admin.steamID}</TableCell>
                        <TableCell className="hidden md:table-cell text-ink-muted">{admin.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            admin.role === 'Admin' 
                              ? 'bg-theme/20 text-theme border border-theme/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {admin.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              admin.status === 'active'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {admin.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-ink-muted">
                          {admin.joinDate ? new Date(admin.joinDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(admin)}
                              className="h-8 w-8 p-0 border-theme/50 text-theme bg-transparent hover:bg-theme/10 hover:shadow-[0_0_15px_rgb(var(--theme-primary-rgb)_/_0.4)] transition-all duration-300"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(admin)}
                              className="h-8 w-8 p-0 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
              className="border-line hover:bg-hover text-ink"
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
              className="border-line hover:bg-hover text-ink"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <ServerAdminForm
          open={formOpen}
          onOpenChange={setFormOpen}
          admin={selectedAdmin}
          onSuccess={fetchAdmins}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-panel border-line text-ink shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-theme">Delete Server Admin?</AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                This will permanently delete the server admin <span className="text-ink font-semibold">{adminToDelete?.name}</span>. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-line text-ink hover:bg-hover hover:text-ink">Cancel</AlertDialogCancel>
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

export default ServerAdminsPage;
