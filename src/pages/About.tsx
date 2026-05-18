import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, Target, Eye, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { supabase } from "@/integrations/supabase/client";

const About = () => {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("pages_content").select("*").eq("page_slug", "about").maybeSingle();
      setPage(data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const content = page?.content || {};
  const values: string[] = content.values || [];

  const canonical = `${typeof window !== "undefined" ? window.location.origin : "https://velvame.lovable.app"}/about`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Velvame — Our Mission for Health & Wellness</title>
        <meta name="description" content="Learn about Velvame's mission, vision, and values powering our premium health and wellness rewards platform." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="About Velvame" />
        <meta property="og:description" content="Our mission, vision, and the values behind Velvame." />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <div className="pb-16">
        <PageBreadcrumb
          title={page?.title || "About Us"}
          subtitle={page?.subtitle || "Learn more about our mission and values"}
          pageType="about"
        />

        {/* Mission & Vision */}
        <section className="py-16">
          <div className="container px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="p-8 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-3">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">{content.mission || ""}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="p-8 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-3">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed">{content.vision || ""}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        {values.length > 0 && (
          <section className="py-16 bg-secondary/30">
            <div className="container px-4">
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-display font-bold text-center mb-10">
                Our <span className="text-gradient-gold">Core Values</span>
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {values.map((v, i) => (
                  <motion.div key={v} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
                  >
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{v}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default About;
