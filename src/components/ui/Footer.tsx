export default function Footer() {
  return (
    <footer className="border-t border-border-gray bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:justify-between">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary-maroon">
            E-Katalog Komputer
          </h3>
          <p className="text-sm text-text-muted">
            Katalog komputer dan aksesoris elektronik dengan alur inquiry WhatsApp.
          </p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>Garansi toko</span>
            <span>Dukungan WhatsApp</span>
            <span>Pembelian resmi</span>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-text-dark mb-2">Informasi</h4>
          <nav className="space-y-1 text-sm text-text-muted">
            <a href="#" className="hover:text-primary-maroon">
              Tentang Kami
            </a>
            <a href="#" className="hover:text-primary-maroon">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-primary-maroon">
              Syarat & Ketentuan
            </a>
            <a href="#" className="hover:text-primary-maroon">
              Hubungi Kami
            </a>
          </nav>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-text-dark mb-2">Ikuti Kami</h4>
          <div className="flex gap-3">
            <a
              href="#"
              className="p-2 rounded border border-border-gray hover:border-primary-maroon"
            >
              WhatsApp
            </a>
            <a
              href="#"
              className="p-2 rounded border border-border-gray hover:border-primary-maroon"
            >
              Instagram
            </a>
            <a
              href="#"
              className="p-2 rounded border border-border-gray hover:border-primary-maroon"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border-gray px-4 py-6 sm:px-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} E-Katalog Komputer. All rights reserved.
      </div>
    </footer>
  );
}