import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database, HardDrive, Cloud, RefreshCw, AlertTriangle, CheckCircle, Server, FolderOpen, Loader2 } from "lucide-react";

interface TableStat {
  name: string;
  total_bytes: number;
  data_bytes: number;
  index_bytes: number;
  total_mb: string;
}

interface RowCount {
  table: string;
  rows: number;
}

interface BucketStat {
  name: string;
  public: boolean;
  file_count: number;
}

interface StorageData {
  database: {
    total_bytes: number;
    total_mb: string;
    tables: TableStat[];
    row_counts: RowCount[];
  };
  storage_buckets: BucketStat[];
}

const DB_LIMIT_MB = 500; // Free tier Supabase limit

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const AdminStorageMonitor = () => {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [s3Enabled, setS3Enabled] = useState(false);
  const [s3Config, setS3Config] = useState({
    accessKey: "",
    secretKey: "",
    region: "ap-south-1",
    bucketName: "",
  });
  const [testingConnection, setTestingConnection] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Session expired", variant: "destructive" });
        return;
      }

      const { data: result, error } = await supabase.functions.invoke("storage-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setData(result);
    } catch (err: any) {
      toast({ title: "Failed to load storage stats", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const usagePct = data ? (parseFloat(data.database.total_mb) / DB_LIMIT_MB) * 100 : 0;
  const usageColor = usagePct >= 95 ? "text-destructive" : usagePct >= 80 ? "text-yellow-600" : "text-emerald-600";
  const progressColor = usagePct >= 95 ? "bg-destructive" : usagePct >= 80 ? "bg-yellow-500" : "bg-emerald-500";

  const rowMap = new Map<string, number>();
  data?.database.row_counts.forEach((r) => rowMap.set(r.table, r.rows));

  const handleTestConnection = async () => {
    if (!s3Config.accessKey || !s3Config.secretKey || !s3Config.bucketName) {
      toast({ title: "Fill all S3 fields first", variant: "destructive" });
      return;
    }
    setTestingConnection(true);
    // Simulate test — actual S3 test would need an edge function
    setTimeout(() => {
      setTestingConnection(false);
      toast({ title: "S3 connection feature", description: "Connect your AWS S3 bucket from the Connectors panel to enable this feature." });
    }, 1500);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              Storage & Infrastructure
            </h1>
            <p className="text-muted-foreground mt-1">Monitor database usage, file storage, and configure cloud providers</p>
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="database" className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" /> Database
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" /> File Storage
            </TabsTrigger>
            <TabsTrigger value="s3" className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5" /> Amazon S3
            </TabsTrigger>
          </TabsList>

          {/* DATABASE TAB */}
          <TabsContent value="database" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data ? (
              <>
                {/* Usage Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Total DB Size</span>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className={`text-3xl font-bold ${usageColor}`}>
                        {data.database.total_mb} MB
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">of {DB_LIMIT_MB} MB limit</p>
                      <div className="mt-3 relative">
                        <Progress value={Math.min(usagePct, 100)} className="h-2.5" />
                        <div
                          className={`absolute top-0 left-0 h-2.5 rounded-full transition-all ${progressColor}`}
                          style={{ width: `${Math.min(usagePct, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{usagePct.toFixed(1)}% used</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Total Tables</span>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        {data.database.tables.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">public schema tables</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Total Rows</span>
                        <Server className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        {data.database.row_counts.reduce((sum, r) => sum + r.rows, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">across all tables (estimated)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Warning Banner */}
                {usagePct >= 80 && (
                  <Card className={`border-2 ${usagePct >= 95 ? "border-destructive bg-destructive/5" : "border-yellow-500 bg-yellow-50"}`}>
                    <CardContent className="pt-6 flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${usagePct >= 95 ? "text-destructive" : "text-yellow-600"}`} />
                      <div>
                        <p className="font-semibold text-foreground">
                          {usagePct >= 95 ? "Critical: Database almost full!" : "Warning: High database usage"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {usagePct >= 95
                            ? "Your database is at 95%+ capacity. Consider archiving old data or upgrading your plan immediately."
                            : "Your database is above 80% capacity. Plan ahead to avoid running out of space."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Table Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Table-wise Breakdown</CardTitle>
                    <CardDescription>Size and row count per table (sorted by size)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table</TableHead>
                          <TableHead className="text-right">Data</TableHead>
                          <TableHead className="text-right">Indexes</TableHead>
                          <TableHead className="text-right">Total Size</TableHead>
                          <TableHead className="text-right">Rows (est.)</TableHead>
                          <TableHead className="text-right">% of DB</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.database.tables.map((t) => {
                          const pct = data.database.total_bytes > 0
                            ? ((t.total_bytes / data.database.total_bytes) * 100).toFixed(1)
                            : "0";
                          return (
                            <TableRow key={t.name}>
                              <TableCell className="font-medium font-mono text-xs">{t.name}</TableCell>
                              <TableCell className="text-right text-xs">{formatBytes(t.data_bytes)}</TableCell>
                              <TableCell className="text-right text-xs">{formatBytes(t.index_bytes)}</TableCell>
                              <TableCell className="text-right text-xs font-semibold">{formatBytes(t.total_bytes)}</TableCell>
                              <TableCell className="text-right text-xs">
                                {(rowMap.get(t.name) ?? 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-secondary rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full"
                                      style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                                    />
                                  </div>
                                  <span>{pct}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Failed to load database stats. Click Refresh to retry.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FILE STORAGE TAB */}
          <TabsContent value="storage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.storage_buckets.map((bucket) => (
                    <Card key={bucket.name}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{bucket.name}</span>
                          <Badge variant={bucket.public ? "default" : "secondary"}>
                            {bucket.public ? "Public" : "Private"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {bucket.file_count} file{bucket.file_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {data.storage_buckets.length === 0 && (
                  <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No storage buckets found.
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>

          {/* AMAZON S3 TAB */}
          <TabsContent value="s3" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cloud className="h-5 w-5" />
                      Amazon S3 Integration
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Connect Amazon S3 as an external storage provider for large files and backups
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="s3-toggle" className="text-sm">Enable S3</Label>
                    <Switch id="s3-toggle" checked={s3Enabled} onCheckedChange={setS3Enabled} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!s3Enabled ? (
                  <div className="text-center py-8">
                    <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Enable the toggle above to configure Amazon S3 integration
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      S3 can be used for large file uploads, backups, and media storage
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-primary">Setup Guide</p>
                          <ol className="text-primary/80 mt-1 space-y-1 list-decimal list-inside">
                            <li>Create an S3 bucket in your AWS console</li>
                            <li>Create an IAM user with S3 permissions</li>
                            <li>Enter the credentials below</li>
                            <li>Test the connection</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="access-key">Access Key ID</Label>
                        <Input
                          id="access-key"
                          type="password"
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                          value={s3Config.accessKey}
                          onChange={(e) => setS3Config(p => ({ ...p, accessKey: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secret-key">Secret Access Key</Label>
                        <Input
                          id="secret-key"
                          type="password"
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          value={s3Config.secretKey}
                          onChange={(e) => setS3Config(p => ({ ...p, secretKey: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">AWS Region</Label>
                        <Input
                          id="region"
                          placeholder="ap-south-1"
                          value={s3Config.region}
                          onChange={(e) => setS3Config(p => ({ ...p, region: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bucket">Bucket Name</Label>
                        <Input
                          id="bucket"
                          placeholder="my-app-storage"
                          value={s3Config.bucketName}
                          onChange={(e) => setS3Config(p => ({ ...p, bucketName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button onClick={handleTestConnection} disabled={testingConnection} variant="outline">
                        {testingConnection ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        onClick={() => {
                          toast({ title: "S3 Configuration", description: "To fully enable S3, connect your AWS S3 bucket from the Connectors panel. Credentials will be securely stored." });
                        }}
                      >
                        Save Configuration
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-3">Storage Routing Rules</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Product Images</p>
                            <p className="text-xs text-muted-foreground">Product catalog media</p>
                          </div>
                          <Badge variant="outline">Supabase Storage</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">User Uploads</p>
                            <p className="text-xs text-muted-foreground">KYC documents, avatars</p>
                          </div>
                          <Badge variant="outline">Supabase Storage</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Large Files & Backups</p>
                            <p className="text-xs text-muted-foreground">Files over 50MB, database backups</p>
                          </div>
                          <Badge variant={s3Enabled ? "default" : "secondary"}>
                            {s3Enabled ? "Amazon S3" : "Not configured"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <h4 className="font-medium text-sm mb-2">Performance & Cost Tips</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Use S3 lifecycle policies to move old files to Glacier (saves up to 80% storage cost)</li>
                          <li>• Enable CloudFront CDN for faster file delivery</li>
                          <li>• Use signed URLs for private file access (auto-expire)</li>
                          <li>• Avoid excessive LIST operations — cache results where possible</li>
                          <li>• Enable S3 Transfer Acceleration for uploads from distant regions</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminStorageMonitor;
