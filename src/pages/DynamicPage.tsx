import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";

interface PageData {
  id: string;
  title: string;
  subtitle: string | null;
  content: any;
  meta_title: string | null;
  meta_description: string | null;
  page_slug: string;
  is_published: boolean;
}

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Normalize: remove trailing slashes, lowercase
    const normalizedSlug = slug.toLowerCase().replace(/\/+$/, "");
    if (normalizedSlug !== slug) {
      navigate(`/${normalizedSlug}`, { replace: true });
      return;
    }

    const fetchPage = async () => {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("pages_content")
        .select("*")
        .ilike("page_slug", normalizedSlug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPage(data as unknown as PageData);
      setLoading(false);

      // Set SEO meta tags
      const metaTitle = data.meta_title || data.title;
      const metaDesc = data.meta_description || "";
      document.title = metaTitle;

      const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.content = content;
      };

      setMeta("name", "description", metaDesc);
      setMeta("property", "og:title", metaTitle);
      setMeta("property", "og:description", metaDesc);

      // Canonical
      let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `${window.location.origin}/${data.page_slug}`;
    };

    fetchPage();

    return () => {
      // Cleanup meta on unmount
      document.title = "Loading...";
    };
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-8 pb-16">
          <div className="container mx-auto max-w-4xl px-4">
            <Skeleton className="h-10 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-8 pb-16">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
            <p className="mb-4 text-xl text-muted-foreground">Page not found</p>
            <a href="/" className="text-primary underline hover:text-primary/90">
              Return to Home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const bodyContent = typeof page.content === "object" && page.content?.body
    ? page.content.body
    : typeof page.content === "string"
    ? page.content
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16">
        <PageBreadcrumb
          title={page.title}
          subtitle={page.subtitle || undefined}
          pageType="cms"
        />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div
            className="prose prose-sm md:prose-base max-w-none text-foreground
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
              [&_li]:my-1
              [&_p]:my-3 [&_p]:leading-relaxed
              [&_a]:text-primary [&_a]:underline
              [&_strong]:font-semibold
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyContent) }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DynamicPage;
