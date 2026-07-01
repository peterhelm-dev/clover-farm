import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { LucideIcon } from "lucide-react";

interface AnimatedFeatureCardProps {
  image?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  delay: number;
}

export function AnimatedFeatureCard({
  image,
  icon: Icon,
  title,
  description,
  color,
  delay,
}: AnimatedFeatureCardProps) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-6 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative">
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-80 object-cover rounded-2xl shadow-lg"
          />
        )}
      </div>
      <div>
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
