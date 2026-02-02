'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-primary-foreground"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-primary text-primary-foreground border-t border-primary-foreground/20 shadow-lg z-50">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              href="/"
              className="py-2 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/viewer"
              className="py-2 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Table Viewer
            </Link>
            <Link
              href="/about"
              className="py-2 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <a
              href="https://github.com/open4game/tempcsv"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 flex items-center gap-2 hover:underline"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
