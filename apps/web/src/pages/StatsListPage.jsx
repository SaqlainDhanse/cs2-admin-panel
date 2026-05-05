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
        <title>Player Stats - UGC CS2 Dashboard</title>
        <meta name="description" content="View player statistics" />
      </Helmet>
      
      <ProtectedLayout>
        <div className="p-4 md:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-[#00FF41] hover:text-[#00FF41] hover:bg-[#00FF41]/10 pl-0 gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[#00FF41] mb-6" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}>
          Player Statistics
        </h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by name or Steam ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-[#1a1a1a] border-gray-700 focus:border-[#00FF41] text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00FF41] mb-2"></div>
            <div className="text-[#00FF41] animate-pulse">Loading stats...</div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0a0a0a]">
                  <TableRow className="border-gray-800 hover:bg-[#0a0a0a]">
                    <TableHead className="text-gray-400">Rank</TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('points')}
                    >
                      Points {sortBy === 'points' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('total_kills')}
                    >
                      Kills {sortBy === 'total_kills' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('total_deaths')}
                    >
                      Deaths {sortBy === 'total_deaths' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-gray-400">K/D Ratio</TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('total_assists')}
                    >
                      Assists {sortBy === 'total_assists' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('total_headshots')}
                    >
                      Headshots {sortBy === 'total_headshots' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-gray-400">Accuracy</TableHead>
                    <TableHead 
                      className="text-gray-400 cursor-pointer hover:text-[#00FF41] transition-colors"
                      onClick={() => handleSort('last_online')}
                    >
                      Last Online {sortBy === 'last_online' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.length === 0 ? (
                    <TableRow className="border-gray-800">
                      <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                        No stats found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.map((player, index) => (
                      <TableRow 
                        key={player.steam_id} 
                        className="border-gray-800 hover:bg-[#252525]/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/stats/${player.steam_id}`)}
                      >
                        <TableCell className="text-white font-bold">
                          {player.rank === 1 && '🥇'}
                          {player.rank === 2 && '🥈'}
                          {player.rank === 3 && '🥉'}
                          {player.rank > 3 && `#${player.rank}`}
                        </TableCell>
                        <TableCell className="font-medium text-white">{player.name || 'Unknown'}</TableCell>
                        <TableCell className="text-[#00FF41] font-bold">{player.points || 0}</TableCell>
                        <TableCell className="text-[#00FF41] font-bold">{player.total_kills || 0}</TableCell>
                        <TableCell className="text-red-400">{player.total_deaths || 0}</TableCell>
                        <TableCell className="text-gray-300">
                          {formatKDR(player.total_kills, player.total_deaths)}
                        </TableCell>
                        <TableCell className="text-gray-300">{player.total_assists || 0}</TableCell>
                        <TableCell className="text-yellow-400">{player.total_headshots || 0}</TableCell>
                        <TableCell className="text-gray-300">
                          {player.total_shots > 0 
                            ? ((player.total_hits / player.total_shots) * 100).toFixed(1) + '%'
                            : '0.0%'}
                        </TableCell>
                        <TableCell className="text-gray-400">
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
            <div className="text-gray-400 text-sm">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-[#252525] hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-[#252525] hover:text-white disabled:opacity-50"
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
