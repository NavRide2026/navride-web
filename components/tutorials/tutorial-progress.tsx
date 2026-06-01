export default function TutorialProgress({
  step,
}: {
  step: number;
}) {

  return (
    <div className="flex justify-center gap-4 mb-20">

      {[0,1,2,3,4,5].map((item) => (
        <div
          key={item}
          className={
            item <= step
              ? "w-14 h-2 rounded-full bg-[#FF5A1F]"
              : "w-14 h-2 rounded-full bg-white/10"
          }
        />
      ))}

    </div>
  );
}
