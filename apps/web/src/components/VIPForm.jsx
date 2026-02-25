
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

const VIPForm = ({ open, onOpenChange, vip, onSuccess }) => {
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    steamid64: '',
    group_name: '',
    expires: ''
  });

  useEffect(() => {
    if (vip) {
      setFormData({
        name: vip.name || '',
        steamid64: vip.steamid64 || '',
        group_name: vip.group_name || '',
        expires: vip.expires || 0
      });
    } else {
      setFormData({
        name: '',
        steamid64: '',
        group_name: '',
        expires: 0
      });
    }
  }, [vip, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Determine if we are updating or creating
    const isUpdate = !!vip;
    const url = isUpdate 
        ? `/api/vips/${vip.id}` // Your backend endpoint for update
        : '/api/vips';          // Your backend endpoint for create

    try {
        const response = await authenticatedFetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            body: JSON.stringify(formData),
        });

        // Parse the response body
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save VIP');
        }

        toast({ 
            title: 'Success', 
            description: `VIP ${isUpdate ? 'updated' : 'created'} successfully`,
            className: "bg-[#1a1a1a] border-[#00FF41] text-white"
        });

        onSuccess();
        onOpenChange(false);
    } catch (error) {
        console.error('Error saving VIP:', error);
        toast({
            title: 'Error',
            description: error.message || 'Failed to save VIP',
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
          <DialogTitle className="text-[#00FF41]">{vip ? 'Edit VIP' : 'Add VIP'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {vip ? 'Update the VIP details below.' : 'Fill in the details to add a new VIP.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="steamID">Steam ID</Label>
              <Input
                id="steamID"
                value={formData.steamid64}
                onChange={(e) => setFormData({ ...formData, steamid64: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vip_type">VIP Type</Label>
              <Select value={formData.group_name} onValueChange={(value) => setFormData({ ...formData, group_name: value })}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="SVIP">SVIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expires">Expiry UNIX Timestamp (0 = never)</Label>
              <Input
                id="expires"
                value={formData.expires}
                onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <DatePicker 
                value={formData.expires} 
                onChange={(newUnix) => {setFormData({ ...formData, expires: newUnix })}} 
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
              {loading ? 'Saving...' : vip ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VIPForm;
