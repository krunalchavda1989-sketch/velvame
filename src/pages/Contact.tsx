import { useState, useEffect } from "react";
import { Loader2, Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBrand } from "@/contexts/BrandContext";

const Contact = () => {
  const brand = useBrand();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("pages_content").select("*").eq("page_slug", "contact").maybeSingle();
      setPage(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("All fields are required"); return; }
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const content = page?.content || {};
  const contactItems = [
    { icon: Mail, label: "Email", value: brand.email || content.email },
    { icon: Phone, label: "Phone", value: brand.phone || content.phone },
    { icon: MapPin, label: "Address", value: brand.address || content.address },
    { icon: Clock, label: "Working Hours", value: content.working_hours },
  ].filter((c) => c.value);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <section className="py-16 bg-gradient-dark">
          <div className="container px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">{page?.title || "Contact Us"}</h1>
              <p className="text-lg text-muted-foreground">{page?.subtitle || ""}</p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Contact Info */}
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-foreground">Get in Touch</h2>
                <p className="text-muted-foreground">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                <div className="space-y-4">
                  {contactItems.map((item) => (
                    <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-card border border-border space-y-4">
                  <h3 className="text-lg font-display font-bold text-foreground mb-2">Send a Message</h3>
                  <div className="space-y-2">
                    <Label>Your Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="How can we help?" />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                    <Send className="h-4 w-4 mr-2" /> Send Message
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
