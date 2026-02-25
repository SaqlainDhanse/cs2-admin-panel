
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
import { useAuth } from '@/contexts/AuthContext.jsx';

const BanForm = ({ open, onOpenChange, ban, onSuccess }) => {
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    playerName: '',
    steamID: '',
    playerIp: '',
    reason: '',
    duration: 0,
    status: 'active',
  });

  useEffect(() => {
    if (ban) {
      // Format dates safely for inputs (YYYY-MM-DD)
      const formatDate = (dateStr) => dateStr ? dateStr.substring(0, 10) : '';

      setFormData({
        playerName: ban.player_name || '',
        steamID: ban.player_steamid || '',
        playerIp: ban.player_ip || '',
        reason: ban.reason || '',
        duration: ban.duration,
        status: ban.status || 'active',
      });
    } else {
      setFormData({
        playerName: '',
        steamID: '',
        playerIp: '',
        reason: '',
        duration: 0,
        status: 'active',
      });
    }
  }, [ban, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = !!ban;

      // Map Frontend keys -> Database keys
      const payload = {
        player_name: formData.playerName,
        player_steamid: formData.steamID,
        player_ip: formData.playerIp,
        reason: formData.reason,
        duration: formData.duration,
        status: formData.status.toUpperCase(), // Match ENUM ('ACTIVE', 'UNBANNED', etc.)
      };

      const response = await authenticatedFetch(
        isEditing ? `/api/bans/${ban.id}` : '/api/bans',
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save ban');
      }

      toast({
        title: 'Success',
        description: `Ban ${isEditing ? 'updated' : 'created'} successfully`,
        className: "bg-[#1a1a1a] border-[#00FF41] text-white"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving ban:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save ban',
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
            {ban ? 'Edit Ban' : 'Add Ban'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {ban ? 'Update the ban details below.' : 'Fill in the details to add a new ban.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
              <Label htmlFor="playerName" className="text-gray-300">Player Name</Label>
              <Input
                id="playerName"
                value={formData.playerName}
                onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
                placeholder="Player123"
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="playerIp" className="text-gray-300">Player IP</Label>
              <Input
                id="playerIp"
                value={formData.playerIp}
                onChange={(e) => setFormData({ ...formData, playerIp: e.target.value })}
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
                placeholder="10.10...."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-300">Reason</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
              placeholder="e.g. Cheating, Toxicity"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-gray-300">Duration (in minutes)</Label>
              <Input
                id="bannedBy"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="UNBANNED">Unbanned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="secondary"
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
              {loading ? 'Saving...' : ban ? 'Update Ban' : 'Create Ban'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BanForm;
