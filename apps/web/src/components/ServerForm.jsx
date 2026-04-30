
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

const ServerForm = ({ open, onOpenChange, server, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serverName: '',
    IP: '',
    port: '',
    region: '',
    maxPlayers: '',
    currentPlayers: 0,
    status: 'online',
  });

  useEffect(() => {
    if (server) {
      setFormData({
        serverName: server.serverName || '',
        IP: server.IP || '',
        port: server.port || '',
        region: server.region || '',
        maxPlayers: server.maxPlayers || '',
        currentPlayers: server.currentPlayers || 0,
        status: server.status || 'online',
      });
    } else {
      setFormData({
        serverName: '',
        IP: '',
        port: '',
        region: '',
        maxPlayers: '',
        currentPlayers: 0,
        status: 'online',
      });
    }
  }, [server, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        port: parseInt(formData.port),
        maxPlayers: parseInt(formData.maxPlayers),
        currentPlayers: parseInt(formData.currentPlayers),
      };

      if (server) {
        await pb.collection('servers').update(server.id, dataToSave, { $autoCancel: false });
        toast({ title: 'Success', description: 'Server updated successfully' });
      } else {
        await pb.collection('servers').create(dataToSave, { $autoCancel: false });
        toast({ title: 'Success', description: 'Server created successfully' });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving server:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-[#00FF41]">{server ? 'Edit Server' : 'Add Server'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {server ? 'Update the server details below.' : 'Fill in the details to add a new game server.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                value={formData.serverName}
                onChange={(e) => setFormData({ ...formData, serverName: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="IP">IP Address</Label>
              <Input
                id="IP"
                value={formData.IP}
                onChange={(e) => setFormData({ ...formData, IP: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max Players</Label>
              <Input
                id="maxPlayers"
                type="number"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPlayers">Current Players</Label>
              <Input
                id="currentPlayers"
                type="number"
                value={formData.currentPlayers}
                onChange={(e) => setFormData({ ...formData, currentPlayers: e.target.value })}
                required
                className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
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
              {loading ? 'Saving...' : server ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServerForm;
