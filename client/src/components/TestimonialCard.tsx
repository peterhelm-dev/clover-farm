import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  item: {
    rating: number;
    count: number;
    text: string;
  };
  delay: number;
}

export function TestimonialCard({ item, delay }: TestimonialCardProps) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  return (
    <Card
      ref={ref}
      className={`border-green-100 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <CardContent className="pt-6">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-5 h-5 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
        <p className="text-gray-700 font-medium mb-4">{item.text}</p>
        <p className="text-sm text-gray-500">
          {item.rating} • {item.count} reviews
        </p>
      </CardContent>
    </Card>
  );
}
