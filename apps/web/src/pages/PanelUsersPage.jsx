
import React, { useState, useEffect } from 'react';
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
import PanelUserForm from '@/components/PanelUserForm.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { formatLocalTime } from '@/lib/utils.js';
import { activeBrand } from '@/themes';

const PanelUsersPage = () => {
  const { authenticatedFetch } = useAuth();

  const formatUpdatedTime = (updatedString, createdString) => {
    // If updated_at is null, undefined, or equals created_at, show N/A
    if (!updatedString) return 'N/A';
    if (updatedString === createdString) return 'N/A';
    return formatLocalTime(updatedString);
  };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Construct the URL with pagination and search
      // We use /api/users which Vite proxies to your Express server
      const url = new URL('/api/users', window.location.origin);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', 10);
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await authenticatedFetch(url.toString(), {
        method: 'GET'
      });

      if (!response.ok) {
        // If 401 or 403, the user might have been demoted or session expired
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized: Admin access required');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      // 3. Update state with the results from Express
      // Note: Result structure is { items: [], totalPages: x, ... }
      setUsers(result.items || []);
      setTotalPages(result.totalPages || 1);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load panel users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleAdd = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await authenticatedFetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      toast({ 
        title: 'Success', 
        description: 'User deleted successfully',
        className: "bg-panel border-theme text-ink" 
      });
      
      // Refresh the list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Panel Users - {activeBrand.appName}</title>
        <meta name="description" content="Manage admin panel users" />
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
            Panel Users
          </h1>
          <Button
            onClick={handleAdd}
            className="bg-theme text-black hover:bg-theme/90 shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.5)] w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              placeholder="Search by username or email..."
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
            <div className="text-theme animate-pulse">Loading users...</div>
          </div>
        ) : (
          <div className="bg-panel border border-line-subtle rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-canvas">
                  <TableRow className="border-line-subtle hover:bg-canvas">
                    <TableHead className="text-ink-muted">Username</TableHead>
                    <TableHead className="hidden md:table-cell text-ink-muted">Email</TableHead>
                    <TableHead className="text-ink-muted">Role</TableHead>
                    <TableHead className="text-ink-muted">Created Date</TableHead>
                    <TableHead className="text-ink-muted">Last Updated</TableHead>
                    <TableHead className="text-right text-ink-muted">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow className="border-line-subtle">
                      <TableCell colSpan={6} className="text-center text-ink-muted py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-line-subtle hover:bg-hover/50 transition-colors">
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-md bg-theme/10 text-theme text-xs font-medium whitespace-nowrap">
                            {user.role || 'User'}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatLocalTime(user.created_at)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatUpdatedTime(user.updated_at, user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {user.role != 'Administrator' && (<div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(user)}
                              className="h-8 w-8 p-0 border-theme/50 text-theme bg-transparent hover:bg-theme/10 hover:shadow-[0_0_15px_rgb(var(--theme-primary-rgb)_/_0.4)] transition-all duration-300"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(user)}
                              className="h-8 w-8 p-0 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>)}
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

        <PanelUserForm
          open={formOpen}
          onOpenChange={setFormOpen}
          user={selectedUser}
          onSuccess={fetchUsers}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-panel border-line text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-theme">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                This will permanently delete the user <span className="text-ink font-semibold">{userToDelete?.username || userToDelete?.email}</span>. This action cannot be undone.
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

export default PanelUsersPage;
