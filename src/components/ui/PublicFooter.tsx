'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

type PublicFooterProps = {
  whatsappUrl: string;
  storeName?: string;
  storeAddress?: string | null;
  publicVoucherEnabled?: boolean;
  topCategories?: Array<{ id: string; name: string; slug: string }>;
};

const HEADING_CLASS =
  'mb-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/35';
const LINK_CLASS =
  'mb-2 block text-[13px] text-white/50 transition-colors duration-150 hover:text-white/90';

export default function PublicFooter({
  whatsappUrl,
  storeName = 'Rama Computer',
  storeAddress,
  publicVoucherEnabled = false,
  topCategories = [],
}: PublicFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-16"
      style={{ background: 'var(--color-brand)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* Column 1: Brand */}
        <div>
          <div className="flex items-center">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: 'var(--color-accent)',
                borderRadius: 2,
                marginRight: 10,
              }}
            />
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15, letterSpacing: '0.1em' }}>
              {storeName.toUpperCase()}
            </span>
          </div>
          <p className="mt-2.5 max-w-[220px] text-[13px] leading-[1.6] text-white/45">
            Katalog komputer dan aksesoris elektronik. Tanya harga dan ketersediaan via WhatsApp.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition"
            style={{ background: 'var(--color-wa)' }}
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          {storeAddress ? <p className="mt-3 text-xs text-white/40">{storeAddress}</p> : null}
        </div>

        {/* Column 2: Katalog */}
        <div>
          <h4 className={HEADING_CLASS}>Katalog</h4>
          <Link href="/products" className={LINK_CLASS}>Produk</Link>
          <Link href="/categories" className={LINK_CLASS}>Kategori</Link>
          {topCategories.slice(0, 4).map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className={LINK_CLASS}>
              {cat.name}
            </Link>
          ))}
          {publicVoucherEnabled ? (
            <Link href="/vouchers" className={LINK_CLASS}>Voucher</Link>
          ) : null}
        </div>

        {/* Column 3: Akun */}
        <div>
          <h4 className={HEADING_CLASS}>Akun</h4>
          <Link href="/login" className={LINK_CLASS}>Masuk</Link>
          <Link href="/register" className={LINK_CLASS}>Daftar Retail</Link>
          <Link href="/produk-tersimpan" className={LINK_CLASS}>Produk Tersimpan</Link>
        </div>

        {/* Column 4: Info */}
        <div>
          <h4 className={HEADING_CLASS}>Info</h4>
          <a href="#about" className={LINK_CLASS}>Tentang Kami</a>
          <a href="#privacy" className={LINK_CLASS}>Kebijakan Privasi</a>
          <a href="#terms" className={LINK_CLASS}>Syarat &amp; Ketentuan</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Hubungi Kami
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6">
          <p className="text-xs text-white/25">
            &copy; {currentYear} {storeName}. All rights reserved.
          </p>
          <p className="text-xs text-white/20">Katalog Digital — Rama Computer</p>
        </div>
      </div>
    </footer>
  );
}
