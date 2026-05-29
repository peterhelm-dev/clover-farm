import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <Leaf className="h-8 w-8 animate-bounce" />
      </div>
      <h1 className="text-4xl font-bold font-serif text-foreground mb-2">404 - Harvest Not Found</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        The coordination page or harvest resource you are looking for has been moved or is currently out of season.
      </p>
      <Link href="/">
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}
