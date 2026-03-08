import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { supabase } from "@/integrations/supabase/client";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order");
      setFaqs((data as unknown as FAQ[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = ["All", ...new Set(faqs.map((f) => f.category))];
  const filtered = faqs.filter((f) => {
    const matchesSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || f.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <PageBreadcrumb
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about our platform"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-background border-border" />
          </div>
        </PageBreadcrumb>

        <section className="py-16">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              {/* Category filters */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >{cat}</button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No matching questions found</p>
              ) : (
                <Accordion type="single" collapsible className="space-y-3">
                  {filtered.map((faq, i) => (
                    <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                      <AccordionItem value={faq.id} className="rounded-xl border border-border bg-card px-6">
                        <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default FAQPage;
