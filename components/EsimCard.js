import QRCode from 'qrcode';

/**
 * Shows one issued eSIM: the QR image, the ICCID and the activation details.
 *
 * The QR image is generated here, on the server, from the qrData string stored
 * in the database. Nothing binary is kept in Postgres — only the activation
 * string, which is the thing that actually matters. The image is a rendering of
 * it, and can always be regenerated.
 *
 * qrData follows the real GSMA format a phone expects:
 *   LPA:1$<SM-DP+ address>$<matching id>
 */
export default async function EsimCard({ esim, destination }) {
  const qrImage = await QRCode.toDataURL(esim.qrData, {
    margin: 2,
    width: 320,
    color: { dark: '#14161a', light: '#ffffff' },
  });

  return (
    <div className="rounded-2xl border border-[var(--z-line)] p-6">
      <h3 className="type-display text-2xl">{destination} eSIM</h3>

      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImage}
            alt={`QR code to install your ${destination} eSIM`}
            width={200}
            height={200}
            className="rounded-xl border border-[var(--z-line)]"
          />
          <p className="mt-3 max-w-[200px] text-xs leading-relaxed text-[var(--z-ink-soft)]">
            Scan from another device, or enter the details manually.
          </p>
        </div>

        <dl className="flex-1 space-y-4">
          <div>
            <dt className="eyebrow">ICCID</dt>
            <dd className="type-mono mt-1 break-all text-sm">{esim.iccid}</dd>
          </div>
          <div>
            <dt className="eyebrow">SM-DP+ address</dt>
            <dd className="type-mono mt-1 break-all text-sm">
              {esim.smdpAddress}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Activation code</dt>
            <dd className="type-mono mt-1 break-all text-sm">
              {esim.activationCode}
            </dd>
          </div>
        </dl>
      </div>

      <details className="faq-item mt-6 border-t border-[var(--z-line)] pt-4">
        <summary className="flex items-center justify-between text-sm">
          <span>How do I install this?</span>
          <span aria-hidden="true" className="faq-icon type-mono text-lg">
            +
          </span>
        </summary>
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--z-ink-soft)]">
          <li>1. On your phone, open Settings → Mobile Data → Add eSIM.</li>
          <li>2. Scan this QR code, or choose to enter details manually.</li>
          <li>3. Label the plan so you recognise it later.</li>
          <li>
            4. Keep your usual line as default for calls. Switch mobile data to
            Zelvoya when you arrive.
          </li>
        </ol>
      </details>
    </div>
  );
}
