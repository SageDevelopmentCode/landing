interface CardProps {
  title: string;
  description: string;
  iconPlaceholder?: string;
}

export default function Card({ title, description, iconPlaceholder = '🌱' }: CardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-center w-16 h-16 mb-4 bg-secondary/20 rounded-full text-3xl">
        {iconPlaceholder}
      </div>
      <h3 className="text-lg font-semibold text-black mb-2 font-heading">{title}</h3>
      <p className="text-sm text-black leading-relaxed font-body">{description}</p>
    </div>
  );
}
