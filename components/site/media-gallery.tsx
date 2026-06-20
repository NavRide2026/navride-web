import Image from "next/image";
import { MEDIA_SLOTS } from "@/lib/site/constants";

export default function MediaGallery() {
  return (
    <section className="mt-16 border-t border-white/5 pt-12">
      <h2 className="text-2xl font-bold text-white mb-2">
        Capturas de la aplicación
      </h2>
      <p className="text-white/50 text-sm mb-8 max-w-2xl">
        Espacios preparados para screenshots y vídeo reales de NavRide. Sin
        contenido inventado — añade assets en{" "}
        <code className="text-white/60">lib/site/constants.ts</code> →{" "}
        MEDIA_SLOTS cuando estén disponibles.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MEDIA_SLOTS.map((slot) => (
          <figure
            key={slot.id}
            className="rounded-2xl border border-white/10 bg-[#101114] overflow-hidden"
          >
            <div className="relative aspect-[9/16] bg-[#1C1C1E] flex items-center justify-center">
              {slot.imageSrc ? (
                <Image
                  src={slot.imageSrc}
                  alt={slot.title}
                  fill
                  className="object-cover object-top"
                />
              ) : (
                <div className="text-center px-4">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
                    Pendiente
                  </p>
                  <p className="text-white/50 text-sm">{slot.title}</p>
                </div>
              )}
            </div>
            <figcaption className="p-4">
              <p className="text-white font-medium text-sm">{slot.title}</p>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                {slot.caption}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
