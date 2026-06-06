import { Link } from 'react-router'
import { trpc } from '@/providers/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Clock,
  Trash2,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react'

export default function History() {
  const { data: sessions, isLoading, refetch } = trpc.search.listSessions.useQuery()
  const deleteSession = trpc.search.deleteSession.useMutation({
    onSuccess: () => {
      toast.success('Session deleted')
      refetch()
    },
    onError: (err) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">No sessions yet</h3>
        <p className="text-slate-400 mt-1 mb-4">Start your first literature search to see it here.</p>
        <Link to="/">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Start New Search
          </Button>
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    searching: 'bg-blue-100 text-blue-700',
    extracting: 'bg-blue-100 text-blue-700',
    synthesizing: 'bg-indigo-100 text-indigo-700',
    drafting: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    error: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Search History</h2>
        <p className="text-slate-500 mt-1">
          Manage your literature review sessions and continue where you left off.
        </p>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session.id} className="border-slate-200 hover:border-blue-200 transition-colors group">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-800 truncate">{session.topic}</h3>
                    <Badge className={`${statusColors[session.status] || 'bg-slate-100'} text-[10px]`}>
                      {session.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {session.version.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span>{session.yearFrom}-{session.yearTo}</span>
                    <span>{session.bibFormat}</span>
                    <span className="text-slate-300">|</span>
                    <span>{session.databases}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/session/${session.id}`}>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      Open
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Delete this session?')) {
                        deleteSession.mutate({ sessionId: session.id })
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
