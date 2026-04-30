
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
import { DatePicker } from "@/components/custom/DatePicker";
import { useAuth } from '@/contexts/AuthContext.jsx';
import { RoleMapper } from '@/utils/RoleMapper';

const AdminForm = ({ open, onOpenChange, admin, onSuccess }) => {
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    player_name: '',
    player_steamid: '',
    role: '',
    ends: 0
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        player_name: admin.player_name || '',
        player_steamid: admin.player_steamid || '',
        role: admin.role || '',
        ends: admin.ends || 0
      });
    } else {
      setFormData({
        player_name: '',
        player_steamid: '',
        role: '',
        ends: 0
      });
    }
  }, [admin, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Determine if we are updating or creating
    const isUpdate = !!admin;
    const url = isUpdate 
        ? `/api/admins/${admin.id}` // Your backend endpoint for update
        : '/api/admins';          // Your backend endpoint for create

    try {
        const response = await authenticatedFetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            body: JSON.stringify(formData),
        });

        // Parse the response body
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save admin');
        }

        toast({ 
            title: 'Success', 
            description: `Admin ${isUpdate ? 'updated' : 'created'} successfully`,
            className: "bg-[#1a1a1a] border-[#00FF41] text-white"
        });

        onSuccess();
        onOpenChange(false);
    } catch (error) {
        console.error('Error saving admin:', error);
        toast({
            title: 'Error',
            description: error.message || 'Failed to save admin',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-[#00FF41]">{admin ? 'Edit Admin' : 'Add Admin'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {admin ? 'Update the admin details below.' : 'Fill in the details to add a new admin.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="steamID">Steam ID</Label>
              <Input
                id="steamID"
                value={formData.player_steamid}
                onChange={(e) => setFormData({ ...formData, player_steamid: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_type">Admin Type</Label>
              <Select value={formData.role} required onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  {RoleMapper.getOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ends">Expiry UNIX Timestamp (0 = never)</Label>
              <Input
                id="ends"
                value={formData.ends}
                onChange={(e) => setFormData({ ...formData, ends: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <DatePicker 
                value={formData.ends} 
                onChange={(newUnix) => {setFormData({ ...formData, ends: newUnix })}} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-[#252525]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)]"
            >
              {loading ? 'Saving...' : admin ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminForm;
