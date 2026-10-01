import Image from "next/image";
import { MEDIA_SLOTS } from "@/lib/site/constants";

export default function MediaGallery() {
  const availableMedia = MEDIA_SLOTS.filter((slot) => Boolean(slot.imageSrc));
  if (availableMedia.length === 0) return null;

  return (
    <section className="mt-16 border-t border-white/5 pt-12">
      <h2 className="mb-2 text-2xl font-bold text-white">Capturas de la aplicación</h2>
      <p className="mb-8 max-w-2xl text-sm text-white/50">Imágenes reales de las funciones disponibles en NavRide.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableMedia.map((slot) => (
          <figure key={slot.id} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101114]">
            <div className="relative aspect-[9/16] bg-[#1C1C1E]">
              <Image src={slot.imageSrc!} alt={slot.title} fill className="object-cover object-top" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
            <figcaption className="p-4"><p className="text-sm font-medium text-white">{slot.title}</p><p className="mt-1 text-xs leading-relaxed text-white/50">{slot.caption}</p></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
