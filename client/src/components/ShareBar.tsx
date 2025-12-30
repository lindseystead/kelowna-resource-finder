/**
 * @fileoverview Share bar component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides sharing functionality for resources (print, copy link, email, etc.).
 */

import { Printer, Share2, Mail, Phone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { type Resource } from "@shared/schema";

interface ShareBarProps {
  resource: Resource;
  className?: string;
}

export function ShareBar({ resource, className = "" }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: resource.name,
      text: `${resource.name} - ${resource.description}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Resource: ${resource.name}`);
    const bodyParts = [
      `I found this resource that might be helpful:`,
      ``,
      resource.name,
      resource.description,
      ``,
      `Address: ${resource.address}`,
    ];
    if (resource.phone) {
      bodyParts.push(`Phone: ${resource.phone}`);
    }
    if (resource.website) {
      bodyParts.push(`Website: ${resource.website}`);
    }
    bodyParts.push(``, `View more details: ${window.location.href}`);
    const body = encodeURIComponent(bodyParts.join('\n'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className={`flex flex-nowrap items-center gap-1.5 sm:gap-2 overflow-x-auto ${className}`} data-testid="share-bar">
      <span className="text-xs sm:text-sm text-gray-500 mr-0.5 sm:mr-1 shrink-0 whitespace-nowrap">Share:</span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-[32px] px-2 sm:px-3 text-xs sm:text-sm shrink-0 touch-manipulation"
        data-testid="button-print"
      >
        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span className="hidden sm:inline">Print</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-[32px] px-2 sm:px-3 text-xs sm:text-sm shrink-0 touch-manipulation"
        data-testid="button-share"
      >
        {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 shrink-0" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleEmail}
        className="gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-[32px] px-2 sm:px-3 text-xs sm:text-sm shrink-0 touch-manipulation"
        data-testid="button-email-share"
      >
        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span className="hidden sm:inline">Email</span>
      </Button>

      {resource.phone && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-[32px] px-2 sm:px-3 text-xs sm:text-sm shrink-0 touch-manipulation"
        >
          <a href={`tel:${resource.phone}`} data-testid="button-call">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Call</span>
          </a>
        </Button>
      )}
    </div>
  );
}
