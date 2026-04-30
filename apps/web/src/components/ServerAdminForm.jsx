
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
          className: "bg-[#1a1a1a] border-[#00FF41] text-white"
        });
      } else {
        await pb.collection('serverAdmins').create(formData, { $autoCancel: false });
        toast({
          title: 'Success',
          description: 'Server admin created successfully',
          className: "bg-[#1a1a1a] border-[#00FF41] text-white"
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
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-gray-700 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader>
          <DialogTitle className="text-[#00FF41] text-xl tracking-wide" style={{ textShadow: '0 0 10px rgba(0, 255, 65, 0.3)' }}>
            {admin ? 'Edit Server Admin' : 'Add Server Admin'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {admin ? 'Update the server admin details below.' : 'Fill in the details to add a new server admin.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
              placeholder="e.g. ProGamer123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="steamID" className="text-gray-300">Steam ID</Label>
            <Input
              id="steamID"
              value={formData.steamID}
              onChange={(e) => setFormData({ ...formData, steamID: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
              placeholder="STEAM_0:1:..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
              placeholder="admin@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="joinDate" className="text-gray-300">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-[#252525] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_15px_rgba(0,255,65,0.4)] font-semibold"
            >
              {loading ? 'Saving...' : admin ? 'Update Admin' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerAdminForm;
