
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/components/ui/use-toast';

const ServerAdminForm = ({ open, onOpenChange, admin, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    steamID: '',
    email: '',
    role: 'Moderator',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (admin) {
      // Safely handle date formatting for input
      let formattedDate = '';
      if (admin.joinDate) {
        // Take first 10 chars (YYYY-MM-DD) to avoid timezone shifts
        formattedDate = admin.joinDate.substring(0, 10);
      } else {
        formattedDate = new Date().toISOString().split('T')[0];
      }

      setFormData({
        name: admin.name || '',
        steamID: admin.steamID || '',
        email: admin.email || '',
        role: admin.role || 'Moderator',
        status: admin.status || 'active',
        joinDate: formattedDate,
      });
    } else {
      setFormData({
        name: '',
        steamID: '',
        email: '',
        role: 'Moderator',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [admin, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (admin) {
        await pb.collection('serverAdmins').update(admin.id, formData, { $autoCancel: false });
        toast({
          title: 'Success',
          description: 'Server admin updated successfully',
          className: "bg-panel border-theme text-ink"
        });
      } else {
        await pb.collection('serverAdmins').create(formData, { $autoCancel: false });
        toast({
          title: 'Success',
          description: 'Server admin created successfully',
          className: "bg-panel border-theme text-ink"
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save server admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-panel border-line text-ink shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader>
          <DialogTitle className="text-theme text-xl tracking-wide" style={{ textShadow: '0 0 10px rgb(var(--theme-primary-rgb) / 0.3)' }}>
            {admin ? 'Edit Server Admin' : 'Add Server Admin'}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {admin ? 'Update the server admin details below.' : 'Fill in the details to add a new server admin.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-ink">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-canvas border-line focus:border-theme text-ink placeholder:text-ink-ghost"
              placeholder="e.g. ProGamer123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="steamID" className="text-ink">Steam ID</Label>
            <Input
              id="steamID"
              value={formData.steamID}
              onChange={(e) => setFormData({ ...formData, steamID: e.target.value })}
              required
              className="bg-canvas border-line focus:border-theme text-ink placeholder:text-ink-ghost"
              placeholder="STEAM_0:1:..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-ink">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-canvas border-line focus:border-theme text-ink placeholder:text-ink-ghost"
              placeholder="admin@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-ink">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-canvas border-line focus:border-theme text-ink">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-line text-ink">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-ink">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-canvas border-line focus:border-theme text-ink">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-line text-ink">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="joinDate" className="text-ink">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              required
              className="bg-canvas border-line focus:border-theme text-ink"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-line text-ink hover:bg-hover hover:text-ink"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-theme text-black hover:bg-theme/90 shadow-[0_0_15px_rgb(var(--theme-primary-rgb)_/_0.4)] font-semibold"
            >
              {loading ? 'Saving...' : admin ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerAdminForm;
