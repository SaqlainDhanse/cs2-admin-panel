import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Play, Square, RefreshCw, Users, MonitorPlay } from 'lucide-react';

const MAX_LINES = 2000;
const ANSI_RE = /\u001b\[[0-9;]*m/g;
const PLAYERS_POLL_MS = 15000;

// Server details modal: live console (authenticated admins only), live player
// count/list (public), and power buttons (role-gated, confirmed by parent).
const ServerConsole = ({ server, open, onOpenChange, onPowerAction }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const canStartServers = currentUser?.role === 'Senior Moderator' || currentUser?.role === 'Administrator';
  const canStopServers = currentUser?.role === 'Administrator';

  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | connected | reconnecting | error
  const [liveStatus, setLiveStatus] = useState(null);
  const [players, setPlayers] = useState(null); // { count, maxplayers, players: [{slot,name,score,duration}] }
  const [playersError, setPlayersError] = useState(false);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // Live console websocket — only for logged-in users (backend requires a JWT)
  useEffect(() => {
    if (!open || !server || !isAuthenticated) return;
    let disposed = false;
    setLines([]);
    setLiveStatus(null);
    setStatus('connecting');

    const connect = () => {
      const jwt = localStorage.getItem('token');
      if (!jwt) { setStatus('error'); return; }

      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(
        `${proto}://${window.location.host}/api/servers/${server.id}/console/ws?token=${encodeURIComponent(jwt)}`
      );
      wsRef.current = ws;

      ws.onopen = () => setStatus('connected');
      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.event === 'auth success') {
          ws.send(JSON.stringify({ event: 'send logs', args: [] }));
        } else if (msg.event === 'status') {
          setLiveStatus(msg.args?.[0] || null);
        } else if (msg.event === 'console output') {
          setLines((prev) => [
            ...prev.slice(-(MAX_LINES - msg.args.length)),
            ...msg.args.map((l) => l.replace(ANSI_RE, '')),
          ]);
        } else if (msg.event === 'token expiring' || msg.event === 'token revoked') {
          // Credentials are short-lived; reconnect with a fresh token
          setStatus('reconnecting');
          ws.close();
        }
      };
      ws.onerror = () => setStatus('error');
      ws.onclose = () => {
        if (!disposed) {
          setStatus('reconnecting');
          reconnectTimer.current = setTimeout(connect, 1500);
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [open, server, isAuthenticated]);

  // Live player list — public, refreshed periodically
  useEffect(() => {
    if (!open || !server) return;

    const fetchPlayers = async () => {
      try {
        const res = await fetch(`/api/servers/${server.id}/players`);
        if (!res.ok) throw new Error('query failed');
        setPlayers(await res.json());
        setPlayersError(false);
      } catch {
        setPlayersError(true);
      }
    };

    fetchPlayers();
    const timer = setInterval(fetchPlayers, PLAYERS_POLL_MS);
    return () => clearInterval(timer);
  }, [open, server]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [lines]);

  const effectiveStatus = (liveStatus || server?.status || '').toLowerCase();
  const isRunning = effectiveStatus === 'running';
  const isOffline = effectiveStatus === 'offline' || effectiveStatus === 'stopped';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="sm:max-w-5xl bg-panel border-line text-ink flex flex-col h-[75vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <DialogTitle className="text-theme flex items-center gap-3 flex-wrap">
              {server?.name}
              <span className="text-xs font-normal text-ink-muted flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {playersError
                  ? 'players unavailable'
                  : players
                    ? `${players.count}/${players.maxplayers || '?'} players${players.bots ? ` · ${players.bots} bots` : ''}`
                    : 'loading players…'}
              </span>
            </DialogTitle>
            <div className="flex gap-2 justify-center md:justify-end w-full md:w-auto">
              {isRunning && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { window.location.href = `steam://connect/${server.ip}:${server.port}`; }}
                  className="h-8 border-theme/50 text-theme bg-transparent hover:bg-theme/10"
                >
                  <MonitorPlay className="w-4 h-4 mr-1.5" /> Join
                </Button>
              )}
              {isAuthenticated && onPowerAction && isRunning && canStartServers && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPowerAction(server, 'restart')}
                  className="h-8 border-yellow-500/50 text-yellow-500 bg-transparent hover:bg-yellow-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Restart
                </Button>
              )}
              {isAuthenticated && onPowerAction && isRunning && canStopServers && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPowerAction(server, 'stop')}
                  className="h-8 border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10"
                >
                  <Square className="w-4 h-4 mr-1.5" /> Stop
                </Button>
              )}
              {isAuthenticated && onPowerAction && isOffline && canStartServers && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPowerAction(server, 'start')}
                  className="h-8 border-green-500/50 text-green-500 bg-transparent hover:bg-green-500/10"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Start
                </Button>
              )}
            </div>
          </div>
          <DialogDescription className="text-ink-muted">
            {isAuthenticated
              ? 'Live console output and player list.'
              : 'Player list is public. Log in to view the console.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3">
          {/* Console */}
          <div className="flex-1 min-h-0 min-w-0 rounded-md bg-black/90 border border-line overflow-hidden flex flex-col">
            {!isAuthenticated ? (
              <div className="flex-1 flex items-center justify-center text-ink-faint font-mono text-sm p-4 text-center">
                No Access — log in to view the server console.
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-green-400 whitespace-pre-wrap break-words">
                {lines.length === 0 && (
                  <span className="text-ink-faint">
                    {status === 'connected' ? 'Waiting for console output…' : 'Connecting…'}
                  </span>
                )}
                {lines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Players */}
          <div className="md:w-72 shrink-0 rounded-md bg-black/60 border border-line overflow-hidden flex flex-col min-h-0 max-h-48 md:max-h-none">
            <div className="px-3 py-2 border-b border-line-subtle text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Players
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {playersError ? (
                <div className="p-3 text-xs text-ink-faint">Could not reach server query port.</div>
              ) : !players ? (
                <div className="p-3 text-xs text-ink-faint">Loading…</div>
              ) : players.players.length === 0 ? (
                <div className="p-3 text-xs text-ink-faint">No players online.</div>
              ) : (
                players.players.map((p, i) => (
                  <div
                    key={p.slot ?? i}
                    className="px-3 py-1.5 text-xs border-b border-line-subtle/50 last:border-0"
                  >
                    <span className="text-ink truncate block" title={p.steam_id64 || p.name}>
                      {p.name || 'Unknown'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-line-subtle">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-line text-ink hover:bg-hover"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServerConsole;
