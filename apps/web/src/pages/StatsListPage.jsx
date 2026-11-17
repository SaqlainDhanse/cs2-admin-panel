import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Helmet } from 'react-helmet';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout.jsx';
import { activeBrand } from '@/themes';

const StatsListPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState('DESC');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/player-stats?page=${page}&limit=20${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      const data = await response.json();
      setStats(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const formatKDR = (kills, deaths) => {
    if (deaths === 0) return kills > 0 ? '∞' : '0.00';
    return (kills / deaths).toFixed(2);
  };

  return (
    <>
      <Helmet>
        <title>Player Stats - {activeBrand.appName}</title>
        <meta name="description" content="View player statistics" />
      </Helmet>
      
      <ProtectedLayout>
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

        <h1 className="text-2xl md:text-3xl font-bold text-theme mb-6" style={{ textShadow: '0 0 15px rgb(var(--theme-primary-rgb) / 0.5)' }}>
          Player Statistics
        </h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faint" />
            <Input
              type="text"
              placeholder="Search by name or Steam ID..."
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
            <div className="text-theme animate-pulse">Loading stats...</div>
          </div>
        ) : (
          <div className="bg-panel border border-line-subtle rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-canvas">
                  <TableRow className="border-line-subtle hover:bg-canvas">
                    <TableHead className="text-ink-muted">Rank</TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('points')}
                    >
                      Points {sortBy === 'points' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('total_kills')}
                    >
                      Kills {sortBy === 'total_kills' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('total_deaths')}
                    >
                      Deaths {sortBy === 'total_deaths' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-ink-muted">K/D Ratio</TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('total_assists')}
                    >
                      Assists {sortBy === 'total_assists' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('total_headshots')}
                    >
                      Headshots {sortBy === 'total_headshots' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-ink-muted">Accuracy</TableHead>
                    <TableHead 
                      className="text-ink-muted cursor-pointer hover:text-theme transition-colors"
                      onClick={() => handleSort('last_online')}
                    >
                      Last Online {sortBy === 'last_online' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.length === 0 ? (
                    <TableRow className="border-line-subtle">
                      <TableCell colSpan={9} className="text-center text-ink-muted py-8">
                        No stats found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.map((player, index) => (
                      <TableRow 
                        key={player.steam_id} 
                        className="border-line-subtle hover:bg-hover/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/stats/${player.steam_id}`)}
                      >
                        <TableCell className="text-ink font-bold">
                          {player.rank === 1 && '🥇'}
                          {player.rank === 2 && '🥈'}
                          {player.rank === 3 && '🥉'}
                          {player.rank > 3 && `#${player.rank}`}
                        </TableCell>
                        <TableCell className="font-medium text-ink">{player.name || 'Unknown'}</TableCell>
                        <TableCell className="text-theme font-bold">{player.points || 0}</TableCell>
                        <TableCell className="text-theme font-bold">{player.total_kills || 0}</TableCell>
                        <TableCell className="text-red-400">{player.total_deaths || 0}</TableCell>
                        <TableCell className="text-ink">
                          {formatKDR(player.total_kills, player.total_deaths)}
                        </TableCell>
                        <TableCell className="text-ink">{player.total_assists || 0}</TableCell>
                        <TableCell className="text-yellow-400">{player.total_headshots || 0}</TableCell>
                        <TableCell className="text-ink">
                          {player.total_shots > 0 
                            ? ((player.total_hits / player.total_shots) * 100).toFixed(1) + '%'
                            : '0.0%'}
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {player.last_online ? new Date(player.last_online).toLocaleDateString() : 'Never'}
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
          <div className="mt-6 flex items-center justify-between">
            <div className="text-ink-muted text-sm">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                className="border-line text-ink hover:bg-hover hover:text-ink disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                className="border-line text-ink hover:bg-hover hover:text-ink disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        </div>
      </ProtectedLayout>
    </>
  );
};

export default StatsListPage;
