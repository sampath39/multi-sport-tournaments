import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Copy, Check, QrCode, X, MessageSquare,
  Globe, Clock, ShieldCheck, Trophy, Sparkles, ExternalLink
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

interface ShareTournamentModalProps {
  isOpen: boolean
  onClose: () => void
  tournamentId: string
  tournamentName: string
  sportName: string
  sportIcon: string
  roundNumber?: number
  totalRounds?: number
  isCompleted?: boolean
}

export function ShareTournamentModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  sportName,
  sportIcon,
  roundNumber = 1,
  totalRounds,
  isCompleted = false
}: ShareTournamentModalProps) {
  const [copied, setCopied] = useState(false)

  // Direct shareable link for players
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pairings/${tournamentId}`
    : `/pairings/${tournamentId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Pairing link copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🏆 *${tournamentName}* (${sportIcon} ${sportName})\n` +
      `⚡ *Round ${roundNumber} Pairings & Match Schedule are live!*\n\n` +
      `👉 Click here to check your board/court, opponent & live scores:\n${shareUrl}\n\n` +
      `_Link valid for full tournament duration + 24 hours after final._`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-white relative overflow-hidden"
      >
        {/* Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Public Player Link</span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>Share Round Pairings</span>
              <span>{sportIcon}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Players can open this link on any mobile phone to see their board/court and opponents.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center space-y-3 shadow-inner">
          <div className="p-3 bg-white rounded-2xl shadow-xl">
            <QRCodeSVG
              value={shareUrl}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scan to open on Mobile Phone</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Project on venue screen or print for player check-in
            </p>
          </div>
        </div>

        {/* Share Link Input & Copy Button */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Direct Shareable URL
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-white/15 shadow-inner">
            <Globe className="w-4 h-4 text-indigo-400 ml-2.5 shrink-0" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-2 py-1.5 bg-transparent text-xs text-slate-200 font-mono focus:outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer border border-emerald-400/40"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all border border-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Preview Player View</span>
          </a>
        </div>

        {/* Expiry & Access Window Info Badge */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs">
          <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-indigo-200">24-Hour Post-Tournament Access Policy</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This link remains active for the full duration of the tournament and stays accessible for up to <strong>1 day (24 hours)</strong> after completion for players to check final results and standings.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
