
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

const PanelUserForm = ({ open, onOpenChange, user, onSuccess }) => {
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'Moderator',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        passwordConfirm: '',
        role: user.role || null,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        passwordConfirm: '',
        role: null,
      });
    }
  }, [user, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Validation for new users
    if (!user && (!formData.password || formData.password !== formData.passwordConfirm)) {
      toast({
        title: 'Error',
        description: 'Passwords do not match or are missing',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const isEditing = !!user;
      
      // 2. Prepare payload
      const payload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      };
      
      // Only include password if we are creating or explicitly changing it
      if (formData.password) {
        payload.password = formData.password;
      }

      // 3. Execute Fetch
      const response = await authenticatedFetch(
        isEditing ? `/api/users/${user.id}` : '/api/users', 
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save user');
      }

      toast({ 
        title: 'Success', 
        description: isEditing ? 'User updated successfully' : 'User created successfully',
        className: "bg-[#1a1a1a] border-[#00FF41] text-white"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user',
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
          <DialogTitle className="text-[#00FF41]">{user ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {user ? 'Update the panel user details below.' : 'Fill in the details to add a new panel user.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                <SelectItem value="Senior Moderator">Senior Moderator</SelectItem>
                <SelectItem value="Moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password {user && '(Leave blank to keep current)'}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirm Password</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              required={!user && !!formData.password}
              className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41]"
            />
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
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PanelUserForm;
