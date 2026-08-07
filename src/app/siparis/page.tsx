"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, Loader2, MapPin, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type CheckoutForm = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  floor: string;
  doorbellName: string;
  customerNote: string;
};

const emptyForm: CheckoutForm = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phone: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  country: "Deutschland",
  floor: "",
  doorbellName: "",
  customerNote: "",
};

export default function CheckoutPage() {
  const { items, pfandItems, productSubtotal, subtotal, pfandReturnTotal, clearCart } =
    useCart();

  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          loginRequired: "Bitte melden Sie sich an, um eine Bestellung aufzugeben.",
          customerRequired: "Bitte melden Sie sich mit einem Kunden- oder Händlerkonto an.",
          customerLoadError: "Kundendaten konnten nicht geladen werden.",
          cartEmpty: "Ihr Warenkorb ist leer.",
          orderCreateError: "Die Bestellung konnte nicht erstellt werden.",
          orderFailed: "Bestellung konnte nicht erstellt werden.",
          loading: "Kundendaten werden geladen...",
          thankYou: "Vielen Dank für Ihre Bestellung",
          orderNumber: "Ihre Bestellnummer lautet:",
          continueShopping: "Weiter einkaufen",
          eyebrow: "Bestellung",
          checkoutTitle: "Bestellung abschließen",
          checkoutDescription: "Prüfen Sie Ihre Lieferdaten und senden Sie anschließend Ihre Bestellung ab.",
          dealerData: "Händlerdaten",
          contactData: "Kontaktdaten",
          dealerInfo: "Die Bestellung wird mit den hinterlegten Händlerdaten erstellt.",
          company: "Firmenname",
          contactPerson: "Ansprechpartner",
          firstName: "Vorname",
          lastName: "Nachname",
          email: "E-Mail",
          phone: "Telefon",
          deliveryAddress: "Lieferadresse",
          street: "Straße",
          houseNumber: "Hausnummer",
          postalCode: "Postleitzahl",
          city: "Stadt",
          floor: "Etage",
          bell: "Name an der Klingel",
          deliveryNote: "Hinweis zur Lieferung",
          delivery: "Lieferung",
          orderSummary: "Bestellübersicht",
          deliveryFee: "Liefergebühr",
          pfandReturn: "Pfandrückgabe",
          subtotal: "Zwischensumme",
          total: "Gesamt",
          free: "Kostenlos",
          warehousePickup: "Lagerabholung",
          freeDeliveryText: "Die Lieferung ist kostenlos.",
          paidDeliveryText: "Für Bestellungen unter 100 € beträgt die Liefergebühr 7,90 €.",
          dealerDeliveryText: "Händlerbestellungen werden kostenlos im Lager zur Abholung bereitgestellt.",
          pfandInfo: "Pfand wird bei Bedarf zusätzlich serverseitig berechnet.",
          paymentTitle: "Zahlung bei Lieferung",
          paymentInfo:
            "Sie bezahlen bar oder mit Karte direkt an den Fahrer bei Zustellung. Eine Online-Zahlung ist nicht erforderlich.",
          saving: "Wird gespeichert...",
          submitOrder: "Bestellung absenden",
          goToLogin: "Jetzt anmelden",
          goToRegister: "Konto erstellen",
        }
      : {
          loginRequired: "Sipariş vermek için giriş yapmalısınız.",
          customerRequired: "Sipariş vermek için müşteri veya bayi hesabıyla giriş yapmalısınız.",
          customerLoadError: "Müşteri bilgileri yüklenemedi.",
          cartEmpty: "Sepetiniz boş.",
          orderCreateError: "Sipariş oluşturulamadı.",
          orderFailed: "Sipariş oluşturulamadı.",
          loading: "Müşteri bilgileri yükleniyor...",
          thankYou: "Siparişiniz alındı",
          orderNumber: "Sipariş numaranız:",
          continueShopping: "Alışverişe devam et",
          eyebrow: "Sipariş",
          checkoutTitle: "Siparişi Tamamla",
          checkoutDescription: "Teslimat bilgilerinizi kontrol edin ve siparişinizi gönderin.",
          dealerData: "Bayi Bilgileri",
          contactData: "İletişim Bilgileri",
          dealerInfo: "Sipariş kayıtlı bayi bilgileriyle oluşturulacaktır.",
          company: "Bayi / Firma Adı",
          contactPerson: "Yetkili Kişi",
          firstName: "Ad",
          lastName: "Soyad",
          email: "E-posta",
          phone: "Telefon",
          deliveryAddress: "Teslimat Adresi",
          street: "Sokak",
          houseNumber: "Kapı Numarası",
          postalCode: "Posta Kodu",
          city: "Şehir",
          floor: "Kat",
          bell: "Zil Üzerindeki İsim",
          deliveryNote: "Teslimat Notu",
          delivery: "Teslimat",
          orderSummary: "Sipariş Özeti",
          deliveryFee: "Teslimat Ücreti",
          pfandReturn: "Pfand İadesi",
          subtotal: "Ara Toplam",
          total: "Toplam",
          free: "Ücretsiz",
          warehousePickup: "Depodan Teslim",
          freeDeliveryText: "Teslimat ücretsizdir.",
          paidDeliveryText: "100 € altındaki siparişlerde teslimat ücreti 7,90 €’dur.",
          dealerDeliveryText: "Bayi siparişleri depodan teslim alınır. Bayilere teslimat ücreti eklenmez.",
          pfandInfo: "Pfand varsa sunucu tarafından ayrıca hesaplanır.",
          paymentTitle: "Teslimatta Ödeme",
          paymentInfo:
            "Ödemenizi teslimat sırasında şoföre nakit veya kartla yapabilirsiniz. Online ödeme gerekmez.",
          saving: "Kaydediliyor...",
          submitOrder: "Siparişi Gönder",
          goToLogin: "Şimdi giriş yap",
          goToRegister: "Hesap oluştur",
        };


  const [accountRole, setAccountRole] = useState<"CUSTOMER" | "DEALER" | null>(
    null,
  );

  const isDealer = accountRole === "DEALER";

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [isAuthorized, setIsAuthorized] = useState(true);

  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

  /*
   * Bayiler ürünleri depodan kendileri alır.
   * Sipariş tutarı ne olursa olsun teslimat ücreti eklenmez.
   */
  const deliveryFee = isDealer ? 0 : productSubtotal >= 100 ? 0 : 7.9;

  const total = Math.max(0, subtotal + deliveryFee - pfandReturnTotal);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        const data = await response.json();

        if (!response.ok) {
          setError(
            t.loginRequired,
          );
          setIsAuthorized(false);
          return;
        }

        const user = data.user;

        setAccountRole(user.role);

        if (!["CUSTOMER", "DEALER"].includes(user.role)) {
          setError(
            t.customerRequired,
          );
          setIsAuthorized(false);
          return;
        }

        const address = user.addresses?.[0];
        const dealerProfile = user.dealerProfile;

        if (user.role === "DEALER") {
          setForm({
            firstName:
              dealerProfile?.contactName ||
              user.firstName ||
              dealerProfile?.companyName ||
              "",
            lastName: user.lastName || "",
            companyName: dealerProfile?.companyName || user.companyName || "",
            email: user.email || "",
            phone: dealerProfile?.phone || user.phone || "",
            street: "",
            houseNumber: "",
            postalCode: "",
            city: "",
            country: dealerProfile?.country || "Deutschland",
            floor: "",
            doorbellName: "",
            customerNote: "",
          });

          return;
        }

        setForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          companyName: user.companyName || "",
          email: user.email || "",
          phone: user.phone || "",
          street: address?.street || "",
          houseNumber: address?.houseNumber || "",
          postalCode: address?.postalCode || "",
          city: address?.city || "",
          country: address?.country || "Deutschland",
          floor: address?.floor || "",
          doorbellName: address?.doorbellName || "",
          customerNote: "",
        });
      } catch {
        setError(
          t.customerLoadError,
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [language]);

  function updateForm(key: keyof CheckoutForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setError(
        t.cartEmpty,
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,

          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),

          pfandItems: pfandItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.orderFailed);
        return;
      }

      setCompletedOrder({
        orderNumber: data.order.orderNumber,
        totalAmount: data.order.totalAmount,
      });

      clearCart();
    } catch {
      setError(t.orderCreateError);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <Header />

        <div className="flex min-h-[500px] items-center justify-center gap-3 font-bold text-slate-500">
          <Loader2 className="animate-spin" />
          {t.loading}
        </div>

        <Footer />
      </main>
    );
  }

  if (completedOrder) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <Header />

        <section className="px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-[32px] bg-white p-10 text-center shadow-sm">
            <CheckCircle2 size={64} className="mx-auto text-green-600" />

            <h1 className="mt-6 text-4xl font-black text-slate-950">
              {t.thankYou}
            </h1>

            <p className="mt-4 text-slate-600">
              {t.orderNumber}
            </p>

            <p className="mt-2 text-2xl font-black text-orange-500">
              {completedOrder.orderNumber}
            </p>

            <p className="mt-4 text-lg font-bold text-slate-950">
              {completedOrder.totalAmount.toFixed(2)} €
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/urunler"
                className="rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
              >
                {t.continueShopping}
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <Header />

        <section className="px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-[32px] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto rounded-2xl bg-red-50 p-5 font-bold text-red-600">
              {error}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/giris"
                className="rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600"
              >
                {t.goToLogin}
              </Link>

              <Link
                href="/kayit"
                className="rounded-xl bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-slate-800"
              >
                {t.goToRegister}
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header />

      <section className="border-b border-slate-200 bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold text-orange-500">{t.eyebrow}</p>

          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
            {t.checkoutTitle}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            {t.checkoutDescription}
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="px-4 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {error ? (
              <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
                {error}
              </div>
            ) : null}

            <section className="rounded-[32px] bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-black text-slate-950">
                {isDealer
                  ? t.dealerData
                  : t.contactData}
              </h2>

              {isDealer ? (
                <>
                  <p className="mt-2 text-sm text-slate-500">
                    {t.dealerInfo}
                  </p>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Input
                      label={
                        t.company
                      }
                      readOnly
                      value={form.companyName}
                      onChange={() => {}}
                    />

                    <Input
                      label={
                        t.contactPerson
                      }
                      required={false}
                      readOnly
                      value={form.firstName}
                      onChange={() => {}}
                    />

                    <Input
                      label={t.email}
                      type="email"
                      readOnly
                      value={form.email}
                      onChange={() => {}}
                    />

                    <Input
                      label={t.phone}
                      type="tel"
                      readOnly
                      value={form.phone}
                      onChange={() => {}}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Input
                    label={t.firstName}
                    value={form.firstName}
                    onChange={(value) => updateForm("firstName", value)}
                  />

                  <Input
                    label={t.lastName}
                    value={form.lastName}
                    onChange={(value) => updateForm("lastName", value)}
                  />

                  <Input
                    label={t.email}
                    type="email"
                    readOnly
                    value={form.email}
                    onChange={() => {}}
                  />

                  <Input
                    label={t.phone}
                    type="tel"
                    value={form.phone}
                    onChange={(value) => updateForm("phone", value)}
                  />
                </div>
              )}
            </section>

            {!isDealer ? (
              <section className="rounded-[32px] bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <MapPin className="text-orange-500" />

                  <h2 className="text-2xl font-black text-slate-950">
                    {t.deliveryAddress}
                  </h2>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Input
                    label={t.street}
                    value={form.street}
                    onChange={(value) => updateForm("street", value)}
                  />

                  <Input
                    label={t.houseNumber}
                    value={form.houseNumber}
                    onChange={(value) => updateForm("houseNumber", value)}
                  />

                  <Input
                    label={t.postalCode}
                    inputMode="numeric"
                    pattern="\d{5}"
                    value={form.postalCode}
                    onChange={(value) =>
                      updateForm(
                        "postalCode",
                        value.replace(/\D/g, "").slice(0, 5),
                      )
                    }
                  />

                  <Input
                    label={t.city}
                    value={form.city}
                    onChange={(value) => updateForm("city", value)}
                  />

                  <Input
                    label={t.floor}
                    required={false}
                    value={form.floor}
                    onChange={(value) => updateForm("floor", value)}
                  />

                  <Input
                    label={
                      t.bell
                    }
                    required={false}
                    value={form.doorbellName}
                    onChange={(value) => updateForm("doorbellName", value)}
                  />

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-bold text-slate-700">
                      {t.deliveryNote}
                    </span>

                    <textarea
                      rows={4}
                      value={form.customerNote}
                      onChange={(event) =>
                        updateForm("customerNote", event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </label>
                </div>
              </section>
            ) : null}

            <section className="rounded-[32px] bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Truck className="text-orange-500" />

                <h2 className="text-2xl font-black text-slate-950">
                  {t.delivery}
                </h2>
              </div>

              <p className="mt-4 text-slate-600">
                {isDealer
                  ? t.dealerDeliveryText
                  : productSubtotal >= 100
                    ? t.freeDeliveryText
                    : t.paidDeliveryText}
              </p>
            </section>
          </div>

          <aside className="h-fit rounded-[32px] bg-white p-6 lg:sticky lg:top-28">
            <h2 className="text-2xl font-black text-slate-950">
              {t.orderSummary}
            </h2>

            {items.length === 0 ? (
              <p className="mt-6 text-slate-500">
                {t.cartEmpty}
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-slate-100 pb-4"
                  >
                    <div>
                      <p className="font-bold text-slate-950">{item.name}</p>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity} × {item.price.toFixed(2)} €
                      </p>
                    </div>

                    <span className="font-black">
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.subtotal}</span>

                <span className="font-bold">{subtotal.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t.deliveryFee}
                </span>

                <span className="font-bold">
                  {isDealer
                    ? t.warehousePickup
                    : deliveryFee === 0
                      ? t.free
                      : `${deliveryFee.toFixed(2)} €`}
                </span>
              </div>

              {pfandReturnTotal > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {t.pfandReturn}
                  </span>

                  <span className="font-bold text-green-700">
                    -{pfandReturnTotal.toFixed(2)} €
                  </span>
                </div>
              ) : null}

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between text-xl">
                  <span className="font-black">{t.total}</span>

                  <span className="font-black">{total.toFixed(2)} €</span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {t.pfandInfo}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <Wallet size={20} className="mt-0.5 shrink-0 text-orange-500" />

              <div>
                <p className="text-sm font-black text-slate-950">
                  {t.paymentTitle}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t.paymentInfo}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0 || Boolean(error)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.submitOrder
              )}
            </button>
          </aside>
        </div>
      </form>

      <Footer />
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  pattern,
  readOnly = false,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "email"
    | "decimal"
    | "search"
    | "url"
    | "none";
  pattern?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        required={required}
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 read-only:bg-slate-100"
      />
    </label>
  );
}
