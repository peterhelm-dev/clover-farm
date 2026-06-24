import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  FlaskConical,
  CreditCard,
  Clock,
  Mail,
  Share2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Crown,
} from "lucide-react";

type Tab = "overview" | "users" | "waitlist" | "referrals";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [userPage, setUserPage] = useState(1);
  const [waitlistPage, setWaitlistPage] = useState(1);

  // Redirect non-admins
  if (!loading && (!isAuthenticated || user?.role !== "admin")) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Clover Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            ← Back to App
          </Button>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {(["overview", "users", "waitlist", "referrals"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && (
          <UsersTab page={userPage} onPageChange={setUserPage} />
        )}
        {activeTab === "waitlist" && (
          <WaitlistTab page={waitlistPage} onPageChange={setWaitlistPage} />
        )}
        {activeTab === "referrals" && <ReferralsTab />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------
function OverviewTab() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Active Trials", value: stats?.activeTrials ?? 0, icon: Clock, color: "text-amber-600" },
    { label: "Paid Subscribers", value: stats?.paidSubscribers ?? 0, icon: CreditCard, color: "text-green-600" },
    { label: "Testers", value: stats?.testers ?? 0, icon: FlaskConical, color: "text-purple-600" },
    { label: "Waitlist", value: stats?.totalWaitlist ?? 0, icon: Mail, color: "text-rose-600" },
    { label: "Referrals", value: stats?.totalReferrals ?? 0, icon: Share2, color: "text-teal-600" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users tab
// ---------------------------------------------------------------------------
function UsersTab({ page, onPageChange }: { page: number; onPageChange: (p: number) => void }) {
  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({ page, pageSize: 25 });
  const setTester = trpc.admin.setTester.useMutation({ onSuccess: () => { toast.success("Updated"); refetch(); } });
  const setRole = trpc.admin.setRole.useMutation({ onSuccess: () => { toast.success("Role updated"); refetch(); } });
  const overrideSub = trpc.admin.overrideSubscription.useMutation({ onSuccess: () => { toast.success("Subscription updated"); refetch(); } });

  const totalPages = data ? Math.ceil(data.total / 25) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Users ({data?.total ?? "…"})</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>AI Calls</TableHead>
                  <TableHead>Tester</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : data?.users.map((u) => {
                      const trialDaysLeft = u.trialEndsAt
                        ? Math.max(0, Math.ceil((new Date(u.trialEndsAt).getTime() - Date.now()) / 86400000))
                        : null;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{u.name ?? "—"}</p>
                              <p className="text-xs text-gray-400">{u.email ?? "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                u.tier === "pro"
                                  ? "border-purple-400 text-purple-700"
                                  : u.tier === "plus"
                                  ? "border-blue-400 text-blue-700"
                                  : "border-gray-300 text-gray-600"
                              }
                            >
                              {u.tier ?? "free"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trialDaysLeft !== null && trialDaysLeft > 0 ? (
                              <span className="text-xs text-amber-600 font-medium">{trialDaysLeft}d left</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {u.aiCallsUsedThisMonth ?? 0}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => setTester.mutate({ userId: u.id, isTester: !u.isTester })}
                              className={`w-8 h-5 rounded-full transition-colors relative ${
                                u.isTester ? "bg-purple-500" : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                  u.isTester ? "translate-x-3" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={u.tier ?? "free"}
                                onValueChange={(tier) =>
                                  overrideSub.mutate({ userId: u.id, tier: tier as "free" | "plus" | "pro" })
                                }
                              >
                                <SelectTrigger className="h-7 w-20 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="plus">Plus</SelectItem>
                                  <SelectItem value="pro">Pro</SelectItem>
                                </SelectContent>
                              </Select>
                              {u.role !== "admin" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setRole.mutate({ userId: u.id, role: "admin" })}
                                >
                                  <Shield className="w-3 h-3 mr-1" /> Admin
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waitlist tab
// ---------------------------------------------------------------------------
function WaitlistTab({ page, onPageChange }: { page: number; onPageChange: (p: number) => void }) {
  const { data, isLoading } = trpc.admin.listWaitlist.useQuery({ page, pageSize: 50 });
  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Waitlist ({data?.total ?? "…"})</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Signed Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.entries.map((entry, idx) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-gray-400 text-sm">{(page - 1) * 50 + idx + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{entry.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{entry.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Referrals tab
// ---------------------------------------------------------------------------
function ReferralsTab() {
  const { data, isLoading } = trpc.admin.listReferrals.useQuery();

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Referrals ({data?.length ?? "…"})</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{r.referrerName ?? "—"}</p>
                          <p className="text-xs text-gray-400">{r.referrerEmail ?? "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{r.code}</code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "credited" ? "default" : "secondary"}
                          className={r.status === "credited" ? "bg-green-100 text-green-700 border-green-200" : ""}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
