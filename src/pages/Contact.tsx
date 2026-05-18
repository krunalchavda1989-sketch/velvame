import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBrand } from "@/contexts/BrandContext";

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options: any;
}

const Contact = () => {
  const brand = useBrand();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [pageRes, fieldsRes] = await Promise.all([
        supabase.from("pages_content").select("*").eq("page_slug", "contact").maybeSingle(),
        supabase.from("contact_form_fields").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setPage(pageRes.data);
      if (fieldsRes.data) setFields(fieldsRes.data);
      setLoading(false);
    };
    init();
  }, []);

  const handleChange = (fieldLabel: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldLabel]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of fields) {
      if (field.is_required && !formData[field.label]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    // Email validation
    const emailField = fields.find(f => f.field_type === "email");
    if (emailField && formData[emailField.label]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData[emailField.label])) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      submitted_data: formData,
    });

    if (error) {
      toast.error("Failed to send message. Please try again.");
    } else {
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({});
    }
    setSubmitting(false);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.label] || "";

    switch (field.field_type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
            placeholder={field.placeholder}
            rows={5}
            required={field.is_required}
          />
        );
      case "dropdown":
        return (
          <Select value={value} onValueChange={(v) => handleChange(field.label, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(field.options) ? field.options : []).map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value === "true"}
              onCheckedChange={(checked) => handleChange(field.label, checked ? "true" : "false")}
            />
            <span className="text-sm text-muted-foreground">{field.placeholder}</span>
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
            required={field.is_required}
          />
        );
      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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

  const canonical = `${typeof window !== "undefined" ? window.location.origin : "https://velvame.lovable.app"}/contact`;
  const localBizJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand?.brand_name || "Velvame",
    url: canonical,
    ...(brand?.email && { email: brand.email }),
    ...(brand?.phone && { telephone: brand.phone }),
    ...(brand?.address && { address: { "@type": "PostalAddress", streetAddress: brand.address } }),
    ...(content.working_hours && { openingHours: content.working_hours }),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact Velvame — Health & Wellness Support</title>
        <meta name="description" content="Reach the Velvame team for product, order, or membership questions. Email, phone, and a contact form available." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Contact Velvame" />
        <meta property="og:description" content="Get in touch with the Velvame team for product and membership support." />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(localBizJsonLd)}</script>
      </Helmet>
      <Navbar />
      <div className="pb-16">
        <PageBreadcrumb
          title={page?.title || "Contact Us"}
          subtitle={page?.subtitle || "Get in Touch"}
          pageType="contact"
        />

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
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                  <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Message
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
