import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";

interface BannerSettings {
  id: string;
  autoplay_speed: number;
  transition_speed: number;
  transition_effect: string;
  easing: string;
  direction: string;
  loop_enabled: boolean;
  pause_on_hover: boolean;
  show_arrows: boolean;
  show_dots: boolean;
  default_desktop_mode: string;
  default_mobile_mode: string;
}

const BannerSliderSettings = () => {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("banner_settings").select("*").limit(1).single();
      if (data) setSettings(data as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase.from("banner_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Slider settings saved");
    setSaving(false);
  };

  if (loading || !settings) return null;

  const update = (key: keyof BannerSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5" /> Slider Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timing */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Timing</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Auto-Play Speed (ms)</Label>
              <Input type="number" min={1000} max={30000} step={500} value={settings.autoplay_speed} onChange={e => update("autoplay_speed", parseInt(e.target.value) || 4000)} />
              <p className="text-xs text-muted-foreground">{(settings.autoplay_speed / 1000).toFixed(1)}s per slide</p>
            </div>
            <div className="space-y-2">
              <Label>Transition Speed (ms)</Label>
              <Input type="number" min={100} max={3000} step={100} value={settings.transition_speed} onChange={e => update("transition_speed", parseInt(e.target.value) || 600)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Animation */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Animation</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Transition Effect</Label>
              <Select value={settings.transition_effect} onValueChange={v => update("transition_effect", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="zoom-in">Zoom In</SelectItem>
                  <SelectItem value="zoom-out">Zoom Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Easing</Label>
              <Select value={settings.easing} onValueChange={v => update("easing", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="ease">Ease</SelectItem>
                  <SelectItem value="ease-in">Ease In</SelectItem>
                  <SelectItem value="ease-out">Ease Out</SelectItem>
                  <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={settings.direction} onValueChange={v => update("direction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Behavior */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Behavior</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "loop_enabled" as const, label: "Loop Slides" },
              { key: "pause_on_hover" as const, label: "Pause on Hover" },
              { key: "show_arrows" as const, label: "Show Arrows" },
              { key: "show_dots" as const, label: "Show Dots" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-md border p-3">
                <Label>{item.label}</Label>
                <Switch checked={settings[item.key] as boolean} onCheckedChange={v => update(item.key, v)} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Image Display */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Default Image Display</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Desktop Mode</Label>
              <Select value={settings.default_desktop_mode} onValueChange={v => update("default_desktop_mode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="fill">Fill</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Mode</Label>
              <Select value={settings.default_mobile_mode} onValueChange={v => update("default_mobile_mode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="fill">Fill</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Slider Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BannerSliderSettings;
