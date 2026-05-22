export default function WhatsAppButton({
  href = "https://wa.me/6280000000000",
  children = "Tanya via WhatsApp",
  className = "",
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`rounded-xl bg-whatsapp-green px-4 py-2 text-sm font-semibold text-white flex items-center gap-2 ${className}`}
    >
      {children}
    </a>
  );
}