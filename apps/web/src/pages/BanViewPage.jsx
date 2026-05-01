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
import { ArrowLeft, Copy, Check, ChevronLeft } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout.jsx';

const BanViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ban, setBan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [banHistory, setBanHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchBan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bans/${id}`);
      if (!response.ok) {
        throw new Error('Ban not found');
      }
      const data = await response.json();
      setBan(data);
      
      // Fetch ban history
      setHistoryLoading(true);
      try {
        const historyResponse = await fetch(`/api/bans/${id}/history`);
        const history = await historyResponse.json();
        setBanHistory(history);
      } catch (err) {
        console.error('Failed to fetch ban history:', err);
        setBanHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBan();
  }, [id]);

  const formatLocalTime = (utcString) => {
    if (!utcString) return 'N/A';
    
    const date = new Date(utcString + ' UTC');
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimeZone
    });
  };

  const formatDuration = (minutes) => {
    if (minutes === 0 || minutes === "0") return "Permanent";
    
    const units = [
      { label: "y", value: 60 * 24 * 365 },
      { label: "mo", value: 60 * 24 * 30 },
      { label: "d", value: 60 * 24 },
      { label: "h", value: 60 },
      { label: "m", value: 1 },
    ];

    let remaining = parseInt(minutes);
    const parts = [];

    for (const { label, value } of units) {
      const result = Math.floor(remaining / value);
      if (result > 0) {
        parts.push(`${result}${label}`);
        remaining %= value;
      }
    }

    return parts.length > 0 ? parts.join(" ") : "0m";
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-[#00FF41] text-xl font-bold animate-pulse">Loading...</div>
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !ban) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-red-400 text-2xl font-bold mb-4">Ban Not Found</h1>
            <Button onClick={() => navigate('/bans')} className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90">
              Go to Bans Page
            </Button>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Ban Details - CS2 Servers Admin Panel</title>
        <meta name="description" content={`View ban details for ${ban.player_name}`} />
      </Helmet>
      
      <ProtectedLayout>
        <div className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/bans')}
                className="text-[#00FF41] hover:text-[#00FF41] hover:bg-[#00FF41]/10 pl-0 gap-2 transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Bans
              </Button>
              <Button
                onClick={handleCopyLink}
                className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 font-semibold"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 shadow-2xl">
              <h1 className="text-3xl font-bold text-[#00FF41] mb-2" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.6)' }}>
                Ban Details
              </h1>
              <p className="text-gray-400 mb-8">Detailed information about this ban</p>

              <Table>
                <TableBody>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400 w-1/3">Player Name</TableCell>
                    <TableCell className="text-white">{ban.player_name}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Steam ID</TableCell>
                    <TableCell className="text-white font-mono text-sm">{ban.player_steamid || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Banned By</TableCell>
                    <TableCell className="text-white">{ban.admin_name || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Reason</TableCell>
                    <TableCell className="text-white">{ban.reason || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Duration</TableCell>
                    <TableCell className="text-white">{formatDuration(ban.duration)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Server</TableCell>
                    <TableCell className="text-white">{ban.server_name || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Ban Date</TableCell>
                    <TableCell className="text-white">{formatLocalTime(ban.created)}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Expiry</TableCell>
                    <TableCell className="text-white">
                      {ban.duration === 0 || !ban.ends ? 'N/A' : formatLocalTime(ban.ends)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="font-medium text-gray-400">Status</TableCell>
                    <TableCell className="text-white">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          ban.status === 'ACTIVE'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : ban.status === 'UNBANNED'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {ban.status}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#00FF41] mb-4">Ban History</h3>
              {historyLoading ? (
                <div className="text-gray-400 text-sm">Loading history...</div>
              ) : banHistory.length === 0 ? (
                <div className="text-gray-400 text-sm">No matching bans found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Player Name</TableHead>
                      <TableHead className="text-gray-400">Match Type</TableHead>
                      <TableHead className="text-gray-400">Reason</TableHead>
                      <TableHead className="text-gray-400">Ban Date</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banHistory.map((historyBan) => (
                      <TableRow key={historyBan.id} className="border-gray-800 hover:bg-[#252525]/50 transition-colors">
                        <TableCell className="text-white">{historyBan.player_name}</TableCell>
                        <TableCell className="text-gray-300">{historyBan.matchType}</TableCell>
                        <TableCell className="text-gray-300 truncate max-w-[150px]">{historyBan.reason}</TableCell>
                        <TableCell className="text-gray-300">{formatLocalTime(historyBan.created)}</TableCell>
                        <TableCell className="text-gray-300">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              historyBan.status === 'ACTIVE'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : historyBan.status === 'UNBANNED'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {historyBan.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="mt-8 p-6 bg-[#1a1a1a] border border-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold text-[#00FF41] mb-4">Appeal This Ban</h2>
              <p className="text-gray-400 mb-4">
                If you believe this ban was made in error, you can share this link with the moderators to appeal the ban.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyLink}
                  className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    </>
  );
};

export default BanViewPage;
