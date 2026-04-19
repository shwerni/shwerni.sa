export default function ReelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#f5f7fa]">
      {children}
    </div>
  );
}