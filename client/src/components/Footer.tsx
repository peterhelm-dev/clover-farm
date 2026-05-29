import React from "react";
import { Link } from "wouter";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-12 text-muted-foreground">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Leaf className="h-5 w-5" />
            <span>Clover Farm</span>
          </div>
          <p className="text-xs max-w-xs leading-relaxed">
            The Concord-first local food coordination platform. We help growers, restaurants, and households plan and source fresh harvests without transactional friction.
          </p>
          <div className="text-[10px] text-muted-foreground/60 mt-2">
            © 2026 Clover Farm. All rights reserved.
          </div>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold text-foreground mb-3">Roles</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link href="/features" className="hover:text-primary">For Local Growers</Link></li>
            <li><Link href="/features" className="hover:text-primary">For Chefs & Restaurants</Link></li>
            <li><Link href="/features" className="hover:text-primary">For Meal Planners</Link></li>
            <li><Link href="/pricing" className="hover:text-primary">Subscription Tiers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold text-foreground mb-3">Platform</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link href="/coordination" className="hover:text-primary">The Coordination Layer</Link></li>
            <li><Link href="/ai-planner" className="hover:text-primary">AI Sourcing Planner</Link></li>
            <li><Link href="/pricing" className="hover:text-primary">Pricing & Pilots</Link></li>
            <li><Link href="/dashboard" className="hover:text-primary">Simulate Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold text-foreground mb-3">Contact Concord</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Concord, New Hampshire, 03301</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <a href="mailto:concord@clover.farm" className="hover:text-primary">concord@clover.farm</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>(603) 555-0143</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
