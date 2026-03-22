import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, GripVertical, Shield, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder: string;
  is_required: boolean;
  is_active: boolean;
  is_protected: boolean;
  sort_order: number;
  options: any;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Textarea" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
];

const AdminContactForm = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [deletingField, setDeletingField] = useState<FormField | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    label: "",
    field_type: "text",
    placeholder: "",
    is_required: true,
    options: [] as string[],
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data } = await supabase
      .from("contact_form_fields")
      .select("*")
      .order("sort_order");
    if (data) setFields(data);
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingField(null);
    setForm({ label: "", field_type: "text", placeholder: "", is_required: true, options: [] });
    setDialogOpen(true);
  };

  const openEditDialog = (field: FormField) => {
    setEditingField(field);
    setForm({
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder,
      is_required: field.is_required,
      options: Array.isArray(field.options) ? field.options : [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error("Field label is required");
      return;
    }
    setSaving(true);
    if (editingField) {
      const { error } = await supabase
        .from("contact_form_fields")
        .update({
          label: form.label,
          field_type: form.field_type,
          placeholder: form.placeholder,
          is_required: form.is_required,
          options: form.options,
        })
        .eq("id", editingField.id);
      if (error) toast.error("Failed to update field");
      else toast.success("Field updated");
    } else {
      const maxOrder = fields.length > 0 ? Math.max(...fields.map(f => f.sort_order)) + 1 : 0;
      const { error } = await supabase.from("contact_form_fields").insert({
        label: form.label,
        field_type: form.field_type,
        placeholder: form.placeholder,
        is_required: form.is_required,
        sort_order: maxOrder,
        options: form.options,
      });
      if (error) toast.error("Failed to add field");
      else toast.success("Field added");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchFields();
  };

  const handleDelete = async () => {
    if (!deletingField) return;
    await supabase.from("contact_form_fields").delete().eq("id", deletingField.id);
    toast.success("Field deleted");
    setDeleteDialogOpen(false);
    setDeletingField(null);
    fetchFields();
  };

  const toggleActive = async (field: FormField) => {
    await supabase
      .from("contact_form_fields")
      .update({ is_active: !field.is_active })
      .eq("id", field.id);
    fetchFields();
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...fields];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setFields(updated);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    const updates = fields.map((f, i) =>
      supabase.from("contact_form_fields").update({ sort_order: i }).eq("id", f.id)
    );
    await Promise.all(updates);
    toast.success("Order saved");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contact Form Builder</h1>
            <p className="text-muted-foreground">Manage the fields displayed on your contact form</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" /> Add Field
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Form Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  dragIndex === index ? "bg-accent border-primary" : "bg-card border-border hover:bg-accent/50"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{field.label}</span>
                    <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                    {field.is_required && <Badge className="text-xs">Required</Badge>}
                    {field.is_protected && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" /> Protected
                      </Badge>
                    )}
                    {!field.is_active && (
                      <Badge variant="destructive" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{field.placeholder}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(field)} title={field.is_active ? "Disable" : "Enable"}>
                    {field.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(field)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!field.is_protected && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => { setDeletingField(field); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No fields configured. Add your first field.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Field Label</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g., Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm({ ...form, field_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Placeholder Text</Label>
              <Input
                value={form.placeholder}
                onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
            {form.field_type === "dropdown" && (
              <div className="space-y-2">
                <Label>Options (one per line)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={(form.options || []).join("\n")}
                  onChange={(e) => setForm({ ...form, options: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_required}
                onCheckedChange={(v) => setForm({ ...form, is_required: v })}
              />
              <Label>Required field</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingField?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminContactForm;
