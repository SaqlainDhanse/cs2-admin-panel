import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.jsx';
import { Helmet } from 'react-helmet';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout.jsx';

const PlayerStatsPage = () => {
  const { steamId } = useParams();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weaponStatsCollapsed, setWeaponStatsCollapsed] = useState(false);
  const [mapStatsCollapsed, setMapStatsCollapsed] = useState(false);

  const fetchPlayerStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/player-stats/${steamId}`);
      if (!response.ok) {
        throw new Error('Player not found');
      }
      const data = await response.json();
      setPlayerData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerStats();
  }, [steamId]);

  const formatKDR = (kills, deaths) => {
    if (deaths === 0) return kills > 0 ? '∞' : '0.00';
    return (kills / deaths).toFixed(2);
  };

  const getWeaponIcon = (weapon) => {
    const weaponLower = weapon.toLowerCase();
    
    if (weaponLower.includes('ak') || weaponLower.includes('rifle')) {
      return '🔫';
    } else if (weaponLower.includes('awp') || weaponLower.includes('sniper')) {
      return '🎯';
    } else if (weaponLower.includes('pistol') || weaponLower.includes('glock') || weaponLower.includes('usps')) {
      return '⚡';
    } else if (weaponLower.includes('smg') || weaponLower.includes('mp')) {
      return '🔥';
    } else if (weaponLower.includes('shotgun') || weaponLower.includes('nova') || weaponLower.includes('mag')) {
      return '🏆';
    } else if (weaponLower.includes('knife')) {
      return '💀';
    } else {
      return '🛡️';
    }
  };

  const getWeaponColor = (weapon) => {
    const weaponLower = weapon.toLowerCase();
    
    if (weaponLower.includes('awp')) return 'text-purple-400';
    if (weaponLower.includes('ak')) return 'text-orange-400';
    if (weaponLower.includes('m4')) return 'text-blue-400';
    if (weaponLower.includes('knife')) return 'text-red-400';
    if (weaponLower.includes('deagle')) return 'text-yellow-400';
    return 'text-[#00FF41]';
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="p-4 md:p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00FF41] mb-2"></div>
            <div className="text-[#00FF41] animate-pulse">Loading stats...</div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !playerData) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-red-400 text-2xl font-bold mb-4">Player Not Found</h1>
            <Button onClick={() => navigate('/stats')} className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90">
              Go to Stats List
            </Button>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  const { player, weaponStats, mapStats, aggregate } = playerData;
  const agg = aggregate || {};

  return (
    <>
      <Helmet>
        <title>{player.name} - Stats - UGC CS2 Dashboard</title>
        <meta name="description" content={`View detailed statistics for ${player.name}`} />
      </Helmet>
      
      <ProtectedLayout>
        <div className="p-4 md:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/stats')}
            className="text-[#00FF41] hover:text-[#00FF41] hover:bg-[#00FF41]/10 pl-0 gap-2 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Stats
          </Button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[#00FF41] mb-2" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}>
          {player.name}
        </h1>
        <p className="text-gray-400 mb-6">Steam ID: <span className="text-white font-mono">{player.steam_id}</span></p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Kills</div>
            <div className="text-2xl font-bold text-[#00FF41]">{agg.total_kills || 0}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Deaths</div>
            <div className="text-2xl font-bold text-red-400">{agg.total_deaths || 0}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">K/D Ratio</div>
            <div className="text-2xl font-bold text-white">{formatKDR(agg.total_kills, agg.total_deaths)}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Assists</div>
            <div className="text-2xl font-bold text-blue-400">{agg.total_assists || 0}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Headshots</div>
            <div className="text-2xl font-bold text-yellow-400">{agg.total_headshots || 0}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">MVPs</div>
            <div className="text-2xl font-bold text-purple-400">{agg.total_mvp || 0}</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg mb-6">
          <div 
            className="p-6 border-b border-gray-800 flex items-center justify-between cursor-pointer hover:bg-[#252525]/50 transition-colors"
            onClick={() => setWeaponStatsCollapsed(!weaponStatsCollapsed)}
          >
            <h2 className="text-xl font-bold text-[#00FF41]">Weapon Statistics</h2>
            {weaponStatsCollapsed ? <ChevronDown className="text-[#00FF41]" /> : <ChevronUp className="text-[#00FF41]" />}
          </div>
          
          {!weaponStatsCollapsed && weaponStats && weaponStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0a0a0a]">
                  <TableRow className="border-gray-800 hover:bg-[#0a0a0a]">
                    <TableHead className="text-gray-400">Weapon</TableHead>
                    <TableHead className="text-gray-400">Kills</TableHead>
                    <TableHead className="text-gray-400">Shots</TableHead>
                    <TableHead className="text-gray-400">Hits</TableHead>
                    <TableHead className="text-gray-400">Accuracy</TableHead>
                    <TableHead className="text-gray-400">Headshots</TableHead>
                    <TableHead className="text-gray-400">HS %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weaponStats.map((weapon) => (
                    <TableRow key={weapon.weapon} className="border-gray-800 hover:bg-[#252525]/50 transition-colors">
                      <TableCell className="text-white font-medium">
                        {weapon.weapon}
                      </TableCell>
                      <TableCell className="text-[#00FF41] font-bold">{weapon.kills}</TableCell>
                      <TableCell className="text-gray-300">{weapon.shots}</TableCell>
                      <TableCell className="text-gray-300">{weapon.hits}</TableCell>
                      <TableCell className="text-gray-300">
                        {weapon.shots > 0 ? ((weapon.hits / weapon.shots) * 100).toFixed(1) + '%' : '0.0%'}
                      </TableCell>
                      <TableCell className="text-yellow-400">{weapon.headshots}</TableCell>
                      <TableCell className="text-gray-300">
                        {weapon.kills > 0 ? ((weapon.headshots / weapon.kills) * 100).toFixed(1) + '%' : '0.0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !weaponStatsCollapsed && (
            <div className="p-6 text-gray-400 text-sm">No weapon stats available</div>
          )}
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div 
            className="p-6 border-b border-gray-800 flex items-center justify-between cursor-pointer hover:bg-[#252525]/50 transition-colors"
            onClick={() => setMapStatsCollapsed(!mapStatsCollapsed)}
          >
            <h2 className="text-xl font-bold text-[#00FF41]">Map Statistics</h2>
            {mapStatsCollapsed ? <ChevronDown className="text-[#00FF41]" /> : <ChevronUp className="text-[#00FF41]" />}
          </div>
          
          {!mapStatsCollapsed && mapStats && mapStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0a0a0a]">
                  <TableRow className="border-gray-800 hover:bg-[#0a0a0a]">
                    <TableHead className="text-gray-400">Map</TableHead>
                    <TableHead className="text-gray-400">Kills</TableHead>
                    <TableHead className="text-gray-400">Deaths</TableHead>
                    <TableHead className="text-gray-400">Assists</TableHead>
                    <TableHead className="text-gray-400">K/D</TableHead>
                    <TableHead className="text-gray-400">Headshots</TableHead>
                    <TableHead className="text-gray-400">MVPs</TableHead>
                    <TableHead className="text-gray-400">W/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapStats.map((map) => (
                    <TableRow key={map.map_name} className="border-gray-800 hover:bg-[#252525]/50 transition-colors">
                      <TableCell className="text-white font-medium">{map.map_name}</TableCell>
                      <TableCell className="text-[#00FF41] font-bold">{map.kills}</TableCell>
                      <TableCell className="text-red-400">{map.deaths}</TableCell>
                      <TableCell className="text-blue-400">{map.assists}</TableCell>
                      <TableCell className="text-white">{formatKDR(map.kills, map.deaths)}</TableCell>
                      <TableCell className="text-yellow-400">{map.headshots}</TableCell>
                      <TableCell className="text-purple-400">{map.mvp}</TableCell>
                      <TableCell className="text-gray-300">
                        {map.round_lose > 0 
                          ? ((map.round_win / (map.round_win + map.round_lose)) * 100).toFixed(1) + '%'
                          : '0.0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !mapStatsCollapsed && (
            <div className="p-6 text-gray-400 text-sm">No map stats available</div>
          )}
        </div>
      </div>
      </ProtectedLayout>
    </>
  );
};

export default PlayerStatsPage;
