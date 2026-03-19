import Image from "next/image";

interface CardProps {
  title: string;
  description: string;
  iconPlaceholder?: string;
  image?: string;
}

export default function Card({ title, description, iconPlaceholder = '🌱', image }: CardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
      {image ? (
        <div className="relative h-48 w-full">
          <Image src={image} alt={title} fill className="object-cover" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-16 h-16 m-6 mb-0 bg-secondary/20 rounded-full text-3xl">
          {iconPlaceholder}
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-black mb-2 font-heading">{title}</h3>
        <p className="text-sm text-black leading-relaxed font-body">{description}</p>
      </div>
    </div>
  );
}
