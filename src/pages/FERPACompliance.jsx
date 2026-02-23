import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, FileText, Clock, Users, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function FERPACompliance() {
  const [user, setUser] = useState(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [newConsent, setNewConsent] = useState({
    athlete_email: "",
    parent_name: "",
    parent_email: "",
    consent_type: "full",
    signature: "",
    notes: ""
  });
  const [newPolicy, setNewPolicy] = useState({
    policy_name: "",
    retention_period_days: 1095,
    auto_delete_enabled: false,
    data_types: ["all"],
    effective_date: moment().format("YYYY-MM-DD")
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: () => base44.entities.User.filter({ role: "user" }),
    enabled: user?.role === "admin" || user?.role === "coach"
  });

  const { data: consents = [] } = useQuery({
    queryKey: ["consents"],
    queryFn: () => base44.entities.ParentalConsent.list("-created_date"),
    enabled: user?.role === "admin" || user?.role === "coach"
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 100),
    enabled: user?.role === "admin"
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: () => base44.entities.DataRetentionPolicy.list("-created_date"),
    enabled: user?.role === "admin"
  });

  const createConsentMutation = useMutation({
    mutationFn: (data) => base44.entities.ParentalConsent.create({
      ...data,
      consent_date: moment().format("YYYY-MM-DD"),
      status: "granted"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consents"] });
      toast.success("Parental consent recorded");
      setConsentDialogOpen(false);
      setNewConsent({
        athlete_email: "",
        parent_name: "",
        parent_email: "",
        consent_type: "full",
        signature: "",
        notes: ""
      });
    },
    onError: () => toast.error("Failed to record consent")
  });

  const createPolicyMutation = useMutation({
    mutationFn: (data) => base44.entities.DataRetentionPolicy.create({
      ...data,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Data retention policy created");
      setPolicyDialogOpen(false);
      setNewPolicy({
        policy_name: "",
        retention_period_days: 1095,
        auto_delete_enabled: false,
        data_types: ["all"],
        effective_date: moment().format("YYYY-MM-DD")
      });
    },
    onError: () => toast.error("Failed to create policy")
  });

  const togglePolicyMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.DataRetentionPolicy.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Policy updated");
    },
    onError: () => toast.error("Failed to update policy")
  });

  const updateConsentMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.ParentalConsent.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consents"] });
      toast.success("Consent status updated");
    },
    onError: () => toast.error("Failed to update consent")
  });

  if (!user || (user.role !== "admin" && user.role !== "coach")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Access Restricted</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Only administrators and coaches can access FERPA compliance tools.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const athletesWithoutConsent = athletes.filter(
    a => !consents.some(c => c.athlete_email === a.email && c.status === "granted")
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[var(--brand-primary)] dark:text-gray-300" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">FERPA Compliance</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage privacy, consent, and data retention</p>
          </div>
        </div>

        <Tabs defaultValue="consent" className="space-y-6">
          <TabsList className="dark:bg-gray-800 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="consent" className="dark:data-[state=active]:bg-gray-700 flex-1 min-w-[120px]">
              <Users className="w-4 h-4 mr-1 hidden sm:block" />
              Consent
            </TabsTrigger>
            {user.role === "admin" && (
              <>
                <TabsTrigger value="audit" className="dark:data-[state=active]:bg-gray-700 flex-1 min-w-[100px]">
                  <Eye className="w-4 h-4 mr-1 hidden sm:block" />
                  Audit
                </TabsTrigger>
                <TabsTrigger value="retention" className="dark:data-[state=active]:bg-gray-700 flex-1 min-w-[100px]">
                  <Clock className="w-4 h-4 mr-1 hidden sm:block" />
                  Retention
                </TabsTrigger>
                <TabsTrigger value="info" className="dark:data-[state=active]:bg-gray-700 flex-1 min-w-[100px]">
                  <FileText className="w-4 h-4 mr-1 hidden sm:block" />
                  Info
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="consent" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="dark:text-gray-100">Parental Consent Records</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Track and manage parental consent for student athletes
                    </CardDescription>
                  </div>
                  <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="dark:bg-gray-700 dark:hover:bg-gray-600">
                        Record Consent
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">Record Parental Consent</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="dark:text-gray-200">Athlete</Label>
                          <Select
                            value={newConsent.athlete_email}
                            onValueChange={(val) => setNewConsent({ ...newConsent, athlete_email: val })}
                          >
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                              <SelectValue placeholder="Select athlete" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              {athletes.map(a => (
                                <SelectItem key={a.email} value={a.email} className="dark:text-gray-200">
                                  {a.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">Parent/Guardian Name</Label>
                          <Input
                            value={newConsent.parent_name}
                            onChange={(e) => setNewConsent({ ...newConsent, parent_name: e.target.value })}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">Parent/Guardian Email</Label>
                          <Input
                            type="email"
                            value={newConsent.parent_email}
                            onChange={(e) => setNewConsent({ ...newConsent, parent_email: e.target.value })}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">Consent Type</Label>
                          <Select
                            value={newConsent.consent_type}
                            onValueChange={(val) => setNewConsent({ ...newConsent, consent_type: val })}
                          >
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              <SelectItem value="full" className="dark:text-gray-200">Full Consent</SelectItem>
                              <SelectItem value="data_collection" className="dark:text-gray-200">Data Collection Only</SelectItem>
                              <SelectItem value="data_sharing" className="dark:text-gray-200">Data Sharing</SelectItem>
                              <SelectItem value="photo_video" className="dark:text-gray-200">Photo/Video</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">Digital Signature/Confirmation</Label>
                          <Input
                            value={newConsent.signature}
                            onChange={(e) => setNewConsent({ ...newConsent, signature: e.target.value })}
                            placeholder="Type parent's full name to confirm"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">Notes (Optional)</Label>
                          <Textarea
                            value={newConsent.notes}
                            onChange={(e) => setNewConsent({ ...newConsent, notes: e.target.value })}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <Button
                          onClick={() => createConsentMutation.mutate(newConsent)}
                          disabled={!newConsent.athlete_email || !newConsent.parent_name || !newConsent.signature}
                          className="w-full dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                          Record Consent
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {athletesWithoutConsent.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      {athletesWithoutConsent.length} athlete(s) missing parental consent
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {consents.map((consent) => (
                    <Card key={consent.id} className="dark:bg-gray-700 dark:border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {athletes.find(a => a.email === consent.athlete_email)?.full_name || consent.athlete_email}
                              </p>
                              <Badge variant={consent.status === "granted" ? "default" : consent.status === "revoked" ? "destructive" : "secondary"}>
                                {consent.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Parent: {consent.parent_name} ({consent.parent_email})
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Type: {consent.consent_type.replace("_", " ")} • Date: {moment(consent.consent_date).format("MMM D, YYYY")}
                            </p>
                            {consent.notes && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 italic">{consent.notes}</p>
                            )}
                          </div>
                          {consent.status === "granted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateConsentMutation.mutate({ id: consent.id, status: "revoked" })}
                              className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 self-start"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {consents.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No consent records yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === "admin" && (
            <>
              <TabsContent value="audit" className="space-y-4">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="dark:text-gray-100">Access Audit Log</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Track who accessed student records and when
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                              {log.user_email} • {log.action_type.replace("_", " ")}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                              {moment(log.created_date).format("MMM D, h:mm A")}
                            </p>
                          </div>
                          {log.target_email && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Target: {athletes.find(a => a.email === log.target_email)?.full_name || log.target_email}
                            </p>
                          )}
                          {log.details && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">{log.details}</p>
                          )}
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No audit logs yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="retention" className="space-y-4">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="dark:text-gray-100">Data Retention Policies</CardTitle>
                        <CardDescription className="dark:text-gray-400">
                          Define how long student data is retained
                        </CardDescription>
                      </div>
                      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="dark:bg-gray-700 dark:hover:bg-gray-600">
                            Create Policy
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="dark:text-gray-100">Create Retention Policy</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="dark:text-gray-200">Policy Name</Label>
                              <Input
                                value={newPolicy.policy_name}
                                onChange={(e) => setNewPolicy({ ...newPolicy, policy_name: e.target.value })}
                                placeholder="e.g., Standard Retention Policy"
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              />
                            </div>
                            <div>
                              <Label className="dark:text-gray-200">Retention Period (days)</Label>
                              <Input
                                type="number"
                                value={newPolicy.retention_period_days}
                                onChange={(e) => setNewPolicy({ ...newPolicy, retention_period_days: parseInt(e.target.value) })}
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Recommended: 1095 days (3 years)
                              </p>
                            </div>
                            <div>
                              <Label className="dark:text-gray-200">Effective Date</Label>
                              <Input
                                type="date"
                                value={newPolicy.effective_date}
                                onChange={(e) => setNewPolicy({ ...newPolicy, effective_date: e.target.value })}
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              />
                            </div>
                            <Button
                              onClick={() => createPolicyMutation.mutate(newPolicy)}
                              disabled={!newPolicy.policy_name}
                              className="w-full dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              Create Policy
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {policies.map((policy) => (
                        <Card key={policy.id} className="dark:bg-gray-700 dark:border-gray-600">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{policy.policy_name}</p>
                                  <Badge variant={policy.is_active ? "default" : "secondary"}>
                                    {policy.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Retention: {policy.retention_period_days} days ({Math.round(policy.retention_period_days / 365)} years)
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Effective: {moment(policy.effective_date).format("MMM D, YYYY")}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePolicyMutation.mutate({ id: policy.id, isActive: policy.is_active })}
                                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                              >
                                {policy.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {policies.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No retention policies yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="space-y-4">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="dark:text-gray-100">FERPA Compliance Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">What is FERPA?</h3>
                      <p>
                        The Family Educational Rights and Privacy Act (FERPA) is a federal law that protects the privacy of student education records. 
                        Parents and eligible students have the right to access, review, and request amendments to these records.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Data Collected</h3>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>Athletic performance metrics (distances, times)</li>
                        <li>Training logs and attendance</li>
                        <li>Coach notes and feedback</li>
                        <li>Meet results and competition data</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Rights</h3>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>Parents and students can review all data at any time</li>
                        <li>Request corrections to inaccurate information</li>
                        <li>Export or delete personal data</li>
                        <li>Revoke consent at any time</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Data Access</h3>
                      <p>
                        Only coaches, administrators, and assigned parents can view student athletic performance data. 
                        All access is logged for auditing purposes.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        For questions about FERPA compliance or to request access to records, contact your team administrator or coach.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}