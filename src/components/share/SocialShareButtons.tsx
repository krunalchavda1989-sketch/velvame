import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Send, Facebook, Instagram, Twitter, Linkedin, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  referralLink: string;
  referralCode?: string;
  compact?: boolean;
}

const SocialShareButtons = ({ referralLink, referralCode, compact = false }: SocialShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const message = `Join me and start earning! Use my referral code: ${referralCode || ""}`;
  const encodedMessage = encodeURIComponent(message);
  const encodedLink = encodeURIComponent(referralLink);

  const channels = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20",
      url: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20",
      url: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
    },
    {
      name: "X / Twitter",
      icon: Twitter,
      color: "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20",
      url: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20",
      action: "copy",
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-primary/10 text-primary hover:bg-primary/20",
      url: `mailto:?subject=${encodeURIComponent("Join me!")}&body=${encodedMessage}%20${encodedLink}`,
    },
    {
      name: "More",
      icon: Share2,
      color: "bg-muted text-muted-foreground hover:bg-muted/80",
      action: "native",
    },
  ];

  const handleClick = async (channel: typeof channels[0]) => {
    if (channel.action === "copy") {
      await navigator.clipboard.writeText(`${message}\n${referralLink}`);
      setCopied(true);
      toast({ title: "Link copied!", description: "Paste it in your Instagram bio or DM." });
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (channel.action === "native") {
      if (navigator.share) {
        await navigator.share({ title: "Join me!", text: message, url: referralLink });
      } else {
        await navigator.clipboard.writeText(referralLink);
        toast({ title: "Copied!", description: "Share this link anywhere." });
      }
      return;
    }
    window.open(channel.url, "_blank", "noopener,noreferrer");
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <Button
            key={ch.name}
            variant="ghost"
            size="icon"
            className={`rounded-full h-10 w-10 ${ch.color} transition-all`}
            onClick={() => handleClick(ch)}
            title={ch.name}
          >
            {ch.name === "Instagram" && copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <ch.icon className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {channels.map((ch) => (
        <button
          key={ch.name}
          onClick={() => handleClick(ch)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${ch.color} transition-all cursor-pointer`}
        >
          {ch.name === "Instagram" && copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <ch.icon className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium leading-tight">{ch.name}</span>
        </button>
      ))}
    </div>
  );
};

export default SocialShareButtons;
